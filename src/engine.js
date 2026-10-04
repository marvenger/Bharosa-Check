// Pure, language-neutral analysis engine. No DOM, no network. Runs in browsers and Node (tests).
import {RULES,BRANDS,BADTLD,SHORT,VALID} from './rules.js';
const lev=(a,b)=>{const d=Array.from({length:a.length+1},(_,i)=>[i,...Array(b.length).fill(0)]);for(let j=1;j<=b.length;j++)d[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]==b[j-1]?0:1));return d[a.length][b.length]};
const NEG=/\b(no|not|never|cannot|can't|doesn't|isn't|without)\b(\s+\w+){0,3}\s*$/i;
const DOM=/(?:https?:\/\/)?(?:www\.)?((?:[a-z0-9][a-z0-9-]*\.)+[a-z]{2,24})\b(?!@)(?:\/[^\s]*)?/gi;
const REG=/sebi[- ]*(registered|regd\.?)|registered (with|by) sebi|\breg\.? ?no\b|sebi (reg|registration) (no|number)/i;
export const level=s=>s>=55?'hi':s>=20?'mid':'lo';
export const combine=f=>Math.round(100*(1-f.reduce((p,x)=>p*(1-x.w/100),1)));
export function analyze(raw){
 const text=raw.replace(/[’‘]/g,"'"),flags=[],marks=[],notes=[];
 const mk=(i,n,w)=>marks.push([i,i+n,w>=25?'h':'m']);
 const hit=(id,w,ev,i,n,p={})=>{flags.push({id,w,ev:[ev],p});mk(i,n,w)};
 for(const r of RULES){const ev=new Set;
  for(const m of text.matchAll(r.re)){if(r.neg&&NEG.test(text.slice(Math.max(0,m.index-30),m.index)))continue;ev.add(m[0].trim());mk(m.index,m[0].length,r.w)}
  if(ev.size)flags.push({id:r.id,w:r.w,ev:[...ev].slice(0,3),p:{}})}
 const nums=[...text.matchAll(/\bIN[AHZMPBDCEFKLNRSTUVWY]\d+\b/gi)];
 for(const m of nums){const d=m[0].slice(3);
  if(d.length!==9||/^0+$/.test(d))hit('regbad',30,m[0],m.index,m[0].length,{r:m[0]});
  else{notes.push({id:'regok',p:{r:m[0]}});mk(m.index,m[0].length,12)}}
 const c=text.match(REG);if(!nums.length&&c)hit('regnone',20,c[0],c.index,c[0].length);
 for(const m of text.matchAll(VALID))notes.push({id:'validok',p:{h:m[0]}});
 const seen={};
 for(const m of text.matchAll(DOM)){const h=m[1].toLowerCase();
  if(seen[h]||/^(t\.me|wa\.me|chat\.whatsapp\.com)$/.test(h))continue;seen[h]=1;
  if(Object.values(BRANDS).some(d=>h===d||h.endsWith('.'+d))){notes.push({id:'siteok',p:{h}});continue}
  const n=h.replace(/0/g,'o').replace(/1/g,'l').replace(/rn/g,'m');let b=null;
  for(const k of Object.keys(BRANDS))if(n.includes(k)||(k.length>4&&n.split(/[.-]/).some(l=>l.length>3&&lev(l,k)<=(k.length>6?2:1)))){b=k;break}
  if(b)hit('lookalike',40,h,m.index,m[0].length,{h,b,d:BRANDS[b]});
  else if(SHORT.test(h))hit('short',10,h,m.index,m[0].length,{h});
  if(BADTLD.test(h))hit('tld',15,h,m.index,m[0].length,{h})}
 return{text,flags,marks,notes,score:combine(flags)}}
// Group chats: split into messages, analyse each, then add two group-level signals.
const TS=/^\[?\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:[ap]m)?\]?\s*-?\s*([^:]{1,40}):\s*(.*)$/i;
export function parseChat(raw){const m=[];
 for(const line of raw.split(/\r?\n/)){const x=line.match(TS);if(x)m.push({who:x[1].trim(),text:x[2]});else if(line.trim()){if(m.length)m[m.length-1].text+='\n'+line;else m.push({who:'?',text:line})}}
 return m.length>1?m:raw.split(/\n\s*\n/).filter(s=>s.trim()).map(text=>({who:'?',text}))}
export function analyzeGroup(raw){
 const msgs=parseChat(raw).map(m=>({...m,r:analyze(m.text)})),by={};
 msgs.forEach(m=>m.r.flags.forEach(f=>{(by[f.id]??={w:f.w,c:0}).c++}));
 const flags=Object.entries(by).map(([id,v])=>({id,w:v.w,ev:[],p:{c:v.c}}));
 const tip=msgs.filter(m=>m.r.flags.some(f=>['tip','guarantee','unreal'].includes(f.id)));
 if(msgs.length>=4&&tip.length/msgs.length>=.3)flags.push({id:'tipheavy',w:15,ev:[],p:{n:tip.length,t:msgs.length}});
 const cnt={};tip.forEach(m=>cnt[m.who]=(cnt[m.who]||0)+1);const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];
 if(top&&top[0]!=='?'&&tip.length>=3&&top[1]/tip.length>=.7)flags.push({id:'onevoice',w:10,ev:[],p:{who:top[0],n:top[1]}});
 return{msgs,flags,score:combine(flags),senders:new Set(msgs.map(m=>m.who)).size,risky:msgs.filter(m=>m.r.score>=20).length}}

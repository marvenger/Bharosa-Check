import {analyze,analyzeGroup,level} from './engine.js';
import en from './locales/en.js';import hi from './locales/hi.js';import {ocr} from './ocr.js';
const LG={en,hi},$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store={get:k=>{try{return localStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch{}}};
const saved=store.get('lang');let lang=LG[saved]?saved:((navigator.language||'').startsWith('hi')?'hi':'en'),last=null,lastG=null;
const t=k=>LG[lang].ui[k]??en.ui[k],fmt=(s,p={})=>s.replace(/\{(\w+)\}/g,(_,k)=>p[k]??'');
const rule=(id,p)=>(LG[lang].rules[id]||en.rules[id]).map(s=>fmt(s,p)),note=(id,p)=>fmt(LG[lang].notes[id]||en.notes[id],p);
const steps=L=>LG[lang].steps[L],ICON={hi:'🛑',mid:'⚠️',lo:'🛡️'};
const S={a:`🔥 VIP Stock Tips Group 🔥 Join our Telegram channel t.me/profit_kings_vip. Guaranteed 40% returns every month, 100% accuracy! SEBI approved analyst Reg. No. INH00012345. Limited seats, only 5 left. Download our app https://zerodha-pro-trade.xyz/app.apk and pay Rs 5,000 registration fee to 9876543210@ybl. Don't tell anyone.`,
b:`Dear investor, your withdrawal of Rs 2,40,000 is blocked. Pay 15% tax to release funds. Install AnyDesk so our officer can help recover your money. Visit https://grow.in-support.top now.`,
c:`Reminder: your mutual fund SIP of Rs 2,000 will be debited on the 5th. For details log in at https://groww.in. Never share OTP or PIN with anyone.`,
d:`🔥 VIP ग्रुप जॉइन करें! पक्का मुनाफा, 40% हर महीने गारंटी। सिर्फ आज, सीमित सीट। रजिस्ट्रेशन फीस 5000 रुपये 9876543210@ybl पर भेजें। किसी को मत बताना।`,
g:`12/09/2026, 10:02 - Admin Rahul: Welcome to VIP Profit Group! Guaranteed 30% monthly returns.\n12/09/2026, 10:05 - Admin Rahul: Buy above 245 target 260 stop loss 238. Sure shot call.\n12/09/2026, 10:30 - Neha: Thank you sir, I made 18000 today!\n12/09/2026, 11:00 - Admin Rahul: Last chance, only 5 seats left. Pay 4999 fee to rahulvip@ybl and join premium channel.\n12/09/2026, 11:10 - Admin Rahul: Don't tell anyone outside the group.\n12/09/2026, 11:12 - Amit: Mine too sir, upper circuit today!`};
const verdict=(L,s,n)=>`<div class="v ${L}"><div class="big">${ICON[L]} ${t('v_'+L)}</div><p>${t('v_'+L+'S')}</p><div class="bar"><i style="width:${Math.max(s,3)}%"></i></div><small>${fmt(t('score'),{s,n})}</small><div class="row"><button class="say">🔊 ${t('read')}</button><button class="cp">📋 ${t('copy')}</button></div></div>`;
const rp=f=>rule(f.id,{...f.p,h:f.p.h||f.ev[0]});
const signs=fl=>`<ul class="fs">${[...fl].sort((a,b)=>b.w-a.w).map(f=>{const[ti,why]=rp(f);const ev=f.ev.length?`<div class="ev">${t('found')} ${f.ev.map(e=>'“'+esc(e.slice(0,60))+'”').join(', ')}</div>`:f.p.c?`<div class="ev">${fmt(t('gcount'),{n:f.p.c})}</div>`:'';return`<li class="fl ${f.w>=25?'h':'m'}"><b>${esc(ti)}</b><span class="tag">${f.w>=25?t('ser'):t('warn')}</span>${ev}<p>${esc(why)}</p></li>`}).join('')}</ul>`;
const todo=L=>`<h3>${t('todo')}</h3><ul>${steps(L).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
function wire(root,L,fl,score){const ti=fl.map(f=>rp(f)[0]),say=root.querySelector('.say'),cp=root.querySelector('.cp');
 const spoken=`${t('v_'+L)}. ${t('v_'+L+'S')} ${ti.join('. ')}. ${steps(L).slice(0,2).join(' ')}`;
 if(!('speechSynthesis'in window))say.remove();else say.onclick=()=>{if(speechSynthesis.speaking){speechSynthesis.cancel();return}const u=new SpeechSynthesisUtterance(spoken);u.lang=lang==='hi'?'hi-IN':'en-IN';u.rate=.9;speechSynthesis.speak(u)};
 cp.onclick=async e=>{try{await navigator.clipboard.writeText(`Bharosa Check: ${t('v_'+L)} (${score}/100). ${ti.join('; ')}. 1930 / cybercrime.gov.in`);e.target.textContent='✅ '+t('copied')}catch{e.target.textContent=t('nocopy')}}}
function render(raw){last=raw;const r=analyze(raw),L=level(r.score);let o='',p=0;
 for(const[a,b,c]of[...r.marks].sort((x,y)=>x[0]-y[0])){if(a<p)continue;o+=esc(r.text.slice(p,a))+`<mark class="${c}">${esc(r.text.slice(a,b))}</mark>`;p=b}o+=esc(r.text.slice(p));
 $('#out').innerHTML=verdict(L,r.score,r.flags.length)+`<div class="card"><h3 style="margin-top:0">${t('looked')}</h3><div class="msg">${o}</div><p class="note">${t('hl')}</p>`+(r.flags.length?`<h3>${t('signs')}</h3>${signs(r.flags)}`:'')+(r.notes.length?`<h3>${t('noted')}</h3><ul>${r.notes.map(n=>`<li class="note ok">${esc(note(n.id,n.p))}</li>`).join('')}</ul>`:'')+todo(L)+`<h3>${t('sure')}</h3><p class="note">${t('sureT')}</p></div>`;
 wire($('#out'),L,r.flags,r.score);$('#out').scrollIntoView({behavior:'smooth',block:'start'})}
function renderG(raw){lastG=raw;const g=analyzeGroup(raw),L=level(g.score),worst=[...g.msgs].sort((a,b)=>b.r.score-a.r.score).slice(0,3).filter(m=>m.r.score>0);
 $('#gout').innerHTML=verdict(L,g.score,g.flags.length)+`<div class="card"><p><b>${fmt(t('gsum'),{n:g.msgs.length,s:g.senders,r:g.risky})}</b></p>`+(g.flags.length?`<h3>${t('signs')}</h3>${signs(g.flags)}`:'')+(worst.length?`<h3>${t('gworst')}</h3>`+worst.map(m=>`<div class="msg" style="margin-bottom:8px"><b>${esc(m.who)}</b> (${m.r.score}/100)\n${esc(m.text.slice(0,160))}</div>`).join(''):'')+todo(L)+`</div>`;
 wire($('#gout'),L,g.flags,g.score);$('#gout').scrollIntoView({behavior:'smooth',block:'start'})}
function applyLang(){document.documentElement.lang=lang;
 $$('[data-i]').forEach(e=>e.textContent=t(e.dataset.i));$$('[data-p]').forEach(e=>e.placeholder=t(e.dataset.p));
 $('#paid').innerHTML=LG[lang].paid.map(x=>`<li>${esc(x)}</li>`).join('');$('#lang').textContent=lang==='hi'?'English':'हिन्दी';
 if(last)render(last);if(lastG)renderG(lastG)}
const run=()=>{const v=$('#in').value.trim();if(v.length<12){$('#out').innerHTML=`<div class="card">${t('empty')}</div>`;return}render(v)};
$('#go').onclick=run;
$('#clr').onclick=()=>{$('#in').value='';$('#out').innerHTML='';last=null;window.speechSynthesis&&speechSynthesis.cancel()};
$$('.chip').forEach(b=>b.onclick=()=>{$('#in').value=S[b.dataset.s];run()});
$('#shot').onchange=async e=>{const f=e.target.files[0];if(!f)return;$('#out').innerHTML=`<div class="card" id="ocrs">${t('ocr')}</div>`;
 try{$('#in').value=(await ocr(f,lang,p=>{const s=$('#ocrs');if(s)s.textContent=`${t('ocr')} ${p}%`})).trim();run()}catch{$('#out').innerHTML=`<div class="card">${t('ocrfail')}</div>`}e.target.value=''};
$('#ggo').onclick=()=>{const v=$('#gin').value.trim();if(v.length<20){$('#gout').innerHTML=`<div class="card">${t('empty')}</div>`;return}renderG(v)};
$('#gex').onclick=()=>{$('#gin').value=S.g;$('#ggo').click()};
$$('nav button').forEach(b=>b.onclick=()=>{$$('nav button').forEach(x=>x.setAttribute('aria-selected',x===b));['chk','grp','paid'].forEach(k=>$('#p-'+k).classList.toggle('hid',k!==b.dataset.t))});
$('#lang').onclick=()=>{lang=lang==='hi'?'en':'hi';store.set('lang',lang);applyLang()};
let big=false;$('#fs').onclick=()=>{big=!big;document.documentElement.style.fontSize=big?'125%':''};
// Web Share Target: sharing text from WhatsApp/SMS to the installed app opens it pre-filled.
const q=new URLSearchParams(location.search),shared=['title','text','url'].map(k=>q.get(k)).filter(Boolean).join('\n');
applyLang();if(shared){$('#in').value=shared;run()}
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});

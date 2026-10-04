// Evaluates the engine on a small labelled SEED set (synthetic, written by the authors).
// This is a regression baseline, not a real-world accuracy claim. Add real, anonymised messages to improve it.
import {readFileSync} from 'node:fs';import {analyze} from '../src/engine.js';
const data=JSON.parse(readFileSync(new URL('./dataset.json',import.meta.url))),TH=20;
let tp=0,fp=0,fn=0,tn=0;const miss=[],fa=[];
for(const d of data){const s=analyze(d.t).score,p=s>=TH?1:0;if(d.y&&p)tp++;else if(d.y)(fn++,miss.push(d.t.slice(0,70)));else if(p)(fp++,fa.push(d.t.slice(0,70)));else tn++}
const f=x=>(100*x).toFixed(0)+'%';
console.log(`messages=${data.length} scam=${tp+fn} genuine=${fp+tn} threshold=${TH}`);
console.log(`precision=${f(tp/(tp+fp||1))} recall=${f(tp/(tp+fn||1))} false-alarm-rate=${f(fp/(fp+tn||1))}`);
console.log('missed:',miss);console.log('false alarms:',fa);

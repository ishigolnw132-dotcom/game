import { completion,countBlocks,expand,generateMap,initialState,transition } from '../game/engine';
import type { Command,Program,GameState } from '../game/types';
import type { MissionSettings,Room,Submission } from './contracts';
export function validateProgram(value:unknown,settings:MissionSettings):Program{
 if(!value||typeof value!=='object'||JSON.stringify(value).length>60000)throw Error('โปรแกรมไม่ถูกต้องหรือใหญ่เกินไป');let nodes=0;
 const walk=(cs:unknown,depth=0):Command[]=>{if(!Array.isArray(cs)||depth>8)throw Error('โครงสร้างบล็อกไม่ถูกต้อง');return cs.map((c:any)=>{if(++nodes>200||!c||!settings.level.blocks.includes(c.op))throw Error('บล็อกไม่อยู่ในบทเรียน');const next:Command={op:c.op};if(c.op==='repeat'){if(!Number.isInteger(c.count)||c.count<1||c.count>20)throw Error('จำนวนครั้งในลูปไม่ถูกต้อง');next.count=c.count;next.body=walk(c.body,depth+1)}if(c.op==='say'){if(typeof c.text!=='string'||c.text.length>100)throw Error('บทพูดยาวเกินไป');next.text=c.text;next.actor=c.actor==='friend'?'friend':'bot'}return next})};
 const src=value as any,p:Program={start:[],key:[],touch:[],receive:[]};for(const k of Object.keys(p)as(keyof Program)[]){p[k]=walk(src[k]||[]);expand(p[k])}return p;
}
export function energyTransition(s:GameState,c:Command,map:ReturnType<typeof generateMap>,m:MissionSettings){const before=s.energy;const n=transition({...s,energy:999},c,map);const cost=c.op==='move'?m.costs.move:['left','right'].includes(c.op)?m.costs.turn:c.op==='pick'?m.costs.pick:c.op==='drop'?m.costs.drop:0;n.energy=m.energy?before-cost:999;if(n.energy<0)throw Error('พลังงานหมดแล้ว');return n;}
export function replaySubmission(room:Pick<Room,'mission'|'seed'|'difficulty'>,input:Submission,attempts:number,seconds:number){
 const m=room.mission,p=validateProgram(input.program,m),map=generateMap(m.level,room.seed,room.difficulty);let state=initialState(map);state.energy=m.energy?m.startEnergy:999;state.features=['event'];let steps=0,touched=false;
 const execute=(cs:Command[])=>{const queue=expand(cs);for(let i=0;i<queue.length;i++){if(++steps>500)throw Error('โปรแกรมเกิน 500 ขั้นตอน');const c=queue[i];state=energyTransition(state,c,map,m);if(c.op==='broadcast'){state.features.push('receive');queue.splice(i+1,0,...expand(p.receive))}if(state.touched&&!touched){touched=true;queue.splice(i+1,0,...expand(p.touch))}}};execute(p.start);
 if(!Number.isInteger(input.keyTriggers)||input.keyTriggers<0||input.keyTriggers>20)throw Error('เหตุการณ์ไม่ถูกต้อง');for(let i=0;i<input.keyTriggers;i++){if(!p.key.length)throw Error('ไม่มีเหตุการณ์ Space');state.features.push('key');execute(p.key)}
 const check=completion(m.level,map,state,{prediction:input.prediction===m.level.prediction?.answer,storyboard:Array.isArray(input.storyboard)&&input.storyboard.length===4&&input.storyboard.every((v,i)=>v===i),customize:['mint','sunny','violet'].includes(input.character)&&['forest','sunset','sky'].includes(input.environment)});if(!check.won)throw Error(check.missing.join(' · '));
 const blocks=countBlocks(p),optimal=m.level.kind==='loop'?5:m.level.kind==='story'?Math.max(4,m.level.required?.length||4):map.optimal.length,efficiency=Math.min(1,optimal/Math.max(1,blocks));const w=m.weights;
 const score=m.level.id?Math.min(100,Math.max(0,Math.round(w.mission+w.efficiency*efficiency+w.attempts*Math.max(.2,1-(attempts-1)*2/15)+w.time*Math.max(.2,1-Math.max(0,seconds-120)/600)))):0;
 return {score,stars:m.level.id?(efficiency>=(m.level.starRules?.three??.9)?3:efficiency>=(m.level.starRules?.two??.6)?2:1):0,blocks,attempts,seconds,state};
}
export const compareResults=(a:any,b:any)=>b.score-a.score||b.stars-a.stars||a.blocks-b.blocks||a.attempts-b.attempts||a.seconds-b.seconds||String(a.studentId).localeCompare(String(b.studentId));

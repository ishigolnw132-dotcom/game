import {z} from 'zod';
import {generateMap} from '../game/engine';
import type {MissionSettings} from './contracts';
const text=z.string().trim().min(1).max(500);
export const missionSchema=z.object({
 active:z.boolean(),energy:z.boolean(),startEnergy:z.coerce.number().int().min(1).max(500),
 costs:z.object({move:z.number().min(0).max(20),turn:z.number().min(0).max(20),pick:z.number().min(0).max(20),drop:z.number().min(0).max(20)}),
 weights:z.object({mission:z.number().min(0).max(100),efficiency:z.number().min(0).max(100),attempts:z.number().min(0).max(100),time:z.number().min(0).max(20)}),
 level:z.object({id:z.number().int().min(0).max(999),world:z.number().int().min(1).max(3),stage:z.number().int().min(1).max(999).optional(),lessonId:text.max(100).optional(),title:text.max(120),concept:text.max(120),description:text,instruction:text,kind:z.enum(['path','key','delivery','logic','story','loop']),blocks:z.array(z.enum(['move','left','right','pick','drop','say','show','hide','repeat','broadcast','ending'])).min(1).max(11),hints:z.array(text.max(300)).length(3),stars:z.number().int().min(1).max(3).default(3),required:z.array(z.enum(['event','key','broadcast','receive','repeat','say','friend','hide','show','ending','prediction','storyboard','customize','story3','move2','move4'])).max(20).optional(),prediction:z.object({question:text,choices:z.array(text.max(120)).min(2).max(6),answer:z.number().int().min(0).max(5)}).optional(),storyboard:z.array(text.max(120)).length(4).optional(),mapRules:z.object({gridSize:z.number().int().min(5).max(11),layout:z.enum(['straight','bent','circuit']),rotate:z.boolean(),obstacleDensity:z.number().min(0).max(1),itemIndex:z.number().int().min(1).max(30),gateIndex:z.number().int().min(2).max(40)}).optional(),scene:z.enum(['forest','sunset','sky']).optional(),npc:z.boolean().optional(),difficulty:z.enum(['easy','normal','hard']).optional(),timeLimit:z.number().int().min(60).max(86400).optional(),attemptLimit:z.number().int().min(1).max(100).optional(),starRules:z.object({three:z.number().min(.1).max(1),two:z.number().min(.01).max(1)}).optional(),assetId:z.string().regex(/^[A-Za-z0-9_-]{1,128}$/).optional()})
});
export function validateMission(input:unknown):MissionSettings{
 const m=missionSchema.parse(input);if(Object.values(m.weights).reduce((a,b)=>a+b,0)!==100)throw Error('น้ำหนักคะแนนรวมต้องเท่ากับ 100');
 if(m.level.starRules&&m.level.starRules.two>=m.level.starRules.three)throw Error('เกณฑ์ 3 ดาวต้องสูงกว่า 2 ดาว');
 if(m.level.required?.includes('prediction')&&(!m.level.prediction||m.level.prediction.answer>=m.level.prediction.choices.length))throw Error('กำหนดคำถามและคำตอบทำนายผลให้ครบ');
 if(m.level.required?.includes('storyboard')&&!m.level.storyboard)throw Error('กำหนดลำดับเรื่อง 4 ฉาก');
 if(m.level.kind==='logic'&&m.level.mapRules?.layout==='straight')throw Error('เกมตรรกะต้องใช้เส้นทางแบบเลี้ยวหรือวงรอบ');
 for(const d of ['easy','normal','hard']as const)for(let i=0;i<8;i++){
 const map=generateMap(m.level,'VALIDATE-'+i,d);if(m.level.kind!=='story'){
 if(!m.level.blocks.includes('move'))throw Error('ภารกิจเดินต้องมีบล็อกเดินหน้า');
 if(map.optimal.some(c=>c.op==='left'||c.op==='right')&&!m.level.blocks.some(c=>c==='left'||c==='right'))throw Error('เส้นทางมีจุดเลี้ยว ต้องอนุญาตบล็อกเลี้ยว');
 for(const op of ['pick','drop']as const)if(map.optimal.some(c=>c.op===op)&&!m.level.blocks.includes(op))throw Error('ภารกิจต้องใช้บล็อก '+op);
 const energy=map.optimal.reduce((n,c)=>n+(c.op==='move'?m.costs.move:c.op==='pick'?m.costs.pick:c.op==='drop'?m.costs.drop:m.costs.turn),0);if(m.energy&&m.startEnergy<energy)throw Error('พลังงานน้อยเกินกว่าจะจบแผนที่บางความยาก');
 }}return m;
}

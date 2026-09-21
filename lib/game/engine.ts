import type { Command, Difficulty, Direction, GameMap, GameState, Level, Point, Program } from './types';
export const DIRS = [{ x: 0, z: -1 }, { x: 1, z: 0 }, { x: 0, z: 1 }, { x: -1, z: 0 }];
export const same = (a: Point, b: Point) => a.x === b.x && a.z === b.z;
export const key = (p: Point) => `${p.x},${p.z}`;
export function random(seed: string) { let h = 2166136261; for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619); return () => { h += 0x6d2b79f5; let t = Math.imul(h ^ h >>> 15, 1 | h); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function generateMap(level: Level, seed: string, difficulty: Difficulty = 'normal'): GameMap {
 if (!/^[A-Za-z0-9-]{1,64}$/.test(seed)) throw new Error('รหัสแผนที่ต้องเป็นตัวอักษรอังกฤษ ตัวเลข หรือขีดกลาง ไม่เกิน 64 ตัว');
 const rnd = random(seed + level.id + difficulty), rules=level.mapRules, size=rules?.gridSize||7, end=size-2;
 const start = { x: 1, z: end }, path: Point[] = [{ ...start }];
 if (rules?.layout === 'straight') for (let z = end-1; z >= Math.max(1,end-3); z--) path.push({ x: 1, z });
 else if (rules?.layout==='circuit'||(!rules&&level.kind==='story')) { for (let z = end-1; z >= 1; z--) path.push({ x: 1, z }); for (let x = 2; x <= end; x++) path.push({ x, z: 1 }); for (let z = 2; z <= end; z++) path.push({ x: end, z }); for (let x = end-1; x >= 2; x--) path.push({ x, z: end }); }
 else { const corner = level.kind === 'loop' ? 1 : difficulty === 'easy' ? 3 : difficulty === 'hard' ? 1 : 2;
 for (let z = end-1; z >= corner; z--) path.push({ x: 1, z }); for (let x = 2; x <= end; x++) path.push({ x, z: corner });
 if (difficulty === 'hard' && level.kind !== 'loop') for (let z = 2; z <= 3; z++) path.push({ x: end, z }); }
 const goal = { ...path[path.length - 1] }; let wrongGoal: Point | undefined;
 if (level.kind === 'logic') { wrongGoal = { x: 1, z: 0 }; for (let z = path.find(p => p.x === 2)!.z - 1; z >= 0; z--) path.push({ x: 1, z }); }
 const item = ['key', 'delivery'].includes(level.kind) ? { ...path[Math.min(path.length-2,rules?.itemIndex??2)] } : undefined;
 const gate = level.kind === 'key' ? { ...path[Math.min(path.length-1,Math.max((rules?.itemIndex??2)+1,rules?.gateIndex??4))] } : undefined;
 const walkable = new Set(path.map(key)), obstacles: Point[] = [];
 for (let z = 0; z < size; z++) for (let x = 0; x < size; x++) if (!walkable.has(`${x},${z}`) && rnd() < (rules?.obstacleDensity??.53)) obstacles.push({ x, z });
 const map: GameMap = { seed, levelId: level.id, size, start, direction: 0, goal, wrongGoal, path, item, gate, obstacles, optimal: [] };
 const turns = rules?.rotate===false || seed.endsWith('-2026') ? 0 : Math.floor(rnd()*4);
 const rotate = (p: Point): Point => { let q = {...p}; for (let i=0;i<turns;i++) q={x:size-1-q.z,z:q.x}; return q; };
 map.start=rotate(map.start);map.goal=rotate(map.goal);map.path=map.path.map(rotate);map.obstacles=map.obstacles.map(rotate);map.direction=turns as Direction;if(map.item)map.item=rotate(map.item);if(map.gate)map.gate=rotate(map.gate);if(map.wrongGoal)map.wrongGoal=rotate(map.wrongGoal);
 map.optimal = solve(map, level.kind === 'delivery'); if (!map.optimal.length) throw new Error('แผนที่นี้ไม่มีเส้นทางที่แก้ได้'); return map;
}
export function solve(map: GameMap, deliver = false): Command[] {
 type S = Point & { d: Direction; picked: boolean; cmds: Command[] };
 const queue: S[] = [{ ...map.start, d: map.direction, picked: false, cmds: [] }], seen = new Set<string>(), route = new Set(map.path.map(key));
 for (let i = 0; i < queue.length && i < 3000; i++) { const s = queue[i], k = `${s.x},${s.z},${s.d},${s.picked}`; if (seen.has(k)) continue; seen.add(k);
 if (same(s, map.goal) && (!map.item || s.picked)) return deliver ? [...s.cmds, { op: 'drop' }] : s.cmds;
 const push = (p: S, cmd: Command) => queue.push({ ...p, cmds: [...s.cmds, cmd] });
 if (map.item && same(s, map.item) && !s.picked) push({ ...s, picked: true }, { op: 'pick' });
 push({ ...s, d: (s.d + 1) % 4 as Direction }, { op: 'right' }); push({ ...s, d: (s.d + 3) % 4 as Direction }, { op: 'left' });
 const p = { x: s.x + DIRS[s.d].x, z: s.z + DIRS[s.d].z };
 if (route.has(key(p)) && (!map.gate || !same(p, map.gate) || s.picked)) push({ ...s, ...p }, { op: 'move' }); }
 return [];
}
export const initialState = (map: GameMap, energy = false): GameState => ({ position: { ...map.start }, direction: map.direction, energy: energy ? Math.max(24, map.optimal.length + 8) : 999, carrying: false, picked: false, delivered: false, visible: true, steps: 0, speech: '', speaker: 'bot', ended: false, touched: false, log: [], features: [] });
export function expand(commands: Command[], depth = 0, budget = { n: 0 }): Command[] {
 if (depth > 8) throw new Error('บล็อกซ้อนกันลึกเกินไป ลองลดให้ไม่เกิน 8 ชั้น'); const out: Command[] = [];
 for (const c of commands) { if (++budget.n > 500) throw new Error('โปรแกรมยาวเกิน 500 ขั้นตอน ลองลดจำนวนครั้งในลูป');
 if (c.op === 'repeat') { const n = Number(c.count); if (!Number.isInteger(n) || n < 1 || n > 20) throw new Error('ทำซ้ำได้ 1–20 ครั้ง'); out.push({ ...c, body: undefined }); for (let i = 0; i < n; i++) out.push(...expand(c.body || [], depth + 1, budget)); } else out.push(c); } return out;
}
export function transition(state: GameState, c: Command, map: GameMap): GameState {
 const s = structuredClone(state); s.speech = ''; const feature = (f: string) => { if (!s.features.includes(f)) s.features.push(f); }; feature(c.op);
 if (['move', 'left', 'right', 'pick', 'drop'].includes(c.op)) { s.energy -= ['pick', 'drop'].includes(c.op) ? 2 : 1; if (s.energy < 0) throw new Error('พลังงานหมดแล้ว ลองวางแผนให้ใช้คำสั่งน้อยลง'); }
 switch (c.op) {
 case 'move': { const next = { x: s.position.x + DIRS[s.direction].x, z: s.position.z + DIRS[s.direction].z }; if (!map.path.some(p => same(p, next))) throw new Error('ทางนี้เดินต่อไม่ได้ ลองตรวจทิศหรือจุดเลี้ยวดูนะ'); if (map.gate && same(map.gate, next) && !s.carrying) throw new Error('ประตูยังล็อกอยู่ ต้องเก็บกุญแจก่อน'); s.position = next; s.steps++; if (same(next, map.goal)) s.touched = true; break; }
 case 'left': s.direction = (s.direction + 3) % 4 as Direction; break;
 case 'right': s.direction = (s.direction + 1) % 4 as Direction; break;
 case 'pick': if (!map.item || !same(s.position, map.item) || s.picked) throw new Error('ยังไม่มีของให้เก็บที่ช่องนี้ เดินไปหยุดบนช่องของก่อน'); s.carrying = true; s.picked = true; break;
 case 'drop': if (!s.carrying) throw new Error('บอทยังไม่ได้ถือของ ลองใช้เก็บของก่อน'); if (!same(s.position, map.goal)) throw new Error('วางของที่ช่องดาวเท่านั้นนะ'); s.delivered = true; s.carrying = false; break;
 case 'say': s.speech = (c.text || 'สวัสดี!').slice(0, 100); s.speaker = c.actor || 'bot'; s.log.push(`${s.speaker}: ${s.speech}`); if (s.speaker === 'friend') feature('friend'); break;
 case 'hide': s.visible = false; break;
 case 'show': s.visible = true; break;
 case 'ending': s.ended = true; s.speech = 'จบเรื่อง ขอบคุณที่รับชม!'; break;
 } return s;
}
export function completion(level: Level, map: GameMap, s: GameState, context: { prediction: boolean; storyboard: boolean; customize: boolean }): { won: boolean; missing: string[] } {
 const missing: string[] = [];
 if (level.kind !== 'story' && !same(s.position, map.goal)) missing.push(level.kind === 'logic' ? 'เดินไปยังคำตอบ X' : 'พาบอทไปถึงดาว');
 if (level.kind === 'key' && !s.picked) missing.push('เก็บกุญแจ'); if (level.kind === 'delivery' && !s.delivered) missing.push('เก็บและวางของบนช่องดาว');
 const labels: Record<string,string> = { prediction: 'ตอบคำถามทำนายผลให้ถูกต้อง', storyboard: 'เรียงฉากเรื่องให้ถูกต้อง', customize: 'เลือกตัวละครและฉาก', story3: 'บทพูดอย่างน้อย 3 ประโยค', move2: 'เดินอย่างน้อย 2 ก้าว', move4: 'เดินอย่างน้อย 4 ก้าว', say: 'ให้บอทพูด', friend: 'ให้เพื่อนพูดตอบ', hide: 'ซ่อนตัว', show: 'แสดงตัว', repeat: 'ใช้บล็อกทำซ้ำ', key: 'เรียกเหตุการณ์ Space', broadcast: 'ส่งสัญญาณ', receive: 'รับสัญญาณ', event: 'ใช้เหตุการณ์เริ่มเกมหรือ Space', ending: 'ใช้บล็อกจบเรื่อง' };
 for (const r of level.required || []) { let ok = s.features.includes(r); if (r in context) ok = context[r as keyof typeof context]; if (r === 'story3') ok = s.log.length >= 3; if (r === 'move2') ok = s.steps >= 2; if (r === 'move4') ok = s.steps >= 4; if (r === 'ending') ok = s.ended; if (!ok) missing.push(labels[r] || r); }
 return { won: missing.length === 0, missing };
}
export function countBlocks(p: Program): number { const count = (cs: Command[]): number => cs.reduce((sum,c) => sum + 1 + count(c.body || []),0); return Object.values(p).reduce((n,cs) => n + count(cs),0); }
export function scoreResult(level: Level, map: GameMap, blocks: number, attempts: number, seconds: number) {
 if (!level.id) return {score:0,stars:0}; const optimal = level.kind === 'loop' ? 5 : level.kind === 'story' ? Math.max(4,level.required?.length || 4) : map.optimal.length; const efficiency = Math.min(1, optimal / Math.max(1,blocks));
 return { score: Math.min(100,Math.round(50 + 25 * efficiency + Math.max(3,15 - (attempts - 1) * 2) + Math.max(2,10 - Math.max(0,seconds - 120) / 60))), stars: efficiency >= .9 ? 3 : efficiency >= .6 ? 2 : 1 };
}

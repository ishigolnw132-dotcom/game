import type { Level, Op } from './types';
const basic: Op[] = ['move', 'left', 'right'];
const actions: Op[] = [...basic, 'pick', 'drop'];
const story: Op[] = [...basic, 'say', 'show', 'hide', 'repeat', 'broadcast', 'ending'];
const pathHints = ['ดูตำแหน่งเริ่มต้นและดาวก่อน แล้วนับช่องทางเดินที่เชื่อมกัน', 'เดินหน้าคือทิศที่บอทหันอยู่ ใช้เลี้ยวซ้ายหรือขวาเมื่อถึงทางโค้ง', 'ลองแบ่งเส้นทางเป็นช่วงตรง ๆ และใช้ปุ่มทีละขั้นเพื่อตรวจจุดเลี้ยว'];
export const WORLDS = [ { id: 1, name: 'ป่าตรรกะแสนสนุก', sub: 'คิดอย่างมีเหตุผล', range: '01 — 05', color: 'green' }, { id: 2, name: 'เกาะนักออกแบบ', sub: 'ออกแบบก่อนเขียนโปรแกรม', range: '06 — 10', color: 'blue' }, { id: 3, name: 'ดินแดนสร้างเรื่องราว', sub: 'สร้างสรรค์ด้วยโค้ด', range: '11 — 20', color: 'purple' } ];
type Entry = Omit<Level, 'hints' | 'stars' | 'instruction'> & Partial<Pick<Level, 'hints' | 'stars' | 'instruction'>>;
const entries: Entry[] = [
{ id: 0, mapRules:{gridSize:7,layout:"straight",rotate:false,obstacleDensity:.53,itemIndex:2,gateIndex:4}, world: 1, title: 'ก้าวแรกของนักผจญภัย', concept: 'เริ่มต้นใช้งาน', description: 'ลองพาบอทเดินไปหาดาวดวงแรก', instruction: 'ลากบล็อกเดินหน้า ต่อใต้เมื่อเริ่มเกม แล้วกดรัน หมุนฉากและลองปุ่มทีละขั้นได้ด้วย', kind: 'path', blocks: basic },
{ id: 1, world: 1, title: 'ตามหาดาวดวงแรก', concept: 'เหตุผลเชิงตรรกะ', description: 'พาบอทน้อยไปให้ถึงดาว โดยเดินตามเส้นทางที่ปลอดภัย', kind: 'path', blocks: basic },
{ id: 2, world: 1, title: 'กุญแจไขความลับ', concept: 'กฎและเงื่อนไข', description: 'เก็บกุญแจก่อน แล้วพาบอทผ่านประตูไปหาดาว', kind: 'key', blocks: actions, hints: ['ประตูเปิดได้เมื่อบอทมีกุญแจเท่านั้น', 'เดินไปหยุดบนช่องกุญแจ แล้วต่อบล็อกเก็บของ', 'เก็บกุญแจให้เรียบร้อยก่อนเดินผ่านช่องประตู'] },
{ id: 3, mapRules:{gridSize:7,layout:"bent",rotate:false,obstacleDensity:.53,itemIndex:2,gateIndex:4}, world: 1, title: 'นักทำนายผลลัพธ์', concept: 'สถานะเริ่มต้นและผลลัพธ์', description: 'ทำนายทิศของบอท แล้วทดสอบความคิดด้วยโปรแกรมของเรา', kind: 'path', blocks: basic, prediction: { question: 'เริ่มหันเหนือ → เลี้ยวขวา → เลี้ยวขวา บอทจะหันทิศใด?', choices: ['เหนือ (N)', 'ตะวันออก (E)', 'ใต้ (S)', 'ตะวันตก (W)'], answer: 2 }, required: ['prediction'] },
{ id: 4, world: 1, title: 'จริงหรือไม่ ไปพิสูจน์!', concept: 'เกม O / X เชิงตรรกะ', description: '“เดินหน้า 3 ครั้ง ได้ผลเหมือนเดินหน้า 1 ครั้ง” พาบอทไป O ถ้าจริง หรือ X ถ้าไม่จริง', kind: 'logic', blocks: basic },
{ id: 5, world: 1, title: 'ภารกิจโลกสีเขียว', concept: 'เหตุผลในชีวิตประจำวัน', description: 'เก็บขวดที่หล่น แล้ววางลงจุดรีไซเคิลบนช่องดาว', kind: 'delivery', blocks: actions },
{ id: 6, world: 2, title: 'ออกแบบเส้นทางของเรา', concept: 'รู้จัก Algorithm', description: 'ออกแบบขั้นตอนเก็บพัสดุและนำไปวางที่ปลายทาง', kind: 'delivery', blocks: actions },
{ id: 7, world: 2, title: 'อ่าน คิด แล้วลงมือ', concept: 'Algorithm จากข้อความ', description: 'ทำตามข้อความ: เดินไปหาพัสดุ → เก็บ → เดินไปหาดาว → วาง', kind: 'delivery', blocks: actions },
{ id: 8, world: 2, title: 'ผู้กำกับตัวน้อย', concept: 'Storyboard และลำดับ', description: 'เรียงฉากให้ถูกต้อง แล้วเขียนโปรแกรมส่งพัสดุตามเรื่อง', kind: 'delivery', blocks: actions, storyboard: ['เริ่มเดินทาง', 'พบพัสดุและเก็บ', 'เดินไปจุดหมาย', 'ส่งพัสดุสำเร็จ'], required: ['storyboard'] },
{ id: 9, world: 2, title: 'จับบั๊กในป่า', concept: 'Debugging Algorithm', description: 'โปรแกรมตั้งต้นมีจุดเลี้ยวผิด ลองทีละขั้นแล้วแก้ให้บอทไปถึงดาว', kind: 'path', blocks: basic },
{ id: 10, world: 2, title: 'เรื่องเล่าบนเกาะ', concept: 'เริ่มต้น ปัญหา การแก้ไข ผลลัพธ์', description: 'เล่าเรื่องอย่างน้อย 3 ประโยค ให้บอทเดิน 2 ก้าว และใช้บล็อกจบเรื่อง', kind: 'story', blocks: story, required: ['story3', 'move2', 'ending'] },
{ id: 11, world: 3, title: 'รู้จักห้องทดลองโค้ด', concept: 'พื้นที่ทำงาน Coding', description: 'เชื่อมบล็อกใต้เมื่อเริ่มเกม แล้วพาบอทไปหาดาว', kind: 'path', blocks: basic },
{ id: 12, world: 3, title: 'โลกในแบบของฉัน', concept: 'ตัวละครและฉาก', description: 'เลือกตัวละครและฉากในเมนูตั้งค่า แล้วให้บอทพูดแนะนำตัว', kind: 'story', blocks: story, required: ['customize', 'say'] },
{ id: 13, world: 3, title: 'ต่อให้ถูกลำดับ', concept: 'Sequence', description: 'ลำดับสำคัญ! เก็บพัสดุก่อน แล้วค่อยนำไปวางบนดาว', kind: 'delivery', blocks: actions },
{ id: 14, world: 3, title: 'บอทนักมายากล', concept: 'Movement & Appearance', description: 'เดิน 2 ก้าว พูด ซ่อนตัว แล้วแสดงตัวอีกครั้ง', kind: 'story', blocks: story, required: ['move2', 'say', 'hide', 'show'] },
{ id: 15, world: 3, title: 'กดปุ่มแล้วเริ่มเลย', concept: 'Event', description: 'เขียนคำสั่งใต้เมื่อกด Space ให้บอทพูดและเดินอย่างน้อย 2 ก้าว', kind: 'story', blocks: story, required: ['key', 'say', 'move2'] },
{ id: 16, world: 3, title: 'สวัสดีเพื่อนใหม่', concept: 'Dialogue', description: 'ให้บอทและเพื่อนพูดตอบกัน เลือกผู้พูดในบล็อกคำพูด', kind: 'story', blocks: story, required: ['say', 'friend'] },
{ id: 17, world: 3, title: 'ส่งข่าวถึงเพื่อน', concept: 'Broadcast / Communication', description: 'บอทส่งสัญญาณ แล้วให้เพื่อนพูดตอบจากบล็อกเมื่อรับสัญญาณ', kind: 'story', blocks: story, required: ['broadcast', 'receive', 'friend'] },
{ id: 18, world: 3, title: 'ทำน้อย ได้มาก', concept: 'Repeat / Loop', description: 'ใช้ทำซ้ำช่วยพาบอทไปถึงดาวด้วยบล็อกที่กระชับ', kind: 'loop', blocks: [...basic, 'repeat'], required: ['repeat'] },
{ id: 19, world: 3, title: 'นักสืบบั๊กมือโปร', concept: 'Debugging Loop', description: 'จำนวนครั้งในลูปยังไม่ถูกต้อง แก้โปรแกรมให้ถึงดาว', kind: 'loop', blocks: [...basic, 'repeat'], required: ['repeat'] },
{ id: 20, world: 3, title: 'การผจญภัยที่ฉันสร้าง', concept: 'Final Project', description: 'สร้างเรื่อง 3D: เลือกฉากและตัวละคร เดิน 4 ก้าว บทสนทนา 2 ตัวละคร Event ทำซ้ำ และจบเรื่อง', kind: 'story', blocks: story, required: ['customize', 'move4', 'say', 'friend', 'repeat', 'event', 'ending'] }
];
export const LEVELS: Level[] = entries.map(l => ({ instruction: 'ลากบล็อกมาต่อใต้ “เมื่อเริ่มเกม” แล้วกดรันเพื่อทดสอบ', hints: pathHints, stars: 3, ...l }));
export const getLevel = (id: number) => LEVELS.find(l => l.id === id) || LEVELS[1];

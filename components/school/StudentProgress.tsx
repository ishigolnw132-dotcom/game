'use client';
import {useEffect,useState} from 'react';
import {callSchool} from '@/lib/school/client';
import {LEVELS,WORLDS} from '@/lib/game/curriculum';
import {Star,Award} from 'lucide-react';
export function StudentProgress({studentId}:{studentId:string}){
 const [scores,setScores]=useState<any[]|null>(null),[error,setError]=useState('');
 useEffect(()=>{let alive=true;callSchool('studentDetail',{studentId}).then(v=>{if(alive)setScores(v.scores)}).catch(e=>alive&&setError(e.message));return()=>{alive=false}},[studentId]);
 if(error)return <p className="school-error">{error}</p>;if(!scores)return <p role="status">กำลังอ่านความก้าวหน้าของฉัน…</p>;
 const best=LEVELS.filter(l=>l.id).map(l=>scores.filter(s=>s.levelId===l.id).sort((a,b)=>b.score-a.score||b.stars-a.stars)[0]),completed=best.filter(Boolean).length,stars=best.reduce((n,s)=>n+(s?.stars||0),0),xp=best.reduce((n,s)=>n+(s?.score||0),0);
 return <section className="student-progress"><h2>การเรียนรู้ของฉัน</h2><div className="school-metrics"><div><span>ผ่านบทเรียน</span><b>{completed}/20</b></div><div><span>ดาว</span><b>{stars}/60</b></div><div><span>XP จากคะแนนที่ตรวจแล้ว</span><b>{xp}</b></div></div><p>ด่านแนะนำถัดไป: {best.findIndex(s=>!s)>=0?best.findIndex(s=>!s)+1:'ผ่านครบแล้ว'} · เข้าห้องที่ครูเปิดเพื่อเรียนต่อ</p>{WORLDS.map(w=><section key={w.id}><h3>{w.name}</h3><div className="stage-grid">{LEVELS.filter(l=>l.id&&l.world===w.id).map(l=>{const score=best[l.id-1];return <div className="student-stage" key={l.id}><b>{l.id}. {l.title}</b><span>{score?`${score.score}/100 · ${score.stars} ดาว`:'ยังไม่ผ่าน'}</span></div>})}</div></section>)}<div className="achievement-row">{[['ดาวดวงแรก',completed>=1],['นักสำรวจป่า',best.slice(0,5).every(Boolean)],['นักคิดครบ 20 ด่าน',completed===20]].map(([label,ready])=><div key={String(label)} className={ready?'earned':''}><Award/><span>{String(label)}</span>{ready&&<Star size={16}/>}</div>)}</div><p className="small-note">แสดงคะแนนดีที่สุดตลอดประวัติ คะแนนในแต่ละรอบอยู่ในหน้าประวัติของฉัน</p></section>;
}

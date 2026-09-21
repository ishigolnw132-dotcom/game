'use client';
import {useEffect,useState} from 'react';
import {callSchool} from '@/lib/school/client';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {GameScene} from '../game/GameScene';
import {generateMap,initialState} from '@/lib/game/engine';
import {getLevel} from '@/lib/game/curriculum';
import {DEFAULT_PREFERENCES} from '@/lib/game/storage';
const map=generateMap(getLevel(1),'ASSET-PREVIEW');
export function AssetPanel(){
 const [data,setData]=useState<any>({ready:true,storageMode:'github',rows:[]}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[preview,setPreview]=useState<any>(null);
 const run=async(fn:()=>Promise<void>)=>{if(busy)return;setBusy(true);setError('');try{await fn()}catch(e){setError((e as Error).message)}finally{setBusy(false)}};
 const refresh=async()=>setData(await callSchool('assets'));useEffect(()=>{run(refresh)},[]);
 return <><h2>โมเดลตัวละคร 3D</h2><p>โหมดฟรีเก็บไฟล์ GLB บน GitHub Pages โดยตรง จึงไม่ใช้ Firebase Storage และไม่มีค่าใช้จ่ายแบบ Blaze</p><p className="small-note">เพิ่มโมเดลใหม่โดยวางไฟล์ใน <code>public/models/custom/</code> แล้วเพิ่มรายการใน <code>public/school-config.json</code> จากนั้น Push ขึ้น GitHub อีกครั้ง</p>{error&&<p role="alert" className="school-error">{error}</p>}{!data.rows.length?<p>ยังไม่มีโมเดลพิเศษที่ลงทะเบียนไว้ · โมเดลมาตรฐานของเกมยังใช้งานตามปกติ</p>:<div className="school-cards">{data.rows.map((a:any)=><article key={a.id}><h3>{a.name}</h3><p>GitHub Pages · {a.active?'เปิดใช้งาน':'ปิดไว้'}</p><small>{a.path||a.url}</small><button className="outline-btn" onClick={()=>setPreview(a)}>ดูโมเดล 3D</button><button className="outline-btn" disabled={busy} onClick={()=>run(async()=>{await callSchool('setAssetActive',{assetId:a.id,active:!a.active});await refresh()})}>{a.active?'ปิดใช้ในบทเรียนใหม่':'เปิดใช้งาน'}</button></article>)}</div>}<Dialog open={!!preview} onOpenChange={v=>!v&&setPreview(null)}><DialogContent className="game-dialog wide-dialog"><DialogTitle>{preview?.name||'ตัวอย่างโมเดล'}</DialogTitle><DialogDescription>ลากหมุนหรือซูมเพื่อตรวจโมเดลก่อนเลือกใช้ในบทเรียน</DialogDescription>{preview&&<GameScene map={map} state={initialState(map)} preferences={DEFAULT_PREFERENCES} schoolAsset={{assetId:preview.id,roomId:'preview'}} npc={false} onReady={()=>{}} onLoading={()=>{}} onError={setError} onTouch={()=>{}}/>}</DialogContent></Dialog></>;
}

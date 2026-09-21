import {getStorage} from 'firebase-admin/storage';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import {randomUUID,createHash} from 'node:crypto';
import type {Identity} from '../../../lib/school/contracts';
export async function assetOperation(u:Identity,op:string,p:any){
 const db=getFirestore(),collection=db.collection(`schools/${u.schoolId}/assets`),bucketName=process.env.CQ_ASSET_BUCKET;
 if(op==='assets'){if(u.role!=='admin')throw Error('ไม่มีสิทธิ์จัดการโมเดล');return{ready:!!bucketName,rows:(await collection.orderBy('createdAt','desc').limit(200).get()).docs.map(d=>({...d.data(),id:d.id}))}}
 if(!bucketName)throw Error('NOT READY · ยังไม่ได้กำหนดพื้นที่เก็บโมเดลของโรงเรียน');
 if(op==='uploadAsset'){
 if(u.role!=='admin')throw Error('ไม่มีสิทธิ์เพิ่มโมเดล');if(typeof p.base64!=='string'||p.base64.length>7_000_000)throw Error('โมเดลต้องไม่เกิน 5 MB');
 const bytes=Buffer.from(p.base64,'base64');if(bytes.length<24||bytes.length>5_000_000||bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==bytes.length||bytes.readUInt32LE(16)!==0x4e4f534a)throw Error('ไฟล์ GLB 2.0 ไม่ถูกต้อง');
 const size=bytes.readUInt32LE(12);if(size>bytes.length-20)throw Error('ข้อมูล GLB ไม่ครบ');let gltf:any;try{gltf=JSON.parse(bytes.subarray(20,20+size).toString())}catch{throw Error('โครงสร้าง GLB อ่านไม่ได้')}
 if([...gltf.buffers||[],...gltf.images||[]].some(x=>x.uri))throw Error('GLB ต้องรวมทรัพยากรในไฟล์เดียว');
 const required=['Idle','Walk','Run','TurnLeft','TurnRight','PickUp','Carry','Drop','Talk','Happy','Wrong','Celebrate'];if(!gltf.skins?.length||required.some(name=>!gltf.animations?.some((a:any)=>a.name===name)))throw Error('ตัวละครต้องมี skeleton และแอนิเมชันครบ 12 ท่าตามแบบเกม');
 if(!gltf.meshes?.length||gltf.nodes?.length>500||gltf.accessors?.some((a:any)=>a.count>200000))throw Error('โมเดลซับซ้อนเกินขีดจำกัด');
 const name=String(p.name||'').trim().slice(0,120);if(!name)throw Error('กรอกชื่อโมเดล');const assetId=randomUUID(),path=`schools/${u.schoolId}/models/${assetId}.glb`,digest=createHash('sha256').update(bytes).digest('hex');await getStorage().bucket(bucketName).file(path).save(bytes,{resumable:false,metadata:{contentType:'model/gltf-binary',cacheControl:'private,max-age=3600'}});
 const record={name,path,bytes:bytes.length,digest,active:true,kind:'character',createdAt:Date.now(),createdBy:u.uid,animations:required};try{await db.runTransaction(async tx=>{tx.create(collection.doc(assetId),record);tx.create(db.collection(`schools/${u.schoolId}/system_logs`).doc(),{action:'asset.uploaded',target:assetId,actor:u.uid,schoolId:u.schoolId,createdAt:FieldValue.serverTimestamp()})})}catch(e){await getStorage().bucket(bucketName).file(path).delete().catch(()=>{});throw e}return{id:assetId,...record};
 }
 if(typeof p.assetId!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(p.assetId))throw Error('รหัสโมเดลไม่ถูกต้อง');const doc=await collection.doc(p.assetId).get(),asset=doc.data();if(!asset)throw Error('ไม่พบโมเดล');
 if(op==='setAssetActive'){if(u.role!=='admin')throw Error('ไม่มีสิทธิ์แก้โมเดล');await doc.ref.update({active:p.active===true});return{saved:true}}
 if(op==='loadAsset'){
 if(u.role==='student'){const room=await db.doc(`schools/${u.schoolId}/rooms/${String(p.roomId)}`).get(),r=room.data();if(!r?.members?.[u.studentId!]||r.mission?.level?.assetId!==p.assetId)throw Error('ไม่มีสิทธิ์อ่านโมเดลนี้')}
 const [bytes]=await getStorage().bucket(bucketName).file(asset.path).download();return{base64:bytes.toString('base64'),digest:asset.digest};
 }
 throw Error('ไม่รองรับคำสั่งโมเดล');
}

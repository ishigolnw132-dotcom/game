import type {Identity} from './contracts';
const encoder=new TextEncoder(),decoder=new TextDecoder();
const bytes=(s:string)=>Uint8Array.from(atob(s),v=>v.charCodeAt(0));
const base64=(v:Uint8Array)=>btoa(Array.from(v,b=>String.fromCharCode(b)).join(''));
export class StudentCache {
 private sequence=0;private key:Promise<CryptoKey>;private prefix:string;
 constructor(owner:Identity,secret:string){if(!crypto.subtle)throw Error('การเก็บงานออฟไลน์ต้องเปิดเกมผ่าน HTTPS');this.key=crypto.subtle.importKey('raw',bytes(secret),'AES-GCM',false,['encrypt','decrypt']);this.prefix=`cq:secure:${owner.schoolId}:${owner.studentId}:`}
 async save(roundId:string,value:unknown){const seq=++this.sequence,key=await this.key,iv=crypto.getRandomValues(new Uint8Array(12)),encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,encoder.encode(JSON.stringify(value)));if(seq!==this.sequence)return;const k=this.prefix+roundId,blob=JSON.stringify({v:1,iv:base64(iv),cipher:base64(new Uint8Array(encrypted))});localStorage.setItem(k,blob);if(localStorage.getItem(k)!==blob)throw Error('ยืนยันการบันทึกบนเครื่องไม่สำเร็จ')}
 async load(roundId:string){const raw=localStorage.getItem(this.prefix+roundId);if(!raw)return null;const v=JSON.parse(raw);try{return JSON.parse(decoder.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(v.iv)},await this.key,bytes(v.cipher))))}catch{throw Error('งานออฟไลน์นี้ใช้สิทธิ์เดิมที่หมดอายุแล้ว กู้ข้อมูลจากโรงเรียนแทนได้')}}
 cancel(){this.sequence++}
}

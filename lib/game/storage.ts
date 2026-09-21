import type { GameState, Preferences, SavedResult } from './types';
export type Draft={seed:string;workspace:object|null;attempts:number;seconds:number;hints:number;state?:GameState;prediction?:number;board?:number[];customize?:boolean;execution?:{queue:any[];cursor:number;program:any;executed:number;touchFired:boolean;keyTriggers:number}};
export type PracticeData={version:1;profileId:string;currentLevel:number;preferences:Preferences;drafts:Record<number,Draft>;results:Record<number,SavedResult>;history:SavedResult[]};
export const DEFAULT_PREFERENCES:Preferences={character:'mint',environment:'forest',quality:'medium',sound:true,music:true,musicVolume:30,effectsVolume:55,speed:1,difficulty:'normal',energy:false};
export const freshData=(id:string):PracticeData=>({version:1,profileId:id,currentLevel:1,preferences:DEFAULT_PREFERENCES,drafts:{},results:{},history:[]});
export function writePractice(data:PracticeData){const k='cq:practice:'+data.profileId,v=JSON.stringify(data);localStorage.setItem(k,v);if(localStorage.getItem(k)!==v)throw new Error('บันทึกบนเครื่องไม่สำเร็จ');}
export function readPractice(id:string):PracticeData{const v=localStorage.getItem('cq:practice:'+id);if(!v)return freshData(id);try{const d=JSON.parse(v);if(d.version!==1||d.profileId!==id||!d.drafts||!d.results)throw new Error();return{...freshData(id),...d,preferences:{...DEFAULT_PREFERENCES,...d.preferences}}}catch{throw new Error('ข้อมูลฝึกเล่นที่บันทึกไว้เสียหาย กรุณาเริ่มผู้เล่นใหม่');}}
export const safeCSV=(value:unknown)=>{let v=String(value??'');if(/^[=+@\-\t\r\n]/.test(v))v="'"+v;return '"'+v.replaceAll('"','""')+'"'};
export function downloadFile(name:string,text:string,type='application/json'){const u=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),5000);}

export function localId(){if(typeof crypto.randomUUID==='function')return crypto.randomUUID();const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;return [...b].map((v,i)=>([4,6,8,10].includes(i)?'-':'')+v.toString(16).padStart(2,'0')).join('');}

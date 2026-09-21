import {initializeApp,type FirebaseApp,type FirebaseOptions} from 'firebase/app';
import {getAuth,setPersistence,browserSessionPersistence,signInWithEmailAndPassword,signInAnonymously,signOut,onAuthStateChanged,type Auth} from 'firebase/auth';
import {initializeAppCheck,ReCaptchaEnterpriseProvider} from 'firebase/app-check';
import {getFirestore,doc,onSnapshot,type Firestore} from 'firebase/firestore';
import type {Room,Identity} from './contracts';
import {sparkCall} from './spark-direct';
import {appUrl} from '../app-path';
export type SchoolClient={app:FirebaseApp;auth:Auth;db:Firestore;config:any;firebaseOptions:FirebaseOptions};
let promise:Promise<SchoolClient|null>|null=null;
export function schoolClient(){return promise||=load()}
async function load():Promise<SchoolClient|null>{const response=await fetch(appUrl('school-config.json'),{cache:'no-store'});if(!response.ok)throw Error('อ่านการเชื่อมต่อโรงเรียนไม่สำเร็จ');const config:any=await response.json();if(!config.enabled)return null;if(config.mode!=='spark-direct')throw Error('เวอร์ชันฟรีรองรับ Firebase Spark Direct เท่านั้น');if(!config.firebase?.projectId||!config.firebase?.apiKey||!config.firebase?.appId)throw Error('การตั้งค่าโรงเรียนยังไม่ครบ');const app=initializeApp(config.firebase,'code-quest-school');if(config.appCheckSiteKey){try{initializeAppCheck(app,{provider:new ReCaptchaEnterpriseProvider(config.appCheckSiteKey),isTokenAutoRefreshEnabled:true})}catch{}}const auth=getAuth(app);await setPersistence(auth,browserSessionPersistence);return {app,auth,db:getFirestore(app),config,firebaseOptions:config.firebase}}
export async function callSchool<T=any>(op:string,payload:Record<string,unknown>={}):Promise<T>{const c=await schoolClient();if(!c)throw Error('ระบบโรงเรียนยังไม่ได้เชื่อมต่อ');try{return await sparkCall<T>(c,op,payload)}catch(e:any){const message=String(e?.message||'เชื่อมต่อไม่สำเร็จ').replace(/^Firebase:\s*/,'');throw Error(message)} }
export async function staffLogin(email:string,password:string){const c=await schoolClient();if(!c)throw Error('ยังไม่ได้เชื่อมต่อโรงเรียน');await signInWithEmailAndPassword(c.auth,email,password);return callSchool<{identity:Identity}>('me')}
export async function studentLogin(code:string,studentCode:string,pin:string){const c=await schoolClient();if(!c)throw Error('ยังไม่ได้เชื่อมต่อโรงเรียน');if(!c.auth.currentUser)await signInAnonymously(c.auth);return callSchool<{identity:Identity;roomId:string}>('join',{code,studentCode,pin})}
export async function schoolLogout(){const c=await schoolClient();if(c)await signOut(c.auth)}
export async function observeIdentity(callback:(signedIn:boolean)=>void){const c=await schoolClient();if(!c){callback(false);return()=>{}}return onAuthStateChanged(c.auth,user=>callback(!!user))}
export async function observeRoom(schoolId:string,roomId:string,callback:(room:Room)=>void,onError:(e:Error)=>void){const c=await schoolClient();if(!c)throw Error('ยังไม่ได้เชื่อมต่อโรงเรียน');return onSnapshot(doc(c.db,'schools',schoolId,'rooms',roomId),snap=>{if(snap.exists())callback({...snap.data(),id:snap.id}as Room);else onError(Error('ไม่พบห้องเกม'))},onError)}
export async function schoolModel(assetId:string,roomId:string):Promise<string>{const result=await callSchool<{url?:string}>('loadAsset',{assetId,roomId});if(result.url)return appUrl(result.url);throw Error('ไม่พบไฟล์โมเดล')}

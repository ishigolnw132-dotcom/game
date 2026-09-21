import {initializeApp,applicationDefault} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
const [schoolId,schoolName,email,adminName]=process.argv.slice(2),password=process.env.CQ_BOOTSTRAP_PASSWORD;
if(!schoolId||!schoolName||!email||!adminName||!password||password.length<12)throw Error('Usage: CQ_BOOTSTRAP_PASSWORD=<secret> node scripts/bootstrap-school.mjs SCHOOL_ID SCHOOL_NAME ADMIN_EMAIL ADMIN_NAME');
initializeApp({credential:applicationDefault()});const db=getFirestore(),existing=await db.collection('users').where('schoolId','==',schoolId).where('role','==','admin').limit(1).get();if(!existing.empty)throw Error('School already has an administrator. No identity was changed.');
const user=await getAuth().createUser({email,password,displayName:adminName});try{await db.runTransaction(async tx=>{const s=db.doc('schools/'+schoolId);if((await tx.get(s)).exists)throw Error('School already exists');tx.create(s,{name:schoolName,createdAt:FieldValue.serverTimestamp(),createdBy:user.uid});tx.create(db.doc('users/'+user.uid),{schoolId,role:'admin',active:true,name:adminName,email,createdAt:FieldValue.serverTimestamp(),createdBy:user.uid})});console.log('School administrator created. No password or token was written to files.')}catch(e){await getAuth().deleteUser(user.uid);throw e}

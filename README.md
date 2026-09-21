# CODE QUEST 3D — GitHub Pages + Firebase Spark Edition

เวอร์ชันนี้ปรับจาก source เดิมให้ทำงานแบบ **ฟรี 100% โดยไม่ต้องเปิด Billing/Blaze**:

- **GitHub Pages** — host หน้าเว็บ เกม 3D, Blockly, GLB, รูป, เสียง และ PWA assets
- **Firebase Authentication (Spark)** — ครูใช้ Email/Password, นักเรียนใช้ Anonymous
- **Cloud Firestore (Spark)** — ห้องเรียน รายชื่อนักเรียน ห้องเกม คะแนน progress และ workspace
- **ไม่ใช้ Firebase Hosting / Cloud Functions / Cloud Storage**

เริ่มติดตั้งจาก **`START_HERE_GITHUB_FIREBASE_SPARK.md`**

## เกมเดิมที่ยังคงไว้

- บทเรียนเริ่มต้นและด่าน 1–20
- Babylon.js 3D + GLB เดิมทั้งหมด
- Blockly, Run / Step / Pause / Stop / Reset
- animation, collision, camera, environment และ software-renderer fallback
- เพลง/เสียงเอฟเฟกต์
- local practice, PWA/offline cache, CSV และไฟล์โปรแกรม
- ระบบครู/นักเรียน, ห้องเกม, ตารางคะแนน, รายงาน และ progress โดยเปลี่ยน backend เป็น Firestore โดยตรง

## สิ่งที่เปลี่ยนใน Free Spark Edition

- `lib/school/spark-direct.ts` เป็น backend ฝั่ง browser ที่คุย Firestore โดยตรง
- `firebase/firestore.rules` คุมสิทธิ์และโครงสร้างข้อมูลแทน callable Functions
- GLB เพิ่มเติมเก็บใน `public/models/` แล้ว deploy ผ่าน GitHub Pages
- path ของ models, service worker, manifest, `/school` และ config รองรับ GitHub Pages แบบ `username.github.io/repository/`
- `.github/workflows/deploy-pages.yml` build/deploy GitHub Pages อัตโนมัติ
- `firebase.json` เหลือเฉพาะ Firestore rules/indexes เพื่อป้องกันการ deploy Hosting/Functions/Storage โดยไม่ตั้งใจ

## ข้อจำกัดที่ต้องรู้

การไม่มี trusted server ทำให้ความปลอดภัยบางอย่างลดลงจาก backend เดิม:

- การตรวจคะแนนยัง replay ตามกติกาเกมก่อนบันทึก แต่ทำบน browser จึงไม่ใช่ server-verified และผู้ที่ตั้งใจแก้ JavaScript/DevTools อาจปลอมผลได้
- PIN นักเรียนไม่มี server-side rate limit; การ reset PIN ยังทำให้ credential version เก่าหมดอายุ
- การอัปโหลด GLB จากหน้า Admin ถูกตัดออก; เพิ่ม GLB ผ่าน GitHub แทน
- การแก้อีเมล Firebase Auth ของครูเดิมจากหน้า Admin ถูกปิด; ให้สร้างบัญชีใหม่หรือแก้จาก Firebase Console

สำหรับการเรียนภายในโรงเรียนทั่วไป โครงสร้างนี้ลดความซับซ้อนและไม่ต้องผูกบัตร แต่ถ้าต้องการ anti-cheat/ความปลอดภัยระดับการแข่งขัน ควรมี trusted backend ภายหลัง

## คำสั่งหลัก

```bash
pnpm install --frozen-lockfile
pnpm build:github
pnpm exec firebase login
pnpm exec firebase use --add
pnpm deploy:rules
```

> `pnpm deploy:rules` deploy เฉพาะ Firestore Rules/Indexes เท่านั้น

## โครงสร้างสำคัญ

- `components/game/` — ตัวเกม Blockly/3D/UI
- `lib/game/` — engine, curriculum, replay/scoring, storage
- `components/school/` — portal ครู/นักเรียน/ห้องเกม/รายงาน
- `lib/school/spark-direct.ts` — Firebase Spark direct backend
- `lib/school/client.ts` — Auth + Firestore client
- `firebase/firestore.rules` — Security Rules สำหรับโหมด Spark
- `public/models/` — โมเดล 3D ที่ GitHub Pages ให้บริการ
- `public/school-config.json` — Firebase Web config
- `.github/workflows/deploy-pages.yml` — GitHub Pages deployment

โฟลเดอร์ `firebase/functions/` จาก source เดิมยังเก็บไว้เป็น **legacy reference** เท่านั้น และไม่ได้ถูกอ้างโดย `firebase.json` หรือ frontend ของ Free Spark Edition

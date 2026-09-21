# CODE QUEST 3D — GitHub Pages + Firebase Spark (ฟรี ไม่ใช้ Blaze)

เวอร์ชันนี้ตั้งใจให้ใช้งานโดยไม่เปิด Billing:

- GitHub Pages: host React/Vite, Babylon.js, Blockly, รูป, เสียง และไฟล์ GLB
- Firebase Authentication (Spark): ครูใช้ Email/Password, นักเรียนใช้ Anonymous
- Cloud Firestore (Spark): ห้องเรียน นักเรียน ห้องเกม คะแนน งาน และความก้าวหน้า
- ไม่ใช้ Firebase Hosting
- ไม่ใช้ Cloud Functions
- ไม่ใช้ Firebase Storage

## 1) Firebase Console

เปิด Authentication providers:

- Email/Password
- Anonymous

เพิ่มโดเมน GitHub Pages ใน Authentication > Settings > Authorized domains เช่น `YOURNAME.github.io`

สร้าง Firestore `(default)` ใน Production mode แล้วใช้ rules จากโปรเจกต์นี้

## 2) ตั้งค่า public/school-config.json

คัดลอกค่าจาก Firebase Console > Project settings > Your apps > Web app

```json
{
  "enabled": true,
  "mode": "spark-direct",
  "schoolId": "watniyom-yatra",
  "firebase": {
    "apiKey": "...",
    "authDomain": "YOUR_PROJECT.firebaseapp.com",
    "projectId": "YOUR_PROJECT",
    "appId": "..."
  },
  "appCheckSiteKey": "",
  "assets": []
}
```

Firebase Web config ไม่ใช่ server secret; สิทธิ์จริงถูกควบคุมด้วย Authentication + Firestore Rules

## 3) สร้างผู้ดูแลคนแรก (ทำครั้งเดียว)

Cloud Functions ถูกตัดออก จึงไม่มี Admin SDK สำหรับ bootstrap อัตโนมัติ ให้สร้างจาก Firebase Console 1 ครั้ง:

1. Authentication > Users > Add user แล้วสร้างอีเมล/รหัสผ่านผู้ดูแล
2. คัดลอก UID ของผู้ใช้
3. Firestore > สร้าง collection `schools`
   - Document ID: ต้องตรงกับ `schoolId` ใน `school-config.json` เช่น `watniyom-yatra`
   - field `name` (string): ชื่อโรงเรียน
4. Firestore > สร้าง collection `users`
   - Document ID: UID ที่คัดลอกมา
   - `schoolId` (string): `watniyom-yatra`
   - `role` (string): `admin`
   - `name` (string): ชื่อผู้ดูแล
   - `email` (string): อีเมลผู้ดูแล
   - `active` (boolean): `true`

หลังจากมี Admin คนแรกแล้ว Admin สามารถสร้างบัญชีครูจากหน้าเว็บได้ ระบบจะใช้ Firebase Auth instance แยกเพื่อสร้างบัญชีใหม่โดยไม่ทำให้ Admin หลุดจากระบบ

## 4) Deploy Firestore Rules — ไม่ Deploy Hosting/Functions/Storage

```bash
pnpm exec firebase login
pnpm exec firebase use --add
pnpm deploy:rules
```

`firebase.json` ของเวอร์ชันนี้มีเฉพาะ Firestore จึงไม่เผลอ deploy บริการ Blaze

## 5) ขึ้น GitHub Pages

Push โปรเจกต์ขึ้น branch `main` แล้วไป GitHub repository > Settings > Pages > Source = GitHub Actions

workflow `.github/workflows/deploy-pages.yml` จะ:

- ติดตั้ง dependencies
- ตรวจชื่อ repository
- ตั้ง Vite base path ให้อัตโนมัติ
- build ไป `firebase-dist`
- deploy GitHub Pages

รองรับทั้ง:

- `https://USERNAME.github.io/REPOSITORY/`
- repository แบบ `USERNAME.github.io` ที่อยู่ root domain

หน้าโรงเรียนจะอยู่ที่ `.../school/`

## 6) โมเดล 3D

โมเดลมาตรฐานอยู่ใน `public/models/` และยังทำงานเหมือนเดิม

ถ้าจะเพิ่ม GLB เองโดยไม่ใช้ Storage:

1. เพิ่มไฟล์ เช่น `public/models/custom/robot-a.glb`
2. เพิ่มใน `public/school-config.json`

```json
"assets": [
  {
    "id": "robot-a",
    "name": "Robot A",
    "path": "models/custom/robot-a.glb",
    "active": true,
    "digest": "github-static"
  }
]
```

3. Commit + Push ใหม่

## ข้อจำกัดด้านความปลอดภัยของโหมดฟรี

โหมดเดิมใช้ Cloud Functions ตรวจ PIN, rate-limit และ replay คะแนนบน server. Spark-only ไม่มี trusted server ดังนั้นเวอร์ชันนี้ปรับเป็น:

- PIN 6 หลักถูกแปลงเป็น SHA-256 lookup key; Firestore ไม่เปิดให้ list credential keys
- การ reset PIN ทำให้ credentialVersion เดิมหมดอายุ
- คะแนนถูก replay ด้วย engine เดิมใน browser แล้ว Firestore Rules ตรวจผู้ใช้ เจ้าของ attempt โครงสร้าง และช่วงคะแนน
- คะแนนถูกบันทึก `verified:false` และ `verification:"client-rule-checked"` เพื่อไม่อ้างว่าเป็น server-verified

ผู้ใช้ทั่วไปใช้งานเกม/ห้อง/คะแนนได้ตามปกติ แต่ผู้ที่ตั้งใจแก้ JavaScript/DevTools อาจปลอมผล client ได้มากกว่าเวอร์ชัน Cloud Functions. จึงเหมาะกับการเรียนในโรงเรียนมากกว่าการแข่งขันที่ต้องการ anti-cheat ระดับสูง

ข้อดีของการไม่เปิด Billing คือเมื่อชนโควตา Spark ระบบจะถูกจำกัด/หยุดชั่วคราวแทนการสร้างค่าใช้จ่ายแบบ pay-as-you-go

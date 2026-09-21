# เริ่มตรงนี้ — CODE QUEST 3D ฟรี 100%

เวอร์ชันนี้ปรับให้ใช้ **GitHub Pages + Firebase Spark** โดยไม่ใช้ Firebase Hosting, Cloud Functions หรือ Cloud Storage

## สิ่งที่ตั้งไว้ให้แล้ว

- Firebase project: `gamme-25bf3`
- Backend mode: `spark-direct`
- Firebase Auth: ใช้ Email/Password สำหรับครู และ Anonymous สำหรับนักเรียน
- Firestore: ใช้เป็นฐานข้อมูลโดยตรง
- โมเดล 3D/เสียง/รูป: โหลดจาก GitHub Pages
- GitHub Pages base path: คำนวณอัตโนมัติใน GitHub Actions

## ก่อนเปิดใช้จริง ทำ 3 ขั้นตอน

### 1) สร้างผู้ดูแลระบบคนแรก

ใน Firebase Console > Authentication > Users ให้สร้างบัญชี Email/Password ของผู้ดูแล แล้วคัดลอก UID

จากนั้นใน Firestore สร้างเอกสาร:

`schools/watniyom-yatra`

ฟิลด์อย่างน้อย:

- `name` (string): `โรงเรียนวัดนิยมยาตรา`

และสร้าง:

`users/<UID ที่คัดลอกมา>`

ฟิลด์:

- `schoolId` (string): `watniyom-yatra`
- `role` (string): `admin`
- `name` (string): ชื่อผู้ดูแล
- `email` (string): อีเมลบัญชี
- `active` (boolean): `true`

### 2) Deploy เฉพาะ Firestore Rules/Indexes

ที่โฟลเดอร์โปรเจกต์:

```bash
pnpm install --frozen-lockfile
pnpm exec firebase login
pnpm exec firebase use --add
pnpm deploy:rules
```

ตอน `firebase use --add` ให้เลือก `gamme-25bf3` และตั้ง alias เป็น `default`

> ห้าม deploy Hosting / Functions / Storage ในเวอร์ชันฟรีนี้

### 3) Push ขึ้น GitHub

Push โปรเจกต์ขึ้น repository แล้วไปที่ GitHub > Settings > Pages > Source เลือก **GitHub Actions**

ไฟล์ `.github/workflows/deploy-pages.yml` จะ build และ deploy เว็บให้อัตโนมัติทุกครั้งที่ push เข้า `main`

## ข้อจำกัดของโหมดฟรี

- คะแนนยังตรวจตามกติกาเกมก่อนบันทึก แต่การตรวจเกิดบนเครื่องนักเรียน ไม่ใช่ trusted server ดังนั้นผู้ใช้ที่แก้ JavaScript/DevTools เป็นสามารถปลอมคะแนนได้มากกว่าระบบ Cloud Functions เดิม
- PIN นักเรียนไม่มี server-side rate limit จึงอ่อนกว่าระบบเดิม แต่ Firestore Rules ยังจำกัดสิทธิ์ข้อมูลและ PIN reset จะทำให้สิทธิ์เก่าหมดอายุ
- การเพิ่ม GLB ใหม่ทำผ่าน GitHub (`public/models/...`) ไม่ได้อัปโหลดจากหน้า Admin
- ผู้ดูแลสร้างบัญชีครูใหม่จากหน้าเว็บได้ แต่การเปลี่ยนอีเมล Firebase Auth ของครูเดิมจากหน้าเว็บถูกปิดไว้ในโหมดนี้

อ่านรายละเอียดเพิ่มที่ `docs/GITHUB_FIREBASE_SPARK.md`

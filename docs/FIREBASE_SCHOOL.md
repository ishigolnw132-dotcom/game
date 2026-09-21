# เชื่อมระบบโรงเรียน

สถานะการเผยแพร่: frontend พร้อม ส่วน Firebase production ยังไม่ได้เชื่อม ไม่มี project ID หรือ credentials ของโรงเรียนในงานนี้

## สิ่งที่ต้องเตรียม

1. Firebase project ของโรงเรียนที่เปิด Firestore, Cloud Functions v2 และ Cloud Storage ได้ พร้อมสิทธิ์ deploy ที่เหมาะสม
2. เปิด Authentication: Email/Password สำหรับครูและผู้ดูแล; Anonymous สำหรับ session นักเรียนที่ server จะผูกกับทะเบียนหลังตรวจ PIN
3. ลงทะเบียน Web App แล้วคัดลอก **public Firebase web config** รวม projectId, appId, apiKey, authDomain, storageBucket
4. ลงทะเบียนเว็บกับ App Check โดยใช้ reCAPTCHA Enterprise และตั้ง allowed domains ของเว็บที่ใช้จริง
5. ตั้ง App Check site key ใน frontend; backend บังคับ App Check สำหรับทุก callable บน production ไม่มี debug bypass สำหรับเว็บจริง
6. กำหนดชื่อ bucket จริงใน environment `CQ_ASSET_BUCKET` ของ Functions สำหรับฟังก์ชันโมเดล 3D

ไม่ต้องส่ง service-account private key, PIN หรือรหัสผ่านในแชต ค่าข้างต้นที่เป็น web config/site key เป็นค่าฝั่งเว็บ; ใช้การยืนยันตัวตนที่ปลอดภัยสำหรับสิทธิ์ deploy

## การตั้งค่าและ deploy

- คัดลอก `firebase/school-config.example.json` ไป `public/school-config.json` เติมค่าจริงและเลือก region ให้ตรงกับ Functions (`asia-southeast1`)
- ช่วง staging ใช้บัญชีและข้อมูลทดสอบแยกจากโรงเรียนจริง
- ใช้ Firebase CLI ที่ติดตั้งใน package และยืนยันตัวตนกับโปรเจกต์ที่เลือก
- สร้าง Functions package จาก root ก่อน deploy; ไฟล์ใน `firebase/functions/lib/` เกิดจาก TypeScript build

```sh
pnpm build:functions
pnpm build:firebase
firebase use --add
firebase deploy --only functions:school,firestore,storage,hosting
```

ไฟล์ environment ของ Functions ให้เก็บนอก Git เช่น `firebase/functions/.env.<project-id>` และใส่ `CQ_ASSET_BUCKET` เป็นชื่อ bucket ที่มีอยู่จริง ค่า Storage rules ปิด direct client access โดยเจตนา: อ่าน/เขียนโมเดลผ่าน server ที่ตรวจ role และ school scope แล้ว

Sites deployment ของงานนี้แสดง frontend; หากต้องใช้ frontend เดิมให้ตั้ง public config แล้วเผยแพร่ Sites ใหม่ การ deploy บน Firebase Hosting เป็นทางเลือกที่ใช้ UI ชุดเดียวกัน

## สร้างผู้ดูแลคนแรก

`scripts/bootstrap-school.mjs` ใช้ Application Default Credentials ของผู้มีสิทธิ์ และต้องระบุ schoolId/name/admin email/name ชัดเจน สคริปต์ไม่ทับโรงเรียนหรือ admin เดิม

จัดเตรียมรหัสผ่านเริ่มต้นใน environment `CQ_BOOTSTRAP_PASSWORD` ผ่านช่องทางลับของเครื่องผู้ดูแล แล้วรัน:

```sh
node scripts/bootstrap-school.mjs SCHOOL_ID SCHOOL_NAME ADMIN_EMAIL ADMIN_NAME
```

สคริปต์ไม่พิมพ์รหัสผ่านหรือ token สร้าง Auth user และผูก school/role ฝั่ง server ครูสร้างหรือเพิ่มนักเรียนโดยใช้ studentId ถาวร; PIN ใหม่แสดงให้ครูเฉพาะผลของคำสั่ง reset และไม่ใส่ audit log

## ข้อมูลและสิทธิ์

| ข้อมูล | ขอบเขต |
|---|---|
| users | Auth uid; role/school/credentialVersion เปลี่ยนผ่าน server |
| students | UUID คงเดิม; studentCode unique ต่อโรงเรียน |
| classes/enrollments | ห้อง ปี เทอม เลขที่ และประวัติการย้าย |
| student_credentials | salted scrypt PIN hash และ cache key; ห้าม direct read |
| rooms/room_rounds | 40 members, lifecycle, seed, config และ eligible snapshot |
| attempts/scores | ตัวตนและบริบท ณ เวลาเล่น; server replay/time; idempotent score |
| workspaces | school + student + round; direct writes ถูกปฏิเสธ |
| assets | GLB ใน bucket แบบ private; scoped callable อ่าน/เขียน |
| system_logs | audit ที่ไม่บันทึกรหัสผ่าน PIN หรือ payload ทะเบียน |

Rules อนุญาต room document เฉพาะผู้มีสิทธิ์และตรวจการเป็นสมาชิก/ห้องเรียนปัจจุบัน ข้อมูลอื่นอ่านผ่าน callable ตาม role ปิดบัญชี/นักเรียน/เปลี่ยน PIN แล้ว session เก่าจะทำงานต่อไม่ได้

## การเชื่อมต่อขาดหาย

หลังเริ่ม attempt ที่ server แล้ว เกมใช้ local state เล่นต่อได้ งานและคะแนนค้างเข้ารหัส AES-GCM ด้วย key ของนักเรียนและเก็บแยก round การเปิดใหม่ต้องยืนยันตัวตนเดิมก่อนกู้ เมื่อ reconnect จะส่งซ้ำโดยใช้ attempt เดิม คะแนนที่ server รับแล้วไม่สร้างซ้ำ

การส่งคะแนนยังต้องผ่านกติกาเวลา/รอบ: มีช่วงรับงานเพิ่ม 120 วินาทีหลังหมดเวลา และปฏิเสธ submission ข้ามรอบหรือหลังสิ้นสุดช่วงรับงาน งานเข้ารหัสเก่าคงอยู่ แต่ไม่ถือเป็นคะแนนที่ยืนยันแล้ว ต้องกำหนดนโยบายโรงเรียนสำหรับเครือข่ายขัดข้องยาวนานก่อนตรวจรับ

## ตรวจรับก่อนใช้จริง

ทดสอบครูเข้าสู่ระบบ → สร้างห้อง/นำเข้าทะเบียน → แจก PIN → นักเรียน 40 คนเข้า/เริ่มพร้อมกัน → รัน Blockly → server ตรวจคะแนน → จบ/รอบใหม่ → export → admin analytics รวมกรณี offline, shared-device, token revocation, App Check failure, concurrent updates และ Storage จริง

ต้องทดสอบ target hardware/Chrome/Safari/iPad/Android และประเมินการอ่าน/เขียน Firestore กับค่าใช้จ่ายจริง ระบบ health ในแอปแสดงสัญญาณผู้เล่น/ห้อง/audit ไม่ใช่แดชบอร์ด billing ของ Firebase

# สถานะการตรวจ CODE QUEST 3D

วันที่ 14 กันยายน 2026 — แยกผลตรวจโหมดฝึก, service integration และ production ให้ชัดเจน

## ผ่านแล้ว

- TypeScript frontend และ Functions compilation
- Sites production build และ Firebase Hosting static build
- Core tests 11 กลุ่ม รวม 1,890 seeded maps: deterministic/solvable, key/gate/delivery, energy, loop bounds, immutable state, objectives และคะแนนอยู่ในช่วง
- GLB ตัวละครทั้ง 3 ไฟล์ตรวจ JSON chunk มี skin 6 joints และ 12 animation groups จริง; แก้ exporter ที่ตัด root bone ออก
- Browser Chromium: เกม/Blockly/โมเดลแสดงได้ ไม่มี console error ในการตรวจล่าสุด; fallback ฉาย geometry จริงเมื่อ WebGL ไม่มี
- Browser: ตั้งเพลง 35%, ปิดเฉพาะเพลงแล้วยังคงเอฟเฟกต์, เปิดเพลงใหม่, กดลองฟังเสียง และ reload แล้วค่า 35% ยังอยู่; AudioContext แสดงสถานะกำลังทำงาน
- Browser: ต่อโปรแกรมด่าน 1 ด้วย 8 บล็อก, Step 1 ก้าว, บันทึก, reload, กู้ปุ่มทำต่อและ execution cursor แล้วเล่นจบ 97/100 ใน 1 attempt; คะแนนลดตามเวลาที่ใช้ตรวจ
- ผลตรวจรุ่นก่อนหน้า: drag/connect Blockly, ด่าน 2 กุญแจและประตู, local progress, viewport 390×844 และ 768×844 ไม่มี horizontal overflow
- Backend service + Firestore/Auth Emulator: 40 concurrent joins/attempts/submissions, same seed/countdown, server replay, forged score/wrong owner rejection, idempotent scores/ranking, pause/resume, workspace isolation, transfer history, archive/restore, PIN revocation และ cross-school/class Security Rules
- Mission configuration: บันทึกด่านใหม่ grid 5/7/9/11 แล้วสร้างแผนที่ทุกความยากได้; ปฏิเสธครูแก้ด่านและค่าพลังงานที่ทำภารกิจไม่สำเร็จ
- Historical report: คะแนนและห้อง/เทอมเดิมยังอยู่หลังย้ายห้อง; grouping แยก student/class/year/term และรวม enrollment ที่เปิดคืนสถานะในบริบทเดียวกัน

## ผลสรุป Emulator

PASS 21 กลุ่มทดสอบ: 40 concurrent players และทะเบียน/รายงาน 500 คนครบ 5 หน้า โดยไม่ตัดผู้ไม่เคยเล่นออก ไม่สร้างแถวซ้ำหลังปิด/คืนสถานะ และไม่ทำบริบทเก่าหาย

ผลสุดท้าย: `{"status":"PASS","checks":21,"concurrentPlayers":40,"backend":"Firestore + Auth Emulator","production":false}`

รอบแรกพบ enrollment ซ้ำในรายงานหลังคืนสถานะ จึงแก้ grouping ตาม student/class/year/term และทดสอบชุด integration ซ้ำจนผ่านทั้งหมด

## ยังไม่ผ่านการตรวจรับ production

- ไม่มี Firebase project/credentials/web config/App Check site key ของโรงเรียน จึงยังไม่ได้ deploy backend จริง; `/school` แสดง NOT READY และไม่แสดงรายชื่อหรือผลคะแนนจำลอง
- Service integration เรียก `execute()` โดยตรงร่วมกับ Auth/Firestore Emulator ไม่ใช่ HTTP callable transport หรือการเข้าสู่ระบบผ่านเบราว์เซอร์
- การทดสอบ Functions Emulator transport ในสภาพแวดล้อมก่อนหน้าติด `EPERM` ที่ Unix socket ของ runtime จึงไม่ถือว่าผ่าน; ไม่เปลี่ยนระบบสิทธิ์เพื่อหลบข้อจำกัดนี้
- App Check enforcement, admin bootstrap, authentication flow และครู–นักเรียนทั้ง flow ต้องตรวจบน staging ที่มีสิทธิ์จริง
- Cloud Storage upload/load ของโมเดล custom: มี implementation และ validation แต่ยังไม่มี bucket ให้ทดสอบ; ทดสอบได้เฉพาะ unavailable-config/role denial ใน emulator
- Encrypted offline queue/reconnect/shared-device UI ยังไม่ได้ทดสอบผ่านเบราว์เซอร์ที่เข้าสู่ระบบโรงเรียน; local practice cursor recovery ผ่านแล้ว
- รายงาน Excel/CSV มี implementation จริง แต่ยังไม่ได้ตรวจ export ของ authenticated school UI แบบครบ flow
- WebGL/GPU shadows/FPS, Safari/iOS/Android/iPad, touch pinch และ PWA install/offline บนอุปกรณ์จริงยังไม่ได้รับรอง
- Health แสดง application telemetry ไม่ใช่ Firebase billing/metrics console; hints/errors/block usage เป็น client-reported analytics ไม่ใช้สร้างคะแนนสุดท้าย
- ข้อมูลที่ส่งเกินช่วงรับคะแนนหรือข้ามรอบถูก server ปฏิเสธ คิวเข้ารหัสไม่ใช่คะแนนที่ยืนยันแล้ว

**ยังไม่ประกาศ Final Acceptance หรือ Full Production Ready ตาม Master Prompt**

## รันการทดสอบซ้ำ

ต้องใช้ Node 22+ / Java 21+ และรันที่ root ของ repository:

```sh
pnpm test:core
pnpm build:functions
firebase emulators:exec --only firestore,auth --project demo-code-quest \
  "env FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 GCLOUD_PROJECT=demo-code-quest node scripts/test-school.cjs"
```

ชุดทดสอบบังคับตรวจชื่อ demo project และ emulator host ก่อนล้าง fixture จึงไม่อนุญาตให้ชี้ไป production ข้อความ `PERMISSION_DENIED` ใน negative rules tests เป็นผลที่คาดหวัง

มี `scripts/test-callable.cjs` สำหรับตรวจ HTTP transport ในสภาพแวดล้อมที่ Functions Emulator ใช้ได้ แต่ยังไม่มีผล PASS ของ transport ในการส่งมอบนี้

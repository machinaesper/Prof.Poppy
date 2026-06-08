# 🎮 Pokémon Discord Bot

บอท Discord สำหรับดูตารางธาตุโปเกม่อนและข้อมูลโปเกม่อนแบบ Real-time

## ✨ Commands

| Command | คำอธิบาย | ตัวอย่าง |
|---|---|---|
| `/elementchart` | แสดงตาราง Type Effectiveness ทุกธาตุ | `/elementchart` |
| `/check [name]` | ดูข้อมูลโปเกม่อน (ธาตุ, Ability, จุดอ่อน, Stats) | `/check charizard` |

**ชื่อที่รองรับใน /check:**
- ชื่อปกติ: `pikachu`, `garchomp`, `gengar`
- Mega: `mega-charizard-x`, `mega-mewtwo-y`, `mega-rayquaza`
- รูปอื่น: `giratina-origin`, `rotom-wash`, `urshifu-rapid-strike`

---

## 🚀 ติดตั้งและใช้งาน

### ขั้นตอนที่ 1 — สร้าง Discord App

1. ไปที่ https://discord.com/developers/applications → **New Application**
2. ตั้งชื่อ → **Create**
3. ไปที่ **General Information** → คัดลอก **Application ID** (= CLIENT_ID)
4. ไปที่ **Bot** → **Reset Token** → คัดลอก Token (= DISCORD_TOKEN)
5. ที่หน้า **Bot** → เปิด **"Message Content Intent"** (ถ้ามี)
6. ไปที่ **OAuth2 → URL Generator**
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Attach Files`, `Embed Links`
   - คัดลอก URL ที่ได้ → เปิดในเบราว์เซอร์ → เพิ่มบอทเข้า Server

### ขั้นตอนที่ 2 — รันบนเครื่องตัวเอง (ทดสอบ)

```bash
# 1. Clone หรือวางโฟลเดอร์โปรเจกต์
cd pokemon-discord-bot

# 2. ติดตั้ง dependencies
npm install

# 3. สร้างไฟล์ .env
cp .env.example .env
# แก้ไข .env ใส่ DISCORD_TOKEN และ CLIENT_ID ของจริง

# 4. รันบอท
npm start
```

---

## ☁️ โฮสต์ฟรีบน Railway (ทำงานตลอด 24/7)

### วิธีที่ 1 — Deploy ผ่าน GitHub (แนะนำ)

1. **สร้าง GitHub Repository** → อัปโหลดไฟล์ทั้งหมด (ยกเว้น `.env` และ `node_modules`)

2. **สมัคร Railway** → https://railway.app (ใช้ GitHub Login)

3. **New Project → Deploy from GitHub** → เลือก repo ที่สร้าง

4. **ตั้ง Environment Variables** ใน Railway:
   - ไปที่ **Variables** tab → เพิ่ม:
     ```
     DISCORD_TOKEN = your_bot_token_here
     CLIENT_ID     = your_client_id_here
     ```

5. **Deploy** → Railway จะ build และรันบอทอัตโนมัติ

6. ✅ **บอทจะทำงานตลอด 24/7** โดยไม่ต้องเปิดเครื่อง

### วิธีที่ 2 — Deploy ผ่าน Railway CLI

```bash
npm install -g @railway/cli
railway login
railway init
railway up
railway variables set DISCORD_TOKEN=xxx CLIENT_ID=xxx
```

---

## 📁 โครงสร้างโปรเจกต์

```
pokemon-discord-bot/
├── index.js          ← ไฟล์หลักของบอท
├── package.json      ← dependencies
├── .env.example      ← ตัวอย่าง environment variables
├── .env              ← ไฟล์จริง (อย่า commit ขึ้น GitHub!)
└── README.md
```

---

## 🔧 Dependencies

| Package | หน้าที่ |
|---|---|
| `discord.js` | Discord API Library |
| `@napi-rs/canvas` | วาดตารางธาตุเป็นรูปภาพ |
| `node-fetch` | ดึงข้อมูลจาก PokéAPI |
| `dotenv` | อ่านไฟล์ .env |

ข้อมูลโปเกม่อนดึงจาก **PokéAPI** (https://pokeapi.co) — ฟรี ไม่ต้องมี API Key

---

## ⚠️ หมายเหตุ

- อย่าอัปโหลดไฟล์ `.env` ขึ้น GitHub เด็ดขาด
- เพิ่ม `.env` และ `node_modules/` ใน `.gitignore`

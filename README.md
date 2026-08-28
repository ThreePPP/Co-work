# Co-work — Enterprise Collaboration & Workspace Platform

ระบบเว็บแอปพลิเคชันสำหรับการทำงานร่วมกันภายในองค์กร รองรับแชทแบบเรียลไทม์ (Direct Messages), แชร์และจัดเก็บไฟล์, จัดการงาน (Tasks), ประวัติกิจกรรม (History), ทำเนียบสมาชิก และการตั้งค่าผู้ใช้ แยก Frontend / Backend ชัดเจน พร้อม Docker Deployment

---

## Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | Next.js 15 (App Router) | React 19, Server & Client Components |
| **Styling** | Tailwind CSS v4 | Custom Design System, Dark / Light Mode |
| **Icons & State** | Lucide Icons, Zustand | Auth, UI, Chat, Task, History, Huddle stores |
| **Backend** | Express 5 | Modular Controller–Service–Router |
| **Language** | TypeScript | Strict type safety |
| **Realtime** | Socket.IO + SSE | Live messaging, presence, huddle signaling, live updates |
| **Database** | PostgreSQL 17 | Relational database |
| **ORM** | Prisma | Schema migrations, seeding & type generation |
| **Auth** | JWT + bcrypt + Google OAuth | Role-Based Access Control (Admin, Manager, Member) |
| **File Storage** | Multer | Categorized uploads (Images, Docs, Video, Archives, Audio) |
| **DevOps** | Docker & Docker Compose | Full stack หรือ DB-only สำหรับ local dev |

---

## โครงสร้างโปรเจกต์

```
Co-work/
├── apps/
│   ├── web/                           # Next.js 15 Frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/            # Login & Register (Google OAuth)
│   │   │   │   ├── (main)/            # Authenticated layout
│   │   │   │   │   ├── dashboard/     # Stats, charts, activity widgets
│   │   │   │   │   ├── tasks/         # Kanban, Calendar, Timeline, detail page
│   │   │   │   │   ├── messages/      # Real-time DMs & WebRTC Huddle
│   │   │   │   │   ├── files/         # File drive & categories
│   │   │   │   │   ├── history/       # Activity log, filters, export
│   │   │   │   │   ├── members/       # Company directory
│   │   │   │   │   └── settings/      # Profile, Security, Theme, Admin
│   │   │   │   ├── layout.tsx
│   │   │   │   └── globals.css
│   │   │   ├── components/            # ui, layout, chat, tasks, huddle, dashboard, history, ...
│   │   │   ├── stores/                # Zustand stores
│   │   │   ├── lib/                   # api, socket, sse, export, utils
│   │   │   └── types/
│   │   ├── Dockerfile
│   │   ├── .env.local.example
│   │   └── package.json
│   │
│   └── server/                        # Express 5 Backend
│       ├── src/
│       │   ├── config/                # Prisma DB, Env (Zod)
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── messages/
│       │   │   ├── files/
│       │   │   ├── tasks/
│       │   │   ├── history/
│       │   │   ├── dashboard/
│       │   │   └── sse/
│       │   ├── middleware/            # Auth JWT, ErrorHandler, Multer, Validate
│       │   ├── socket/                # Socket.IO & WebRTC signaling
│       │   └── index.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts
│       ├── uploads/                   # Local file storage (gitignored)
│       ├── Dockerfile
│       ├── .env.example
│       └── package.json
│
├── docker-compose.yml                 # Full stack (PostgreSQL + Server + Web)
├── docker-compose.dev.yml             # Local PostgreSQL only (host port 5433)
├── .env.example                       # Root env template (safe to commit)
├── .gitignore
└── README.md
```

---

## ติดตั้งและรันโปรเจกต์

### วิธีที่ 1: Docker Compose ทั้งระบบ

```bash
# (แนะนำ) คัดลอก env ระดับ root สำหรับค่า optional เช่น Google OAuth
cp .env.example .env

docker compose up --build -d
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

หยุดระบบ:

```bash
docker compose down
```

---

### วิธีที่ 2: Local Development (Hot Reload)

#### 1. สตาร์ท PostgreSQL (Docker)

```bash
docker compose -f docker-compose.dev.yml up -d
```

Container จะ map พอร์ต **5433 → 5432** เพื่อไม่ชนกับ PostgreSQL ที่ติดตั้งบน Windows

ค่าเริ่มต้นใน `docker-compose.dev.yml`:

| Key | Value |
|---|---|
| User | `cowork_user` |
| Password | `cowork_password` |
| Database | `cowork_db` |
| Host port | `5433` |

หยุด database:

```bash
docker compose -f docker-compose.dev.yml down
```

#### 2. ตั้งค่า Environment

```bash
# Backend
cp apps/server/.env.example apps/server/.env

# Frontend
cp apps/web/.env.local.example apps/web/.env.local
```

ใน `apps/server/.env` ตั้ง `DATABASE_URL` ให้ชี้พอร์ต **5433** เช่น:

```env
DATABASE_URL=postgresql://cowork_user:cowork_password@localhost:5433/cowork_db?schema=public
```

#### 3. รัน Backend

```bash
cd apps/server
npm install
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

#### 4. รัน Frontend

```bash
cd apps/web
npm install
npm run dev
```

เปิดเบราว์เซอร์ที่ http://localhost:3000

---

## บัญชีทดสอบ (Demo Accounts)

มีปุ่ม **1-Click Fill** บนหน้า Login หรือกรอกตามตารางนี้ (สร้างจาก `npm run prisma:seed`):

| บทบาท | Email | รหัสผ่าน | สิทธิ์ |
|---|---|---|---|
| **Admin** | `admin@cowork.com` | `Admin@123456` | สิทธิ์สูงสุด, จัดการผู้ใช้, Admin panel |
| **Manager** | `sarah.lead@cowork.com` | `User@123456` | หัวหน้าทีม |
| **Member** | `alex.dev@cowork.com` | `User@123456` | สมาชิกทั่วไป |
| **Member (Design)** | `somchai.ux@cowork.com` | `User@123456` | สมาชิกทั่วไป |
| **Member (Marketing)** | `napat.mkt@cowork.com` | `User@123456` | สมาชิกทั่วไป |

---

## ฟีเจอร์หลัก

1. **Dashboard**
   - สถิติสมาชิกออนไลน์, งาน, ไฟล์ และการใช้พื้นที่เก็บข้อมูล
   - Activity feed, charts, online colleagues

2. **Real-time Messaging (Direct Messages)**
   - แชทส่วนตัว 1-1 แบบเรียลไทม์
   - แนบไฟล์, typing indicator, presence (Online / Away / Busy / Offline)
   - Pin / Edit / Delete ข้อความ, reactions

3. **Company File Drive**
   - อัปโหลดไฟล์, แยกหมวดอัตโนมัติ (เอกสาร, รูป, วิดีโอ, เสียง, บีบอัด)
   - ค้นหาและดาวน์โหลด

4. **Tasks & Project Management**
   - มุมมอง Kanban, Calendar, Timeline และหน้ารายละเอียดงาน
   - มอบหมายผู้รับผิดชอบหลายคน, Subtasks, Comments

5. **Activity History**
   - บันทึกและกรองประวัติการทำงานในองค์กร
   - Export ประวัติได้

6. **Company Directory (Members)**
   - ทำเนียบพนักงาน, ฟิลเตอร์แผนก/สถานะ
   - แสดง Avatar, Role, ตำแหน่ง, Bio

7. **WebRTC Audio Huddle & Screen Share**
   - สนทนาด้วยเสียงด่วนระหว่างแชท
   - Mute/Unmute และแชร์หน้าจอ

8. **Settings & Admin Panel**
   - แก้โปรไฟล์, เปลี่ยนรหัสผ่าน, ธีม, เสียงแจ้งเตือน
   - Admin: ปรับ Role หรือจัดการบัญชีสมาชิก

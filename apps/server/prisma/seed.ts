import { PrismaClient, Role, UserStatus, MessageType, TaskStatus, TaskPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seeding for Co-work...');

  const passwordHash = await bcrypt.hash('Admin@123456', 10);
  const memberPasswordHash = await bcrypt.hash('User@123456', 10);

  // 1. Create Default Users (Starting OFFLINE for 100% Real Live Presence)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cowork.com' },
    update: {},
    create: {
      email: 'admin@cowork.com',
      passwordHash,
      name: 'Pattarapol Admin',
      role: Role.ADMIN,
      department: 'Management',
      position: 'Chief Technology Officer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Leading innovation and engineering architecture at Co-work.',
      status: UserStatus.OFFLINE,
    },
  });

  const sarah = await prisma.user.upsert({
    where: { email: 'sarah.lead@cowork.com' },
    update: {},
    create: {
      email: 'sarah.lead@cowork.com',
      passwordHash: memberPasswordHash,
      name: 'Sarah Connor',
      role: Role.MANAGER,
      department: 'Engineering',
      position: 'Product Engineering Lead',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      bio: 'Building world-class collaborative platforms.',
      status: UserStatus.OFFLINE,
    },
  });

  const alex = await prisma.user.upsert({
    where: { email: 'alex.dev@cowork.com' },
    update: {},
    create: {
      email: 'alex.dev@cowork.com',
      passwordHash: memberPasswordHash,
      name: 'Alex Rivera',
      role: Role.MEMBER,
      department: 'Engineering',
      position: 'Senior Fullstack Engineer',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'Next.js, TypeScript & PostgreSQL enthusiast.',
      status: UserStatus.OFFLINE,
    },
  });

  const somchai = await prisma.user.upsert({
    where: { email: 'somchai.ux@cowork.com' },
    update: {},
    create: {
      email: 'somchai.ux@cowork.com',
      passwordHash: memberPasswordHash,
      name: 'Somchai Prasert',
      role: Role.MEMBER,
      department: 'Design',
      position: 'Lead Product Designer',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      bio: 'Designing sleek micro-interactions and dark mode UI.',
      status: UserStatus.OFFLINE,
    },
  });

  const napat = await prisma.user.upsert({
    where: { email: 'napat.mkt@cowork.com' },
    update: {},
    create: {
      email: 'napat.mkt@cowork.com',
      passwordHash: memberPasswordHash,
      name: 'Napat Srisawat',
      role: Role.MEMBER,
      department: 'Marketing',
      position: 'Marketing & Brand Specialist',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      bio: 'Connecting company culture with customer growth.',
      status: UserStatus.OFFLINE,
    },
  });

  console.log('✅ Users seeded');

  // 2. Seed Direct Messages
  const existingMessagesCount = await prisma.message.count();
  if (existingMessagesCount === 0) {
    await prisma.message.create({
      data: {
        content: 'สวัสดีครับคุณ Sarah บ่ายนี้มีสรุป Sprint Review ไหมครับ?',
        type: MessageType.TEXT,
        senderId: alex.id,
        receiverId: sarah.id,
      },
    });

    await prisma.message.create({
      data: {
        content: 'มีตอน 14:00 น. ค่ะ เดี๋ยวส่งสรุป agenda ให้ในนี้นะคะ',
        type: MessageType.TEXT,
        senderId: sarah.id,
        receiverId: alex.id,
      },
    });

    await prisma.message.create({
      data: {
        content: 'คุณ Somchai รบกวนตรวจดู Figma mockups ของ Kanban board ตัวใหม่หน่อยครับ',
        type: MessageType.TEXT,
        senderId: admin.id,
        receiverId: somchai.id,
      },
    });

    // Seed Sample Notifications
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'ยินดีต้อนรับสู่ Co-work Platform',
        message: 'ระบบพร้อมทำงานเต็มรูปแบบ สามารถเริ่มส่งข้อความ มอบหมายงาน และแชร์ไฟล์ได้ทันที',
        type: 'SYSTEM',
        isRead: false,
      },
    });

    console.log('✅ Initial messages and notifications seeded');
  }

  // 3. Seed Tasks with Assignees, Subtasks & Comments
  const existingTasksCount = await prisma.task.count();
  if (existingTasksCount === 0) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const inThreeDays = new Date();
    inThreeDays.setDate(inThreeDays.getDate() + 3);

    // Task 1: Core API & Real-time setup (DONE)
    await prisma.task.create({
      data: {
        title: 'ตั้งค่า Real-time WebSocket Architecture และ API Endpoint',
        description: 'พัฒนาระบบ Socket.IO สำหรับ Real-time Presence และ Direct Messaging พร้อมเชื่อมต่อ JWT Authentication',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        dueDate: inThreeDays,
        createdById: admin.id,
        assignees: {
          create: [
            { userId: alex.id, role: 'LEAD' },
            { userId: sarah.id, role: 'REVIEWER' },
          ],
        },
        subtasks: {
          create: [
            { title: 'Setup Socket.IO Server in Express 5', isCompleted: true, order: 0 },
            { title: 'JWT Token handshake validation', isCompleted: true, order: 1 },
            { title: 'Presence tracking with multi-tab support', isCompleted: true, order: 2 },
          ],
        },
      },
    });

    // Task 2: Design System & UI/UX (IN_PROGRESS)
    const task2 = await prisma.task.create({
      data: {
        title: 'ออกแบบ Dark Mode Design Tokens และ Kanban Board Component',
        description: 'สร้าง Component Drag & Drop สำหรับกระดานติดตามงาน พร้อม Badge แสดงสถานะและ Avatar ผู้รับผิดชอบ',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: nextWeek,
        createdById: sarah.id,
        assignees: {
          create: [
            { userId: somchai.id, role: 'DESIGNER' },
            { userId: alex.id, role: 'DEVELOPER' },
          ],
        },
        subtasks: {
          create: [
            { title: 'Figma layout for Kanban columns', isCompleted: true, order: 0 },
            { title: 'Card micro-animations and hover effects', isCompleted: true, order: 1 },
            { title: 'Multi-role Assignee selector modal', isCompleted: false, order: 2 },
            { title: 'Responsive drawer for task details', isCompleted: false, order: 3 },
          ],
        },
      },
    });

    // Task 3: Security & Storage Optimization (TODO)
    await prisma.task.create({
      data: {
        title: 'ติดตั้ง Rate Limiting และระบบตรวจสอบความปลอดภัยไฟล์อัปโหลด',
        description: 'เพิ่ม Multer fileFilter ตรวจสอบนามสกุลไฟล์อันตราย และติดตั้ง Express Rate Limit บน Auth endpoints',
        status: TaskStatus.TODO,
        priority: TaskPriority.URGENT,
        dueDate: inThreeDays,
        createdById: sarah.id,
        assignees: {
          create: [
            { userId: alex.id, role: 'DEVELOPER' },
            { userId: admin.id, role: 'REVIEWER' },
          ],
        },
        subtasks: {
          create: [
            { title: 'Multer MIME & extension whitelist', isCompleted: false, order: 0 },
            { title: 'Auth rate limiter configuration', isCompleted: false, order: 1 },
          ],
        },
      },
    });

    // Task 4: Marketing & Onboarding Launch (IN_REVIEW)
    await prisma.task.create({
      data: {
        title: 'จัดทำคู่มือการใช้งานระบบและการสื่อสารภายในทีมสำหรับพนักงานใหม่',
        description: 'สร้างเอกสาร Onboarding แนะนำช่องทางการติดต่อ ฟีเจอร์การแชร์ไฟล์ และการติดตามงานผ่าน Kanban Board',
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.MEDIUM,
        dueDate: nextWeek,
        createdById: admin.id,
        assignees: {
          create: [
            { userId: napat.id, role: 'LEAD' },
            { userId: somchai.id, role: 'DESIGNER' },
          ],
        },
        subtasks: {
          create: [
            { title: 'Drafting onboarding handbook content', isCompleted: true, order: 0 },
            { title: 'Infographic visual assets creation', isCompleted: true, order: 1 },
            { title: 'Final review by Department Heads', isCompleted: false, order: 2 },
          ],
        },
      },
    });

    // Seed task comments
    await prisma.taskComment.create({
      data: {
        taskId: task2.id,
        userId: somchai.id,
        content: 'ผมส่งแบบร่างสีและป้ายกำกับ Role ในงานเรียบร้อยแล้วครับ กำลังต่อยอดส่วน Detail Drawer',
      },
    });

    await prisma.taskComment.create({
      data: {
        taskId: task2.id,
        userId: alex.id,
        content: 'เยี่ยมเลยครับ ฝั่ง API พร้อมรองรับทั้ง Subtasks และการเปลี่ยนสถานะแบบ Real-time แล้ว!',
      },
    });

    console.log('✅ Tasks & collaboration data seeded');
  }

  console.log('🌟 Seeding finished successfully!');
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    throw e;
  })
  .then(async () => {
    await prisma.$disconnect();
  });

import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { env } from './config/env.js';
import { prisma } from './config/db.js';
import { UserStatus } from './types/enums.js';
import { initSocket } from './socket/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { sendSuccess, ApiError } from './utils/apiResponse.js';

// Routers
import authRouter from './modules/auth/auth.router.js';
import userRouter from './modules/users/user.router.js';
import messageRouter from './modules/messages/message.router.js';
import fileRouter from './modules/files/file.router.js';
import dashboardRouter from './modules/dashboard/dashboard.router.js';
import taskRouter from './modules/tasks/task.router.js';
import historyRouter from './modules/history/history.router.js';
import sseRouter from './modules/sse/sse.router.js';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
export const io = initSocket(server, env.CORS_ORIGIN);

// CORS configuration
app.use(
  cors({
    origin: [env.CORS_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure upload directory exists
const uploadDirectory = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDirectory));

// Health Check
app.get('/api/health', (_req, res) => {
  return sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Co-work API (Express 5)',
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/messages', messageRouter);
app.use('/api/files', fileRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/history', historyRouter);
app.use('/api/sse', sseRouter);

// 404 Route Handler
app.use((_req, _res, next) => {
  next(ApiError.notFound('Requested API endpoint does not exist'));
});

// Global Error Handler Middleware
app.use(errorHandler);

// Start Server
const PORT = env.PORT || 5000;
server.listen(PORT, async () => {
  // Clear any stale presence status from previous runs/mock seeds to ensure 100% Real Live status
  try {
    await prisma.user.updateMany({
      data: { status: UserStatus.OFFLINE },
    });
    console.log('🔄 All member presence statuses reset to OFFLINE (Live Socket Presence Active)');
  } catch (err) {
    console.error('Failed to reset member statuses on startup:', err);
  }

  console.log(`🚀 Co-work Server running on http://localhost:${PORT}`);
  console.log(`📂 Upload directory: ${uploadDirectory}`);
  console.log(`⚡ Environment: ${env.NODE_ENV}`);
});

export default app;

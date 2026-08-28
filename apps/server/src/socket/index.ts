import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt.utils.js';
import { prisma } from '../config/db.js';
import { UserStatus } from '../types/enums.js';
import { AuthenticatedUser } from '../types/express.js';

interface CustomSocket extends Socket {
  user?: AuthenticatedUser;
}

export interface HuddleParticipant {
  socketId: string;
  userId: string;
  name: string;
  avatarUrl?: string | null;
  position?: string | null;
  isMuted: boolean;
  isSharingScreen: boolean;
}

export const onlineUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds
// channelId -> Map of socketId to HuddleParticipant
export const huddleRooms = new Map<string, Map<string, HuddleParticipant>>();

export const initSocket = (httpServer: HttpServer, corsOrigin: string) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin === '*' ? '*' : [corsOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket Auth Middleware
  io.use((socket: CustomSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    const user = verifyToken(token);
    if (!user) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }

    socket.user = user;
    next();
  });

  io.on('connection', async (socket: CustomSocket) => {
    const user = socket.user!;
    const userId = user.id;

    // Track online user sockets
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Join personal room for private notifications/DMs
    socket.join(`user_${userId}`);

    // Update DB status to ONLINE
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.ONLINE },
      });
      io.emit('presence:status', { userId, status: UserStatus.ONLINE });
    } catch (e) {
      console.error('Failed to update user presence on connection:', e);
    }

    console.log(`[Socket Connected] User: ${user.name} (${userId}) - Socket: ${socket.id}`);

    // Typing Indicators
    socket.on('typing:start', ({ receiverId }: { receiverId?: string }) => {
      if (receiverId) {
        socket.to(`user_${receiverId}`).emit('typing:status', {
          userId,
          name: user.name,
          receiverId,
          isTyping: true,
        });
      }
    });

    socket.on('typing:stop', ({ receiverId }: { receiverId?: string }) => {
      if (receiverId) {
        socket.to(`user_${receiverId}`).emit('typing:status', {
          userId,
          name: user.name,
          receiverId,
          isTyping: false,
        });
      }
    });

    // Broadcast New Message
    socket.on('message:new', (message: any) => {
      if (message.receiverId) {
        io.to(`user_${message.receiverId}`).emit('message:received', message);
        io.to(`user_${userId}`).emit('message:received', message);
      }
    });

    // Broadcast Deleted Message
    socket.on('message:delete', (data: { messageId: string; receiverId?: string }) => {
      if (data.receiverId) {
        io.to(`user_${data.receiverId}`).emit('message:deleted', data);
        io.to(`user_${userId}`).emit('message:deleted', data);
      }
    });

    // Broadcast Edited Message
    socket.on('message:edit', (message: any) => {
      if (message.receiverId) {
        io.to(`user_${message.receiverId}`).emit('message:edited', message);
        io.to(`user_${userId}`).emit('message:edited', message);
      }
    });

    // Broadcast Message Reaction
    socket.on('message:reaction', (data: { messageId: string; receiverId?: string; reactions: any[] }) => {
      if (data.receiverId) {
        io.to(`user_${data.receiverId}`).emit('message:reaction_updated', data);
        io.to(`user_${userId}`).emit('message:reaction_updated', data);
      }
    });

    // Broadcast Task Events
    socket.on('task:created', (task: any) => {
      io.emit('task:created', task);
    });

    socket.on('task:updated', (task: any) => {
      io.emit('task:updated', task);
    });

    socket.on('task:status_changed', (data: { taskId: string; status: string; task?: any }) => {
      io.emit('task:status_changed', data);
    });

    socket.on('task:deleted', (data: { taskId: string }) => {
      io.emit('task:deleted', data);
    });

    socket.on('task:comment_added', (data: { taskId: string; comment: any }) => {
      io.emit('task:comment_added', data);
    });

    // =========================================================================
    // WebRTC Audio Huddle & Screen Share Signaling
    // =========================================================================
    socket.on('huddle:join', ({ channelId, channelName, isMuted = false }: { channelId: string; channelName?: string; isMuted?: boolean }) => {
      socket.join(`huddle_${channelId}`);

      if (!huddleRooms.has(channelId)) {
        huddleRooms.set(channelId, new Map());
      }

      const room = huddleRooms.get(channelId)!;
      const participant: HuddleParticipant = {
        socketId: socket.id,
        userId: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        position: user.position,
        isMuted,
        isSharingScreen: false,
      };

      // Get existing participants before adding current
      const existingParticipants = Array.from(room.values());
      room.set(socket.id, participant);

      // Tell the joining user about existing members
      socket.emit('huddle:room_state', {
        channelId,
        channelName: channelName || 'Channel',
        participants: Array.from(room.values()),
      });

      // Broadcast to others in the huddle room
      socket.to(`huddle_${channelId}`).emit('huddle:user_joined', {
        participant,
        participants: Array.from(room.values()),
      });

      // Also announce huddle activity to the channel
      io.to(`channel_${channelId}`).emit('huddle:active_count', {
        channelId,
        count: room.size,
      });
    });

    socket.on('huddle:signal', ({ toSocketId, signal }: { toSocketId: string; signal: any }) => {
      io.to(toSocketId).emit('huddle:signal', {
        fromSocketId: socket.id,
        signal,
      });
    });

    socket.on('huddle:toggle_media', ({ channelId, isMuted, isSharingScreen }: { channelId: string; isMuted?: boolean; isSharingScreen?: boolean }) => {
      const room = huddleRooms.get(channelId);
      if (room && room.has(socket.id)) {
        const p = room.get(socket.id)!;
        if (typeof isMuted === 'boolean') p.isMuted = isMuted;
        if (typeof isSharingScreen === 'boolean') p.isSharingScreen = isSharingScreen;

        io.to(`huddle_${channelId}`).emit('huddle:user_updated', {
          participant: p,
          participants: Array.from(room.values()),
        });
      }
    });

    const leaveHuddle = (channelId: string) => {
      socket.leave(`huddle_${channelId}`);
      const room = huddleRooms.get(channelId);
      if (room && room.has(socket.id)) {
        room.delete(socket.id);
        const remaining = Array.from(room.values());
        if (room.size === 0) {
          huddleRooms.delete(channelId);
        }

        socket.to(`huddle_${channelId}`).emit('huddle:user_left', {
          socketId: socket.id,
          userId: user.id,
          participants: remaining,
        });

        io.to(`channel_${channelId}`).emit('huddle:active_count', {
          channelId,
          count: room.size,
        });
      }
    };

    socket.on('huddle:leave', ({ channelId }: { channelId: string }) => {
      leaveHuddle(channelId);
    });

    // =========================================================================
    // Direct Discord-Style Call Signaling (Voice & Screen Share Calling)
    // =========================================================================
    socket.on('call:start', ({ receiverId, channelId, channelName, callType }: { receiverId: string; channelId: string; channelName: string; callType: 'voice' | 'screen' }) => {
      console.log(`[Call Start] From ${user.name} (${userId}) to receiver (${receiverId}) - type: ${callType}`);
      io.to(`user_${receiverId}`).emit('call:incoming', {
        caller: {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          position: user.position,
        },
        channelId,
        channelName,
        callType: callType || 'voice',
      });
    });

    socket.on('call:accept', ({ callerId, channelId }: { callerId: string; channelId: string }) => {
      console.log(`[Call Accepted] By ${user.name} for caller (${callerId})`);
      io.to(`user_${callerId}`).emit('call:accepted', {
        receiverId: user.id,
        receiverName: user.name,
        channelId,
      });
    });

    socket.on('call:decline', ({ callerId, channelId }: { callerId: string; channelId: string }) => {
      console.log(`[Call Declined] By ${user.name} for caller (${callerId})`);
      io.to(`user_${callerId}`).emit('call:declined', {
        receiverId: user.id,
        receiverName: user.name,
        channelId,
      });
    });

    socket.on('call:cancel', ({ receiverId, channelId }: { receiverId: string; channelId: string }) => {
      console.log(`[Call Cancelled] By caller ${user.name} for receiver (${receiverId})`);
      io.to(`user_${receiverId}`).emit('call:cancelled', {
        callerId: user.id,
        channelId,
      });
    });

    // Handle Disconnect
    socket.on('disconnect', async () => {
      // Clean up any huddles user was in
      huddleRooms.forEach((room, channelId) => {
        if (room.has(socket.id)) {
          leaveHuddle(channelId);
        }
      });

      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          // If no more active tabs, mark OFFLINE
          try {
            await prisma.user.update({
              where: { id: userId },
              data: { status: UserStatus.OFFLINE },
            });
            io.emit('presence:status', { userId, status: UserStatus.OFFLINE });
          } catch (e) {
            console.error('Failed to update presence on disconnect:', e);
          }
        }
      }
      console.log(`[Socket Disconnected] User: ${user.name} - Socket: ${socket.id}`);
    });
  });

  return io;
};

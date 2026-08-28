import { Response } from 'express';
import { prisma } from '../../config/db.js';
import { UserStatus } from '../../types/enums.js';
import { AuthenticatedUser } from '../../types/express.js';
import { io } from '../../index.js';

interface SSEClient {
  id: string;
  res: Response;
  user: AuthenticatedUser;
  connectedAt: Date;
}

export class SSEService {
  // Map of userId -> Map of clientId -> SSEClient
  private static clients: Map<string, Map<string, SSEClient>> = new Map();
  private static heartbeatInterval: NodeJS.Timeout | null = null;

  static initialize() {
    if (!this.heartbeatInterval) {
      // Send heartbeat ping every 25 seconds to keep connection alive through proxies/routers
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat();
      }, 25000);
      console.log('⚡ SSE Service initialized with 25s keep-alive heartbeat');
    }
  }

  /**
   * Register a new client SSE stream connection
   */
  static async addClient(userId: string, clientId: string, res: Response, user: AuthenticatedUser) {
    this.initialize();

    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Map());
    }

    const userClients = this.clients.get(userId)!;
    const isFirstConnection = userClients.size === 0;

    userClients.set(clientId, {
      id: clientId,
      res,
      user,
      connectedAt: new Date(),
    });

    console.log(`[SSE Connected] User: ${user.name} (${userId}) | ClientId: ${clientId} | Total tabs: ${userClients.size}`);

    // If first connection from this user, mark as ONLINE
    if (isFirstConnection) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { status: UserStatus.ONLINE },
        });

        // Broadcast presence to all SSE clients and Socket.IO
        this.broadcast('presence:status', { userId, status: UserStatus.ONLINE });
        if (io) {
          io.emit('presence:status', { userId, status: UserStatus.ONLINE });
        }
      } catch (err) {
        console.error('Failed to update presence status to ONLINE on SSE connect:', err);
      }
    }

    // Send initial connected handshake event to client
    this.sendToClient(res, 'connected', {
      clientId,
      userId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      serverTime: new Date().toISOString(),
    });
  }

  /**
   * Handle client disconnect / closed stream
   */
  static async removeClient(userId: string, clientId: string) {
    const userClients = this.clients.get(userId);
    if (!userClients) return;

    userClients.delete(clientId);
    console.log(`[SSE Disconnected] User ID: ${userId} | ClientId: ${clientId} | Remaining tabs: ${userClients.size}`);

    if (userClients.size === 0) {
      this.clients.delete(userId);

      // If user closed all SSE tabs, mark as OFFLINE
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { status: UserStatus.OFFLINE },
        });

        this.broadcast('presence:status', { userId, status: UserStatus.OFFLINE });
        if (io) {
          io.emit('presence:status', { userId, status: UserStatus.OFFLINE });
        }
      } catch (err) {
        console.error('Failed to update presence status to OFFLINE on SSE disconnect:', err);
      }
    }
  }

  /**
   * Send a formatted SSE event to a specific Express Response
   */
  private static sendToClient(res: Response, event: string, data: any) {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      console.error(`Failed to write SSE event '${event}':`, err);
    }
  }

  /**
   * Send keep-alive comment to all active clients
   */
  private static sendHeartbeat() {
    this.clients.forEach((userClients) => {
      userClients.forEach((client) => {
        try {
          client.res.write(':keepalive\n\n');
        } catch {
          // Ignore closed streams; clean up handled by req.on('close')
        }
      });
    });
  }

  /**
   * Send event to a specific user across all their open browser tabs
   */
  static sendToUser(userId: string, event: string, data: any) {
    const userClients = this.clients.get(userId);
    if (!userClients) return;

    userClients.forEach((client) => {
      this.sendToClient(client.res, event, data);
    });
  }

  /**
   * Send event to multiple specific users
   */
  static sendToUsers(userIds: string[], event: string, data: any) {
    for (const userId of userIds) {
      this.sendToUser(userId, event, data);
    }
  }

  /**
   * Broadcast event to ALL connected clients across the entire workspace
   */
  static broadcast(event: string, data: any, excludeUserId?: string) {
    this.clients.forEach((userClients, userId) => {
      if (excludeUserId && userId === excludeUserId) return;
      userClients.forEach((client) => {
        this.sendToClient(client.res, event, data);
      });
    });
  }

  /**
   * Get count of currently connected unique users and total open streams
   */
  static getStats() {
    let totalStreams = 0;
    this.clients.forEach((userClients) => {
      totalStreams += userClients.size;
    });

    return {
      connectedUsersCount: this.clients.size,
      totalStreamsCount: totalStreams,
      connectedUserIds: Array.from(this.clients.keys()),
    };
  }
}

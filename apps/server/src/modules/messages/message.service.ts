import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/apiResponse.js';
import { SendDirectMessageInput, EditMessageInput } from './message.dto.js';
import { MessageType } from '../../types/enums.js';

export class MessageService {
  static async getDirectMessages(currentUserId: string, targetUserId: string, limit = 50, before?: string) {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, avatarUrl: true, status: true },
    });

    if (!targetUser) {
      throw ApiError.notFound('User not found');
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: currentUserId },
        ],
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
        attachments: true,
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return {
      targetUser,
      messages,
    };
  }

  static async sendDirectMessage(senderId: string, data: SendDirectMessageInput) {
    const receiver = await prisma.user.findUnique({
      where: { id: data.receiverId },
    });

    if (!receiver) {
      throw ApiError.notFound('Receiver user not found');
    }

    const message = await prisma.message.create({
      data: {
        content: data.content,
        type: data.type || MessageType.TEXT,
        senderId,
        receiverId: data.receiverId,
        ...(data.attachmentIds && data.attachmentIds.length > 0
          ? {
              attachments: {
                connect: data.attachmentIds.map((id) => ({ id })),
              },
            }
          : {}),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        attachments: true,
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: data.receiverId,
        type: 'MESSAGE',
        title: `New message from ${message.sender.name}`,
        message: message.content.substring(0, 100),
        link: `/messages?userId=${senderId}`,
      },
    });

    return message;
  }

  static async getConversations(userId: string) {
    const sent = await prisma.message.findMany({
      where: { senderId: userId, receiverId: { not: null } },
      select: { receiverId: true },
      distinct: ['receiverId'],
    });

    const received = await prisma.message.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ['senderId'],
    });

    const sentIds: string[] = sent
      .map((m: { receiverId: string | null }) => m.receiverId)
      .filter((id: string | null): id is string => Boolean(id));

    const receivedIds: string[] = received
      .map((m: { senderId: string }) => m.senderId)
      .filter((id: string | null): id is string => Boolean(id));

    const partnerIds = Array.from(new Set([...sentIds, ...receivedIds]));

    const conversations = await Promise.all(
      partnerIds.map(async (partnerId: string) => {
        const user = await prisma.user.findUnique({
          where: { id: partnerId },
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            status: true,
            role: true,
            position: true,
          },
        });

        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: partnerId },
              { senderId: partnerId, receiverId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
        });

        return {
          user,
          lastMessage,
        };
      })
    );

    return conversations.filter((c) => c.user !== null);
  }

  static async togglePin(messageId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw ApiError.notFound('Message not found');
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { isPinned: !message.isPinned },
      include: {
        sender: true,
        attachments: true,
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return updated;
  }

  static async editMessage(messageId: string, userId: string, data: EditMessageInput) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw ApiError.notFound('Message not found');
    }

    if (message.senderId !== userId) {
      throw ApiError.forbidden('You can only edit your own messages');
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: data.content,
        isEdited: true,
      },
      include: {
        sender: true,
        attachments: true,
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return updated;
  }

  static async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw ApiError.notFound('Message not found');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (message.senderId !== userId && user?.role !== 'ADMIN') {
      throw ApiError.forbidden('You do not have permission to delete this message');
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return { message: 'Message deleted successfully' };
  }

  static async toggleReaction(messageId: string, userId: string, emoji: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw ApiError.notFound('Message not found');
    }

    const existing = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    if (existing) {
      await prisma.messageReaction.delete({
        where: { id: existing.id },
      });
    } else {
      await prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
      });
    }

    const updatedReactions = await prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      messageId,
      receiverId: message.receiverId,
      senderId: message.senderId,
      reactions: updatedReactions,
    };
  }
}

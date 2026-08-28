import { Request, Response, NextFunction } from 'express';
import { MessageService } from './message.service.js';
import { sendCreated, sendSuccess } from '../../utils/apiResponse.js';
import { SSEService } from '../sse/sse.service.js';

export class MessageController {
  static async getDirectMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit, before } = req.query;
      const targetUserId = req.params.userId as string;
      const result = await MessageService.getDirectMessages(
        req.user!.id,
        targetUserId,
        limit ? parseInt(limit as string, 10) : 50,
        before as string
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async sendDirectMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const message = await MessageService.sendDirectMessage(req.user!.id, req.body);
      
      // Emit via SSE to sender and receiver
      if (message.receiverId) {
        SSEService.sendToUsers([req.user!.id, message.receiverId], 'message:new', message);
      }

      return sendCreated(res, message, 'Direct message sent');
    } catch (error) {
      next(error);
    }
  }

  static async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const conversations = await MessageService.getConversations(req.user!.id);
      return sendSuccess(res, conversations);
    } catch (error) {
      next(error);
    }
  }

  static async togglePin(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await MessageService.togglePin(id);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async editMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await MessageService.editMessage(id, req.user!.id, req.body);
      
      // Broadcast via SSE
      SSEService.broadcast('message:edited', result);

      return sendSuccess(res, result, 'Message edited');
    } catch (error) {
      next(error);
    }
  }

  static async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await MessageService.deleteMessage(id, req.user!.id);
      
      // Broadcast via SSE
      SSEService.broadcast('message:deleted', { messageId: id });

      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async toggleReaction(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { emoji } = req.body;
      if (!emoji) {
        return res.status(400).json({ success: false, message: 'Emoji is required' });
      }
      const result = await MessageService.toggleReaction(id, req.user!.id, emoji);
      
      // Broadcast via SSE
      SSEService.broadcast('message:reaction_updated', result);

      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

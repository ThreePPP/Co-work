import { Request, Response, NextFunction } from 'express';
import { FileService } from './file.service.js';
import { sendCreated, sendSuccess, ApiError } from '../../utils/apiResponse.js';
import { FileCategory } from '../../types/enums.js';
import { SSEService } from '../sse/sse.service.js';

export class FileController {
  static async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No file uploaded');
      }

      const fileRecord = await FileService.saveFile(
        req.file,
        req.user!.id,
        req.body.messageId
      );

      SSEService.broadcast('file:uploaded', fileRecord);

      return sendCreated(res, fileRecord, 'File uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No avatar image uploaded');
      }

      const relativeUrl = `/uploads/${req.file.filename}`;
      return sendCreated(res, { url: relativeUrl }, 'Avatar uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async listFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, uploaderId, search, page, limit } = req.query;
      const result = await FileService.listFiles({
        category: category as FileCategory,
        uploaderId: uploaderId as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 30,
      });

      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getFileById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const file = await FileService.getFileById(id);
      return sendSuccess(res, file);
    } catch (error) {
      next(error);
    }
  }

  static async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await FileService.deleteFile(id, req.user!.id);
      SSEService.broadcast('file:deleted', { fileId: id });
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getFileStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await FileService.getFileStats();
      return sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

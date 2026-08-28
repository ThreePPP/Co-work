import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service.js';
import { sendSuccess, ApiError } from '../../utils/apiResponse.js';
import { Role, UserStatus } from '../../types/enums.js';

export class UserController {
  static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, department, role, status, page, limit } = req.query;
      const result = await UserService.listUsers({
        search: search as string,
        department: department as string,
        role: role as Role,
        status: status as UserStatus,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50,
      });
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await UserService.getUserById(id);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await UserService.updateUser(id, req.body, req.user?.id);
      return sendSuccess(res, result, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await UserService.deleteUser(id, req.user?.id);
      return sendSuccess(res, result, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getDepartments(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.getDepartments();
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No image file uploaded');
      }

      const relativeUrl = `/uploads/avatars/${req.file.filename}`;
      await UserService.updateUser(req.user!.id, { avatarUrl: relativeUrl });

      return sendSuccess(res, { url: relativeUrl }, 'Profile avatar updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { sendCreated, sendSuccess } from '../../utils/apiResponse.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const ip = req.ip || req.socket.remoteAddress;
      const result = await AuthService.register(req.body, ip);
      return sendCreated(res, result, 'Registered successfully');
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const ip = req.ip || req.socket.remoteAddress;
      const result = await AuthService.login(req.body, ip);
      return sendSuccess(res, result, 'Logged in successfully');
    } catch (error) {
      next(error);
    }
  }

  static async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const ip = req.ip || req.socket.remoteAddress;
      const result = await AuthService.googleLogin(req.body, ip);
      return sendSuccess(res, result, 'Google login successful');
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.getProfile(req.user!.id);
      return sendSuccess(res, result, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.updateProfile(req.user!.id, req.body);
      return sendSuccess(res, result, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.changePassword(req.user!.id, req.body);
      return sendSuccess(res, result, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.id) {
        await AuthService.logout(req.user.id);
      }
      return sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }
}

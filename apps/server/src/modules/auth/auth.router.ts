import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
  RegisterSchema,
  LoginSchema,
  GoogleLoginSchema,
  UpdateProfileSchema,
  ChangePasswordSchema,
} from './auth.dto.js';

const router = Router();

router.post('/register', validate(RegisterSchema), AuthController.register);
router.post('/login', validate(LoginSchema), AuthController.login);
router.post('/google', validate(GoogleLoginSchema), AuthController.googleLogin);
router.get('/me', authenticate, AuthController.getMe);
router.patch('/me', authenticate, validate(UpdateProfileSchema), AuthController.updateProfile);
router.post('/change-password', authenticate, validate(ChangePasswordSchema), AuthController.changePassword);
router.post('/logout', authenticate, AuthController.logout);

export default router;

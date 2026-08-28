import { z } from 'zod';
import { Role } from '../../types/enums.js';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  department: z.string().optional(),
  position: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']).optional().default('MEMBER'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const GoogleLoginSchema = z.object({
  credential: z.string().min(1, 'Google credential token is required'),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().or(z.string().startsWith('/uploads/')).optional().nullable(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type GoogleLoginInput = z.infer<typeof GoogleLoginSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/apiResponse.js';
import { hashPassword, comparePassword } from '../../utils/hash.utils.js';
import { generateToken } from '../../utils/jwt.utils.js';
import {
  RegisterInput,
  LoginInput,
  GoogleLoginInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from './auth.dto.js';
import { UserStatus } from '../../types/enums.js';

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

export class AuthService {
  static async register(data: RegisterInput, ipAddress?: string) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw ApiError.badRequest('A user with this email address already exists');
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: hashedPassword,
        name: data.name,
        role: data.role || 'MEMBER',
        department: data.department || 'General',
        position: data.position || 'Team Member',
        status: UserStatus.ONLINE,
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        details: `Registered account as ${user.name}`,
        ipAddress,
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      position: user.position,
      avatarUrl: user.avatarUrl,
      status: user.status,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        position: user.position,
        avatarUrl: user.avatarUrl,
        status: user.status,
      },
      token,
    };
  }

  static async login(data: LoginInput, ipAddress?: string) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isValid = await comparePassword(data.password, user.passwordHash);
    if (!isValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if ((user as any).isSuspended) {
      throw ApiError.forbidden(
        `Your account has been suspended by an administrator. ${(user as any).suspendedReason ? `Reason: ${(user as any).suspendedReason}` : 'Please contact support.'}`
      );
    }

    // Update status to ONLINE
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { status: UserStatus.ONLINE },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        details: 'User logged in with credentials',
        ipAddress,
      },
    });

    const token = generateToken({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      department: updatedUser.department,
      position: updatedUser.position,
      avatarUrl: updatedUser.avatarUrl,
      status: updatedUser.status,
    });

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        department: updatedUser.department,
        position: updatedUser.position,
        avatarUrl: updatedUser.avatarUrl,
        status: updatedUser.status,
      },
      token,
    };
  }

  static async googleLogin(data: GoogleLoginInput, ipAddress?: string) {
    let email: string;
    let name: string;
    let avatarUrl: string | null = null;
    let googleId: string;

    if (googleClient && data.credential) {
      const ticket = await googleClient.verifyIdToken({
        idToken: data.credential,
        audience: env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw ApiError.badRequest('Invalid Google authentication payload');
      }
      email = payload.email.toLowerCase();
      name = payload.name || payload.email.split('@')[0];
      avatarUrl = payload.picture || null;
      googleId = payload.sub;
    } else {
      // Fallback decode for development/mock testing when GOOGLE_CLIENT_ID not set
      try {
        const payloadPart = data.credential.split('.')[1];
        const decoded = JSON.parse(Buffer.from(payloadPart, 'base64').toString('utf-8'));
        email = (decoded.email || 'user@example.com').toLowerCase();
        name = decoded.name || email.split('@')[0];
        avatarUrl = decoded.picture || null;
        googleId = decoded.sub || `google-${Date.now()}`;
      } catch (err) {
        throw ApiError.badRequest('Malformed Google credential');
      }
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { googleId }],
      },
    });

    if (user) {
      if ((user as any).isSuspended) {
        throw ApiError.forbidden(
          `Your account has been suspended by an administrator. ${(user as any).suspendedReason ? `Reason: ${(user as any).suspendedReason}` : 'Please contact support.'}`
        );
      }
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          googleId,
          avatarUrl,
          role: 'MEMBER',
          department: 'General',
          position: 'Team Member',
          status: UserStatus.ONLINE,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          status: UserStatus.ONLINE,
          googleId: user.googleId || googleId,
          avatarUrl: user.avatarUrl || avatarUrl,
        },
      });
    }

    if (!user) {
      throw ApiError.badRequest('Unable to authenticate user with Google');
    }

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_GOOGLE_LOGIN',
        details: 'User authenticated with Google OAuth',
        ipAddress,
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      position: user.position,
      avatarUrl: user.avatarUrl,
      status: user.status,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        position: user.position,
        avatarUrl: user.avatarUrl,
        status: user.status,
      },
      token,
    };
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        position: true,
        avatarUrl: true,
        bio: true,
        status: true,
        googleId: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  static async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.department !== undefined && { department: data.department }),
        ...(data.position !== undefined && { position: data.position }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        position: true,
        avatarUrl: true,
        bio: true,
        status: true,
        createdAt: true,
      },
    });

    return user;
  }

  static async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (!user.passwordHash) {
      throw ApiError.badRequest('Cannot change password for social login accounts');
    }

    const isValid = await comparePassword(data.currentPassword, user.passwordHash);
    if (!isValid) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    const newHash = await hashPassword(data.newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Password updated successfully' };
  }

  static async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.OFFLINE },
    });
    return { message: 'Logged out successfully' };
  }
}

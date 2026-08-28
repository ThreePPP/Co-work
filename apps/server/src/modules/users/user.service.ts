import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/apiResponse.js';
import { Role, UserStatus } from '../../types/enums.js';

export interface UserFilterOptions {
  search?: string;
  department?: string;
  role?: Role;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

export class UserService {
  static async listUsers(options: UserFilterOptions) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { email: { contains: options.search, mode: 'insensitive' } },
        { position: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options.department) {
      where.department = options.department;
    }

    if (options.role) {
      where.role = options.role;
    }

    if (options.status) {
      where.status = options.status;
    }

    const [users, total] = await Promise.all([
      (prisma.user as any).findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          position: true,
          avatarUrl: true,
          bio: true,
          status: true,
          isSuspended: true,
          suspendedReason: true,
          createdAt: true,
        },
        orderBy: [{ status: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getUserById(id: string) {
    const user = await (prisma.user as any).findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        avatarUrl: true,
        bio: true,
        status: true,
        isSuspended: true,
        suspendedReason: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  static async updateUser(
    id: string,
    data: {
      name?: string;
      email?: string;
      role?: Role;
      department?: string;
      position?: string;
      status?: UserStatus;
      isSuspended?: boolean;
      suspendedReason?: string | null;
      avatarUrl?: string | null;
      bio?: string | null;
    },
    operatorUserId?: string
  ) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('User not found');
    }

    if (data.email && data.email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
      if (emailTaken && emailTaken.id !== id) {
        throw ApiError.badRequest('This email address is already in use by another user');
      }
      data.email = data.email.toLowerCase();
    }

    const user = await (prisma.user as any).update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        avatarUrl: true,
        bio: true,
        status: true,
        isSuspended: true,
        suspendedReason: true,
      },
    });

    // Audit Logging
    let action = 'USER_UPDATED';
    let details = `User "${user.name}" details updated (${Object.keys(data).join(', ')})`;

    if (data.isSuspended !== undefined && data.isSuspended !== (existing as any).isSuspended) {
      action = data.isSuspended ? 'USER_SUSPENDED' : 'USER_REACTIVATED';
      details = data.isSuspended
        ? `Account for "${user.name}" (${user.email}) was SUSPENDED. Reason: ${data.suspendedReason || 'No reason provided'}`
        : `Account for "${user.name}" (${user.email}) was REACTIVATED by administrator.`;
    }

    await (prisma.activityLog as any).create({
      data: {
        userId: operatorUserId || id,
        action,
        details,
      },
    });

    return user;
  }

  static async deleteUser(id: string, adminUserId?: string) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('User not found');
    }

    // 1. Backfill snapshot fields on all past activity logs of this user so history is preserved
    await (prisma.activityLog as any).updateMany({
      where: { userId: id },
      data: {
        userName: existing.name,
        userEmail: existing.email,
        userRole: existing.role,
        userDepartment: existing.department || 'General',
        userPosition: existing.position || 'Team Member',
        userAvatar: existing.avatarUrl,
      },
    });

    // 2. Log audit event of user deletion
    await (prisma.activityLog as any).create({
      data: {
        userId: adminUserId || undefined,
        userName: adminUserId ? undefined : 'System Admin',
        userEmail: adminUserId ? undefined : 'admin@cowork.com',
        userRole: adminUserId ? undefined : 'ADMIN',
        action: 'USER_DELETED',
        details: `User "${existing.name}" (${existing.email}, ${existing.role}) was deleted. All historical activity logs have been archived and preserved.`,
      },
    });

    // 3. Delete user (Foreign key onDelete: SetNull on ActivityLog preserves all historical logs)
    await prisma.user.delete({
      where: { id },
    });

    return { message: `User ${existing.name} removed successfully. Historical audit records preserved.` };
  }

  static async getDepartments() {
    const departments = await prisma.user.findMany({
      select: { department: true },
      distinct: ['department'],
      where: { department: { not: null } },
    });
    return departments.map((d: { department: string | null }) => d.department).filter(Boolean);
  }
}

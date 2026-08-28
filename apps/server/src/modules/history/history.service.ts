import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/apiResponse.js';
import { HistoryQueryInput } from './history.dto.js';

export class HistoryService {
  private static getCategoryActionFilter(category: string) {
    switch (category) {
      case 'TASKS':
        return {
          OR: [
            { action: { contains: 'TASK' } },
            { action: { contains: 'SUBTASK' } },
          ],
        };
      case 'FILES':
        return {
          action: { contains: 'FILE' },
        };
      case 'AUTH':
        return {
          OR: [
            { action: { contains: 'LOGIN' } },
            { action: { contains: 'REGISTER' } },
            { action: { contains: 'LOGOUT' } },
            { action: { contains: 'PASSWORD' } },
          ],
        };
      case 'USERS':
        return {
          OR: [
            { action: { contains: 'USER' } },
            { action: { contains: 'PROFILE' } },
            { action: { contains: 'ROLE' } },
          ],
        };
      case 'MESSAGES':
        return {
          action: { contains: 'MESSAGE' },
        };
      default:
        return null;
    }
  }

  static async listHistory(query: HistoryQueryInput) {
    const {
      page = 1,
      limit = 20,
      category = 'ALL',
      action,
      userId,
      search,
      startDate,
      endDate,
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const andConditions: any[] = [];

    if (category && category !== 'ALL') {
      const categoryFilter = this.getCategoryActionFilter(category);
      if (categoryFilter) {
        andConditions.push(categoryFilter);
      }
    }

    if (action) {
      andConditions.push({ action });
    }

    if (userId) {
      andConditions.push({ userId });
    }

    if (search && search.trim() !== '') {
      const trimmedSearch = search.trim();
      andConditions.push({
        OR: [
          { action: { contains: trimmedSearch, mode: 'insensitive' } },
          { details: { contains: trimmedSearch, mode: 'insensitive' } },
          { userName: { contains: trimmedSearch, mode: 'insensitive' } },
          { userEmail: { contains: trimmedSearch, mode: 'insensitive' } },
          { userDepartment: { contains: trimmedSearch, mode: 'insensitive' } },
          { user: { name: { contains: trimmedSearch, mode: 'insensitive' } } },
          { user: { email: { contains: trimmedSearch, mode: 'insensitive' } } },
        ],
      });
    }

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      andConditions.push({ createdAt: dateFilter });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    const [rawItems, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              role: true,
              department: true,
              position: true,
            },
          },
        },
        orderBy: { createdAt: sortOrder },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Format items: if user is deleted, seamlessly fall back to the archived snapshot fields
    const items = rawItems.map((log) => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      details: log.details,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
      userName: log.userName,
      userEmail: log.userEmail,
      userRole: log.userRole,
      userDepartment: log.userDepartment,
      userPosition: log.userPosition,
      userAvatar: log.userAvatar,
      user: log.user
        ? {
            ...log.user,
            isArchived: false,
          }
        : {
            id: log.userId || 'archived-user',
            name: log.userName || 'Former Member (Archived)',
            email: log.userEmail || 'archived@cowork.local',
            avatarUrl: log.userAvatar || null,
            role: (log.userRole as any) || 'MEMBER',
            department: log.userDepartment || 'Archived',
            position: log.userPosition || 'Former Member',
            isArchived: true,
          },
    }));

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  static async getStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, todayCount, past7DaysCount, allLogs] = await Promise.all([
      prisma.activityLog.count(),
      prisma.activityLog.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.activityLog.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      // Sample recent logs for category and active users breakdown
      prisma.activityLog.findMany({
        take: 500,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              department: true,
            },
          },
        },
      }),
    ]);

    // Calculate Category Breakdown
    const categoryCounts: Record<string, number> = {
      TASKS: 0,
      FILES: 0,
      AUTH: 0,
      USERS: 0,
      MESSAGES: 0,
      OTHER: 0,
    };

    const userActivityMap: Map<string, { user: any; count: number }> = new Map();

    for (const log of allLogs) {
      const act = log.action;
      if (act.includes('TASK') || act.includes('SUBTASK')) {
        categoryCounts.TASKS++;
      } else if (act.includes('FILE')) {
        categoryCounts.FILES++;
      } else if (act.includes('LOGIN') || act.includes('REGISTER') || act.includes('PASSWORD') || act.includes('LOGOUT')) {
        categoryCounts.AUTH++;
      } else if (act.includes('USER') || act.includes('PROFILE') || act.includes('ROLE')) {
        categoryCounts.USERS++;
      } else if (act.includes('MESSAGE')) {
        categoryCounts.MESSAGES++;
      } else {
        categoryCounts.OTHER++;
      }

      if (log.user) {
        const uId = log.user.id;
        const current = userActivityMap.get(uId) || { user: log.user, count: 0 };
        current.count++;
        userActivityMap.set(uId, current);
      } else if (log.userName) {
        const uId = log.userName;
        const current = userActivityMap.get(uId) || {
          user: {
            id: log.userId || 'archived',
            name: log.userName,
            avatarUrl: log.userAvatar,
            department: log.userDepartment,
            isArchived: true,
          },
          count: 0,
        };
        current.count++;
        userActivityMap.set(uId, current);
      }
    }

    // Top 5 active users
    const topActiveUsers = Array.from(userActivityMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate 7-day daily activity trend
    const dailyTrend: Array<{ date: string; label: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);

      const dayLogs = allLogs.filter((l) => {
        const logDate = new Date(l.createdAt);
        return logDate >= dayStart && logDate <= dayEnd;
      });

      const dayLabel = day.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      dailyTrend.push({
        date: dayStart.toISOString().split('T')[0],
        label: dayLabel,
        count: dayLogs.length,
      });
    }

    return {
      total,
      todayCount,
      past7DaysCount,
      categoryCounts,
      topActiveUsers,
      dailyTrend,
    };
  }

  static async getHistoryById(id: string) {
    const log = await prisma.activityLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            department: true,
            position: true,
            status: true,
          },
        },
      },
    });

    if (!log) {
      throw ApiError.notFound('Activity log record not found');
    }

    return {
      ...log,
      user: log.user
        ? { ...log.user, isArchived: false }
        : {
            id: log.userId || 'archived',
            name: log.userName || 'Former Member (Archived)',
            email: log.userEmail || 'archived@cowork.local',
            avatarUrl: log.userAvatar || null,
            role: log.userRole || 'MEMBER',
            department: log.userDepartment || 'Archived',
            position: log.userPosition || 'Former Member',
            isArchived: true,
          },
    };
  }

  static async exportHistory(query: HistoryQueryInput) {
    const listResult = await this.listHistory({
      ...query,
      page: 1,
      limit: 1000, // Export up to 1000 items
    });

    return listResult.items.map((item) => ({
      id: item.id,
      timestamp: item.createdAt,
      userName: item.user?.name || item.userName || 'Unknown',
      userEmail: item.user?.email || item.userEmail || '',
      userRole: item.user?.role || item.userRole || '',
      userDepartment: item.user?.department || item.userDepartment || '',
      action: item.action,
      details: item.details || '',
      ipAddress: item.ipAddress || 'N/A',
      isArchivedUser: item.user?.isArchived || false,
    }));
  }

  static async pruneHistory(days: number, adminUserId: string) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: { lt: cutoff },
      },
    });

    // Log the prune action
    await prisma.activityLog.create({
      data: {
        userId: adminUserId,
        action: 'PRUNE_ACTIVITY_LOGS',
        details: `Pruned ${result.count} logs older than ${days} days (before ${cutoff.toISOString().split('T')[0]})`,
      },
    });

    return {
      message: `Successfully pruned ${result.count} activity log entries`,
      deletedCount: result.count,
      cutoffDate: cutoff,
    };
  }

  static async logActivity(params: {
    userId?: string | null;
    action: string;
    details?: string;
    ipAddress?: string;
    userSnapshot?: {
      name?: string;
      email?: string;
      role?: string;
      department?: string;
      position?: string;
      avatarUrl?: string | null;
    };
  }) {
    let snapshot = params.userSnapshot;
    if (!snapshot && params.userId) {
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: {
          name: true,
          email: true,
          role: true,
          department: true,
          position: true,
          avatarUrl: true,
        },
      });
      if (user) {
        snapshot = {
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department || 'General',
          position: user.position || 'Team Member',
          avatarUrl: user.avatarUrl,
        };
      }
    }

    return prisma.activityLog.create({
      data: {
        userId: params.userId,
        userName: snapshot?.name,
        userEmail: snapshot?.email,
        userRole: snapshot?.role,
        userDepartment: snapshot?.department,
        userPosition: snapshot?.position,
        userAvatar: snapshot?.avatarUrl,
        action: params.action,
        details: params.details,
        ipAddress: params.ipAddress,
      },
    });
  }
}

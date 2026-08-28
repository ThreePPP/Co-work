import { prisma } from '../../config/db.js';
import { UserStatus } from '../../types/enums.js';

export class DashboardService {
  static async getSummary(userId: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const threeYearsAgo = new Date(now.getFullYear() - 3, 0, 1);

    const [
      totalMembers,
      onlineMembers,
      totalTasks,
      totalFiles,
      fileSizeResult,
      todayMessagesCount,
      recentFiles,
      onlineUsersList,
      unreadNotificationsCount,
      allTasks,
      allUsers,
      allFilesGrouped,
      allHistoricalLogs,
    ] = await Promise.all([
      // 1. Total Members
      prisma.user.count(),

      // 2. Online Members
      prisma.user.count({
        where: { status: { in: [UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY] } },
      }),

      // 3. Total Tasks
      prisma.task.count(),

      // 4. Total Files
      prisma.fileItem.count(),

      // 5. Total Storage used
      prisma.fileItem.aggregate({
        _sum: { size: true },
      }),

      // 6. Messages sent today
      prisma.message.count({
        where: { createdAt: { gte: today } },
      }),

      // 7. Recent Shared Files
      prisma.fileItem.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          uploader: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),

      // 8. Team Presence & Online Colleagues
      prisma.user.findMany({
        where: {
          id: { not: userId },
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          position: true,
          department: true,
          status: true,
        },
        take: 12,
        orderBy: [{ status: 'desc' }, { updatedAt: 'desc' }],
      }),

      // 9. Unread Notifications Count
      prisma.notification.count({
        where: { userId, isRead: false },
      }),

      // 10. All Tasks for status and priority distribution + assignees
      prisma.task.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
          createdBy: {
            select: { id: true, name: true, department: true },
          },
          assignees: {
            select: {
              userId: true,
              role: true,
            },
          },
        },
      }),

      // 11. All Users for department breakdown
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          department: true,
          position: true,
          role: true,
          status: true,
        },
        orderBy: { name: 'asc' },
      }),

      // 12. File Storage by Category
      prisma.fileItem.groupBy({
        by: ['category'],
        _count: { id: true },
        _sum: { size: true },
      }),

      // 13. Historical Activity Logs for Multi-Period Trends
      prisma.activityLog.findMany({
        where: { createdAt: { gte: threeYearsAgo } },
        select: { action: true, createdAt: true },
      }),
    ]);

    // Task Status & Priority Breakdown
    const taskStatusCounts = {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
    };
    const taskPriorityCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };

    for (const t of allTasks) {
      if (taskStatusCounts[t.status as keyof typeof taskStatusCounts] !== undefined) {
        taskStatusCounts[t.status as keyof typeof taskStatusCounts]++;
      }
      if (taskPriorityCounts[t.priority as keyof typeof taskPriorityCounts] !== undefined) {
        taskPriorityCounts[t.priority as keyof typeof taskPriorityCounts]++;
      }
    }

    const completionRate = totalTasks > 0 ? Math.round((taskStatusCounts.DONE / totalTasks) * 100) : 0;

    // 0. Hourly Trend (1D / Today: All 24 Hours)
    const hourly1dTrend: Array<{
      date: string;
      label: string;
      tasks: number;
      files: number;
      auth: number;
      total: number;
    }> = [];

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    for (let h = 0; h < 24; h++) {
      const slotStart = new Date(todayStart.getTime() + h * 60 * 60 * 1000);
      const slotEnd = new Date(todayStart.getTime() + (h + 1) * 60 * 60 * 1000 - 1);

      const slotLogs = allHistoricalLogs.filter((l) => {
        const lDate = new Date(l.createdAt);
        return lDate >= slotStart && lDate <= slotEnd;
      });

      let tasksCount = 0;
      let filesCount = 0;
      let authCount = 0;

      for (const log of slotLogs) {
        const act = log.action;
        if (act.includes('TASK')) tasksCount++;
        else if (act.includes('FILE')) filesCount++;
        else if (act.includes('LOGIN') || act.includes('REGISTER') || act.includes('USER')) authCount++;
      }

      hourly1dTrend.push({
        date: `${slotStart.toISOString().split('T')[0]} ${String(h).padStart(2, '0')}:00`,
        label: `${String(h).padStart(2, '0')}:00`,
        tasks: tasksCount,
        files: filesCount,
        auth: authCount,
        total: slotLogs.length,
      });
    }

    // 1. Daily Trend (7 Days)
    const dailyActivityTrend: Array<{
      date: string;
      label: string;
      tasks: number;
      files: number;
      auth: number;
      total: number;
    }> = [];

    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);

      const dayLogs = allHistoricalLogs.filter((l) => {
        const lDate = new Date(l.createdAt);
        return lDate >= dayStart && lDate <= dayEnd;
      });

      let tasksCount = 0;
      let filesCount = 0;
      let authCount = 0;

      for (const log of dayLogs) {
        const act = log.action;
        if (act.includes('TASK')) tasksCount++;
        else if (act.includes('FILE')) filesCount++;
        else if (act.includes('LOGIN') || act.includes('REGISTER') || act.includes('USER')) authCount++;
      }

      dailyActivityTrend.push({
        date: dayStart.toISOString().split('T')[0],
        label: `${day.toLocaleDateString('en-US', { weekday: 'short' })} ${day.getDate()}`,
        tasks: tasksCount,
        files: filesCount,
        auth: authCount,
        total: dayLogs.length,
      });
    }

    // 1.5 Daily Trend (Past 30 Days)
    const daily30ActivityTrend: Array<{
      date: string;
      label: string;
      tasks: number;
      files: number;
      auth: number;
      total: number;
    }> = [];

    for (let i = 29; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);

      const dayLogs = allHistoricalLogs.filter((l) => {
        const lDate = new Date(l.createdAt);
        return lDate >= dayStart && lDate <= dayEnd;
      });

      let tasksCount = 0;
      let filesCount = 0;
      let authCount = 0;

      for (const log of dayLogs) {
        const act = log.action;
        if (act.includes('TASK')) tasksCount++;
        else if (act.includes('FILE')) filesCount++;
        else if (act.includes('LOGIN') || act.includes('REGISTER') || act.includes('USER')) authCount++;
      }

      daily30ActivityTrend.push({
        date: dayStart.toISOString().split('T')[0],
        label: `${day.getDate()}/${day.getMonth() + 1}`,
        tasks: tasksCount,
        files: filesCount,
        auth: authCount,
        total: dayLogs.length,
      });
    }

    // 2. Monthly Trend (Past 12 Months)
    const monthlyActivityTrend: Array<{
      date: string;
      label: string;
      tasks: number;
      files: number;
      auth: number;
      total: number;
    }> = [];

    for (let i = 11; i >= 0; i--) {
      const mDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(mDate.getFullYear(), mDate.getMonth(), 1);
      const mEnd = new Date(mDate.getFullYear(), mDate.getMonth() + 1, 0, 23, 59, 59, 999);

      const mLogs = allHistoricalLogs.filter((l) => {
        const lDate = new Date(l.createdAt);
        return lDate >= mStart && lDate <= mEnd;
      });

      let tasksCount = 0;
      let filesCount = 0;
      let authCount = 0;

      for (const log of mLogs) {
        const act = log.action;
        if (act.includes('TASK')) tasksCount++;
        else if (act.includes('FILE')) filesCount++;
        else if (act.includes('LOGIN') || act.includes('REGISTER') || act.includes('USER')) authCount++;
      }

      monthlyActivityTrend.push({
        date: `${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, '0')}`,
        label: mDate.toLocaleDateString('en-US', { month: 'short' }),
        tasks: tasksCount,
        files: filesCount,
        auth: authCount,
        total: mLogs.length,
      });
    }

    // 3. Yearly Trend (Past 3 Years)
    const yearlyActivityTrend: Array<{
      date: string;
      label: string;
      tasks: number;
      files: number;
      auth: number;
      total: number;
    }> = [];

    const currentYear = now.getFullYear();
    for (let y = currentYear - 2; y <= currentYear; y++) {
      const yStart = new Date(y, 0, 1);
      const yEnd = new Date(y, 11, 31, 23, 59, 59, 999);

      const yLogs = allHistoricalLogs.filter((l) => {
        const lDate = new Date(l.createdAt);
        return lDate >= yStart && lDate <= yEnd;
      });

      let tasksCount = 0;
      let filesCount = 0;
      let authCount = 0;

      for (const log of yLogs) {
        const act = log.action;
        if (act.includes('TASK')) tasksCount++;
        else if (act.includes('FILE')) filesCount++;
        else if (act.includes('LOGIN') || act.includes('REGISTER') || act.includes('USER')) authCount++;
      }

      yearlyActivityTrend.push({
        date: String(y),
        label: String(y),
        tasks: tasksCount,
        files: filesCount,
        auth: authCount,
        total: yLogs.length,
      });
    }

    // Department Workload Distribution with Member details
    const deptMap: Map<
      string,
      {
        memberCount: number;
        taskCount: number;
        members: Array<{
          id: string;
          name: string;
          avatarUrl: string | null;
          position: string | null;
          role: string;
          status: string;
          assignedTasksCount: number;
        }>;
      }
    > = new Map();

    for (const u of allUsers) {
      const d = u.department || 'General';
      const curr = deptMap.get(d) || { memberCount: 0, taskCount: 0, members: [] };
      curr.memberCount++;
      const userTasksCount = allTasks.filter((t) =>
        t.assignees.some((a) => a.userId === u.id) || t.createdBy?.id === u.id
      ).length;
      curr.members.push({
        id: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        position: u.position,
        role: u.role,
        status: u.status,
        assignedTasksCount: userTasksCount,
      });
      deptMap.set(d, curr);
    }

    for (const t of allTasks) {
      const d = t.createdBy?.department || 'General';
      const curr = deptMap.get(d) || { memberCount: 0, taskCount: 0, members: [] };
      curr.taskCount++;
      deptMap.set(d, curr);
    }

    const departmentWorkload = Array.from(deptMap.entries()).map(([department, data]) => ({
      department,
      memberCount: data.memberCount,
      taskCount: data.taskCount,
      members: data.members,
    }));

    // Individual Member Workload Distribution
    const memberWorkload = allUsers.map((u) => {
      const userAssigned = allTasks.filter((t) =>
        t.assignees.some((a) => a.userId === u.id) || t.createdBy?.id === u.id
      );
      return {
        id: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        department: u.department || 'General',
        position: u.position || 'Member',
        role: u.role,
        status: u.status,
        totalTasks: userAssigned.length,
        todoTasks: userAssigned.filter((t) => t.status === 'TODO').length,
        inProgressTasks: userAssigned.filter((t) => t.status === 'IN_PROGRESS').length,
        inReviewTasks: userAssigned.filter((t) => t.status === 'IN_REVIEW').length,
        doneTasks: userAssigned.filter((t) => t.status === 'DONE').length,
      };
    });

    // Storage Category Breakdown
    const totalStorageBytes = fileSizeResult._sum.size || 0;
    const fileCategoryBreakdown = allFilesGrouped.map((g) => {
      const sizeBytes = g._sum.size || 0;
      return {
        category: g.category,
        count: g._count.id,
        sizeBytes,
        percentage: totalStorageBytes > 0 ? Math.round((sizeBytes / totalStorageBytes) * 100) : 0,
      };
    });

    return {
      stats: {
        totalMembers,
        onlineMembers,
        totalTasks,
        totalFiles,
        storageUsedBytes: totalStorageBytes,
        todayMessages: todayMessagesCount,
        unreadNotifications: unreadNotificationsCount,
      },
      taskAnalytics: {
        statusDistribution: taskStatusCounts,
        priorityDistribution: taskPriorityCounts,
        completionRate,
      },
      dailyActivityTrend,
      activityTrends: {
        '1d': hourly1dTrend,
        '7d': dailyActivityTrend,
        '1m': daily30ActivityTrend,
        '1y': monthlyActivityTrend,
        daily: dailyActivityTrend,
        daily30: daily30ActivityTrend,
        monthly: monthlyActivityTrend,
        yearly: yearlyActivityTrend,
      },
      departmentWorkload,
      memberWorkload,
      fileCategoryBreakdown,
      recentFiles,
      onlineUsers: onlineUsersList,
    };
  }

  static async getNotifications(userId: string) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return notifications;
  }

  static async markNotificationAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  static async markAllNotificationsAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

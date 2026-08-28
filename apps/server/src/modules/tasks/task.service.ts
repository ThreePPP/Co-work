import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/apiResponse.js';
import { TaskStatus, TaskPriority, NotificationType } from '../../types/enums.js';
import {
  CreateTaskInput,
  UpdateTaskInput,
  AssignMemberInput,
  CreateSubtaskInput,
  ToggleSubtaskInput,
  CreateTaskCommentInput,
} from './task.dto.js';

export interface TaskFilterOptions {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  createdById?: string;
  search?: string;
}

export class TaskService {
  static async listTasks(filter: TaskFilterOptions) {
    const where: any = {};

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.priority) {
      where.priority = filter.priority;
    }

    if (filter.createdById) {
      where.createdById = filter.createdById;
    }

    if (filter.assigneeId) {
      where.assignees = {
        some: {
          userId: filter.assigneeId,
        },
      };
    }

    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
        assignees: {
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
        },
        subtasks: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    return tasks;
  }

  static async getStats() {
    const now = new Date();

    const [total, todo, inProgress, inReview, done, overdue] = await Promise.all([
      prisma.task.count(),
      prisma.task.count({ where: { status: TaskStatus.TODO } }),
      prisma.task.count({ where: { status: TaskStatus.IN_PROGRESS } }),
      prisma.task.count({ where: { status: TaskStatus.IN_REVIEW } }),
      prisma.task.count({ where: { status: TaskStatus.DONE } }),
      prisma.task.count({
        where: {
          status: { not: TaskStatus.DONE },
          dueDate: { lt: now },
        },
      }),
    ]);

    return {
      total,
      todo,
      inProgress,
      inReview,
      done,
      overdue,
    };
  }

  static async getTaskById(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            position: true,
            department: true,
          },
        },
        assignees: {
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
          orderBy: { assignedAt: 'asc' },
        },
        subtasks: {
          orderBy: { order: 'asc' },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    return task;
  }

  static async createTask(creatorId: string, data: CreateTaskInput) {
    const task = await prisma.$transaction(async (tx: any) => {
      const newTask = await tx.task.create({
        data: {
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          createdById: creatorId,
          subtasks: {
            create: (data.subtasks || []).map((st: any, index: number) => ({
              title: st.title,
              isCompleted: st.isCompleted || false,
              order: index,
            })),
          },
        },
      });

      // Add Assignees
      if (data.assignees && data.assignees.length > 0) {
        await tx.taskAssignee.createMany({
          data: data.assignees.map((a: any) => ({
            taskId: newTask.id,
            userId: a.userId,
            role: a.role,
          })),
        });

        // Create Notifications for assignees
        const notifications = data.assignees
          .filter((a: any) => a.userId !== creatorId)
          .map((a: any) => ({
            userId: a.userId,
            title: 'New Task Assigned',
            message: `You were assigned as ${a.role} on task: "${newTask.title}"`,
            type: NotificationType.TASK_ASSIGNED,
            link: `/tasks?taskId=${newTask.id}`,
          }));

        if (notifications.length > 0) {
          await tx.notification.createMany({
            data: notifications,
          });
        }
      }

      // Log Activity
      await tx.activityLog.create({
        data: {
          userId: creatorId,
          action: 'CREATE_TASK',
          details: `Created task "${newTask.title}" with priority ${newTask.priority}`,
        },
      });

      return newTask;
    });

    return this.getTaskById(task.id);
  }

  static async updateTask(id: string, userId: string, data: UpdateTaskInput) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Task not found');
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

    await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id },
        data: updateData,
      });

      // Sync assignees if provided in Edit Task modal
      if (data.assignees !== undefined) {
        await tx.taskAssignee.deleteMany({ where: { taskId: id } });
        if (data.assignees.length > 0) {
          await tx.taskAssignee.createMany({
            data: data.assignees.map((a: any) => ({
              taskId: id,
              userId: a.userId,
              role: a.role,
            })),
          });
        }
      }

      await tx.activityLog.create({
        data: {
          userId,
          action: 'UPDATE_TASK',
          details: `Updated task details for "${existing.title}"`,
        },
      });
    });

    return this.getTaskById(id);
  }

  static async updateStatus(id: string, userId: string, status: TaskStatus) {
    const existing = await prisma.task.findUnique({
      where: { id },
      include: { assignees: true },
    });

    if (!existing) {
      throw ApiError.notFound('Task not found');
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { status },
    });

    // Notify creator & assignees if status changed to DONE
    if (status === TaskStatus.DONE && existing.status !== TaskStatus.DONE) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const recipients = new Set<string>([
        existing.createdById,
        ...existing.assignees.map((a: any) => a.userId),
      ]);
      recipients.delete(userId);

      if (recipients.size > 0) {
        await prisma.notification.createMany({
          data: Array.from(recipients).map((rId) => ({
            userId: rId,
            title: 'Task Completed 🎉',
            message: `${user?.name || 'A team member'} completed task: "${existing.title}"`,
            type: NotificationType.TASK_STATUS_CHANGED,
            link: `/tasks?taskId=${id}`,
          })),
        });
      }
    }

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'UPDATE_TASK_STATUS',
        details: `Changed task "${existing.title}" status from ${existing.status} to ${status}`,
      },
    });

    return this.getTaskById(id);
  }

  static async deleteTask(id: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignees: true },
    });

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isCreator = task.createdById === userId;
    const isAdmin = user?.role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      throw ApiError.forbidden('Only the task creator or an admin can delete this task');
    }

    await prisma.task.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'DELETE_TASK',
        details: `Deleted task "${task.title}"`,
      },
    });

    return { message: 'Task deleted successfully' };
  }

  static async assignMember(taskId: string, currentUserId: string, data: AssignMemberInput) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    const assignee = await prisma.taskAssignee.upsert({
      where: {
        taskId_userId: {
          taskId,
          userId: data.userId,
        },
      },
      update: {
        role: data.role,
      },
      create: {
        taskId,
        userId: data.userId,
        role: data.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            position: true,
            department: true,
          },
        },
      },
    });

    if (data.userId !== currentUserId) {
      await prisma.notification.create({
        data: {
          userId: data.userId,
          title: 'Task Assigned',
          message: `You were assigned as ${data.role} on task: "${task.title}"`,
          type: NotificationType.TASK_ASSIGNED,
          link: `/tasks?taskId=${taskId}`,
        },
      });
    }

    return assignee;
  }

  static async removeAssignee(taskId: string, targetUserId: string) {
    await prisma.taskAssignee.deleteMany({
      where: {
        taskId,
        userId: targetUserId,
      },
    });

    return { message: 'Assignee removed' };
  }

  static async addSubtask(taskId: string, data: CreateSubtaskInput) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    const lastSubtask = await prisma.subtask.findFirst({
      where: { taskId },
      orderBy: { order: 'desc' },
    });

    const newOrder = lastSubtask ? lastSubtask.order + 1 : 0;

    const subtask = await prisma.subtask.create({
      data: {
        taskId,
        title: data.title,
        order: newOrder,
        isCompleted: false,
      },
    });

    return subtask;
  }

  static async toggleSubtask(subtaskId: string, data: ToggleSubtaskInput) {
    const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId } });
    if (!subtask) {
      throw ApiError.notFound('Subtask not found');
    }

    const updated = await prisma.subtask.update({
      where: { id: subtaskId },
      data: { isCompleted: data.isCompleted },
    });

    return updated;
  }

  static async deleteSubtask(subtaskId: string) {
    await prisma.subtask.delete({ where: { id: subtaskId } });
    return { message: 'Subtask deleted' };
  }

  static async addComment(taskId: string, userId: string, data: CreateTaskCommentInput) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignees: true },
    });

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId,
        content: data.content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            position: true,
          },
        },
      },
    });

    // Notify other assignees
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const recipients = new Set<string>([
      task.createdById,
      ...task.assignees.map((a: any) => a.userId),
    ]);
    recipients.delete(userId);

    if (recipients.size > 0) {
      await prisma.notification.createMany({
        data: Array.from(recipients).map((rId) => ({
          userId: rId,
          title: 'New Comment on Task',
          message: `${currentUser?.name || 'A teammate'} commented on "${task.title}": "${data.content.slice(0, 50)}"`,
          type: NotificationType.TASK_COMMENT,
          link: `/tasks?taskId=${taskId}`,
        })),
      });
    }

    return comment;
  }

  static async updateComment(commentId: string, userId: string, data: { content: string }) {
    const comment = await prisma.taskComment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw ApiError.notFound('Comment not found');
    }
    if (comment.userId !== userId) {
      throw ApiError.forbidden('You can only edit your own comment');
    }

    const updated = await prisma.taskComment.update({
      where: { id: commentId },
      data: { content: data.content },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            position: true,
          },
        },
      },
    });

    return updated;
  }

  static async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.taskComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw ApiError.notFound('Comment not found');
    }
    if (comment.userId !== userId) {
      throw ApiError.forbidden('You can only delete your own comment');
    }

    await prisma.taskComment.delete({ where: { id: commentId } });
    return { message: 'Comment deleted successfully' };
  }
}

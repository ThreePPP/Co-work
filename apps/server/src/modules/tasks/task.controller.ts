import { Request, Response, NextFunction } from 'express';
import { TaskService } from './task.service.js';
import { sendCreated, sendSuccess } from '../../utils/apiResponse.js';
import { TaskStatus, TaskPriority } from '../../types/enums.js';
import { SSEService } from '../sse/sse.service.js';

export class TaskController {
  static async listTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, priority, assigneeId, createdById, search } = req.query;

      const tasks = await TaskService.listTasks({
        status: status as TaskStatus,
        priority: priority as TaskPriority,
        assigneeId: assigneeId as string,
        createdById: createdById as string,
        search: search as string,
      });

      return sendSuccess(res, tasks);
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await TaskService.getStats();
      return sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  static async getTaskById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const task = await TaskService.getTaskById(id);
      return sendSuccess(res, task);
    } catch (error) {
      next(error);
    }
  }

  static async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await TaskService.createTask(req.user!.id, req.body);
      SSEService.broadcast('task:created', task);
      return sendCreated(res, task, 'Task created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const task = await TaskService.updateTask(id, req.user!.id, req.body);
      SSEService.broadcast('task:updated', task);
      return sendSuccess(res, task, 'Task updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const task = await TaskService.updateStatus(id, req.user!.id, status as TaskStatus);
      SSEService.broadcast('task:status_changed', { taskId: id, status, task });
      return sendSuccess(res, task, 'Task status updated');
    } catch (error) {
      next(error);
    }
  }

  static async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await TaskService.deleteTask(id, req.user!.id);
      SSEService.broadcast('task:deleted', { taskId: id });
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async assignMember(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const assignee = await TaskService.assignMember(id, req.user!.id, req.body);
      const updatedTask = await TaskService.getTaskById(id);
      SSEService.broadcast('task:updated', updatedTask);
      return sendCreated(res, assignee, 'Member assigned to task');
    } catch (error) {
      next(error);
    }
  }

  static async removeAssignee(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.params.userId as string;
      const result = await TaskService.removeAssignee(id, userId);
      const updatedTask = await TaskService.getTaskById(id);
      SSEService.broadcast('task:updated', updatedTask);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async addSubtask(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const subtask = await TaskService.addSubtask(id, req.body);
      const updatedTask = await TaskService.getTaskById(id);
      SSEService.broadcast('task:updated', updatedTask);
      return sendCreated(res, subtask, 'Subtask added');
    } catch (error) {
      next(error);
    }
  }

  static async toggleSubtask(req: Request, res: Response, next: NextFunction) {
    try {
      const subtaskId = req.params.subtaskId as string;
      const subtask = await TaskService.toggleSubtask(subtaskId, req.body);
      return sendSuccess(res, subtask, 'Subtask status toggled');
    } catch (error) {
      next(error);
    }
  }

  static async deleteSubtask(req: Request, res: Response, next: NextFunction) {
    try {
      const subtaskId = req.params.subtaskId as string;
      const result = await TaskService.deleteSubtask(subtaskId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const comment = await TaskService.addComment(id, req.user!.id, req.body);
      SSEService.broadcast('task:comment_added', { taskId: id, comment });
      return sendCreated(res, comment, 'Comment posted');
    } catch (error) {
      next(error);
    }
  }

  static async updateComment(req: Request, res: Response, next: NextFunction) {
    try {
      const commentId = req.params.commentId as string;
      const comment = await TaskService.updateComment(commentId, req.user!.id, req.body);
      SSEService.broadcast('task:comment_updated', { commentId, comment });
      return sendSuccess(res, comment, 'Comment updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const commentId = req.params.commentId as string;
      const result = await TaskService.deleteComment(commentId, req.user!.id);
      SSEService.broadcast('task:comment_deleted', { commentId });
      return sendSuccess(res, result, 'Comment deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}


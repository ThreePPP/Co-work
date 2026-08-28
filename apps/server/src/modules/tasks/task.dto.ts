import { z } from 'zod';
import { TaskStatus, TaskPriority, TaskRole } from '../../types/enums.js';

export const TaskAssigneeInputSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum([
    TaskRole.LEAD,
    TaskRole.DEVELOPER,
    TaskRole.REVIEWER,
    TaskRole.DESIGNER,
    TaskRole.TESTER,
    TaskRole.ASSIGNEE,
  ]).default(TaskRole.ASSIGNEE),
});

export const SubtaskInputSchema = z.object({
  title: z.string().min(1, 'Subtask title is required').max(200),
  isCompleted: z.boolean().default(false),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(150),
  description: z.string().max(3000).optional(),
  status: z.enum([
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
    TaskStatus.IN_REVIEW,
    TaskStatus.DONE,
  ]).default(TaskStatus.TODO),
  priority: z.enum([
    TaskPriority.LOW,
    TaskPriority.MEDIUM,
    TaskPriority.HIGH,
    TaskPriority.URGENT,
  ]).default(TaskPriority.MEDIUM),
  dueDate: z.string().datetime().optional().nullable(),
  assignees: z.array(TaskAssigneeInputSchema).default([]),
  subtasks: z.array(SubtaskInputSchema).default([]),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  description: z.string().max(3000).optional().nullable(),
  status: z.enum([
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
    TaskStatus.IN_REVIEW,
    TaskStatus.DONE,
  ]).optional(),
  priority: z.enum([
    TaskPriority.LOW,
    TaskPriority.MEDIUM,
    TaskPriority.HIGH,
    TaskPriority.URGENT,
  ]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assignees: z.array(TaskAssigneeInputSchema).optional(),
  subtasks: z.array(SubtaskInputSchema).optional(),
});

export const UpdateTaskStatusSchema = z.object({
  status: z.enum([
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
    TaskStatus.IN_REVIEW,
    TaskStatus.DONE,
  ]),
});

export const AssignMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum([
    TaskRole.LEAD,
    TaskRole.DEVELOPER,
    TaskRole.REVIEWER,
    TaskRole.DESIGNER,
    TaskRole.TESTER,
    TaskRole.ASSIGNEE,
  ]).default(TaskRole.ASSIGNEE),
});

export const CreateSubtaskSchema = z.object({
  title: z.string().min(1, 'Subtask title is required').max(200),
});

export const ToggleSubtaskSchema = z.object({
  isCompleted: z.boolean(),
});

export const CreateTaskCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000),
});

export const UpdateTaskCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof UpdateTaskStatusSchema>;
export type AssignMemberInput = z.infer<typeof AssignMemberSchema>;
export type CreateSubtaskInput = z.infer<typeof CreateSubtaskSchema>;
export type ToggleSubtaskInput = z.infer<typeof ToggleSubtaskSchema>;
export type CreateTaskCommentInput = z.infer<typeof CreateTaskCommentSchema>;
export type UpdateTaskCommentInput = z.infer<typeof UpdateTaskCommentSchema>;

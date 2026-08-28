import { Router } from 'express';
import { TaskController } from './task.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  UpdateTaskStatusSchema,
  AssignMemberSchema,
  CreateSubtaskSchema,
  ToggleSubtaskSchema,
  CreateTaskCommentSchema,
  UpdateTaskCommentSchema,
} from './task.dto.js';

const router = Router();

router.use(authenticate);

// List & Stats
router.get('/', TaskController.listTasks);
router.get('/stats', TaskController.getStats);
router.post('/', validate(CreateTaskSchema), TaskController.createTask);

// Task Detail & Modification
router.get('/:id', TaskController.getTaskById);
router.patch('/:id', validate(UpdateTaskSchema), TaskController.updateTask);
router.patch('/:id/status', validate(UpdateTaskStatusSchema), TaskController.updateStatus);
router.delete('/:id', TaskController.deleteTask);

// Assignees
router.post('/:id/assignees', validate(AssignMemberSchema), TaskController.assignMember);
router.delete('/:id/assignees/:userId', TaskController.removeAssignee);

// Subtasks
router.post('/:id/subtasks', validate(CreateSubtaskSchema), TaskController.addSubtask);
router.patch('/subtasks/:subtaskId', validate(ToggleSubtaskSchema), TaskController.toggleSubtask);
router.delete('/subtasks/:subtaskId', TaskController.deleteSubtask);

// Comments
router.post('/:id/comments', validate(CreateTaskCommentSchema), TaskController.addComment);
router.patch('/comments/:commentId', validate(UpdateTaskCommentSchema), TaskController.updateComment);
router.delete('/comments/:commentId', TaskController.deleteComment);

export default router;

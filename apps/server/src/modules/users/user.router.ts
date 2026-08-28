import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { Role } from '../../types/enums.js';

import { uploadAvatar } from '../../middleware/upload.middleware.js';

const router = Router();

router.use(authenticate);

// Dedicated private avatar upload (stored in uploads/avatars)
router.post('/avatar', uploadAvatar.single('file'), UserController.uploadAvatar);

// User listing and departments lookup for workspace members (DM, task assignment, etc.)
router.get('/', UserController.listUsers);
router.get('/departments', UserController.getDepartments);

// Individual profile query
router.get('/:id', UserController.getUserById);
router.patch('/:id', requireRole([Role.ADMIN, Role.MANAGER]), UserController.updateUser);
router.delete('/:id', requireRole([Role.ADMIN]), UserController.deleteUser);

export default router;

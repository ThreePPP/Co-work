import { Router } from 'express';
import { MessageController } from './message.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  SendDirectMessageSchema,
  EditMessageSchema,
} from './message.dto.js';

const router = Router();

router.use(authenticate);

router.get('/conversations', MessageController.getConversations);
router.get('/dm/:userId', MessageController.getDirectMessages);
router.post('/dm', validate(SendDirectMessageSchema), MessageController.sendDirectMessage);
router.patch('/:id/pin', MessageController.togglePin);
router.post('/:id/reactions', MessageController.toggleReaction);
router.patch('/:id', validate(EditMessageSchema), MessageController.editMessage);
router.delete('/:id', MessageController.deleteMessage);

export default router;

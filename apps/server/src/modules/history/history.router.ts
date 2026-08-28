import { Router } from 'express';
import { HistoryController } from './history.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Protect all history routes with authentication
router.use(authenticate);

// History routes
router.get('/', HistoryController.listHistory);
router.get('/stats', HistoryController.getStats);
router.get('/export', HistoryController.exportHistory);
router.get('/:id', HistoryController.getHistoryById);
router.delete('/prune', HistoryController.pruneHistory);

export default router;

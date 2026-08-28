import { Router, Request, Response, NextFunction } from 'express';
import { SSEController } from './sse.controller.js';
import { verifyToken } from '../../utils/jwt.utils.js';
import { ApiError } from '../../utils/apiResponse.js';
import { Role } from '../../types/enums.js';
import { requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

/**
 * Flexible Authenticate middleware supporting both Authorization Header and ?token= query parameter (for EventSource)
 */
const authenticateSSE = (req: Request, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return next(ApiError.unauthorized('Authentication token is required for SSE connection'));
  }

  const user = verifyToken(token);
  if (!user) {
    return next(ApiError.unauthorized('Invalid or expired authentication token'));
  }

  req.user = user;
  next();
};

// Stream endpoint: GET /api/sse/stream
router.get('/stream', authenticateSSE, SSEController.stream);

// Diagnostic stats: GET /api/sse/stats (Admin only)
router.get('/stats', authenticateSSE, requireRole([Role.ADMIN]), SSEController.getStats);

export default router;

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { SSEService } from './sse.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class SSEController {
  /**
   * Main SSE Stream Endpoint: GET /api/sse/stream
   */
  static async stream(req: Request, res: Response, _next: NextFunction) {
    const user = req.user!;
    const userId = user.id;
    const clientId = (req.query.clientId as string) || randomUUID();

    // Set mandatory SSE response headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx proxy buffering

    // Flush headers to establish stream immediately
    res.flushHeaders();

    // Register this client connection
    await SSEService.addClient(userId, clientId, res, user);

    // Clean up when client closes connection or navigates away
    req.on('close', () => {
      SSEService.removeClient(userId, clientId);
    });
  }

  /**
   * Diagnostic Stats Endpoint: GET /api/sse/stats
   */
  static getStats(_req: Request, res: Response) {
    const stats = SSEService.getStats();
    return sendSuccess(res, stats, 'SSE server statistics retrieved');
  }
}

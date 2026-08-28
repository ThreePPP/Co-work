import { Request, Response, NextFunction } from 'express';
import { HistoryService } from './history.service.js';
import { HistoryQuerySchema, PruneHistorySchema } from './history.dto.js';
import { sendSuccess, ApiError } from '../../utils/apiResponse.js';

export class HistoryController {
  static async listHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = HistoryQuerySchema.parse(req.query);
      const result = await HistoryService.listHistory(validatedQuery);
      return sendSuccess(res, result, 'Activity history retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await HistoryService.getStats();
      return sendSuccess(res, stats, 'Activity stats retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getHistoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const log = await HistoryService.getHistoryById(id);
      return sendSuccess(res, log, 'Activity log retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async exportHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = HistoryQuerySchema.parse(req.query);
      const format = (req.query.format as string) || 'json';
      const records = await HistoryService.exportHistory(validatedQuery);

      if (format.toLowerCase() === 'csv') {
        const headers = ['ID', 'Timestamp', 'User Name', 'User Email', 'Role', 'Department', 'Action', 'Details', 'IP Address'];
        const csvRows = [
          headers.join(','),
          ...records.map((r) =>
            [
              `"${r.id}"`,
              `"${new Date(r.timestamp).toISOString()}"`,
              `"${(r.userName || '').replace(/"/g, '""')}"`,
              `"${(r.userEmail || '').replace(/"/g, '""')}"`,
              `"${r.userRole || ''}"`,
              `"${(r.userDepartment || '').replace(/"/g, '""')}"`,
              `"${r.action}"`,
              `"${(r.details || '').replace(/"/g, '""')}"`,
              `"${r.ipAddress}"`,
            ].join(',')
          ),
        ];

        const csvContent = csvRows.join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="cowork-activity-audit.csv"');
        return res.status(200).send(csvContent);
      }

      return sendSuccess(res, records, 'History exported successfully');
    } catch (err) {
      next(err);
    }
  }

  static async pruneHistory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      if (req.user.role !== 'ADMIN') {
        throw ApiError.forbidden('Only system administrators can prune activity logs');
      }

      const validated = PruneHistorySchema.parse(req.body);
      const result = await HistoryService.pruneHistory(validated.days, req.user.id);
      return sendSuccess(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }
}

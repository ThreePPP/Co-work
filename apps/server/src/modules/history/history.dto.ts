import { z } from 'zod';

export const HistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z
    .enum(['ALL', 'TASKS', 'FILES', 'AUTH', 'USERS', 'MESSAGES'])
    .default('ALL'),
  action: z.string().optional(),
  userId: z.string().uuid().optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type HistoryQueryInput = z.infer<typeof HistoryQuerySchema>;

export const PruneHistorySchema = z.object({
  days: z.coerce.number().int().min(7).max(365).default(90),
});

export type PruneHistoryInput = z.infer<typeof PruneHistorySchema>;

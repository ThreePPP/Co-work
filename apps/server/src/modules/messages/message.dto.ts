import { z } from 'zod';
import { MessageType } from '../../types/enums.js';

export const SendDirectMessageSchema = z.object({
  receiverId: z.string().uuid('Invalid receiver ID'),
  content: z.string().min(1, 'Message content cannot be empty'),
  type: z.enum(['TEXT', 'IMAGE', 'FILE', 'SYSTEM']).optional().default('TEXT'),
  attachmentIds: z.array(z.string()).optional(),
});

export const EditMessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty'),
});

export type SendDirectMessageInput = z.infer<typeof SendDirectMessageSchema>;
export type EditMessageInput = z.infer<typeof EditMessageSchema>;

export const Role = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const UserStatus = {
  ONLINE: 'ONLINE',
  AWAY: 'AWAY',
  BUSY: 'BUSY',
  OFFLINE: 'OFFLINE',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const MessageType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  FILE: 'FILE',
  SYSTEM: 'SYSTEM',
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export const NotificationType = {
  MESSAGE: 'MESSAGE',
  FILE_UPLOAD: 'FILE_UPLOAD',
  SYSTEM: 'SYSTEM',
  MENTION: 'MENTION',
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_STATUS_CHANGED: 'TASK_STATUS_CHANGED',
  TASK_COMMENT: 'TASK_COMMENT',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const FileCategory = {
  IMAGE: 'IMAGE',
  DOCUMENT: 'DOCUMENT',
  AUDIO: 'AUDIO',
  VIDEO: 'VIDEO',
  ARCHIVE: 'ARCHIVE',
  OTHER: 'OTHER',
} as const;
export type FileCategory = (typeof FileCategory)[keyof typeof FileCategory];

export const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  IN_REVIEW: 'IN_REVIEW',
  DONE: 'DONE',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TaskRole = {
  LEAD: 'LEAD',
  DEVELOPER: 'DEVELOPER',
  REVIEWER: 'REVIEWER',
  DESIGNER: 'DESIGNER',
  TESTER: 'TESTER',
  ASSIGNEE: 'ASSIGNEE',
} as const;
export type TaskRole = (typeof TaskRole)[keyof typeof TaskRole];

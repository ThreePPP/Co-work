export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER';
export type UserStatus = 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
export type FileCategory = 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'VIDEO' | 'ARCHIVE' | 'OTHER';
export type NotificationType =
  | 'MESSAGE'
  | 'FILE_UPLOAD'
  | 'SYSTEM'
  | 'MENTION'
  | 'TASK_ASSIGNED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_COMMENT';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskRole = 'LEAD' | 'DEVELOPER' | 'REVIEWER' | 'DESIGNER' | 'TESTER' | 'ASSIGNEE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string | null;
  position?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  status: UserStatus;
  isSuspended?: boolean;
  suspendedReason?: string | null;
  createdAt: string;
}

export interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  category: FileCategory;
  uploaderId: string;
  uploader?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  messageId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  isEdited: boolean;
  isPinned: boolean;
  senderId: string;
  sender: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    role?: UserRole;
    position?: string | null;
    department?: string | null;
  };
  receiverId?: string | null;
  attachments?: FileItem[];
  reactions?: MessageReaction[];
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId?: string | null;
  user?: {
    id?: string;
    name?: string;
    avatarUrl?: string | null;
    role?: UserRole;
    department?: string | null;
    isArchived?: boolean;
    snapshot?: any;
  };
  action: string;
  details?: string | null;
  createdAt: string;
}

export interface DashboardSummary {
  stats: {
    totalMembers: number;
    onlineMembers: number;
    totalTasks: number;
    totalFiles: number;
    storageUsedBytes: number;
    todayMessages: number;
    unreadNotifications: number;
  };
  taskAnalytics?: {
    statusDistribution: {
      TODO: number;
      IN_PROGRESS: number;
      IN_REVIEW: number;
      DONE: number;
    };
    priorityDistribution: {
      LOW: number;
      MEDIUM: number;
      HIGH: number;
      URGENT: number;
    };
    completionRate: number;
  };
  dailyActivityTrend?: Array<{
    date: string;
    label: string;
    tasks: number;
    files: number;
    auth: number;
    total: number;
  }>;
  activityTrends?: {
    '1d'?: Array<{
      date: string;
      label: string;
      tasks: number;
      files: number;
      auth: number;
      total: number;
    }>;
    '7d'?: Array<{
      date: string;
      label: string;
      tasks: number;
      files: number;
      auth: number;
      total: number;
    }>;
    '1m'?: Array<{
      date: string;
      label: string;
      tasks: number;
      files: number;
      auth: number;
      total: number;
    }>;
    '1y'?: Array<{
      date: string;
      label: string;
      tasks: number;
      files: number;
      auth: number;
      total: number;
    }>;
    daily: Array<{
      date: string;
      label: string;
      tasks: number;
      files: number;
      auth: number;
      total: number;
    }>;
    daily30?: Array<{
      date: string;
      label: string;
      tasks: number;
      files: number;
      auth: number;
      total: number;
    }>;
    monthly: Array<{
      date: string;
      label: string;
      tasks: number;
      files: number;
      auth: number;
      total: number;
    }>;
    yearly: Array<{
      date: string;
      label: string;
      tasks: number;
      files: number;
      auth: number;
      total: number;
    }>;
  };
  departmentWorkload?: Array<{
    department: string;
    memberCount: number;
    taskCount: number;
    members?: Array<{
      id: string;
      name: string;
      avatarUrl: string | null;
      position: string | null;
      role: string;
      status: string;
      assignedTasksCount: number;
    }>;
  }>;
  memberWorkload?: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
    department: string;
    position: string;
    role: string;
    status: string;
    totalTasks: number;
    todoTasks: number;
    inProgressTasks: number;
    inReviewTasks: number;
    doneTasks: number;
  }>;
  fileCategoryBreakdown?: Array<{
    category: string;
    count: number;
    sizeBytes: number;
    percentage: number;
  }>;
  recentFiles: FileItem[];
  onlineUsers: User[];
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  role: TaskRole | string;
  assignedAt: string;
  user: User;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  order: number;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    role?: UserRole;
    position?: string | null;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    role?: UserRole;
    position?: string | null;
    department?: string | null;
  };
  assignees: TaskAssignee[];
  subtasks: Subtask[];
  comments?: TaskComment[];
  _count?: {
    comments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  inReview: number;
  done: number;
  overdue: number;
}

export type HistoryCategory = 'ALL' | 'TASKS' | 'FILES' | 'AUTH' | 'USERS' | 'MESSAGES' | 'OTHER';

export interface HistoryLogItem {
  id: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  userDepartment?: string | null;
  userPosition?: string | null;
  userAvatar?: string | null;
  action: string;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    role?: UserRole;
    department?: string | null;
    position?: string | null;
    isArchived?: boolean;
  };
}

export interface HistoryStats {
  total: number;
  todayCount: number;
  past7DaysCount: number;
  categoryCounts: Record<string, number>;
  topActiveUsers: Array<{
    user: {
      id: string;
      name: string;
      avatarUrl?: string | null;
      department?: string | null;
    };
    count: number;
  }>;
  dailyTrend: Array<{
    date: string;
    label: string;
    count: number;
  }>;
}

export interface HistoryPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface HistoryListResponse {
  items: HistoryLogItem[];
  pagination: HistoryPagination;
}

export interface HistoryFilterState {
  category: HistoryCategory;
  search: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  dateRangePreset: 'all' | 'today' | '7d' | '30d';
  page: number;
  limit: number;
  sortOrder: 'asc' | 'desc';
}

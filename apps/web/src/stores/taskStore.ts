import { create } from 'zustand';
import { Task, TaskStats, TaskStatus, TaskPriority, TaskComment, Subtask, TaskAssignee } from '../types';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

interface TaskState {
  tasks: Task[];
  stats: TaskStats | null;
  activeTask: Task | null;
  isLoading: boolean;
  viewMode: 'kanban' | 'list' | 'calendar' | 'timeline';
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
  assigneeFilter: string;

  fetchTasks: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchTaskById: (id: string) => Promise<Task | null>;
  createTask: (data: any) => Promise<Task>;
  updateTask: (id: string, data: any) => Promise<Task>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  assignMember: (taskId: string, userId: string, role: string) => Promise<void>;
  removeAssignee: (taskId: string, userId: string) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (subtaskId: string, isCompleted: boolean) => Promise<void>;
  deleteSubtask: (subtaskId: string) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<void>;
  updateComment: (taskId: string, commentId: string, content: string) => Promise<void>;
  deleteComment: (taskId: string, commentId: string) => Promise<void>;
  
  setViewMode: (mode: 'kanban' | 'list' | 'calendar' | 'timeline') => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: string) => void;
  setPriorityFilter: (priority: string) => void;
  setAssigneeFilter: (assigneeId: string) => void;
  setActiveTask: (task: Task | null) => void;

  // Real-time Event Handlers
  onTaskCreated: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
  onTaskStatusChanged: (data: { taskId: string; status: TaskStatus; task?: Task }) => void;
  onTaskDeleted: (data: { taskId: string }) => void;
  onTaskCommentAdded: (data: { taskId: string; comment: TaskComment }) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  stats: null,
  activeTask: null,
  isLoading: false,
  viewMode: 'kanban',
  searchQuery: '',
  statusFilter: 'ALL',
  priorityFilter: 'ALL',
  assigneeFilter: 'ALL',

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const { statusFilter, priorityFilter, assigneeFilter, searchQuery } = get();
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (assigneeFilter !== 'ALL') params.assigneeId = assigneeFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res: any = await api.get('/tasks', { params });
      if (res?.data) {
        set({ tasks: res.data });
      }
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const res: any = await api.get('/tasks/stats');
      if (res?.data) {
        set({ stats: res.data });
      }
    } catch (err) {
      console.error('Failed to fetch task stats', err);
    }
  },

  fetchTaskById: async (id: string) => {
    try {
      const res: any = await api.get(`/tasks/${id}`);
      if (res?.data) {
        set({ activeTask: res.data });
        return res.data;
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch task detail', err);
      return null;
    }
  },

  createTask: async (data: any) => {
    const socket = getSocket();
    const res: any = await api.post('/tasks', data);
    const newTask: Task = res.data;

    // Add to local state
    set((state) => ({
      tasks: [newTask, ...state.tasks],
    }));

    // Refresh stats
    get().fetchStats();

    // Broadcast via socket
    if (socket) {
      socket.emit('task:created', newTask);
    }

    return newTask;
  },

  updateTask: async (id: string, data: any) => {
    const socket = getSocket();
    const res: any = await api.patch(`/tasks/${id}`, data);
    const updatedTask: Task = res.data;

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
      activeTask: state.activeTask?.id === id ? updatedTask : state.activeTask,
    }));

    get().fetchStats();

    if (socket) {
      socket.emit('task:updated', updatedTask);
    }

    return updatedTask;
  },

  updateTaskStatus: async (id: string, status: TaskStatus) => {
    const socket = getSocket();
    const prevTasks = get().tasks;
    
    // Optimistic UI Update
    set({
      tasks: prevTasks.map((t) => (t.id === id ? { ...t, status } : t)),
      activeTask: get().activeTask?.id === id ? { ...get().activeTask!, status } : get().activeTask,
    });

    try {
      const res: any = await api.patch(`/tasks/${id}/status`, { status });
      const updatedTask: Task = res.data;

      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
        activeTask: state.activeTask?.id === id ? updatedTask : state.activeTask,
      }));

      get().fetchStats();

      if (socket) {
        socket.emit('task:status_changed', { taskId: id, status, task: updatedTask });
      }
    } catch (err) {
      // Revert if error
      set({ tasks: prevTasks });
      console.error('Failed to update task status', err);
    }
  },

  deleteTask: async (id: string) => {
    const socket = getSocket();
    
    // Optimistic delete
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      activeTask: state.activeTask?.id === id ? null : state.activeTask,
    }));

    try {
      await api.delete(`/tasks/${id}`);
      get().fetchStats();

      if (socket) {
        socket.emit('task:deleted', { taskId: id });
      }
    } catch (err) {
      console.error('Failed to delete task', err);
      get().fetchTasks();
    }
  },

  assignMember: async (taskId: string, userId: string, role: string) => {
    const res: any = await api.post(`/tasks/${taskId}/assignees`, { userId, role });
    const newAssignee: TaskAssignee = res.data;

    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id === taskId) {
          const exists = t.assignees.some((a) => a.userId === userId);
          const updatedAssignees = exists
            ? t.assignees.map((a) => (a.userId === userId ? newAssignee : a))
            : [...t.assignees, newAssignee];
          return { ...t, assignees: updatedAssignees };
        }
        return t;
      }),
      activeTask: state.activeTask?.id === taskId
        ? {
            ...state.activeTask,
            assignees: state.activeTask.assignees.some((a) => a.userId === userId)
              ? state.activeTask.assignees.map((a) => (a.userId === userId ? newAssignee : a))
              : [...state.activeTask.assignees, newAssignee],
          }
        : state.activeTask,
    }));
  },

  removeAssignee: async (taskId: string, userId: string) => {
    await api.delete(`/tasks/${taskId}/assignees/${userId}`);

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, assignees: t.assignees.filter((a) => a.userId !== userId) }
          : t
      ),
      activeTask: state.activeTask?.id === taskId
        ? { ...state.activeTask, assignees: state.activeTask.assignees.filter((a) => a.userId !== userId) }
        : state.activeTask,
    }));
  },

  addSubtask: async (taskId: string, title: string) => {
    const res: any = await api.post(`/tasks/${taskId}/subtasks`, { title });
    const newSubtask: Subtask = res.data;

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, subtasks: [...t.subtasks, newSubtask] } : t
      ),
      activeTask: state.activeTask?.id === taskId
        ? { ...state.activeTask, subtasks: [...state.activeTask.subtasks, newSubtask] }
        : state.activeTask,
    }));
  },

  toggleSubtask: async (subtaskId: string, isCompleted: boolean) => {
    // Optimistic toggle
    set((state) => ({
      tasks: state.tasks.map((t) => ({
        ...t,
        subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, isCompleted } : st)),
      })),
      activeTask: state.activeTask
        ? {
            ...state.activeTask,
            subtasks: state.activeTask.subtasks.map((st) =>
              st.id === subtaskId ? { ...st, isCompleted } : st
            ),
          }
        : state.activeTask,
    }));

    try {
      await api.patch(`/tasks/subtasks/${subtaskId}`, { isCompleted });
    } catch (err) {
      console.error('Failed to toggle subtask', err);
    }
  },

  deleteSubtask: async (subtaskId: string) => {
    set((state) => ({
      tasks: state.tasks.map((t) => ({
        ...t,
        subtasks: t.subtasks.filter((st) => st.id !== subtaskId),
      })),
      activeTask: state.activeTask
        ? {
            ...state.activeTask,
            subtasks: state.activeTask.subtasks.filter((st) => st.id !== subtaskId),
          }
        : state.activeTask,
    }));

    try {
      await api.delete(`/tasks/subtasks/${subtaskId}`);
    } catch (err) {
      console.error('Failed to delete subtask', err);
    }
  },

  addComment: async (taskId: string, content: string) => {
    const socket = getSocket();
    const res: any = await api.post(`/tasks/${taskId}/comments`, { content });
    const newComment: TaskComment = res.data;

    set((state) => ({
      activeTask: state.activeTask?.id === taskId
        ? {
            ...state.activeTask,
            comments: [...(state.activeTask.comments || []), newComment],
            _count: {
              comments: (state.activeTask._count?.comments || 0) + 1,
            },
          }
        : state.activeTask,
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, _count: { comments: (t._count?.comments || 0) + 1 } }
          : t
      ),
    }));

    if (socket) {
      socket.emit('task:comment_added', { taskId, comment: newComment });
    }
  },

  updateComment: async (taskId: string, commentId: string, content: string) => {
    const res: any = await api.patch(`/tasks/comments/${commentId}`, { content });
    const updatedComment: TaskComment = res.data;

    set((state) => ({
      activeTask: state.activeTask?.id === taskId
        ? {
            ...state.activeTask,
            comments: state.activeTask.comments?.map((c) =>
              c.id === commentId ? updatedComment : c
            ),
          }
        : state.activeTask,
    }));
  },

  deleteComment: async (taskId: string, commentId: string) => {
    await api.delete(`/tasks/comments/${commentId}`);

    set((state) => ({
      activeTask: state.activeTask?.id === taskId
        ? {
            ...state.activeTask,
            comments: state.activeTask.comments?.filter((c) => c.id !== commentId),
            _count: {
              comments: Math.max(0, (state.activeTask._count?.comments || 1) - 1),
            },
          }
        : state.activeTask,
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, _count: { comments: Math.max(0, (t._count?.comments || 1) - 1) } }
          : t
      ),
    }));
  },

  setViewMode: (viewMode) => set({ viewMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setPriorityFilter: (priorityFilter) => set({ priorityFilter }),
  setAssigneeFilter: (assigneeFilter) => set({ assigneeFilter }),
  setActiveTask: (activeTask) => set({ activeTask }),

  // Real-time Event Handlers
  onTaskCreated: (newTask: Task) => {
    set((state) => {
      if (state.tasks.some((t) => t.id === newTask.id)) return state;
      return { tasks: [newTask, ...state.tasks] };
    });
    get().fetchStats();
  },

  onTaskUpdated: (updatedTask: Task) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      activeTask: state.activeTask?.id === updatedTask.id ? updatedTask : state.activeTask,
    }));
    get().fetchStats();
  },

  onTaskStatusChanged: ({ taskId, status, task }) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? (task ? task : { ...t, status }) : t
      ),
      activeTask: state.activeTask?.id === taskId
        ? (task ? task : { ...state.activeTask, status })
        : state.activeTask,
    }));
    get().fetchStats();
  },

  onTaskDeleted: ({ taskId }) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      activeTask: state.activeTask?.id === taskId ? null : state.activeTask,
    }));
    get().fetchStats();
  },

  onTaskCommentAdded: ({ taskId, comment }) => {
    set((state) => ({
      activeTask: state.activeTask?.id === taskId
        ? {
            ...state.activeTask,
            comments: state.activeTask.comments?.some((c) => c.id === comment.id)
              ? state.activeTask.comments
              : [...(state.activeTask.comments || []), comment],
          }
        : state.activeTask,
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, _count: { comments: (t._count?.comments || 0) + 1 } }
          : t
      ),
    }));
  },
}));

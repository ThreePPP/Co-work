'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Task, TaskPriority, TaskStatus, TaskRole, User } from '../../types';
import { useTaskStore } from '../../stores/taskStore';
import { api } from '../../lib/api';
import { Avatar } from '../ui/Avatar';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Users,
  CheckSquare,
  AlertCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: Task | null;
}

const AVAILABLE_ROLES: TaskRole[] = [
  'LEAD',
  'DEVELOPER',
  'DESIGNER',
  'TESTER',
  'REVIEWER',
  'ASSIGNEE',
];

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, initialTask }) => {
  const [mounted, setMounted] = useState(false);
  const { createTask, updateTask } = useTaskStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');

  // Assignees list: array of { userId: string, role: string, user?: User }
  const [selectedAssignees, setSelectedAssignees] = useState<
    Array<{ userId: string; role: string; user?: User }>
  >([]);

  // Subtasks list: array of { title: string, isCompleted: boolean }
  const [subtasks, setSubtasks] = useState<Array<{ title: string; isCompleted: boolean }>>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Available users for assignees dropdown
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState('');
  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState<TaskRole>('ASSIGNEE');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch users list for assignee picker
      api.get('/users?limit=100').then((res: any) => {
        if (res?.data?.users) {
          setAvailableUsers(res.data.users);
        }
      }).catch(console.error);

      if (initialTask) {
        setTitle(initialTask.title);
        setDescription(initialTask.description || '');
        setStatus(initialTask.status);
        setPriority(initialTask.priority);
        setDueDate(
          initialTask.dueDate
            ? new Date(initialTask.dueDate).toISOString().slice(0, 10)
            : ''
        );
        setSelectedAssignees(
          initialTask.assignees.map((a) => ({
            userId: a.userId,
            role: a.role,
            user: a.user,
          }))
        );
        setSubtasks(
          initialTask.subtasks.map((st) => ({
            title: st.title,
            isCompleted: st.isCompleted,
          }))
        );
      } else {
        // Reset form for create
        setTitle('');
        setDescription('');
        setStatus('TODO');
        setPriority('MEDIUM');
        setDueDate('');
        setSelectedAssignees([]);
        setSubtasks([]);
        setNewSubtaskTitle('');
      }
      setError(null);
    }
  }, [isOpen, initialTask]);

  if (!isOpen || !mounted) return null;

  const handleAddAssignee = () => {
    if (!selectedUserIdToAdd) return;
    if (selectedAssignees.some((a) => a.userId === selectedUserIdToAdd)) {
      // Update role if already in list
      setSelectedAssignees((prev) =>
        prev.map((a) =>
          a.userId === selectedUserIdToAdd ? { ...a, role: selectedRoleToAdd } : a
        )
      );
    } else {
      const userObj = availableUsers.find((u) => u.id === selectedUserIdToAdd);
      setSelectedAssignees((prev) => [
        ...prev,
        { userId: selectedUserIdToAdd, role: selectedRoleToAdd, user: userObj },
      ]);
    }
    setSelectedUserIdToAdd('');
  };

  const handleRemoveAssignee = (userId: string) => {
    setSelectedAssignees((prev) => prev.filter((a) => a.userId !== userId));
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((prev) => [...prev, { title: newSubtaskTitle.trim(), isCompleted: false }]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        assignees: selectedAssignees.map((a) => ({
          userId: a.userId,
          role: a.role,
        })),
        subtasks,
      };

      if (initialTask) {
        await updateTask(initialTask.id, payload);
      } else {
        await createTask(payload);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialTask ? 'Edit Task' : 'Create New Task'}
              </h3>
              <p className="text-xs text-slate-400">
                {initialTask ? 'Update task details and assignments' : 'Assign roles and define deliverables'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement OAuth login and Google SSO flow"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Description & Specifications
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, acceptance criteria, or technical details..."
              rows={3}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Status, Priority & Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent 🚨</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Team Assignment & Role Specification */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Team Members & Role Responsibilities
            </label>

            {/* Add Assignee Inputs */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <select
                value={selectedUserIdToAdd}
                onChange={(e) => setSelectedUserIdToAdd(e.target.value)}
                className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select a team member to assign...</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.position || u.department || u.role})
                  </option>
                ))}
              </select>

              <select
                value={selectedRoleToAdd}
                onChange={(e) => setSelectedRoleToAdd(e.target.value as TaskRole)}
                className="w-full sm:w-40 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {AVAILABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    Role: {r}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAddAssignee}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors flex-shrink-0"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {/* List of Selected Assignees */}
            {selectedAssignees.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {selectedAssignees.map((assignee) => {
                  const u = assignee.user || availableUsers.find((x) => x.id === assignee.userId);
                  return (
                    <div
                      key={assignee.userId}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/60"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={u?.name || 'User'} src={u?.avatarUrl} size="xs" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{u?.name || 'Team Member'}</p>
                          <span className="text-[9px] font-bold uppercase text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                            {assignee.role}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveAssignee(assignee.userId)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700/50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subtasks / Checklist Builder */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              Subtasks & Deliverables Checklist
            </label>

            {/* Subtask Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add a checklist item (e.g. Write unit tests)..."
                className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="inline-flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {/* Subtasks list */}
            {subtasks.length > 0 && (
              <div className="space-y-1.5 mt-2 max-h-40 overflow-y-auto">
                {subtasks.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-200"
                  >
                    <span className="truncate flex-1">• {st.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{initialTask ? 'Save Changes' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

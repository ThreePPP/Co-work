'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTaskStore } from '../../../../stores/taskStore';
import { useAuthStore } from '../../../../stores/authStore';
import { api } from '../../../../lib/api';
import { TaskStatus, TaskPriority, TaskRole, User } from '../../../../types';
import { TaskModal } from '../../../../components/tasks/TaskModal';
import { TaskSubtasks } from '../../../../components/tasks/TaskSubtasks';
import { TaskComments } from '../../../../components/tasks/TaskComments';
import { TaskAssignees } from '../../../../components/tasks/TaskAssignees';
import { ConfirmModal } from '../../../../components/ui/ConfirmModal';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  AlignLeft,
  Loader2,
} from 'lucide-react';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params?.id as string;

  const { user: currentUser } = useAuthStore();
  const {
    activeTask,
    fetchTaskById,
    updateTaskStatus,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addComment,
    updateComment,
    deleteComment,
    assignMember,
    removeAssignee,
  } = useTaskStore();

  const [isLoading, setIsLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (taskId) {
      setIsLoading(true);
      fetchTaskById(taskId).finally(() => setIsLoading(false));

      api
        .get('/users?limit=100')
        .then((res: any) => {
          if (res?.data?.users) setAvailableUsers(res.data.users);
        })
        .catch(console.error);
    }
  }, [taskId, fetchTaskById]);

  const confirmDeleteTask = async () => {
    if (!activeTask) return;
    setIsDeleting(true);
    try {
      await deleteTask(activeTask.id);
      router.push('/tasks');
    } catch (err) {
      console.error('Failed to delete task', err);
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!activeTask) return;
    await updateTaskStatus(activeTask.id, newStatus);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!activeTask) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4 text-center">
        <p className="text-slate-400">Task not found or has been deleted.</p>
        <button
          onClick={() => router.push('/tasks')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tasks Hub
        </button>
      </div>
    );
  }

  const isCreator = activeTask.createdById === currentUser?.id;
  const isAdmin = currentUser?.role === 'ADMIN';
  const canModify =
    isCreator || isAdmin || activeTask.assignees.some((a) => a.userId === currentUser?.id);

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40';
      case 'LOW':
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* Top Header Bar with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => router.push('/tasks')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl text-xs font-bold border border-slate-700/70 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tasks Hub</span>
          </button>

          {/* Status Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Status:</span>
            <select
              value={activeTask.status}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              className="bg-slate-900 border border-slate-700 text-white font-bold text-xs rounded-xl px-2.5 py-1 focus:outline-none focus:border-indigo-500"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done ✅</option>
            </select>
          </div>

          {/* Priority Badge */}
          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-2xl border uppercase tracking-wider ${getPriorityStyle(
              activeTask.priority
            )}`}
          >
            {activeTask.priority} Priority
          </span>
        </div>

        {/* Edit & Delete Action Buttons */}
        <div className="flex items-center gap-2">
          {canModify && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-2xl text-xs font-bold border border-slate-700 transition-colors shadow-sm"
            >
              <Edit3 className="w-4 h-4 text-indigo-400" />
              <span>Edit Task</span>
            </button>
          )}

          {(isCreator || isAdmin) && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-2xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Title, Description, Subtasks, Discussion (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Title & Description Box */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
              {activeTask.title}
            </h1>

            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-2.5">
                <AlignLeft className="w-4 h-4 text-indigo-400" />
                Description & Specifications
              </h4>
              {activeTask.description ? (
                <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-normal">
                  {activeTask.description}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-4 rounded-2xl bg-slate-800/20 border border-slate-800">
                  No description provided for this task.
                </p>
              )}
            </div>
          </div>

          {/* Subtasks Checklist Subcomponent */}
          <TaskSubtasks
            taskId={activeTask.id}
            subtasks={activeTask.subtasks}
            onAddSubtask={(title) => addSubtask(activeTask.id, title)}
            onToggleSubtask={(subtaskId, isCompleted) => toggleSubtask(subtaskId, isCompleted)}
            onDeleteSubtask={(subtaskId) => deleteSubtask(subtaskId)}
          />

          {/* Task Discussion Comments Subcomponent */}
          <TaskComments
            comments={activeTask.comments}
            onSendComment={(content) => addComment(activeTask.id, content)}
            onUpdateComment={(commentId, content) => updateComment(activeTask.id, commentId, content)}
            onDeleteComment={(commentId) => deleteComment(activeTask.id, commentId)}
          />
        </div>

        {/* Right Column: Attributes & Assigned Team with Roles (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Metadata Attributes Card */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md space-y-4 text-xs">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Task Attributes
            </h4>

            <div className="space-y-3.5 text-slate-300 divide-y divide-slate-800/60">
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> Due Date
                </span>
                <span className="font-bold text-white">
                  {activeTask.dueDate ? new Date(activeTask.dueDate).toLocaleDateString() : 'No due date'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" /> Created By
                </span>
                <span className="font-bold text-white">
                  {activeTask.createdBy?.name || 'Team Member'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" /> Created At
                </span>
                <span className="text-slate-400">
                  {new Date(activeTask.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Assigned Team & Roles Subcomponent */}
          <TaskAssignees assignees={activeTask.assignees} />
        </div>
      </div>

      {/* Edit Task Modal */}
      <TaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialTask={activeTask}
      />

      {/* Delete Task Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteTask}
        title="Delete Task"
        description="Are you sure you want to permanently delete this task? All subtasks and comments will also be removed."
        itemTitle={activeTask.title}
        confirmText="Delete Task"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

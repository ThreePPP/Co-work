'use client';

import React from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { Avatar } from '../ui/Avatar';
import { formatRelativeTime } from '../../lib/utils';
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Clock,
  MoreHorizontal,
} from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const { updateTaskStatus } = useTaskStore();

  const completedSubtasks = task.subtasks.filter((s) => s.isCompleted).length;
  const totalSubtasks = task.subtasks.length;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const isOverdue =
    task.dueDate &&
    task.status !== 'DONE' &&
    new Date(task.dueDate).getTime() < new Date().getTime();

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'LOW':
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role.toUpperCase()) {
      case 'LEAD':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'DEVELOPER':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'DESIGNER':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
      case 'REVIEWER':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'TESTER':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/40';
    }
  };

  return (
    <div
      onClick={() => onClick(task)}
      className="group relative flex flex-col p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-indigo-500/10 space-y-3"
    >
      {/* Top Meta: Priority & Channel / Due Date */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getPriorityStyle(
              task.priority
            )}`}
          >
            {task.priority}
          </span>
        </div>

        {task.dueDate && (
          <div
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
              isOverdue
                ? 'bg-rose-950/60 text-rose-400 border border-rose-800/50 animate-pulse'
                : 'text-slate-400 bg-slate-800/80'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Task Title & Description */}
      <div>
        <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug line-clamp-2">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Subtasks Progress */}
      {totalSubtasks > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3 text-indigo-400" />
              Subtasks
            </span>
            <span>
              {completedSubtasks}/{totalSubtasks} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                progressPercent === 100
                  ? 'bg-emerald-500'
                  : progressPercent > 50
                  ? 'bg-indigo-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Bottom Footer: Assignees with Role Tags & Comments */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
        {/* Assignees Avatars & Roles */}
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          {task.assignees.length === 0 ? (
            <span className="text-[11px] text-slate-400 italic">Unassigned</span>
          ) : (
            task.assignees.map((assignee) => (
              <div
                key={assignee.id}
                className="inline-flex items-center gap-1 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-full pl-0.5 pr-2 py-0.5 text-[10px] transition-colors"
                title={`${assignee.user.name} (${assignee.role})`}
              >
                <Avatar
                  name={assignee.user.name}
                  src={assignee.user.avatarUrl}
                  size="xs"
                />
                <span className="text-slate-200 font-medium truncate max-w-[70px]">
                  {assignee.user.name.split(' ')[0]}
                </span>
                <span
                  className={`text-[8px] font-extrabold uppercase px-1 py-0.2 rounded border ${getRoleBadgeStyle(
                    assignee.role
                  )}`}
                >
                  {assignee.role}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Comments Count */}
        <div className="flex items-center gap-1 text-slate-400 text-xs font-medium flex-shrink-0">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{task._count?.comments || 0}</span>
        </div>
      </div>
    </div>
  );
};

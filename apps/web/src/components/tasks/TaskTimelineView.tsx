'use client';

import React from 'react';
import Link from 'next/link';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Clock, Calendar, CheckSquare, AlertCircle, ArrowRight } from 'lucide-react';

interface TaskTimelineViewProps {
  tasks: Task[];
}

export const TaskTimelineView: React.FC<TaskTimelineViewProps> = ({ tasks }) => {
  // Sort tasks by due date or created date
  const sortedTasks = [...tasks].sort((a, b) => {
    const timeA = a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.createdAt).getTime();
    const timeB = b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.createdAt).getTime();
    return timeA - timeB;
  });

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'DONE':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'IN_REVIEW':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'IN_PROGRESS':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'TODO':
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/40';
    }
  };

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-500 text-white';
      case 'HIGH':
        return 'bg-amber-500 text-slate-900';
      case 'MEDIUM':
        return 'bg-indigo-500 text-white';
      case 'LOW':
      default:
        return 'bg-slate-600 text-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Timeline Header Card */}
      <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Project Gantt & Milestone Timeline</h2>
            <p className="text-xs text-slate-400">
              Sequence of deliverables, progress tracking, and estimated delivery dates
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
        {sortedTasks.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center text-slate-400 text-xs">
            No tasks found in timeline.
          </div>
        ) : (
          sortedTasks.map((task, idx) => {
            const completedCount = task.subtasks?.filter((s) => s.isCompleted).length || 0;
            const totalCount = task.subtasks?.length || 0;
            const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : task.status === 'DONE' ? 100 : 0;

            const isDone = task.status === 'DONE';

            return (
              <div key={task.id} className="relative group">
                {/* Milestone Node Dot */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-4 w-3.5 h-3.5 rounded-full border-2 border-slate-950 transition-all ${
                    isDone
                      ? 'bg-emerald-500 shadow-md shadow-emerald-500/50'
                      : task.priority === 'URGENT'
                      ? 'bg-rose-500 shadow-md shadow-rose-500/50'
                      : 'bg-indigo-500 shadow-md shadow-indigo-500/50'
                  }`}
                />

                {/* Timeline Card */}
                <Link
                  href={`/tasks/${task.id}`}
                  className="block p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-xl backdrop-blur-md hover:translate-x-1"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-lg ${getPriorityStyle(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-lg border ${getStatusBadge(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-md">
                        {task.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Deadline'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                  {/* Progress Bar & Subtask Milestone stats */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                        {completedCount}/{totalCount} Deliverables completed
                      </span>
                      <span className="font-extrabold text-indigo-400 text-xs">{progress}%</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          progress === 100
                            ? 'bg-emerald-500'
                            : progress > 50
                            ? 'bg-indigo-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Assignees avatars footer */}
                  {task.assignees && task.assignees.length > 0 && (
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                        Assigned Teammates
                      </span>
                      <div className="flex items-center -space-x-1.5">
                        {task.assignees.map((a) => (
                          <Avatar
                            key={a.id}
                            name={a.user.name}
                            src={a.user.avatarUrl}
                            size="xs"
                            className="ring-2 ring-slate-900"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

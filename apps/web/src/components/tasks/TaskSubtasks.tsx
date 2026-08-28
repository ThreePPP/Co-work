'use client';

import React, { useState } from 'react';
import { Subtask } from '../../types';
import { CheckSquare, CheckCircle2, Circle, Plus, X } from 'lucide-react';

interface TaskSubtasksProps {
  taskId: string;
  subtasks: Subtask[];
  onAddSubtask: (title: string) => Promise<void>;
  onToggleSubtask: (subtaskId: string, isCompleted: boolean) => Promise<void>;
  onDeleteSubtask: (subtaskId: string) => Promise<void>;
}

export const TaskSubtasks: React.FC<TaskSubtasksProps> = ({
  subtasks,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const completedSubtasks = subtasks.filter((s) => s.isCompleted).length;
  const totalSubtasks = subtasks.length;
  const progressPercent =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    await onAddSubtask(newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-indigo-400" />
          Subtasks & Deliverables Checklist ({completedSubtasks}/{totalSubtasks})
        </h3>
        <span className="text-sm font-extrabold text-indigo-400">{progressPercent}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
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

      {/* Checklist Items */}
      <div className="space-y-2 pt-2">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-colors group"
          >
            <button
              onClick={() => onToggleSubtask(subtask.id, !subtask.isCompleted)}
              className="flex items-center gap-3 text-left flex-1 min-w-0"
            >
              {subtask.isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-500 flex-shrink-0" />
              )}
              <span
                className={`text-sm ${
                  subtask.isCompleted
                    ? 'line-through text-slate-500'
                    : 'text-slate-200 font-medium'
                } truncate`}
              >
                {subtask.title}
              </span>
            </button>

            <button
              onClick={() => onDeleteSubtask(subtask.id)}
              className="p-1.5 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-slate-700/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Subtask Input */}
      <form onSubmit={handleAddSubmit} className="flex items-center gap-2 pt-2">
        <input
          type="text"
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          placeholder="Add a new checklist item (e.g. Unit tests, Documentation)..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs sm:text-sm font-semibold transition-colors flex-shrink-0 shadow-lg shadow-indigo-600/25"
        >
          <Plus className="w-4 h-4 inline-block mr-1" /> Add
        </button>
      </form>
    </div>
  );
};

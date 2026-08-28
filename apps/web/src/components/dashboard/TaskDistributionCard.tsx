'use client';

import React from 'react';
import { CheckSquare, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface TaskDistributionCardProps {
  analytics?: {
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
  totalTasks: number;
}

export const TaskDistributionCard: React.FC<TaskDistributionCardProps> = ({
  analytics,
  totalTasks,
}) => {
  const status = analytics?.statusDistribution || {
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    DONE: 0,
  };

  const priority = analytics?.priorityDistribution || {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    URGENT: 0,
  };

  const completionRate = analytics?.completionRate || 0;

  const statusItems = [
    { label: 'To Do', count: status.TODO, color: 'bg-slate-500', textColor: 'text-slate-400' },
    { label: 'In Progress', count: status.IN_PROGRESS, color: 'bg-indigo-500', textColor: 'text-indigo-400' },
    { label: 'In Review', count: status.IN_REVIEW, color: 'bg-purple-500', textColor: 'text-purple-400' },
    { label: 'Done', count: status.DONE, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
  ];

  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 shadow-xs flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Task Pipeline & Execution</h3>
          </div>

          <Link
            href="/tasks"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 group"
          >
            Manage Tasks <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Completion Rate KPI Card */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Sprint Completion</span>
            <span className="text-xs font-mono font-bold text-emerald-400">{completionRate}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            {status.DONE} of {totalTasks} tasks completed
          </p>
        </div>

        {/* Status Breakdown List */}
        <div className="space-y-2.5">
          {statusItems.map((item) => {
            const percent = totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0;
            return (
              <div key={item.label} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-xs ${item.color}`} />
                  <span className="text-slate-300 font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-400 text-[11px]">{percent}%</span>
                  <span className="text-white font-bold w-4 text-right">{item.count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Priority Focus Breakdown */}
      <div className="pt-3 mt-4 border-t border-slate-800/70 flex items-center justify-between gap-2 flex-wrap text-xs">
        <span className="text-[11px] text-slate-400 font-medium">By Priority:</span>
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          {priority.URGENT > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
              {priority.URGENT} Urgent
            </span>
          )}
          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {priority.HIGH} High
          </span>
          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {priority.MEDIUM} Med
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60">
            {priority.LOW} Low
          </span>
        </div>
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { Building2, Users, CheckSquare } from 'lucide-react';

interface DepartmentWorkloadItem {
  department: string;
  memberCount: number;
  taskCount: number;
}

interface DepartmentWorkloadChartProps {
  data?: DepartmentWorkloadItem[];
}

export const DepartmentWorkloadChart: React.FC<DepartmentWorkloadChartProps> = ({ data = [] }) => {
  const maxTasks = Math.max(...data.map((d) => d.taskCount), 1);

  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 shadow-xs flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Department Allocation</h3>
            <p className="text-xs text-slate-400">Team staffing & active projects</p>
          </div>
        </div>

        {/* Departments List */}
        {data.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No department data recorded.</p>
        ) : (
          <div className="space-y-3.5 mt-4">
            {data.map((item) => {
              const taskPercent = Math.max(Math.round((item.taskCount / maxTasks) * 100), 8);

              return (
                <div key={item.department} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{item.department}</span>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" /> {item.memberCount}
                      </span>
                      <span className="flex items-center gap-1 text-slate-300 font-semibold">
                        <CheckSquare className="w-3 h-3 text-indigo-400" /> {item.taskCount}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${taskPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="pt-3 mt-4 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400">
        <span className="text-[11px]">{data.length} active departments</span>
        <span className="text-[11px] text-emerald-400 font-mono font-medium">All active</span>
      </div>
    </div>
  );
};

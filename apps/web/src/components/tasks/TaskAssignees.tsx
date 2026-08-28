'use client';

import React from 'react';
import { TaskAssignee } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Users } from 'lucide-react';

interface TaskAssigneesProps {
  assignees?: TaskAssignee[];
}

export const TaskAssignees: React.FC<TaskAssigneesProps> = ({
  assignees = [],
}) => {
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
    <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          Assigned Team ({assignees.length})
        </h4>
      </div>

      {/* List of Assignees */}
      {assignees.length === 0 ? (
        <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-800 text-center">
          <p className="text-xs text-slate-500 italic">No members assigned yet.</p>
          <p className="text-[11px] text-slate-600 mt-1">Use Edit Task to assign team members.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignees.map((assignee) => (
            <div
              key={assignee.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  name={assignee.user.name}
                  src={assignee.user.avatarUrl}
                  status={assignee.user.status}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white leading-none mb-1 truncate">
                    {assignee.user.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {assignee.user.position ||
                      assignee.user.department ||
                      assignee.user.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border ${getRoleBadgeStyle(
                    assignee.role
                  )}`}
                >
                  {assignee.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

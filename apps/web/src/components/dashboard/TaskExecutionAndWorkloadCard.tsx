'use client';

import React, { useState } from 'react';
import { CheckSquare, ArrowUpRight, Users, Building2, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { Avatar } from '../ui/Avatar';

interface DepartmentMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  position: string | null;
  role: string;
  status: string;
  assignedTasksCount: number;
}

interface DepartmentWorkloadItem {
  department: string;
  memberCount: number;
  taskCount: number;
  members?: DepartmentMember[];
}

interface MemberWorkloadItem {
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
}

interface TaskExecutionAndWorkloadCardProps {
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
  departmentWorkload?: DepartmentWorkloadItem[];
  memberWorkload?: MemberWorkloadItem[];
}

export const TaskExecutionAndWorkloadCard: React.FC<TaskExecutionAndWorkloadCardProps> = ({
  analytics,
  totalTasks,
  departmentWorkload = [],
  memberWorkload = [],
}) => {
  const [activeTab, setActiveTab] = useState<'department' | 'members'>('department');

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

  const maxDeptTasks = Math.max(...departmentWorkload.map((d) => d.taskCount), 1);
  const maxMemberTasks = Math.max(...memberWorkload.map((m) => m.totalTasks), 1);

  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 shadow-xs flex flex-col justify-between h-full space-y-5">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/70 pb-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-purple-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Pipeline Execution & Team Allocation</h3>
              <p className="text-xs text-slate-400">Sprint progress, stages, and assignee allocation</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View Switcher: By Department vs By Team Members */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium">
              <button
                onClick={() => setActiveTab('department')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'department'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3 h-3" />
                <span>Departments</span>
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'members'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>Assignees</span>
              </button>
            </div>

            <Link
              href="/tasks"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 group px-2 py-1"
            >
              Tasks <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Top Summary: Sprint Progress Bar & Status Tags */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 my-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-medium">Sprint Completion:</span>
              <span className="text-xs font-mono font-bold text-emerald-400">{completionRate}%</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {status.DONE} of {totalTasks} deliverables done
            </span>
          </div>

          {/* Segmented Pipeline Bar */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
            {statusItems.map((item) => {
              const percent = totalTasks > 0 ? (item.count / totalTasks) * 100 : 0;
              if (percent === 0) return null;
              return (
                <div
                  key={item.label}
                  className={`h-full ${item.color} transition-all duration-500`}
                  style={{ width: `${percent}%` }}
                  title={`${item.label}: ${item.count} (${Math.round(percent)}%)`}
                />
              );
            })}
          </div>

          {/* Status Counts Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/60 text-xs">
            {statusItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between pr-2">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                  {item.label}
                </span>
                <span className="font-mono font-bold text-slate-200">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Body: Department Workload VS Member Workload with Avatars & Names */}
        {activeTab === 'department' ? (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              <span>Department & Assigned Personnel</span>
              <span>Workload Share</span>
            </div>

            {departmentWorkload.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No department workload records.</p>
            ) : (
              departmentWorkload.map((dept) => {
                const percent = Math.max(Math.round((dept.taskCount / maxDeptTasks) * 100), 8);

                return (
                  <div key={dept.department} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-200">{dept.department}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                            {dept.taskCount} tasks
                          </span>
                        </div>
                      </div>

                      {/* Avatars & Names of Members in this Department */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {dept.members && dept.members.length > 0 ? (
                          dept.members.map((m) => (
                            <div
                              key={m.id}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300"
                              title={`${m.name} (${m.position || m.role}) - ${m.assignedTasksCount} tasks`}
                            >
                              <Avatar name={m.name} src={m.avatarUrl} size="xs" />
                              <span className="truncate max-w-[80px] font-medium">{m.name.split(' ')[0]}</span>
                              <span className="text-[10px] text-indigo-400 font-mono">({m.assignedTasksCount})</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-500">{dept.memberCount} members</span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* By Members Tab: Detailed Workload per Person */
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              <span>Member & Position</span>
              <span>Tasks (Done / Total)</span>
            </div>

            {memberWorkload.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No member workload records.</p>
            ) : (
              memberWorkload.map((member) => {
                const memberPercent = Math.max(Math.round((member.totalTasks / maxMemberTasks) * 100), 8);

                return (
                  <div
                    key={member.id}
                    className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-1.5 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={member.name} src={member.avatarUrl} size="xs" status={member.status as any} />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-200 truncate">{member.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {member.department} • {member.position}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="text-emerald-400 font-bold">{member.doneTasks}</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-white font-bold">{member.totalTasks}</span>
                      </div>
                    </div>

                    {/* Member workload progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${memberPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Priority Focus Breakdown Footer */}
      <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between gap-2 flex-wrap text-xs">
        <span className="text-[11px] text-slate-400 font-medium">Priority Distribution:</span>
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

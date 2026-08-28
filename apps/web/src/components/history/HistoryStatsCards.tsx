'use client';

import React from 'react';
import { Activity, Clock, Flame, UserCheck, TrendingUp, CheckSquare, FolderOpen, Shield } from 'lucide-react';
import { useHistoryStore } from '../../stores/historyStore';
import { Avatar } from '../ui/Avatar';

export const HistoryStatsCards: React.FC = () => {
  const { stats, isStatsLoading } = useHistoryStore();

  if (isStatsLoading && !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const total = stats?.total || 0;
  const todayCount = stats?.todayCount || 0;
  const past7DaysCount = stats?.past7DaysCount || 0;

  // Calculate highest active category
  const categoryCounts = stats?.categoryCounts || {};
  let topCategory = 'TASKS';
  let topCategoryCount = 0;
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    if (count > topCategoryCount) {
      topCategory = cat;
      topCategoryCount = count;
    }
  });

  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case 'TASKS':
        return { label: 'Tasks & Projects', icon: CheckSquare, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' };
      case 'FILES':
        return { label: 'Drive & Files', icon: FolderOpen, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
      case 'AUTH':
        return { label: 'Security & Auth', icon: Shield, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' };
      default:
        return { label: 'General', icon: Activity, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' };
    }
  };

  const topCategoryMeta = getCategoryMeta(topCategory);
  const TopCategoryIcon = topCategoryMeta.icon;

  const topUser = stats?.topActiveUsers?.[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* 1. Total Activity Events */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Total System Events</span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>{past7DaysCount} logged past 7 days</span>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. Today's Events */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Today's Activity</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
            {todayCount.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live chronological recording</span>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 3. Most Active Category */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Top Module</span>
          <div className={`p-2 rounded-xl border ${topCategoryMeta.bg} ${topCategoryMeta.color}`}>
            <TopCategoryIcon className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
            {topCategoryMeta.label}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{topCategoryCount} actions logged</span>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 4. Top Contributor */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-purple-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Top Contributor</span>
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          {topUser ? (
            <>
              <Avatar
                name={topUser.user.name}
                src={topUser.user.avatarUrl}
                size="md"
                className="flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{topUser.user.name}</p>
                <p className="text-[11px] text-purple-400 font-medium">
                  {topUser.count} activities
                </p>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400">No activity data yet</p>
          )}
        </div>
        <div className="absolute right-0 bottom-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>
    </div>
  );
};

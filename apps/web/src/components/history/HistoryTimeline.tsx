'use client';

import React from 'react';
import {
  CheckSquare,
  FolderOpen,
  Hash,
  Shield,
  MessageCircle,
  Activity,
  Calendar,
  Globe,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { useHistoryStore } from '../../stores/historyStore';
import { HistoryLogItem } from '../../types';
import { Avatar } from '../ui/Avatar';
import { formatRelativeTime } from '../../lib/utils';
import { cn } from '../../lib/utils';

export const HistoryTimeline: React.FC = () => {
  const { items, isLoading, openDetailModal } = useHistoryStore();

  if (isLoading && items.length === 0) {
    return (
      <div className="space-y-4 py-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-20 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3 border border-indigo-500/20">
          <Activity className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">No Activity Records Found</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          No system events match your current filter criteria. Try clearing search filters or
          selecting another category.
        </p>
      </div>
    );
  }

  // Helper to categorize log action
  const getActionConfig = (action: string) => {
    if (action.includes('TASK') || action.includes('SUBTASK')) {
      return {
        icon: CheckSquare,
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/10 border-indigo-500/30',
        badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
        label: 'Task Event',
      };
    }
    if (action.includes('FILE')) {
      return {
        icon: FolderOpen,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/30',
        badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        label: 'Drive & File',
      };
    }
    if (
      action.includes('LOGIN') ||
      action.includes('REGISTER') ||
      action.includes('PASSWORD') ||
      action.includes('PRUNE')
    ) {
      return {
        icon: Shield,
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10 border-cyan-500/30',
        badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
        label: 'Security & Auth',
      };
    }
    if (action.includes('MESSAGE')) {
      return {
        icon: MessageCircle,
        color: 'text-pink-400',
        bg: 'bg-pink-500/10 border-pink-500/30',
        badge: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
        label: 'Communication',
      };
    }
    return {
      icon: Activity,
      color: 'text-slate-400',
      bg: 'bg-slate-700/20 border-slate-700/50',
      badge: 'bg-slate-800 text-slate-300 border-slate-700',
      label: 'General Event',
    };
  };

  // Group items by date section
  const groupLogsByDate = (logs: HistoryLogItem[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { [key: string]: HistoryLogItem[] } = {
      Today: [],
      Yesterday: [],
      'Earlier this Week': [],
      Older: [],
    };

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    logs.forEach((item) => {
      const itemDate = new Date(item.createdAt);
      if (itemDate >= today) {
        groups['Today'].push(item);
      } else if (itemDate >= yesterday) {
        groups['Yesterday'].push(item);
      } else if (itemDate >= oneWeekAgo) {
        groups['Earlier this Week'].push(item);
      } else {
        groups['Older'].push(item);
      }
    });

    return Object.entries(groups).filter(([_, list]) => list.length > 0);
  };

  const grouped = groupLogsByDate(items);

  return (
    <div className="space-y-8 animate-fade-in">
      {grouped.map(([groupTitle, groupItems]) => (
        <div key={groupTitle} className="space-y-4">
          {/* Group Header Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              {groupTitle}
            </span>
            <div className="h-px flex-1 bg-slate-800/80" />
            <span className="text-[11px] text-slate-400 font-medium">
              {groupItems.length} {groupItems.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          {/* Timeline Stream */}
          <div className="relative pl-6 sm:pl-8 space-y-3 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500/40 before:via-slate-800 before:to-transparent">
            {groupItems.map((item) => {
              const meta = getActionConfig(item.action);
              const Icon = meta.icon;
              const formattedDate = new Date(item.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  onClick={() => openDetailModal(item)}
                  className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-850/80 backdrop-blur-md transition-all duration-150 cursor-pointer shadow-xs"
                >
                  {/* Glowing Node Dot on the timeline */}
                  <div
                    className={cn(
                      'absolute -left-6 sm:-left-8 top-5 -translate-x-1/2 w-6 h-6 rounded-full border flex items-center justify-center bg-slate-950 transition-transform group-hover:scale-110 shadow-xs',
                      meta.bg
                    )}
                  >
                    <Icon className={cn('w-3 h-3', meta.color)} />
                  </div>

                  {/* Left: User Avatar & Action Description */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <Avatar
                      name={item.user?.name || 'System'}
                      src={item.user?.avatarUrl}
                      size="sm"
                      className="flex-shrink-0 mt-0.5 sm:mt-0"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">
                          {item.user?.name || 'System Automator'}
                        </span>
                        {item.user?.isArchived && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-500/30">
                            Archived
                          </span>
                        )}
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border',
                            meta.badge
                          )}
                        >
                          {item.action}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mt-0.5 truncate max-w-xl">
                        {item.details || 'System event recorded in workspace log.'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Timestamp & IP Address */}
                  <div className="flex items-center gap-3 sm:text-right flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    {item.ipAddress && (
                      <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/60 text-[10px] text-slate-400 font-mono border border-slate-700/50">
                        <Globe className="w-2.5 h-2.5" />
                        {item.ipAddress}
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-300 font-medium">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                      <span className="text-slate-400 text-[10px]">({formattedDate})</span>
                    </div>

                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-indigo-400 transition-opacity" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

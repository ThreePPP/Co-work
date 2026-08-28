'use client';

import React from 'react';
import {
  Eye,
  CheckSquare,
  FolderOpen,
  Shield,
  MessageCircle,
  Activity,
  Globe,
} from 'lucide-react';
import { useHistoryStore } from '../../stores/historyStore';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

export const HistoryTable: React.FC = () => {
  const { items, isLoading, openDetailModal } = useHistoryStore();

  if (isLoading && items.length === 0) {
    return (
      <div className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center">
        <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-300">No activity records match the criteria.</p>
      </div>
    );
  }

  const getActionBadge = (action: string) => {
    if (action.includes('TASK')) return 'primary';
    if (action.includes('FILE')) return 'warning';
    if (action.includes('LOGIN') || action.includes('AUTH') || action.includes('PASSWORD'))
      return 'info';
    return 'default';
  };

  const getCategoryIcon = (action: string) => {
    if (action.includes('TASK')) return <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />;
    if (action.includes('FILE')) return <FolderOpen className="w-3.5 h-3.5 text-amber-400" />;
    if (action.includes('LOGIN') || action.includes('AUTH'))
      return <Shield className="w-3.5 h-3.5 text-cyan-400" />;
    return <Activity className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3.5">Timestamp</th>
              <th className="px-4 py-3.5">Member</th>
              <th className="px-4 py-3.5">Action Event</th>
              <th className="px-4 py-3.5">Details</th>
              <th className="px-4 py-3.5">IP Address</th>
              <th className="px-4 py-3.5 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {items.map((item) => {
              const d = new Date(item.createdAt);
              const dateStr = d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const timeStr = d.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <tr
                  key={item.id}
                  onClick={() => openDetailModal(item)}
                  className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  {/* Timestamp */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-medium text-slate-200">{timeStr}</div>
                    <div className="text-[10px] text-slate-400">{dateStr}</div>
                  </td>

                  {/* Member */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={item.user?.name || 'User'}
                        src={item.user?.avatarUrl}
                        size="xs"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-200 truncate">
                          <span>{item.user?.name || 'System'}</span>
                          {item.user?.isArchived && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-500/30">
                              Archived
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {item.user?.department || item.user?.role || 'Member'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Action Event */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {getCategoryIcon(item.action)}
                      <Badge variant={getActionBadge(item.action)} size="sm">
                        {item.action}
                      </Badge>
                    </div>
                  </td>

                  {/* Details */}
                  <td className="px-4 py-3 max-w-xs md:max-w-md">
                    <p className="text-slate-300 truncate font-normal">
                      {item.details || '—'}
                    </p>
                  </td>

                  {/* IP Address */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {item.ipAddress ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400">
                        <Globe className="w-3 h-3 text-slate-400" />
                        {item.ipAddress}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailModal(item);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="View Log Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

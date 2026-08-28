'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User } from '../../types';
import { Avatar } from '../ui/Avatar';
import { MessageSquare, Users } from 'lucide-react';

interface OnlineColleaguesProps {
  users: User[];
}

export const OnlineColleagues: React.FC<OnlineColleaguesProps> = ({ users = [] }) => {
  const [filter, setFilter] = useState<'all' | 'online'>('all');

  const onlineCount = users.filter((u) => u.status === 'ONLINE').length;
  const filteredUsers = filter === 'online' ? users.filter((u) => u.status === 'ONLINE') : users;

  const getStatusMeta = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return { label: 'Online', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'AWAY':
        return { label: 'Away', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'BUSY':
        return { label: 'Busy', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      default:
        return { label: 'Offline', badge: 'bg-slate-800 text-slate-400 border-slate-700/60' };
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 shadow-xs flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/70 pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Live Team Presence</h3>
            <p className="text-[11px] text-slate-400">Real-time member status</p>
          </div>
        </div>

        {/* Quick Filter: All vs Online Only */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer text-[11px] ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({users.length})
          </button>
          <button
            onClick={() => setFilter('online')}
            className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer text-[11px] ${
              filter === 'online'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Online ({onlineCount})
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {filteredUsers.length === 0 ? (
          <div className="py-6 text-center text-slate-400 space-y-1">
            <p className="text-xs font-medium text-slate-300">No members match this filter</p>
            <p className="text-[11px] text-slate-500">All other members are currently offline.</p>
          </div>
        ) : (
          filteredUsers.map((colleague) => {
            const meta = getStatusMeta(colleague.status);

            return (
              <div
                key={colleague.id}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    name={colleague.name}
                    src={colleague.avatarUrl}
                    status={colleague.status}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate group-hover:text-indigo-300 transition-colors">
                      {colleague.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {colleague.position || colleague.department || 'Member'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-medium font-mono px-1.5 py-0.2 rounded border ${meta.badge}`}>
                    {meta.label}
                  </span>

                  <Link
                    href={`/messages?userId=${colleague.id}`}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                    title={`Send message to ${colleague.name}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="pt-2.5 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400">
        <span className="text-[11px]">WebSocket Connection</span>
        <span className="text-[11px] text-emerald-400 font-mono font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Real-time
        </span>
      </div>
    </div>
  );
};

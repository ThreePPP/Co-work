import React from 'react';
import { ActivityLog } from '../../types';
import { Avatar } from '../ui/Avatar';
import { formatRelativeTime } from '../../lib/utils';
import { Activity, MessageCircle, FileUp, UserPlus, LogIn } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityLog[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getActionIcon = (action: string) => {
    if (action.includes('MESSAGE')) return <MessageCircle className="w-3.5 h-3.5 text-indigo-400" />;
    if (action.includes('FILE')) return <FileUp className="w-3.5 h-3.5 text-emerald-400" />;
    if (action.includes('REGISTER')) return <UserPlus className="w-3.5 h-3.5 text-purple-400" />;
    return <LogIn className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Recent Activity</h3>
        </div>
        <span className="text-xs text-slate-400">Live stream</span>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No recent team activities.</p>
        ) : (
          activities.map((item) => (
            <div key={item.id} className="flex items-start gap-3 group">
              <Avatar
                name={item.user?.name || 'User'}
                src={item.user?.avatarUrl}
                size="sm"
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-slate-200">{item.user?.name}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                    {getActionIcon(item.action)}
                    {item.details || item.action}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {formatRelativeTime(item.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

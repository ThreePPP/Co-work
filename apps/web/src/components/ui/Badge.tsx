import React from 'react';
import { cn } from '../../lib/utils';
import { UserRole, UserStatus } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  role?: UserRole;
  status?: UserStatus;
  size?: 'sm' | 'md';
  className?: string;
}

const roleStyles: Record<UserRole, { bg: string; text: string; label: string }> = {
  ADMIN: { bg: 'bg-rose-500/15 border-rose-500/30', text: 'text-rose-400', label: 'Admin' },
  MANAGER: { bg: 'bg-purple-500/15 border-purple-500/30', text: 'text-purple-400', label: 'Manager' },
  MEMBER: { bg: 'bg-slate-700/40 border-slate-600/30', text: 'text-slate-300', label: 'Member' },
};

const statusStyles: Record<UserStatus, { dot: string; text: string; label: string }> = {
  ONLINE: { dot: 'bg-emerald-500', text: 'text-emerald-400', label: 'Online' },
  AWAY: { dot: 'bg-amber-500', text: 'text-amber-400', label: 'Away' },
  BUSY: { dot: 'bg-rose-500', text: 'text-rose-400', label: 'Busy' },
  OFFLINE: { dot: 'bg-slate-500', text: 'text-slate-400', label: 'Offline' },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  role,
  status,
  size = 'sm',
  className,
}) => {
  if (role) {
    const config = roleStyles[role];
    return (
      <span
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
          config.bg,
          config.text,
          className
        )}
      >
        {children || config.label}
      </span>
    );
  }

  if (status) {
    const config = statusStyles[status];
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800/80 border border-slate-700/50',
          config.text,
          className
        )}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
        {children || config.label}
      </span>
    );
  }

  const variantMap = {
    default: 'bg-slate-800 border-slate-700 text-slate-300',
    primary: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400',
    success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    warning: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    danger: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
    info: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
    purple: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        variantMap[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import Link from 'next/link';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  href?: string;
  variant?: 'indigo' | 'emerald' | 'purple' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  subtext,
  trend,
  href,
}) => {
  const content = (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700/80 transition-all duration-200 shadow-xs group flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-white tracking-tight tabular-nums">{value}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-300 group-hover:text-indigo-400 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {(subtext || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2 text-xs">
          {subtext && <span className="text-slate-400 truncate text-[11px]">{subtext}</span>}
          {trend && (
            <span
              className={cn(
                'text-[11px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0 font-mono',
                trend.isPositive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
};

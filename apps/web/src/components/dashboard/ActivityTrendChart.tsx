'use client';

import React, { useState } from 'react';
import { TrendingUp, Activity, CheckSquare, FolderOpen, Users, LucideIcon } from 'lucide-react';

export interface TrendItem {
  date: string;
  label: string;
  tasks: number;
  files: number;
  auth: number;
  total: number;
}

export interface ActivityTrendChartProps {
  data?: TrendItem[];
  trends?: {
    '1d'?: TrendItem[];
    '7d'?: TrendItem[];
    '1m'?: TrendItem[];
    '1y'?: TrendItem[];
    daily?: TrendItem[];
    daily30?: TrendItem[];
    monthly?: TrendItem[];
    yearly?: TrendItem[];
  };
}

interface WideChartCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  badgeBg: string;
  badgeText: string;
  barColor: string;
  hoverRing: string;
  data: TrendItem[];
  getValue: (item: TrendItem) => number;
  unit: string;
  period: '1d' | '7d' | '1m' | '1y';
}

const WideChartCard: React.FC<WideChartCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  badgeBg,
  badgeText,
  barColor,
  hoverRing,
  data,
  getValue,
  unit,
  period,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const rawMax = Math.max(...data.map((d) => getValue(d)), 4);
  const yMax = Math.ceil(rawMax / 4) * 4 || 4;
  const yTicks = [yMax, Math.round(yMax * 0.75), Math.round(yMax * 0.5), Math.round(yMax * 0.25), 0];
  const totalSum = data.reduce((acc, curr) => acc + getValue(curr), 0);
  const avg = (totalSum / (data.length || 1)).toFixed(1);

  const getTooltipAlignClass = (idx: number, total: number) => {
    if (total <= 1) return 'left-1/2 -translate-x-1/2';
    if (idx >= total - 3) return 'right-0 translate-x-0';
    if (idx <= 2) return 'left-0 translate-x-0';
    return 'left-1/2 -translate-x-1/2';
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-colors">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/70 pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${badgeBg} ${badgeText}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className={`text-xs font-mono font-bold px-3 py-1 rounded-lg ${badgeBg} ${badgeText}`}>
            Total: {totalSum} {unit}
          </span>
        </div>
      </div>

      {/* 2. Wide Chart Canvas with Y-Axis Guidelines */}
      <div className="relative pt-6 pb-2">
        {/* Y-Axis Guidelines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7 pl-7">
          {yTicks.slice(0, 4).map((tick, i) => (
            <div key={i} className="flex items-center w-full">
              <span className="text-[10px] text-slate-500 font-mono w-6 text-right pr-2 select-none">
                {tick}
              </span>
              <div className="flex-1 border-b border-slate-800/60" />
            </div>
          ))}
        </div>

        {/* Wide Bars Row */}
        <div className="h-40 flex items-end justify-between gap-1.5 sm:gap-3 pl-8 pr-2 relative z-10">
          {data.map((item, idx) => {
            const val = getValue(item);
            const heightPercent = Math.max(Math.round((val / yMax) * 100), val > 0 ? 8 : 3);
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={item.date + idx}
                className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Clean Floating Tooltip */}
                {isHovered && (
                  <div
                    className={`absolute -top-20 z-50 p-2.5 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl text-xs whitespace-nowrap pointer-events-none min-w-[130px] ${getTooltipAlignClass(
                      idx,
                      data.length
                    )}`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5 gap-3">
                      <span className="font-semibold text-white">{item.date}</span>
                      <span className={`font-mono font-bold ${badgeText}`}>
                        {val} {unit}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      <span>{title} recorded</span>
                    </div>
                  </div>
                )}

                {/* Wide Bar */}
                <div
                  className={`w-full max-w-[48px] rounded-t-md transition-all duration-200 ${
                    val === 0 ? 'bg-slate-800/40' : barColor
                  } ${isHovered ? `ring-2 ${hoverRing} brightness-110 shadow-lg` : 'hover:brightness-105'}`}
                  style={{ height: `${heightPercent}%` }}
                />

                {/* X-axis Label */}
                <span
                  className={`mt-2 text-[9px] sm:text-[10px] font-medium transition-colors truncate max-w-full font-mono select-none ${
                    isHovered ? `${badgeText} font-bold` : 'text-slate-400'
                  } ${period === '1d' && idx % 2 !== 0 ? 'hidden md:block' : ''} ${period === '1m' && idx % 3 !== 0 ? 'hidden sm:block' : ''}`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ActivityTrendChart: React.FC<ActivityTrendChartProps> = ({
  data = [],
  trends,
}) => {
  const [period, setPeriod] = useState<'1d' | '7d' | '1m' | '1y'>('7d');

  const activeData: TrendItem[] =
    period === '1d'
      ? trends?.['1d'] || []
      : period === '1m'
      ? trends?.['1m'] || trends?.daily30 || []
      : period === '1y'
      ? trends?.['1y'] || trends?.monthly || []
      : trends?.['7d'] || trends?.daily || data || [];

  const getPeriodSubtitle = () => {
    switch (period) {
      case '1d':
        return 'Today (24h Hourly)';
      case '1m':
        return 'Past 30 Days (Daily)';
      case '1y':
        return 'Past 12 Months (Monthly)';
      default:
        return 'Past 7 Days (Daily)';
    }
  };

  return (
    <div className="space-y-4">
      {/* Synchronized Control Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 shadow-xs">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <div>
            <h2 className="text-sm font-semibold text-white">
              Workspace Operational Velocity <span className="text-slate-400 font-normal">({getPeriodSubtitle()})</span>
            </h2>
            <p className="text-xs text-slate-400">
              Detailed breakdown of Tasks, File Uploads, and Member Activity across the workspace
            </p>
          </div>
        </div>

        {/* Global Synchronized Period Switcher */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium self-start sm:self-auto">
          {(['1d', '7d', '1m', '1y'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-mono uppercase ${
                period === p
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Separate Wide Full-Width Cards */}
      <div className="space-y-4">
        {/* Card 1: Tasks Velocity (Wide) */}
        <WideChartCard
          title="Tasks Velocity"
          subtitle="Task creation, status progression, and completions"
          icon={CheckSquare}
          badgeBg="bg-indigo-500/10 border border-indigo-500/20"
          badgeText="text-indigo-400"
          barColor="bg-indigo-500"
          hoverRing="ring-indigo-400/80"
          data={activeData}
          getValue={(d) => d.tasks}
          unit="tasks"
          period={period}
        />

        {/* Card 2: Files Uploaded (Wide) */}
        <WideChartCard
          title="Files Uploaded & Shared"
          subtitle="Cloud drive asset additions, documents, media & uploads"
          icon={FolderOpen}
          badgeBg="bg-amber-500/10 border border-amber-500/20"
          badgeText="text-amber-400"
          barColor="bg-amber-500"
          hoverRing="ring-amber-400/80"
          data={activeData}
          getValue={(d) => d.files}
          unit="files"
          period={period}
        />

        {/* Card 3: Member Sessions & Logins (Wide) */}
        <WideChartCard
          title="Member Sessions & Logins"
          subtitle="User authentication, active sessions, and member presence"
          icon={Users}
          badgeBg="bg-purple-500/10 border border-purple-500/20"
          badgeText="text-purple-400"
          barColor="bg-purple-500"
          hoverRing="ring-purple-400/80"
          data={activeData}
          getValue={(d) => d.auth}
          unit="events"
          period={period}
        />
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import {
  Search,
  X,
  Calendar,
  Layers,
  CheckSquare,
  FolderOpen,
  Shield,
  ListTree,
  TableProperties,
} from 'lucide-react';
import { useHistoryStore } from '../../stores/historyStore';
import { HistoryCategory } from '../../types';
import { cn } from '../../lib/utils';
import { useTranslation, TranslationKey } from '../../lib/translations';

const categories: Array<{ id: HistoryCategory; key: TranslationKey; label: string; icon: any }> = [
  { id: 'ALL', key: 'allActivities', label: 'All Activities', icon: Layers },
  { id: 'TASKS', key: 'tasksTitle', label: 'Tasks & Projects', icon: CheckSquare },
  { id: 'FILES', key: 'filesTitle', label: 'Drive & Files', icon: FolderOpen },
  { id: 'AUTH', key: 'accountSecurity', label: 'Security & Auth', icon: Shield },
];

const datePresets: Array<{ id: 'all' | 'today' | '7d' | '30d'; key: TranslationKey; label: string }> = [
  { id: 'all', key: 'allTime', label: 'All Time' },
  { id: 'today', key: 'today', label: 'Today' },
  { id: '7d', key: 'past7Days', label: 'Past 7 Days' },
  { id: '30d', key: 'past30Days', label: 'Past 30 Days' },
];

export const HistoryFilters: React.FC = () => {
  const { filters, setCategory, setSearch, setDateRangePreset, viewMode, setViewMode } =
    useHistoryStore();
  const { t, language } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = filters.category === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer border select-none',
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                  : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
              )}
            >
              <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-indigo-400' : 'text-slate-400')} />
              <span>{t(cat.key)}</span>
            </button>
          );
        })}
      </div>

      {/* Control Bar: Search + Date Presets + View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={language === 'th' ? 'ค้นหากิจกรรม ชื่องาน ผู้ดำเนินการ...' : 'Search activities by action, details, user...'}
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Controls: Date Presets & View Mode Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Filter Pills */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1.5 flex-shrink-0" />
            {datePresets.map((preset) => {
              const isSelected = filters.dateRangePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setDateRangePreset(preset.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer select-none text-[11px]',
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  )}
                >
                  {t(preset.key)}
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle: Timeline vs Table */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800">
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                'p-1.5 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-white',
                viewMode === 'timeline' ? 'bg-indigo-600 text-white shadow-xs' : 'hover:bg-slate-800/60'
              )}
              title={t('timelineView')}
            >
              <ListTree className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-1.5 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-white',
                viewMode === 'table' ? 'bg-indigo-600 text-white shadow-xs' : 'hover:bg-slate-800/60'
              )}
              title={t('auditTableView')}
            >
              <TableProperties className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

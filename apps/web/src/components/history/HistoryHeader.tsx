'use client';

import React from 'react';
import { History, Download, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { useHistoryStore } from '../../stores/historyStore';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from '../../lib/translations';

export const HistoryHeader: React.FC = () => {
  const { pagination, isLoading, fetchHistory, fetchStats, openExportModal } = useHistoryStore();
  const { user } = useAuthStore();
  const { t, language } = useTranslation();
  const isAdmin = user?.role === 'ADMIN';

  const handleRefresh = async () => {
    await Promise.all([fetchHistory(), fetchStats()]);
  };

  return (
    <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900 border border-slate-800 backdrop-blur-xl shadow-2xl">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
            <History className="w-3.5 h-3.5" />
            <span>{language === 'th' ? 'บันทึกประวัติกิจกรรม' : 'Audit & Activity Stream'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            {t('historyTitle')}
            {isAdmin && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <ShieldCheck className="w-3.5 h-3.5" /> {t('auditLevel')}
              </span>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            {t('historyDesc')}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="secondary"
            size="md"
            onClick={handleRefresh}
            isLoading={isLoading}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            {t('refresh')}
          </Button>

          <Button
            variant="gradient"
            size="md"
            onClick={openExportModal}
            leftIcon={<Download className="w-4 h-4" />}
          >
            {t('exportLogs')}
          </Button>
        </div>
      </div>

      {/* Ambient background decoration */}
      <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};

'use client';

import React, { useEffect } from 'react';
import { useHistoryStore } from '../../../stores/historyStore';
import { HistoryHeader } from '../../../components/history/HistoryHeader';
import { HistoryStatsCards } from '../../../components/history/HistoryStatsCards';
import { HistoryFilters } from '../../../components/history/HistoryFilters';
import { HistoryTimeline } from '../../../components/history/HistoryTimeline';
import { HistoryTable } from '../../../components/history/HistoryTable';
import { HistoryDetailModal } from '../../../components/history/HistoryDetailModal';
import { HistoryExportModal } from '../../../components/history/HistoryExportModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export default function HistoryPage() {
  const {
    fetchHistory,
    fetchStats,
    viewMode,
    pagination,
    setPage,
    isLoading,
  } = useHistoryStore();

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [fetchHistory, fetchStats]);

  const { page, totalPages, total, hasNextPage, hasPrevPage } = pagination;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* 1. Header Banner */}
      <HistoryHeader />

      {/* 2. KPI Metrics Cards */}
      <HistoryStatsCards />

      {/* 3. Search, Category, and Date Filters */}
      <HistoryFilters />

      {/* 4. Main History Stream (Timeline or Table) */}
      <div className="pt-2">
        {viewMode === 'timeline' ? <HistoryTimeline /> : <HistoryTable />}
      </div>

      {/* 5. Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Showing Page <span className="font-semibold text-slate-200">{page}</span> of{' '}
            <span className="font-semibold text-slate-200">{totalPages}</span> ({total.toLocaleString()} total entries)
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={!hasPrevPage || isLoading}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>

            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                let pageNum = idx + 1;
                if (totalPages > 5 && page > 3) {
                  pageNum = page - 2 + idx;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - idx);
                }

                const isActive = pageNum === page;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={!hasNextPage || isLoading}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* 6. Modals */}
      <HistoryDetailModal />
      <HistoryExportModal />
    </div>
  );
}

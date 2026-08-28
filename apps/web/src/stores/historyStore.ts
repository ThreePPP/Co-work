import { create } from 'zustand';
import {
  HistoryLogItem,
  HistoryStats,
  HistoryPagination,
  HistoryFilterState,
  HistoryCategory,
} from '../types';
import { api } from '../lib/api';

interface HistoryState {
  items: HistoryLogItem[];
  stats: HistoryStats | null;
  pagination: HistoryPagination;
  filters: HistoryFilterState;
  viewMode: 'timeline' | 'table';
  selectedItem: HistoryLogItem | null;
  isLoading: boolean;
  isStatsLoading: boolean;
  isDetailModalOpen: boolean;
  isExportModalOpen: boolean;
  isExporting: boolean;

  fetchHistory: () => Promise<void>;
  fetchStats: () => Promise<void>;
  setCategory: (category: HistoryCategory) => void;
  setSearch: (search: string) => void;
  setUserFilter: (userId?: string) => void;
  setDateRangePreset: (preset: 'all' | 'today' | '7d' | '30d') => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  setViewMode: (mode: 'timeline' | 'table') => void;
  openDetailModal: (item: HistoryLogItem) => void;
  closeDetailModal: () => void;
  openExportModal: () => void;
  closeExportModal: () => void;
  exportData: (format: 'csv' | 'json') => Promise<void>;
  pruneLogs: (days: number) => Promise<{ success: boolean; message: string }>;
}

const initialPagination: HistoryPagination = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

const initialFilters: HistoryFilterState = {
  category: 'ALL',
  search: '',
  dateRangePreset: 'all',
  page: 1,
  limit: 20,
  sortOrder: 'desc',
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  items: [],
  stats: null,
  pagination: initialPagination,
  filters: initialFilters,
  viewMode: 'timeline',
  selectedItem: null,
  isLoading: false,
  isStatsLoading: false,
  isDetailModalOpen: false,
  isExportModalOpen: false,
  isExporting: false,

  fetchHistory: async () => {
    set({ isLoading: true });
    try {
      const { filters } = get();
      const params: any = {
        page: filters.page,
        limit: filters.limit,
        sortOrder: filters.sortOrder,
      };

      if (filters.category && filters.category !== 'ALL') {
        params.category = filters.category;
      }

      if (filters.search && filters.search.trim() !== '') {
        params.search = filters.search.trim();
      }

      if (filters.userId && filters.userId !== 'ALL') {
        params.userId = filters.userId;
      }

      // Calculate dates from preset
      const now = new Date();
      if (filters.dateRangePreset === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        params.startDate = start.toISOString();
      } else if (filters.dateRangePreset === '7d') {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.startDate = start.toISOString();
      } else if (filters.dateRangePreset === '30d') {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        params.startDate = start.toISOString();
      }

      const res: any = await api.get('/history', { params });
      if (res?.data) {
        set({
          items: res.data.items || [],
          pagination: res.data.pagination || initialPagination,
        });
      }
    } catch (err) {
      console.error('Failed to fetch history logs', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    set({ isStatsLoading: true });
    try {
      const res: any = await api.get('/history/stats');
      if (res?.data) {
        set({ stats: res.data });
      }
    } catch (err) {
      console.error('Failed to fetch history stats', err);
    } finally {
      set({ isStatsLoading: false });
    }
  },

  setCategory: (category: HistoryCategory) => {
    set((state) => ({
      filters: { ...state.filters, category, page: 1 },
    }));
    get().fetchHistory();
  },

  setSearch: (search: string) => {
    set((state) => ({
      filters: { ...state.filters, search, page: 1 },
    }));
    get().fetchHistory();
  },

  setUserFilter: (userId?: string) => {
    set((state) => ({
      filters: { ...state.filters, userId, page: 1 },
    }));
    get().fetchHistory();
  },

  setDateRangePreset: (preset: 'all' | 'today' | '7d' | '30d') => {
    set((state) => ({
      filters: { ...state.filters, dateRangePreset: preset, page: 1 },
    }));
    get().fetchHistory();
  },

  setPage: (page: number) => {
    set((state) => ({
      filters: { ...state.filters, page },
    }));
    get().fetchHistory();
  },

  setLimit: (limit: number) => {
    set((state) => ({
      filters: { ...state.filters, limit, page: 1 },
    }));
    get().fetchHistory();
  },

  setSortOrder: (sortOrder: 'asc' | 'desc') => {
    set((state) => ({
      filters: { ...state.filters, sortOrder, page: 1 },
    }));
    get().fetchHistory();
  },

  setViewMode: (viewMode: 'timeline' | 'table') => set({ viewMode }),

  openDetailModal: (item: HistoryLogItem) => {
    set({ selectedItem: item, isDetailModalOpen: true });
  },

  closeDetailModal: () => {
    set({ selectedItem: null, isDetailModalOpen: false });
  },

  openExportModal: () => set({ isExportModalOpen: true }),
  closeExportModal: () => set({ isExportModalOpen: false }),

  exportData: async (format: 'csv' | 'json') => {
    set({ isExporting: true });
    try {
      const { filters } = get();
      const params: any = {
        format,
        limit: 1000,
      };

      if (filters.category && filters.category !== 'ALL') {
        params.category = filters.category;
      }
      if (filters.search && filters.search.trim()) {
        params.search = filters.search.trim();
      }
      if (filters.userId && filters.userId !== 'ALL') {
        params.userId = filters.userId;
      }

      if (format === 'csv') {
        const response = await api.get('/history/export', {
          params,
          responseType: 'blob',
        });

        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `cowork-audit-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const res: any = await api.get('/history/export', { params });
        const jsonStr = JSON.stringify(res.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `cowork-audit-${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      set({ isExportModalOpen: false });
    } catch (err) {
      console.error('Failed to export history logs', err);
    } finally {
      set({ isExporting: false });
    }
  },

  pruneLogs: async (days: number) => {
    try {
      const res: any = await api.delete('/history/prune', { data: { days } });
      await get().fetchHistory();
      await get().fetchStats();
      return { success: true, message: res.data?.message || 'Pruned successfully' };
    } catch (err: any) {
      console.error('Failed to prune logs', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to prune logs',
      };
    }
  },
}));

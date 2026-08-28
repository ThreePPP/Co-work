'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { DashboardSummary } from '../../../types';
import { StatCard } from '../../../components/dashboard/StatCard';
import { ActivityTrendChart } from '../../../components/dashboard/ActivityTrendChart';
import { TaskExecutionAndWorkloadCard } from '../../../components/dashboard/TaskExecutionAndWorkloadCard';
import { StorageBreakdownCard } from '../../../components/dashboard/StorageBreakdownCard';
import { OnlineColleagues } from '../../../components/dashboard/OnlineColleagues';
import { RecentFilesSection } from '../../../components/dashboard/RecentFilesSection';
import { Button } from '../../../components/ui/Button';
import { formatBytes } from '../../../lib/utils';
import { useTranslation } from '../../../lib/translations';
import {
  Users,
  CheckSquare,
  FolderOpen,
  MessageSquare,
  Loader2,
  History,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t, language } = useTranslation();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Admin access guard
  useEffect(() => {
    if (!user) return;
    if (user.role !== 'ADMIN') {
      router.replace('/messages');
      return;
    }

    const fetchDashboard = async () => {
      try {
        const res: any = await api.get('/dashboard/summary');
        if (res?.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  const stats = data?.stats || {
    totalMembers: 0,
    onlineMembers: 0,
    totalTasks: 0,
    totalFiles: 0,
    storageUsedBytes: 0,
    todayMessages: 0,
    unreadNotifications: 0,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Executive Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t('executiveDashboard')}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              Admin
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {t('dashboardDesc')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/history">
            <Button variant="secondary" size="sm" leftIcon={<History className="w-3.5 h-3.5" />}>
              {t('auditLogs')}
            </Button>
          </Link>
          <Link href="/tasks">
            <Button variant="primary" size="sm" leftIcon={<CheckSquare className="w-3.5 h-3.5" />}>
              {t('tasksTitle')}
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Top KPI StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('totalMembers')}
          value={stats.totalMembers}
          icon={Users}
          subtext={`${stats.onlineMembers} ${language === 'th' ? 'ออนไลน์อยู่ตอนนี้' : 'active right now'}`}
          trend={{ value: 'Live', isPositive: true }}
          href="/members"
        />
        <StatCard
          label={t('totalTasks')}
          value={stats.totalTasks}
          icon={CheckSquare}
          subtext={`${data?.taskAnalytics?.completionRate || 0}% ${language === 'th' ? 'เสร็จสมบูรณ์' : 'sprint completion'}`}
          trend={{ value: `${data?.taskAnalytics?.statusDistribution.DONE || 0} ${t('completed')}`, isPositive: true }}
          href="/tasks"
        />
        <StatCard
          label={t('messagesToday')}
          value={stats.todayMessages}
          icon={MessageSquare}
          subtext={language === 'th' ? 'ข้อความสนทนา' : 'Direct conversations'}
          trend={{ value: 'Live', isPositive: true }}
          href="/messages"
        />
        <StatCard
          label={t('storageUsed')}
          value={formatBytes(stats.storageUsedBytes)}
          icon={FolderOpen}
          subtext={`${stats.totalFiles} ${language === 'th' ? 'ไฟล์ในระบบ' : 'files in workspace'}`}
          trend={{ value: 'Safe', isPositive: true }}
          href="/files"
        />
      </div>

      {/* Row 1: Workspace Operational Velocity - 3 Separate Wide Cards (Tasks, Files, Members) */}
      <ActivityTrendChart
        data={data?.dailyActivityTrend || []}
        trends={data?.activityTrends}
      />

      {/* Row 2: Operations & Pipeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Unified Task Execution & Personnel Allocation (Spans 2 columns) */}
        <div className="lg:col-span-2">
          <TaskExecutionAndWorkloadCard
            analytics={data?.taskAnalytics}
            totalTasks={stats.totalTasks}
            departmentWorkload={data?.departmentWorkload}
            memberWorkload={data?.memberWorkload}
          />
        </div>

        {/* Right Stack: Storage Breakdown + Live Team Presence */}
        <div className="space-y-4">
          <StorageBreakdownCard
            storageUsedBytes={stats.storageUsedBytes}
            breakdown={data?.fileCategoryBreakdown}
          />
          <OnlineColleagues users={data?.onlineUsers || []} />
        </div>
      </div>

      {/* Row 3: Quick Shared Files Tray with Types & Previews (Full Width) */}
      <RecentFilesSection
        files={data?.recentFiles || []}
        totalCount={stats.totalFiles}
        totalSizeBytes={stats.storageUsedBytes}
        categoryBreakdown={data?.fileCategoryBreakdown}
      />
    </div>
  );
}

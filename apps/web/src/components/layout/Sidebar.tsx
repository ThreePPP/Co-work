'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Hash,
  FolderOpen,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  History,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation, TranslationKey } from '../../lib/translations';
import { Logo } from '../ui/Logo';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const isAdmin = user?.role === 'ADMIN';

  // Base navigation items with translation keys
  const allNavItems: Array<{
    name: string;
    key: TranslationKey;
    href: string;
    icon: any;
    adminOnly: boolean;
  }> = [
    {
      name: 'Dashboard',
      key: 'dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      adminOnly: true,
    },
    {
      name: 'Tasks & Projects',
      key: 'tasks',
      href: '/tasks',
      icon: CheckSquare,
      adminOnly: false,
    },
    {
      name: 'Messages',
      key: 'messages',
      href: '/messages',
      icon: MessageSquare,
      adminOnly: false,
    },
    {
      name: 'Files & Drive',
      key: 'files',
      href: '/files',
      icon: FolderOpen,
      adminOnly: false,
    },
    {
      name: 'Member Management',
      key: 'members',
      href: '/members',
      icon: Users,
      adminOnly: true,
    },
    {
      name: 'Activity History',
      key: 'history',
      href: '/history',
      icon: History,
      adminOnly: false,
    },
    {
      name: 'Settings',
      key: 'settings',
      href: '/settings',
      icon: Settings,
      adminOnly: false,
    },
  ];

  // Filter items: only ADMIN can see Dashboard and Members
  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  const homeHref = isAdmin ? '/dashboard' : '/messages';

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 z-40 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 select-none shadow-xl md:shadow-none',
          sidebarCollapsed ? 'w-20' : 'w-64',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="relative flex items-center justify-center h-20 px-4 border-b border-slate-800/80 transition-all duration-300">
          <Link
            href={homeHref}
            className="flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-105"
            title="Co-work Workspace"
          >
            <Logo size="md" />
          </Link>

          {/* Clean Edge Collapse/Expand Toggle Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden md:flex items-center justify-center rounded-full bg-slate-900 border border-slate-700 shadow-md text-slate-400 hover:text-white hover:border-indigo-500 hover:bg-slate-800 transition-all cursor-pointer absolute -right-3 top-7 w-6 h-6 z-50 select-none"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {/* Main Links */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {t('mainMenu')}
              </p>
            )}
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              const Icon = item.icon;
              const label = t(item.key);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group relative',
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  )}
                  title={sidebarCollapsed ? label : undefined}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0 transition-colors',
                      isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                    )}
                  />
                  {!sidebarCollapsed && (
                    <span className="flex-1 truncate">{label}</span>
                  )}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
};

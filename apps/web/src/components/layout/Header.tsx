'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Bell,
  CheckCheck,
  Check,
  User as UserIcon,
  Shield,
  LogOut,
  MessageSquare,
  CheckSquare,
  FileText,
  AlertCircle,
  ExternalLink,
  Languages,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from '../../lib/translations';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { api } from '../../lib/api';
import { NotificationItem } from '../../types';
import { formatRelativeTime } from '../../lib/utils';

export const Header: React.FC = () => {
  const router = useRouter();
  const { setMobileSidebarOpen, toggleLanguage, language } = useUIStore();
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res: any = await api.get('/dashboard/notifications');
        if (res?.data) {
          setNotifications(res.data);
        }
      } catch (err) {}
    };

    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Click outside listeners to close popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      await api.post('/dashboard/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markSingleAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/dashboard/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markSingleAsRead(item.id);
    }
    setShowNotifications(false);
    if (item.link) {
      router.push(item.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
      case 'TASK_STATUS_CHANGED':
      case 'TASK_COMMENT':
        return <CheckSquare className="w-4 h-4 text-indigo-400" />;
      case 'MESSAGE':
      case 'MENTION':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'FILE_UPLOAD':
        return <FileText className="w-4 h-4 text-amber-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80">
      {/* Left: Mobile Menu Button (Shown only on small screens) */}
      <div className="flex items-center">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 md:hidden transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right: Language Selector, Notifications & User Profile */}
      <div className="flex items-center gap-2 md:gap-3 ml-auto">
        {/* Language Selector Button */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center justify-center px-2.5 py-1.5 rounded-xl text-xs font-black tracking-wider transition-all bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 shadow-xs cursor-pointer select-none min-w-[38px]"
          title={language === 'th' ? 'Switch to EN' : 'Switch to TH'}
        >
          {language === 'th' ? 'TH' : 'EN'}
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className={`relative p-2 rounded-xl transition-colors ${
              showNotifications
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={t('notifications')}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-slate-900 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden z-50 animate-fade-in backdrop-blur-xl">
              <div className="flex items-center justify-between p-4 px-5 border-b border-slate-800 bg-slate-900/90">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">{t('notifications')}</h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold border border-indigo-500/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    {t('markAllRead')}
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-300">{t('allCaughtUp')}</p>
                    <p className="text-[11px] text-slate-500">{t('allCaughtUpDesc')}</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3.5 px-4.5 hover:bg-slate-800/50 transition-colors cursor-pointer group flex items-start gap-3 ${
                        !n.isRead ? 'bg-indigo-950/25' : ''
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/60 mt-0.5 flex-shrink-0">
                        {getNotificationIcon(n.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-500 flex-shrink-0">
                            {formatRelativeTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      </div>

                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={(e) => markSingleAsRead(n.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-all flex-shrink-0"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition-all"
          >
            <Avatar
              name={user?.name || 'User'}
              src={user?.avatarUrl}
              status={user?.status || 'ONLINE'}
              size="sm"
            />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-100 max-w-[120px] truncate leading-tight">
                {user?.name}
              </span>
              <span className="text-[10px] text-slate-400 font-medium leading-tight">
                {user?.role}
              </span>
            </div>
          </button>

          {/* User Dropdown Popover */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden z-50 animate-fade-in p-1.5 backdrop-blur-xl">
              <div className="p-3 border-b border-slate-800">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <div className="mt-2">
                  <Badge variant={user?.role === 'ADMIN' ? 'danger' : 'primary'} size="sm">
                    {user?.role}
                  </Badge>
                </div>
              </div>

              <div className="py-1 space-y-0.5">
                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>{t('personalSettings')}</span>
                </Link>

                {user?.role === 'ADMIN' && (
                  <Link
                    href="/members"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <Shield className="w-4 h-4 text-indigo-400" />
                    <span>{t('memberManagement')}</span>
                  </Link>
                )}
              </div>

              <div className="pt-1 border-t border-slate-800">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logOut')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

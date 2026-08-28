'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Globe,
  User as UserIcon,
  Shield,
  ArrowUpRight,
  Fingerprint,
  CheckSquare,
  FolderOpen,
} from 'lucide-react';
import { useHistoryStore } from '../../stores/historyStore';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const HistoryDetailModal: React.FC = () => {
  const { selectedItem, isDetailModalOpen, closeDetailModal } = useHistoryStore();

  if (!selectedItem) return null;

  const createdAt = new Date(selectedItem.createdAt);
  const localDate = createdAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const localTime = createdAt.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const getQuickLink = (action: string) => {
    if (action.includes('TASK')) return { href: '/tasks', label: 'Open Tasks & Projects', icon: CheckSquare };
    if (action.includes('FILE')) return { href: '/files', label: 'Open Files & Drive', icon: FolderOpen };
    if (action.includes('USER') || action.includes('ROLE')) return { href: '/members', label: 'Open Member Management', icon: UserIcon };
    return null;
  };

  const quickLink = getQuickLink(selectedItem.action);
  const QuickLinkIcon = quickLink?.icon;

  return (
    <Modal
      isOpen={isDetailModalOpen}
      onClose={closeDetailModal}
      title="Activity Log Details"
      description="Comprehensive metadata and security trace for this event record."
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Action Type</span>
            <Badge variant="primary" size="md">
              {selectedItem.action}
            </Badge>
          </div>
          <p className="text-sm font-semibold text-white mt-1">
            {selectedItem.details || 'No additional summary details recorded.'}
          </p>
        </div>

        {/* User Card */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
            Operator Details
          </h4>
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <Avatar
              name={selectedItem.user?.name || 'System'}
              src={selectedItem.user?.avatarUrl}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white truncate">
                  {selectedItem.user?.name || 'System Automator'}
                </span>
                {selectedItem.user?.isArchived && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">
                    Archived Member
                  </span>
                )}
                {selectedItem.user?.role && !selectedItem.user?.isArchived && (
                  <Badge role={selectedItem.user.role} size="sm" />
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">
                {selectedItem.user?.email || 'system@cowork.internal'}
              </p>
              {selectedItem.user?.department && (
                <p className="text-[11px] text-indigo-400 mt-0.5">
                  {selectedItem.user.department} • {selectedItem.user?.position || 'Team Member'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* System & Audit Metadata */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            Audit Trace & Telemetry
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Date & Time</span>
              </div>
              <p className="font-semibold text-slate-200">{localDate}</p>
              <p className="text-slate-400 text-[11px] mt-0.5">{localTime}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>IP Address & Network</span>
              </div>
              <p className="font-mono text-slate-200 font-semibold">
                {selectedItem.ipAddress || 'Internal Workspace Event'}
              </p>
              <p className="text-slate-400 text-[11px] mt-0.5">Secure Transport Protocol</p>
            </div>

            <div className="sm:col-span-2 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Fingerprint className="w-3.5 h-3.5 text-indigo-400" />
                <span>Log Unique Identifier (UUID)</span>
              </div>
              <p className="font-mono text-[11px] text-slate-300 break-all select-all">
                {selectedItem.id}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          {quickLink && QuickLinkIcon ? (
            <Link href={quickLink.href} onClick={closeDetailModal}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<QuickLinkIcon className="w-3.5 h-3.5 text-indigo-400" />}
                rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
              >
                {quickLink.label}
              </Button>
            </Link>
          ) : (
            <div />
          )}

          <Button variant="secondary" size="sm" onClick={closeDetailModal}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

'use client';

import React from 'react';
import { HardDrive, FileText, Image, Film, Music, Archive, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { formatBytes } from '../../lib/utils';

interface CategoryItem {
  category: string;
  count: number;
  sizeBytes: number;
  percentage: number;
}

interface StorageBreakdownCardProps {
  storageUsedBytes: number;
  breakdown?: CategoryItem[];
}

export const StorageBreakdownCard: React.FC<StorageBreakdownCardProps> = ({
  storageUsedBytes,
  breakdown = [],
}) => {
  const storageLimit = 10 * 1024 * 1024 * 1024; // 10 GB
  const storagePercent = Math.min((storageUsedBytes / storageLimit) * 100, 100);

  const getCategoryMeta = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case 'DOCUMENT':
        return { icon: FileText, label: 'Documents', color: 'text-blue-400' };
      case 'IMAGE':
        return { icon: Image, label: 'Images', color: 'text-emerald-400' };
      case 'VIDEO':
        return { icon: Film, label: 'Videos', color: 'text-purple-400' };
      case 'AUDIO':
        return { icon: Music, label: 'Audio', color: 'text-amber-400' };
      case 'ARCHIVE':
        return { icon: Archive, label: 'Archives', color: 'text-rose-400' };
      default:
        return { icon: FileText, label: 'Other', color: 'text-slate-400' };
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 shadow-xs flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/70 pb-3">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-amber-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Drive Storage Quota</h3>
            <p className="text-[11px] text-slate-400">Workspace cloud allocation</p>
          </div>
        </div>

        <Link
          href="/files"
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 group"
        >
          Drive <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* Global Progress Bar */}
      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-300 font-mono font-medium">
            {formatBytes(storageUsedBytes)} <span className="text-slate-500">/ 10 GB</span>
          </span>
          <span className="text-xs font-mono font-semibold text-amber-400">
            {storagePercent.toFixed(1)}%
          </span>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-amber-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(storagePercent, 2)}%` }}
          />
        </div>
      </div>

      {/* Categories Breakdown */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          Breakdown by Asset Type
        </p>
        {breakdown.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">No files uploaded yet.</p>
        ) : (
          breakdown.map((item) => {
            const meta = getCategoryMeta(item.category);
            const Icon = meta.icon;

            return (
              <div key={item.category} className="flex items-center justify-between text-xs py-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`w-3.5 h-3.5 ${meta.color} flex-shrink-0`} />
                  <span className="text-slate-300 font-medium truncate">{meta.label}</span>
                  <span className="text-[11px] text-slate-500 font-mono">({item.count})</span>
                </div>
                <span className="font-mono text-slate-400 text-[11px]">
                  {formatBytes(item.sizeBytes)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="pt-2.5 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400">
        <span className="text-[11px]">Persistent Storage Volume</span>
        <span className="text-[11px] text-emerald-400 font-mono font-medium">Healthy</span>
      </div>
    </div>
  );
};

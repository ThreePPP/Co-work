'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FileItem } from '../../types';
import { Avatar } from '../ui/Avatar';
import { formatBytes, formatRelativeTime } from '../../lib/utils';
import {
  FolderOpen,
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  Download,
  FileCode,
  Play,
} from 'lucide-react';

interface RecentFilesSectionProps {
  files: FileItem[];
  totalCount: number;
  totalSizeBytes: number;
  categoryBreakdown?: Array<{
    category: string;
    count: number;
    sizeBytes: number;
    percentage: number;
  }>;
}

export const RecentFilesSection: React.FC<RecentFilesSectionProps> = ({
  files = [],
  totalCount = 0,
  totalSizeBytes = 0,
  categoryBreakdown = [],
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const getCategoryMeta = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case 'DOCUMENT':
        return {
          icon: FileText,
          label: 'Doc',
          badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          iconColor: 'text-blue-400',
        };
      case 'IMAGE':
        return {
          icon: ImageIcon,
          label: 'Image',
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          iconColor: 'text-emerald-400',
        };
      case 'VIDEO':
        return {
          icon: Film,
          label: 'Video',
          badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          iconColor: 'text-purple-400',
        };
      case 'AUDIO':
        return {
          icon: Music,
          label: 'Audio',
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          iconColor: 'text-amber-400',
        };
      case 'ARCHIVE':
        return {
          icon: Archive,
          label: 'Archive',
          badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          iconColor: 'text-rose-400',
        };
      default:
        return {
          icon: FileCode,
          label: 'File',
          badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          iconColor: 'text-slate-400',
        };
    }
  };

  const filteredFiles =
    selectedCategory === 'ALL'
      ? files
      : files.filter((f) => f.category?.toUpperCase() === selectedCategory);

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 shadow-xs space-y-4">
      {/* Header & Quick Links */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/70 pb-4">
        <div className="flex items-center gap-2.5">
          <FolderOpen className="w-4 h-4 text-amber-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">
              Recent Shared Files
            </h3>
            <p className="text-xs text-slate-400">
              <span className="text-slate-200 font-medium tabular-nums">{totalCount} files</span> in drive ({formatBytes(totalSizeBytes)})
            </p>
          </div>
        </div>

        <Link
          href="/files"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 hover:text-white border border-slate-700/60 transition-colors self-start sm:self-auto group"
        >
          <span>Open Drive</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
            selectedCategory === 'ALL'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>All ({totalCount})</span>
        </button>

        {categoryBreakdown.map((cat) => {
          const meta = getCategoryMeta(cat.category);
          const isSelected = selectedCategory === cat.category.toUpperCase();

          return (
            <button
              key={cat.category}
              onClick={() => setSelectedCategory(cat.category.toUpperCase())}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{meta.label}</span>
              <span className="text-[11px] opacity-75 font-mono">({cat.count})</span>
            </button>
          );
        })}
      </div>

      {/* Files Grid with Photo & Video Cover Preview */}
      {filteredFiles.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/40 border border-slate-800/50 rounded-xl text-slate-400">
          <p className="text-xs font-medium text-slate-300">No files found in this category</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Upload new files in Company Drive to collaborate with your team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {filteredFiles.map((file) => {
            const meta = getCategoryMeta(file.category);
            const Icon = meta.icon;
            const isImage = file.category === 'IMAGE' || file.mimeType?.startsWith('image/');
            const isVideo = file.category === 'VIDEO' || file.mimeType?.startsWith('video/');
            const isAudio = file.category === 'AUDIO' || file.mimeType?.startsWith('audio/');

            return (
              <div
                key={file.id}
                className="group flex flex-col justify-between rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors overflow-hidden"
              >
                {/* 1. Thumbnail / Preview Box */}
                <div className="relative h-24 w-full bg-slate-900 flex items-center justify-center border-b border-slate-800/60 overflow-hidden">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.url}
                      alt={file.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : isVideo ? (
                    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
                      <video
                        src={`${file.url}#t=0.5`}
                        preload="metadata"
                        muted
                        playsInline
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-slate-900/90 border border-white/10 flex items-center justify-center text-white">
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : isAudio ? (
                    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900 text-amber-400 gap-1">
                      <Music className="w-5 h-5" />
                      <span className="text-[10px] text-amber-400/80 font-mono">Audio</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900 gap-1">
                      <Icon className={`w-5 h-5 ${meta.iconColor}`} />
                      <span className="text-[10px] text-slate-400 font-mono">{meta.label}</span>
                    </div>
                  )}

                  {/* Top-Right Category Pill */}
                  <div className="absolute top-1.5 right-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium border font-mono ${meta.badgeColor}`}>
                      {meta.label}
                    </span>
                  </div>
                </div>

                {/* 2. File Metadata & Uploader */}
                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <p
                      className="text-xs font-medium text-slate-200 truncate group-hover:text-indigo-300 transition-colors"
                      title={file.originalName}
                    >
                      {file.originalName}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                      <span>{formatBytes(file.size)}</span>
                      <span>{formatRelativeTime(file.createdAt)}</span>
                    </div>
                  </div>

                  {/* 3. Bottom Row: Uploader + Download Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5 min-w-0 pr-1">
                      {file.uploader && (
                        <>
                          <Avatar
                            name={file.uploader.name}
                            src={file.uploader.avatarUrl}
                            size="xs"
                          />
                          <span className="text-[10px] text-slate-400 truncate max-w-[70px]">
                            {file.uploader.name.split(' ')[0]}
                          </span>
                        </>
                      )}
                    </div>

                    <a
                      href={file.url}
                      download={file.originalName}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors flex-shrink-0"
                      title={`Download ${file.originalName}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

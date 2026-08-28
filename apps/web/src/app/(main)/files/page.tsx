'use client';

import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../stores/authStore';
import { useUIStore } from '../../../stores/uiStore';
import { FileItem, FileCategory } from '../../../types';
import { formatBytes, formatRelativeTime } from '../../../lib/utils';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { useTranslation } from '../../../lib/translations';
import {
  FolderOpen,
  Upload,
  Search,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  File,
  Loader2,
  HardDrive,
  CheckCircle2,
  Play,
  Eye,
  ExternalLink,
} from 'lucide-react';

export default function FilesPage() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const { t, language } = useTranslation();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [stats, setStats] = useState<{ totalFiles: number; totalSize: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [fileToDelete, setFileToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/files', {
        params: {
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          search: search || undefined,
        },
      });
      if (res?.data) {
        setFiles(res.data.files || []);
        setStats({
          totalFiles: res.data.totalFiles || 0,
          totalSize: res.data.totalSizeBytes || 0,
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error loading files',
        message: err.message || 'Failed to fetch files from server',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [selectedCategory, search]);

  const handleUpload = async (file: globalThis.File) => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res: any = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addToast({
        type: 'success',
        title: 'File Uploaded',
        message: `${file.name} uploaded successfully`,
      });
      fetchFiles();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: err.message || 'Failed to upload file',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/files/${fileToDelete.id}`);
      addToast({
        type: 'success',
        title: 'File Deleted',
        message: `${fileToDelete.name} was removed.`,
      });
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setFileToDelete(null);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Failed to delete file',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const categories = [
    { label: language === 'th' ? 'ไฟล์ทั้งหมด' : 'All Files', value: 'ALL' },
    { label: language === 'th' ? 'เอกสาร' : 'Documents', value: 'DOCUMENT' },
    { label: language === 'th' ? 'รูปภาพ' : 'Images', value: 'IMAGE' },
    { label: language === 'th' ? 'วิดีโอ' : 'Videos', value: 'VIDEO' },
    { label: language === 'th' ? 'เสียง' : 'Audio', value: 'AUDIO' },
    { label: language === 'th' ? 'ไฟล์บีบอัด' : 'Archives', value: 'ARCHIVE' },
  ];

  const getCategoryIcon = (category: FileCategory) => {
    switch (category) {
      case 'IMAGE':
        return <ImageIcon className="w-5 h-5 text-indigo-400" />;
      case 'DOCUMENT':
        return <FileText className="w-5 h-5 text-emerald-400" />;
      case 'VIDEO':
        return <Film className="w-5 h-5 text-purple-400" />;
      case 'AUDIO':
        return <Music className="w-5 h-5 text-pink-400" />;
      case 'ARCHIVE':
        return <Archive className="w-5 h-5 text-amber-400" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FolderOpen className="w-6 h-6 text-indigo-400" />
            {t('filesTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('filesDesc')}
          </p>
        </div>

        {/* Upload Trigger Button */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) handleUpload(e.target.files[0]);
            }}
            className="hidden"
          />
          <Button
            variant="gradient"
            leftIcon={isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (language === 'th' ? 'กำลังอัปโหลด...' : 'Uploading...') : t('uploadFile')}
          </Button>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`p-6 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-indigo-400">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-200">
            {language === 'th' ? (
              <>ลากและวางไฟล์ที่นี่ หรือ <span className="text-indigo-400 underline">เลือกไฟล์</span></>
            ) : (
              <>Drag and drop files here, or <span className="text-indigo-400 underline">browse</span></>
            )}
          </p>
          <p className="text-xs text-slate-400">
            {language === 'th' ? 'รองรับ PDF, Word, Excel, PNG, JPG, MP4, ZIP สูงสุด 100MB' : 'Supports PDF, Word, Excel, PNG, JPG, MP4, ZIP up to 100MB'}
          </p>
        </div>
      </div>

      {/* Storage & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.value
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'th' ? 'ค้นหาไฟล์...' : 'Search files...'}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Files Grid / List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : files.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-3xl text-slate-400">
          <FolderOpen className="w-10 h-10 mx-auto mb-2 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-200">No files found</h3>
          <p className="text-xs mt-1">Upload files using the button above to populate your workspace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file) => {
            const isImage = file.category === 'IMAGE' || file.mimeType.startsWith('image/');
            const isVideo = file.category === 'VIDEO' || file.mimeType.startsWith('video/');
            const isAudio = file.category === 'AUDIO' || file.mimeType.startsWith('audio/');
            const canDelete = file.uploaderId === user?.id || user?.role === 'ADMIN';

            return (
              <div
                key={file.id}
                className="group flex flex-col justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all backdrop-blur-md shadow-lg"
              >
                {/* File Thumbnail or Icon Header */}
                <div className="space-y-3">
                  <div
                    onClick={() => setPreviewFile(file)}
                    className="relative h-36 w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-700/50 cursor-pointer group/thumb"
                  >
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={file.url}
                        alt={file.originalName}
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                      />
                    ) : isVideo ? (
                      <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
                        <video
                          src={`${file.url}#t=0.5`}
                          preload="metadata"
                          muted
                          playsInline
                          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300 pointer-events-none"
                        />
                        {/* Play button overlay */}
                        <div className="absolute inset-0 bg-black/40 group-hover/thumb:bg-black/20 flex items-center justify-center transition-colors">
                          <div className="w-10 h-10 rounded-full bg-slate-900/90 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg group-hover/thumb:scale-110 group-hover/thumb:bg-indigo-600 transition-all text-white">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>
                        {/* VIDEO Badge */}
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm border border-white/10 text-[10px] font-bold text-white flex items-center gap-1">
                          <Film className="w-3 h-3 text-indigo-400" />
                          <span>VIDEO</span>
                        </div>
                      </div>
                    ) : isAudio ? (
                      <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-amber-500/5 text-amber-400 gap-2">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                          <Music className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Audio Track</span>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-900 text-indigo-400">
                        {getCategoryIcon(file.category)}
                      </div>
                    )}

                    {/* Quick Preview Hover Action Icon */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover/thumb:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm rounded-lg p-1 text-white">
                      <Eye className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Info */}
                  <div>
                    <h4
                      onClick={() => setPreviewFile(file)}
                      className="text-xs font-bold text-slate-200 truncate group-hover:text-indigo-300 transition-colors cursor-pointer"
                      title={file.originalName}
                    >
                      {file.originalName}
                    </h4>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                      <span>{formatBytes(file.size)}</span>
                      <span>{formatRelativeTime(file.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer with Uploader & Actions */}
                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0" title={`Uploaded by ${file.uploader?.name}`}>
                    <Avatar
                      name={file.uploader?.name || 'User'}
                      src={file.uploader?.avatarUrl}
                      size="xs"
                    />
                    <span className="text-[11px] text-slate-400 truncate max-w-[80px]">
                      {file.uploader?.name?.split(' ')[0]}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewFile(file)}
                      className="p-1.5 text-slate-400 hover:text-indigo-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={file.url}
                      download={file.originalName}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    {canDelete && (
                      <button
                        onClick={() => setFileToDelete({ id: file.id, name: file.originalName })}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <Modal
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          title={previewFile.originalName}
          description={`${formatBytes(previewFile.size)} • Uploaded by ${previewFile.uploader?.name || 'Member'}`}
          maxWidth={previewFile.category === 'VIDEO' || previewFile.category === 'IMAGE' ? '2xl' : 'lg'}
        >
          <div className="space-y-4">
            {/* Media Viewer */}
            <div className="w-full rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800 shadow-2xl">
              {previewFile.category === 'VIDEO' || previewFile.mimeType.startsWith('video/') ? (
                <video
                  src={previewFile.url}
                  controls
                  autoPlay
                  className="w-full max-h-[65vh] rounded-2xl aspect-video bg-black object-contain"
                />
              ) : previewFile.category === 'IMAGE' || previewFile.mimeType.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewFile.url}
                  alt={previewFile.originalName}
                  className="w-full max-h-[65vh] object-contain rounded-2xl p-2"
                />
              ) : previewFile.category === 'AUDIO' || previewFile.mimeType.startsWith('audio/') ? (
                <div className="p-8 flex flex-col items-center justify-center space-y-4 w-full">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Music className="w-8 h-8" />
                  </div>
                  <audio src={previewFile.url} controls autoPlay className="w-full max-w-md" />
                </div>
              ) : (
                <div className="p-12 flex flex-col items-center justify-center space-y-3 text-center">
                  <div className="p-4 rounded-2xl bg-slate-900 text-indigo-400">
                    {getCategoryIcon(previewFile.category)}
                  </div>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Preview is not available for this file type. You can download or open it in a new browser tab.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Toolbar */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">
                  {previewFile.category}
                </Badge>
                <span className="text-xs text-slate-400">
                  {formatRelativeTime(previewFile.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Tab</span>
                </a>

                <a
                  href={previewFile.url}
                  download={previewFile.originalName}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete File Confirmation Modal */}
      <ConfirmModal
        isOpen={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={confirmDeleteFile}
        title="Delete File"
        description="Are you sure you want to delete this file from storage? This action cannot be undone."
        itemTitle={fileToDelete?.name}
        confirmText="Delete File"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

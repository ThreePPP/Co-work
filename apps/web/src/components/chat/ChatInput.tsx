'use client';

import React, { useState, useRef } from 'react';
import { Paperclip, Send, X, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { formatBytes } from '../../lib/utils';
import { FileItem } from '../../types';

interface ChatInputProps {
  placeholder?: string;
  onSendMessage: (content: string, attachmentIds?: string[]) => Promise<void>;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  placeholder = 'Type a message...',
  onSendMessage,
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res: any = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res?.data) {
        setAttachments((prev) => [...prev, res.data]);
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = async () => {
    if ((!content.trim() && attachments.length === 0) || isSending) return;

    setIsSending(true);
    try {
      const attachmentIds = attachments.map((a) => a.id);
      await onSendMessage(content.trim() || 'Attached file(s)', attachmentIds);
      setContent('');
      setAttachments([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-slate-900/90 border-t border-slate-800">
      {/* Attached Files Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200"
            >
              <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
              <span className="max-w-[150px] truncate">{file.originalName}</span>
              <span className="text-[10px] text-slate-400">({formatBytes(file.size)})</span>
              <button
                onClick={() => removeAttachment(file.id)}
                className="text-slate-400 hover:text-rose-400 p-0.5 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Box Area */}
      <div className="flex items-end gap-2 bg-slate-800/70 border border-slate-700/80 rounded-2xl p-2 focus-within:border-indigo-500 transition-colors">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Attach File Button */}
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-700/60 transition-colors flex-shrink-0 disabled:opacity-50"
          title="Attach file"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          ) : (
            <Paperclip className="w-5 h-5" />
          )}
        </button>

        {/* Textarea */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 bg-transparent text-slate-100 placeholder-slate-400 text-xs sm:text-sm resize-none focus:outline-none py-1.5 px-2 max-h-32 min-h-[24px]"
        />

        {/* Send Button */}
        <button
          type="button"
          disabled={(!content.trim() && attachments.length === 0) || isSending}
          onClick={handleSend}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/20 transition-all flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
          title="Send message"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      <p className="text-[10px] text-slate-400 mt-1.5 px-1">
        Press <span className="font-semibold text-slate-300">Enter</span> to send, <span className="font-semibold text-slate-300">Shift + Enter</span> for new line
      </p>
    </div>
  );
};

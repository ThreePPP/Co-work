'use client';

import React, { useState } from 'react';
import { Message, User } from '../../types';
import { Avatar } from '../ui/Avatar';
import { ConfirmModal } from '../ui/ConfirmModal';
import { formatMessageTime, formatBytes } from '../../lib/utils';
import {
  FileText,
  Download,
  Pin,
  Edit3,
  Trash2,
  Check,
  X,
  FileSpreadsheet,
  FileCode,
  Archive,
  Smile,
  ExternalLink,
} from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';

const QUICK_EMOJIS = ['👍', '❤️', '🚀', '🎉', '👀', '🔥'];

interface MessageItemProps {
  message: Message;
  currentUser: User | null;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUser,
  onEdit,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { editMessage, deleteMessage, toggleReaction } = useChatStore();
  const isMine = currentUser?.id === message.senderId;

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await editMessage(message.id, editContent);
      if (onEdit) onEdit(message.id, editContent);
      setIsEditing(false);
    } catch (e) {
      console.error('Failed to edit message', e);
    }
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteMessage = async () => {
    setIsDeleting(true);
    try {
      await deleteMessage(message.id);
      if (onDelete) onDelete(message.id);
      setIsDeleteModalOpen(false);
    } catch (e) {
      console.error('Failed to delete message', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReactionClick = async (emoji: string) => {
    await toggleReaction(message.id, emoji);
    setShowEmojiPicker(false);
  };

  // Group reactions by emoji
  const groupedReactions = (message.reactions || []).reduce<{
    [emoji: string]: { count: number; users: string[]; hasReacted: boolean };
  }>((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = { count: 0, users: [], hasReacted: false };
    }
    acc[r.emoji].count += 1;
    acc[r.emoji].users.push(r.user?.name || 'User');
    if (r.userId === currentUser?.id) {
      acc[r.emoji].hasReacted = true;
    }
    return acc;
  }, {});

  // Extract first URL if present for Link Preview
  const urlMatch = message.content.match(/(https?:\/\/[^\s]+)/g);
  const detectedUrl = urlMatch ? urlMatch[0] : null;

  const renderFileIcon = (mimeType: string) => {
    if (mimeType.includes('sheet') || mimeType.includes('csv')) {
      return <FileSpreadsheet className="w-6 h-6 text-emerald-400" />;
    }
    if (mimeType.includes('code') || mimeType.includes('json') || mimeType.includes('javascript')) {
      return <FileCode className="w-6 h-6 text-cyan-400" />;
    }
    if (mimeType.includes('zip') || mimeType.includes('archive')) {
      return <Archive className="w-6 h-6 text-amber-400" />;
    }
    return <FileText className="w-6 h-6 text-indigo-400" />;
  };

  return (
    <div
      className={`group relative flex items-start gap-3.5 px-4 py-2 hover:bg-slate-800/30 transition-colors rounded-2xl ${
        message.isPinned ? 'bg-indigo-950/20 border-l-2 border-indigo-500' : ''
      }`}
    >
      <Avatar
        name={message.sender?.name || 'User'}
        src={message.sender?.avatarUrl}
        size="md"
        className="mt-0.5"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-bold text-slate-100 hover:underline cursor-pointer">
            {message.sender?.name}
          </span>
          {message.sender?.position && (
            <span className="text-[10px] text-slate-400 font-medium">
              • {message.sender.position}
            </span>
          )}
          <span className="text-[10px] text-slate-500">
            {formatMessageTime(message.createdAt)}
          </span>
          {message.isEdited && (
            <span className="text-[10px] text-slate-500 italic">(edited)</span>
          )}
          {message.isPinned && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
              <Pin className="w-3 h-3" /> Pinned
            </span>
          )}
        </div>

        {/* Message Body or Edit Mode */}
        {isEditing ? (
          <div className="mt-1 space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              rows={2}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveEdit}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
              >
                <Check className="w-3.5 h-3.5" /> Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed break-words whitespace-pre-wrap">
            {message.content}
          </p>
        )}

        {/* Link Preview Card */}
        {detectedUrl && !message.attachments?.length && (
          <a
            href={detectedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 block p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all max-w-md group/link"
          >
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="truncate">{new URL(detectedUrl).hostname}</span>
            </div>
            <p className="text-xs text-slate-300 mt-1 line-clamp-1 group-hover/link:text-white">
              {detectedUrl}
            </p>
          </a>
        )}

        {/* File Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
            {message.attachments.map((file) => {
              const isImage = file.category === 'IMAGE' || file.mimeType.startsWith('image/');
              return (
                <div
                  key={file.id}
                  className="group/file flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/70 hover:border-indigo-500/50 transition-colors"
                >
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.url}
                      alt={file.originalName}
                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="p-2.5 rounded-lg bg-slate-800 flex-shrink-0">
                      {renderFileIcon(file.mimeType)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate" title={file.originalName}>
                      {file.originalName}
                    </p>
                    <p className="text-[10px] text-slate-400">{formatBytes(file.size)}</p>
                  </div>

                  <a
                    href={file.url}
                    download={file.originalName}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {/* Emoji Reactions Pills */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {Object.entries(groupedReactions).map(([emoji, { count, users, hasReacted }]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReactionClick(emoji)}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all ${
                  hasReacted
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-sm'
                    : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                }`}
                title={`Reacted by: ${users.join(', ')}`}
              >
                <span>{emoji}</span>
                <span className="text-[10px] font-bold">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Quick Action & Emoji Menu on Hover */}
      {!isEditing && (
        <div className="absolute right-3 top-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-1 shadow-2xl backdrop-blur-md transition-all z-10">
          {/* Add Reaction Smile Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              showEmojiPicker
                ? 'bg-indigo-600/20 text-indigo-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Add reaction"
          >
            <Smile className="w-4 h-4" />
          </button>

          {/* Edit / Delete Options (Author Only) */}
          {isMine && (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                title="Edit message"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Delete message"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Popover Emoji Picker Expanded */}
          {showEmojiPicker && (
            <div className="absolute right-0 top-10 p-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex items-center gap-1.5 z-20 animate-fade-in">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleReactionClick(emoji)}
                  className="p-1.5 hover:bg-slate-800 rounded-xl text-base transition-transform hover:scale-125 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Message Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteMessage}
        title="Delete Message"
        description="Are you sure you want to delete this message? This message will be permanently removed for all members in the conversation."
        confirmText="Delete Message"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

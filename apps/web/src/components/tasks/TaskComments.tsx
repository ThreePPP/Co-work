'use client';

import React, { useState } from 'react';
import { TaskComment } from '../../types';
import { Avatar } from '../ui/Avatar';
import { formatRelativeTime } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { ConfirmModal } from '../ui/ConfirmModal';
import { MessageSquare, Send, Edit3, Trash2, Check, X, Loader2 } from 'lucide-react';

interface TaskCommentsProps {
  comments?: TaskComment[];
  onSendComment: (content: string) => Promise<void>;
  onUpdateComment?: (commentId: string, content: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({
  comments = [],
  onSendComment,
  onUpdateComment,
  onDeleteComment,
}) => {
  const { user: currentUser } = useAuthStore();
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Edit state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete state
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSending) return;
    setIsSending(true);
    try {
      await onSendComment(commentText.trim());
      setCommentText('');
    } finally {
      setIsSending(false);
    }
  };

  const startEdit = (comment: TaskComment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.content);
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const saveEdit = async (commentId: string) => {
    if (!editText.trim() || !onUpdateComment || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      await onUpdateComment(commentId, editText.trim());
      setEditingCommentId(null);
      setEditText('');
    } catch (err) {
      console.error('Failed to update comment', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCommentId || !onDeleteComment || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDeleteComment(deletingCommentId);
      setDeletingCommentId(null);
    } catch (err) {
      console.error('Failed to delete comment', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md space-y-5">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-indigo-400" />
        Task Collaboration & Discussion ({comments?.length || 0})
      </h3>

      {/* Comments Stream */}
      <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
        {!comments || comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs text-center space-y-1">
            <MessageSquare className="w-6 h-6 text-slate-600" />
            <p>No discussion comments yet. Start the conversation with your team!</p>
          </div>
        ) : (
          comments.map((comment) => {
            // Strictly ONLY the author can edit or delete their own comment
            const isAuthor =
              currentUser?.id === comment.user?.id ||
              currentUser?.id === (comment as any).userId;
            const isEditingThis = editingCommentId === comment.id;

            return (
              <div key={comment.id} className="flex items-start gap-3 text-xs sm:text-sm group">
                <Avatar
                  name={comment.user.name}
                  src={comment.user.avatarUrl}
                  size="sm"
                />
                <div className="flex-1 bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4 transition-colors hover:border-slate-600/70">
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{comment.user.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>

                    {/* Edit & Delete Action Buttons (Strictly Author Only) */}
                    {!isEditingThis && isAuthor && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onUpdateComment && (
                          <button
                            type="button"
                            onClick={() => startEdit(comment)}
                            className="p-1 text-slate-400 hover:text-indigo-300 hover:bg-slate-700/80 rounded-lg transition-colors cursor-pointer"
                            title="Edit comment"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteComment && (
                          <button
                            type="button"
                            onClick={() => setDeletingCommentId(comment.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Comment Body or Inline Editor */}
                  {isEditingThis ? (
                    <div className="space-y-2 mt-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') cancelEdit();
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            saveEdit(comment.id);
                          }
                        }}
                        rows={3}
                        className="w-full bg-slate-900 border border-indigo-500/60 rounded-xl p-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                        placeholder="Edit your comment... (Ctrl+Enter to save, Esc to cancel)"
                        autoFocus
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500">
                          กด Esc เพื่อยกเลิก, Ctrl+Enter เพื่อบันทึก
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={isSavingEdit}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEdit(comment.id)}
                            disabled={isSavingEdit || !editText.trim()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                          >
                            {isSavingEdit ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Comment Input Box with Current User Avatar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-3 pt-2">
        {currentUser && (
          <Avatar
            name={currentUser.name}
            src={currentUser.avatarUrl}
            size="sm"
          />
        )}
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write an update, question, or note on this task..."
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-4 pr-12 py-3 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-inner"
          />
          <button
            type="submit"
            disabled={isSending || !commentText.trim()}
            className="absolute right-1.5 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            title="Send comment"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deletingCommentId}
        title="Delete Comment"
        description="Are you sure you want to permanently delete this comment from this task?"
        confirmText="Delete Comment"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeletingCommentId(null)}
      />
    </div>
  );
};

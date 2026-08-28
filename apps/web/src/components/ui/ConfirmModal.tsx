'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, AlertCircle, HelpCircle, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  itemTitle?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed with this action? This operation cannot be undone.',
  itemTitle,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="w-5 h-5 text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'primary':
      default:
        return <HelpCircle className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-500/10 border-rose-500/20';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'primary':
      default:
        return 'bg-indigo-500/10 border-indigo-500/20';
    }
  };

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'danger';
      case 'warning':
        return 'primary';
      case 'primary':
      default:
        return 'gradient';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" className="border-slate-800">
      <div className="flex flex-col items-center text-center p-2 space-y-4">
        {/* Glowing Icon Header */}
        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg',
            getIconBg()
          )}
        >
          {getIcon()}
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
            {description}
          </p>

          {itemTitle && (
            <div className="mt-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-200 truncate max-w-xs mx-auto">
              {itemTitle}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 w-full pt-2">
          <Button
            variant="secondary"
            className="flex-1"
            size="md"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>

          <Button
            variant={getConfirmButtonVariant()}
            className="flex-1"
            size="md"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

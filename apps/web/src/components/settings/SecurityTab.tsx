'use client';

import React, { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { api } from '../../lib/api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Lock, KeyRound } from 'lucide-react';

export const SecurityTab: React.FC = () => {
  const { addToast } = useUIStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast({
        type: 'error',
        message: 'New passwords do not match.',
      });
      return;
    }

    setIsChanging(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      addToast({
        type: 'success',
        title: 'Password Changed',
        message: 'Your account password has been updated.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to change password',
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto w-full">
      <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6">
        <div className="text-center border-b border-slate-800 pb-4">
          <h3 className="text-xl font-bold text-white flex items-center justify-center gap-3">
            <KeyRound className="w-6 h-6 text-indigo-400" />
            Change Account Password & Security
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Ensure your account is using a long, random password to stay secure.
          </p>
        </div>

        <div className="space-y-5 max-w-xl mx-auto">
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="text-base py-3 px-4 rounded-2xl"
            required
          />

          <Input
            label="New Password"
            type="password"
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="text-base py-3 px-4 rounded-2xl"
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="text-base py-3 px-4 rounded-2xl"
            required
          />
        </div>

        <div className="flex justify-center pt-4 border-t border-slate-800">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isChanging}
            leftIcon={<Lock className="w-5 h-5" />}
            className="px-8 py-3.5 text-base font-bold shadow-xl shadow-indigo-600/25 rounded-2xl cursor-pointer"
          >
            Update Password
          </Button>
        </div>
      </div>
    </form>
  );
};

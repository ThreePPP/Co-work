'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { useUIStore } from '../../stores/uiStore';
import {
  X,
  User as UserIcon,
  Mail,
  Shield,
  Building,
  Briefcase,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface EditMemberModalProps {
  isOpen: boolean;
  member: User | null;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  member,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useUIStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('MEMBER');
  const [department, setDepartment] = useState('General');
  const [position, setPosition] = useState('');
  const [bio, setBio] = useState('');
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspendedReason, setSuspendedReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setEmail(member.email || '');
      setRole(member.role || 'MEMBER');
      setDepartment(member.department || 'General');
      setPosition(member.position || '');
      setBio(member.bio || '');
      setIsSuspended(!!member.isSuspended);
      setSuspendedReason(member.suspendedReason || '');
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast({ type: 'error', message: 'Please provide a valid name' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      addToast({ type: 'error', message: 'Please provide a valid email address' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { api } = await import('../../lib/api');
      const res: any = await api.patch(`/users/${member.id}`, {
        name: name.trim(),
        email: email.trim(),
        role,
        department: department.trim() || 'General',
        position: position.trim() || 'Team Member',
        bio: bio.trim() || null,
        isSuspended,
        suspendedReason: isSuspended ? suspendedReason.trim() || 'Suspended by administrator' : null,
      });

      if (res?.data) {
        addToast({
          type: 'success',
          title: 'Member Updated',
          message: `User ${name} has been updated successfully.`,
        });
        onSuccess(res.data);
        onClose();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Failed to update member',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const departmentsList = [
    'Engineering',
    'Product',
    'Design',
    'Marketing',
    'Human Resources',
    'Finance',
    'Operations',
    'General',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8 z-10 animate-scale-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Avatar name={member.name} src={member.avatarUrl} size="md" />
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Edit Member Profile</h2>
              <p className="text-xs text-slate-400 font-mono">{member.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name & Email Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-indigo-400" /> Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Role & Department Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-400" /> Access Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="MEMBER">Member (Standard)</option>
                <option value="MANAGER">Manager (Project Lead)</option>
                <option value="ADMIN">Administrator (Full Access)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-amber-400" /> Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {departmentsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" /> Job Position / Title
            </label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Senior Fullstack Engineer, Marketing Director"
              className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Bio / Note
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              placeholder="Brief description or team responsibilities..."
              className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Account Status / Suspension Control Box */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isSuspended ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-white">Account Status</h4>
                  <p className="text-[11px] text-slate-400">
                    {isSuspended
                      ? 'Account is SUSPENDED. User cannot sign in or interact.'
                      : 'Account is ACTIVE. Member has standard platform access.'}
                  </p>
                </div>
              </div>

              {/* Suspend Toggle Switch */}
              <button
                type="button"
                onClick={() => setIsSuspended(!isSuspended)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isSuspended ? 'bg-rose-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isSuspended ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {isSuspended && (
              <div className="pt-2 border-t border-slate-800/80 animate-fade-in">
                <label className="block text-[11px] font-bold text-rose-300 mb-1">
                  Reason for Account Suspension:
                </label>
                <input
                  type="text"
                  value={suspendedReason}
                  onChange={(e) => setSuspendedReason(e.target.value)}
                  placeholder="e.g. Temporary leave, Policy violation, Pending review"
                  className="w-full bg-slate-900 border border-rose-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="ghost" size="md" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
              Save Member Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

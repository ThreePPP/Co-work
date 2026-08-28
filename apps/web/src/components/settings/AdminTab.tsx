'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { api } from '../../lib/api';
import { Avatar } from '../ui/Avatar';
import { ConfirmModal } from '../ui/ConfirmModal';
import { User, UserRole, ActivityLog } from '../../types';
import { Shield, Trash2, Loader2, Download } from 'lucide-react';
import { exportActivityLogsToCSV } from '../../lib/export';

export const AdminTab: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { addToast } = useUIStore();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/users?limit=100');
      if (res?.data?.users) {
        setAllUsers(res.data.users);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    try {
      await api.patch(`/users/${targetUserId}`, { role: newRole });
      setAllUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
      );
      addToast({
        type: 'success',
        message: 'User role updated successfully.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err.message || 'Failed to update role',
      });
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/users/${userToDelete.id}`);
      setAllUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      addToast({
        type: 'info',
        message: `User ${userToDelete.name} removed from workspace.`,
      });
      setUserToDelete(null);
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err.message || 'Failed to remove user',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportAuditLogs = async () => {
    setIsExporting(true);
    try {
      const res: any = await api.get('/dashboard/summary');
      const recentActivities: ActivityLog[] = res?.data?.recentActivities || [];
      if (recentActivities.length === 0) {
        addToast({
          type: 'info',
          message: 'No audit logs found to export.',
        });
      } else {
        exportActivityLogsToCSV(recentActivities);
        addToast({
          type: 'success',
          message: 'Audit logs exported successfully.',
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err.message || 'Failed to export audit logs',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Role Management Card */}
      <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-5 flex-wrap gap-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <Shield className="w-6 h-6 text-rose-400" />
              Workspace Member Access & Roles
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Elevate members to Manager or Admin, and manage workspace permissions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-indigo-400 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">
              {allUsers.length} total users
            </span>
            <button
              onClick={handleExportAuditLogs}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-emerald-400" />
              )}
              <span>Export Audit Log (CSV)</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-xs">
                  <th className="py-4 px-4">User</th>
                  <th className="py-4 px-4">Department</th>
                  <th className="py-4 px-4">Role</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 flex items-center gap-3.5">
                      <Avatar name={u.name} src={u.avatarUrl} size="md" />
                      <div>
                        <p className="font-bold text-slate-200">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-300 font-medium">
                      {u.department || 'General'}
                    </td>

                    <td className="py-4 px-4">
                      <select
                        value={u.role}
                        disabled={u.id === currentUser?.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="bg-slate-800 border border-slate-700 text-slate-200 text-sm font-semibold rounded-xl px-3.5 py-1.5 focus:outline-none focus:border-indigo-500 disabled:opacity-50 cursor-pointer"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>

                    <td className="py-4 px-4 text-right">
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => setUserToDelete({ id: u.id, name: u.name })}
                          className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Remove user"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Remove User Confirmation Modal */}
      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDeleteUser}
        title="Remove Member"
        description="Are you sure you want to remove this user from the workspace? They will lose access to all channels and files."
        itemTitle={userToDelete?.name}
        confirmText="Remove Member"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

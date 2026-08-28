'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { useUIStore } from '../../../stores/uiStore';
import { api } from '../../../lib/api';
import { User } from '../../../types';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { EditMemberModal } from '../../../components/members/EditMemberModal';
import { useTranslation } from '../../../lib/translations';
import {
  Users,
  Search,
  MessageSquare,
  Building,
  Briefcase,
  Loader2,
  Edit,
  UserX,
  UserCheck,
  Trash2,
  Mail,
  ShieldAlert,
} from 'lucide-react';

export default function MembersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { addToast } = useUIStore();
  const { t, language } = useTranslation();

  const [members, setMembers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSuspension, setSelectedSuspension] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [suspendingMember, setSuspendingMember] = useState<User | null>(null);
  const [deletingMember, setDeletingMember] = useState<User | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Admin access guard
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') {
      router.replace('/messages');
    }
  }, [currentUser, router]);

  // Load members & extract departments
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res: any = await api.get('/users', { params: { limit: 200 } });
        const rawUsers: User[] = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.users)
          ? res.data.users
          : [];
        setMembers(rawUsers);

        // Extract unique non-null departments
        const depts: string[] = Array.from(
          new Set(rawUsers.map((u: User) => u.department).filter(Boolean))
        ) as string[];
        setDepartments(depts);
      } catch (err: any) {
        addToast({
          type: 'error',
          title: 'Failed to load directory',
          message: err.message || 'Unable to fetch members list',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [addToast]);

  // Handle Account Suspension / Reactivation
  const handleToggleSuspend = async () => {
    if (!suspendingMember) return;

    setIsActionLoading(true);
    try {
      const willSuspend = !suspendingMember.isSuspended;
      const res: any = await api.patch(`/users/${suspendingMember.id}/suspend`, {
        isSuspended: willSuspend,
      });

      if (res?.data) {
        addToast({
          type: willSuspend ? 'warning' : 'success',
          title: willSuspend ? 'Account Suspended' : 'Account Reactivated',
          message: `User ${suspendingMember.name} has been ${
            willSuspend ? 'suspended' : 'reactivated'
          }.`,
        });

        // Update local state
        setMembers((prev) =>
          prev.map((u) => (u.id === suspendingMember.id ? { ...u, isSuspended: willSuspend } : u))
        );
        setSuspendingMember(null);
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Failed to update account suspension status',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Delete Member
  const handleDeleteMember = async () => {
    if (!deletingMember) return;

    setIsActionLoading(true);
    try {
      await api.delete(`/users/${deletingMember.id}`);
      addToast({
        type: 'success',
        title: 'Member Removed',
        message: `User ${deletingMember.name} was removed. All activity logs remain safely archived in History.`,
      });

      setMembers((prev) => prev.filter((u) => u.id !== deletingMember.id));
      setDeletingMember(null);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Failed to delete member',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Edit Success Callback
  const handleEditSuccess = (updatedUser: User) => {
    setMembers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    );
  };

  const memberList = Array.isArray(members) ? members : [];

  const filteredMembers = memberList.filter((m) => {
    const matchesDept = selectedDept === 'ALL' || m.department === selectedDept;
    const matchesRole = selectedRole === 'ALL' || m.role === selectedRole;
    const matchesStatus = selectedStatus === 'ALL' || m.status === selectedStatus;
    const matchesSuspension = selectedSuspension === 'ALL' 
      ? true 
      : selectedSuspension === 'ACTIVE' ? !m.isSuspended : m.isSuspended;
    const matchesSearch = search === '' || 
      (m.name && m.name.toLowerCase().includes(search.toLowerCase())) ||
      (m.email && m.email.toLowerCase().includes(search.toLowerCase()));
      
    return matchesDept && matchesRole && matchesStatus && matchesSuspension && matchesSearch;
  });

  const totalActive = memberList.filter((m) => !m.isSuspended).length;
  const totalSuspended = memberList.filter((m) => m.isSuspended).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Page Header */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-slate-900 border border-indigo-500/20 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <Users className="w-3.5 h-3.5 text-indigo-400" /> {t('membersTitle')}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('membersTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              {t('membersDesc')}
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3">
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center min-w-[90px]">
              <span className="text-xs text-slate-400 font-medium">{t('totalMembers')}</span>
              <p className="text-xl font-black text-white">{members.length}</p>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center min-w-[90px]">
              <span className="text-xs text-emerald-400 font-medium">{t('activeCount')}</span>
              <p className="text-xl font-black text-emerald-400">{totalActive}</p>
            </div>
            {totalSuspended > 0 && (
              <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-rose-500/30 text-center min-w-[90px]">
                <span className="text-xs text-rose-400 font-medium">{t('suspendedCount')}</span>
                <p className="text-xl font-black text-rose-400">{totalSuspended}</p>
              </div>
            )}
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Department Select */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-950/80 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">{t('allDepartments')}</option>
            {departments.map((dept: string) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Role Select */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-slate-950/80 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">{t('allRoles')}</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="MEMBER">Member</option>
          </select>

          {/* Online Status Select */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950/80 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">{t('allStatusesFilter')}</option>
            <option value="ONLINE">Online 🟢</option>
            <option value="AWAY">Away 🟡</option>
            <option value="BUSY">Busy 🔴</option>
            <option value="OFFLINE">Offline ⚫</option>
          </select>

          {/* Account Status (Suspension) Filter */}
          <select
            value={selectedSuspension}
            onChange={(e) => setSelectedSuspension(e.target.value)}
            className="bg-slate-950/80 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="ALL">{t('allAccounts')}</option>
            <option value="ACTIVE">{t('activeOnly')} ✅</option>
            <option value="SUSPENDED">{t('suspendedOnly')} ⛔</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'th' ? 'ค้นหาสมาชิก ชื่อ แผนก...' : 'Search members, emails...'}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Members Cards Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : members.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="text-base font-bold text-slate-200">No members found</p>
          <p className="text-xs mt-1">Try resetting the filters or clearing the search keyword.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {members.map((member: User) => {
            const isSelf = currentUser?.id === member.id;

            return (
              <div
                key={member.id}
                className={`flex flex-col justify-between p-5 rounded-3xl bg-slate-900/85 border transition-all duration-300 backdrop-blur-xl shadow-xl hover:shadow-2xl relative overflow-hidden group ${
                  member.isSuspended
                    ? 'border-rose-500/40 bg-slate-950/80'
                    : 'border-slate-800/90 hover:border-indigo-500/40'
                }`}
              >
                {/* Suspended Red Banner */}
                {member.isSuspended && (
                  <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-rose-600 to-red-600 text-white text-[10px] font-extrabold uppercase tracking-widest text-center py-0.5 shadow-sm">
                    Account Suspended
                  </div>
                )}

                <div className={`space-y-4 ${member.isSuspended ? 'pt-2' : ''}`}>
                  {/* Top Row: Avatar & Badges */}
                  <div className="flex items-start justify-between">
                    <Avatar
                      name={member.name}
                      src={member.avatarUrl}
                      status={member.isSuspended ? 'OFFLINE' : member.status}
                      size="lg"
                    />

                    <div className="flex flex-col items-end gap-1.5">
                      <Badge role={member.role} size="sm" />
                      {member.isSuspended ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <ShieldAlert className="w-3 h-3" /> Suspended
                        </span>
                      ) : (
                        <Badge status={member.status} size="sm" />
                      )}
                    </div>
                  </div>

                  {/* Name & Contact Info */}
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                      {member.name}
                      {isSelf && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          You
                        </span>
                      )}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-mono">
                      <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1.5">
                      <Briefcase className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                      <span className="truncate font-semibold">{member.position || 'Team Member'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <Building className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      <span className="truncate">{member.department || 'General'}</span>
                    </div>
                  </div>

                  {/* Bio or Suspension note */}
                  {member.isSuspended && member.suspendedReason ? (
                    <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/20 text-[11px] text-rose-300">
                      <span className="font-bold">Reason:</span> {member.suspendedReason}
                    </div>
                  ) : member.bio ? (
                    <p className="text-xs text-slate-400 line-clamp-2 italic">
                      &quot;{member.bio}&quot;
                    </p>
                  ) : null}
                </div>

                {/* Bottom Administrative Actions */}
                <div className="pt-4 mt-5 border-t border-slate-800/80 space-y-2">
                  {/* Top button: DM */}
                  <Link href={`/messages?userId=${member.id}`} className="block w-full">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                    >
                      Direct Message
                    </Button>
                  </Link>

                  {/* Admin controls row */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Edit Button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingMember(member)}
                      title="Edit member details"
                      leftIcon={<Edit className="w-3.5 h-3.5 text-indigo-400" />}
                    >
                      Edit
                    </Button>

                    {/* Suspend / Reactivate Button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSuspendingMember(member)}
                      disabled={isSelf}
                      title={member.isSuspended ? 'Reactivate account' : 'Suspend account'}
                      className={member.isSuspended ? 'hover:text-emerald-400' : 'hover:text-rose-400'}
                    >
                      {member.isSuspended ? (
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <UserX className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </Button>

                    {/* Delete Button */}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeletingMember(member)}
                      disabled={isSelf}
                      title="Delete member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. Edit Member Modal */}
      <EditMemberModal
        isOpen={!!editingMember}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onSuccess={handleEditSuccess}
      />

      {/* 2. Suspend / Reactivate Confirm Modal */}
      <ConfirmModal
        isOpen={!!suspendingMember}
        title={
          suspendingMember?.isSuspended
            ? `Reactivate ${suspendingMember?.name}?`
            : `Suspend ${suspendingMember?.name}?`
        }
        description={
          suspendingMember?.isSuspended
            ? `Are you sure you want to reactivate the account for ${suspendingMember?.name} (${suspendingMember?.email})? The member will be able to sign in and interact again.`
            : `Are you sure you want to suspend the account for ${suspendingMember?.name} (${suspendingMember?.email})? The user will be immediately blocked from signing in or performing actions.`
        }
        confirmText={suspendingMember?.isSuspended ? 'Reactivate Account' : 'Suspend Account'}
        variant={suspendingMember?.isSuspended ? 'primary' : 'danger'}
        isLoading={isActionLoading}
        onConfirm={handleToggleSuspend}
        onClose={() => setSuspendingMember(null)}
      />

      {/* 3. Delete Member Confirm Modal */}
      <ConfirmModal
        isOpen={!!deletingMember}
        title={`Delete Member ${deletingMember?.name}?`}
        description={`Are you sure you want to permanently delete the user account "${deletingMember?.name}" (${deletingMember?.email})? \n\nNote: All past historical activity logs and audit records will remain 100% intact and preserved in History.`}
        confirmText="Delete Account"
        variant="danger"
        isLoading={isActionLoading}
        onConfirm={handleDeleteMember}
        onClose={() => setDeletingMember(null)}
      />
    </div>
  );
}

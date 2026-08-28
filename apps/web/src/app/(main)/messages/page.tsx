'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChatStore } from '../../../stores/chatStore';
import { useAuthStore } from '../../../stores/authStore';
import { useHuddleStore } from '../../../stores/huddleStore';
import { useCallStore } from '../../../stores/callStore';
import { MessageItem } from '../../../components/chat/MessageItem';
import { ChatInput } from '../../../components/chat/ChatInput';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { api } from '../../../lib/api';
import { User } from '../../../types';
import { useTranslation } from '../../../lib/translations';
import {
  MessageSquare,
  Search,
  Users,
  Loader2,
  Sparkles,
  ScreenShare,
  MonitorPlay,
  Radio,
  PhoneOff,
} from 'lucide-react';

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('userId');

  const { user } = useAuthStore();
  const { t, language } = useTranslation();
  const {
    directConversations,
    activeDirectUser,
    messages,
    isLoadingMessages,
    selectDirectUser,
    sendMessage,
    typingUsers,
    fetchConversations,
  } = useChatStore();

  const {
    isInHuddle,
    activeChannelId,
    isScreenSharing,
    activeScreenShareUser,
    remoteStream,
    participants,
    joinHuddle,
    leaveHuddle,
    toggleScreenShare,
    setScreenViewerOpen,
  } = useHuddleStore();

  const { startCall, outgoingCall, cancelCall } = useCallStore();

  const [search, setSearch] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derive DM Huddle Room ID (consistent order regardless of who initiates)
  const dmChannelId =
    user && activeDirectUser
      ? `dm_${[user.id, activeDirectUser.id].sort().join('_')}`
      : '';
  const isCurrentDMHuddle = isInHuddle && activeChannelId === dmChannelId;
  const isSharingInThisRoom =
    isCurrentDMHuddle && (isScreenSharing || !!activeScreenShareUser || !!remoteStream);
  const isCallingThisUser =
    outgoingCall?.receiver.id === activeDirectUser?.id && outgoingCall?.status === 'calling';

  const handleToggleHuddle = async () => {
    if (!activeDirectUser || !user) return;
    if (isCurrentDMHuddle) {
      leaveHuddle();
    } else if (isCallingThisUser) {
      cancelCall();
    } else {
      // Ring the other user Discord-style!
      startCall(activeDirectUser, dmChannelId, activeDirectUser.name, 'voice');
    }
  };

  const handleScreenShare = async () => {
    if (!activeDirectUser || !user) return;
    if (isCurrentDMHuddle) {
      await toggleScreenShare();
    } else if (isCallingThisUser) {
      cancelCall();
    } else {
      // Ring the other user Discord-style for screen share call!
      startCall(activeDirectUser, dmChannelId, activeDirectUser.name, 'screen');
      await toggleScreenShare();
    }
  };

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
    // Also load users list so user can start a new DM with any team member
    setIsLoadingUsers(true);
    api
      .get('/users?limit=100')
      .then((res: any) => {
        if (res?.data?.users) {
          setAllUsers(res.data.users);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingUsers(false));
  }, [fetchConversations]);

  // Initial routing selection via URL parameter
  useEffect(() => {
    if (targetUserId) {
      api
        .get(`/users/${targetUserId}`)
        .then((res: any) => {
          if (res?.data) selectDirectUser(res.data);
        })
        .catch(console.error);
    } else if (!activeDirectUser && directConversations.length > 0) {
      selectDirectUser(directConversations[0].user);
    }
  }, [targetUserId, directConversations]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredDMs = directConversations.filter(
    (c) =>
      c.user.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.user.email && c.user.email.toLowerCase().includes(search.toLowerCase()))
  );

  // Other colleagues not yet in active conversation
  const activeConversationUserIds = new Set(directConversations.map((c) => c.user.id));
  const otherUsers = allUsers.filter(
    (u) =>
      u.id !== user?.id &&
      !activeConversationUserIds.has(u.id) &&
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        (u.department && u.department.toLowerCase().includes(search.toLowerCase())))
  );

  // Check if anyone in active room is typing
  const typingList = Object.values(typingUsers);

  return (
    <div className="flex-1 h-full min-h-0 flex rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden backdrop-blur-xl shadow-2xl animate-fade-in">
      {/* Left Sidebar: Direct Conversations */}
      <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/60">
        {/* Header & Search */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              {t('directMessages')}
            </h2>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === 'th' ? 'ค้นหาเพื่อนร่วมงาน...' : 'Search colleagues...'}
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Active Conversations Section */}
          <div className="space-y-1">
            <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Conversations ({filteredDMs.length})
            </p>

            {filteredDMs.length === 0 ? (
              <p className="px-2 py-2 text-[11px] text-slate-400">No conversations yet.</p>
            ) : (
              filteredDMs.map(({ user: dmUser, lastMessage }) => {
                const isSelected = activeDirectUser?.id === dmUser.id;
                return (
                  <button
                    key={dmUser.id}
                    onClick={() => selectDirectUser(dmUser)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Avatar
                      name={dmUser.name}
                      src={dmUser.avatarUrl}
                      status={dmUser.status}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-200 truncate">{dmUser.name}</p>
                      {lastMessage && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {lastMessage.content}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Team Colleagues Section */}
          {otherUsers.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-slate-800/80">
              <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-indigo-400" />
                <span>Team Members ({otherUsers.length})</span>
              </p>

              {otherUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => selectDirectUser(u)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all text-left cursor-pointer"
                >
                  <Avatar
                    name={u.name}
                    src={u.avatarUrl}
                    status={u.status}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-300 truncate">{u.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {u.department || 'General'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Area: Active Direct Chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950/60">
        {activeDirectUser ? (
          <>
            {/* Chat Top Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  name={activeDirectUser.name}
                  src={activeDirectUser.avatarUrl}
                  status={activeDirectUser.status}
                  size="md"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white truncate">
                      {activeDirectUser.name}
                    </h3>
                    <Badge status={activeDirectUser.status} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {activeDirectUser.position || activeDirectUser.department || activeDirectUser.email}
                  </p>
                </div>
              </div>

              {/* Live Huddle & Screen Share Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Watch Live Screen Share Button (if streaming) */}
                {isSharingInThisRoom && (
                  <button
                    onClick={() => setScreenViewerOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-md cursor-pointer animate-pulse transition-all"
                    title="ดูหน้าจอที่กำลังถ่ายทอดสด (View Live Screen Share)"
                  >
                    <MonitorPlay className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">ดูหน้าจอสด</span>
                  </button>
                )}

                {/* Live Screen Share Button */}
                <button
                  onClick={handleScreenShare}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer ${
                    isCurrentDMHuddle && isScreenSharing
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 animate-pulse'
                      : isCallingThisUser && outgoingCall?.callType === 'screen'
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 animate-pulse'
                      : isCurrentDMHuddle
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 border border-indigo-500'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600'
                  }`}
                  title={
                    isCurrentDMHuddle && isScreenSharing
                      ? 'หยุดแชร์หน้าจอ (Stop Screen Share)'
                      : isCallingThisUser && outgoingCall?.callType === 'screen'
                      ? 'กำลังโทรขอแชร์หน้าจอ... (คลิกเพื่อยกเลิก)'
                      : 'แชร์หน้าจอสด (Live Screen Share)'
                  }
                >
                  <ScreenShare
                    className={`w-3.5 h-3.5 ${
                      isCurrentDMHuddle && isScreenSharing ? 'text-rose-400' : 'text-indigo-400'
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {isCurrentDMHuddle && isScreenSharing
                      ? 'กำลังแชร์จอ'
                      : isCallingThisUser && outgoingCall?.callType === 'screen'
                      ? 'กำลังโทรแชร์จอ...'
                      : 'แชร์หน้าจอ'}
                  </span>
                </button>

                {/* Live Voice Huddle Button */}
                <button
                  onClick={handleToggleHuddle}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer ${
                    isCurrentDMHuddle
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                      : isCallingThisUser && outgoingCall?.callType === 'voice'
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600'
                  }`}
                  title={
                    isCurrentDMHuddle
                      ? 'วางสายการคุยสด (Leave Huddle)'
                      : isCallingThisUser && outgoingCall?.callType === 'voice'
                      ? 'กำลังโทร... (คลิกเพื่อยกเลิก)'
                      : 'เริ่มโทรคุยสด (Start Live Voice Huddle)'
                  }
                >
                  {isCurrentDMHuddle ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <Radio className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">
                        อยู่ในสาย ({participants.length})
                      </span>
                    </>
                  ) : isCallingThisUser && outgoingCall?.callType === 'voice' ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                      <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      <span className="hidden sm:inline">กำลังโทรหา...</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-3.5 h-3.5 text-slate-400" />
                      <span className="hidden sm:inline">โทรคุยสด</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Streaming Active Banner */}
            {isSharingInThisRoom && (
              <div className="flex items-center justify-between px-6 py-2 bg-indigo-950/60 border-b border-indigo-500/30 text-xs text-indigo-200 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>
                    กำลังมีการแชร์หน้าจอสดโดย{' '}
                    <strong className="text-white">
                      {isScreenSharing
                        ? 'คุณ (You)'
                        : activeScreenShareUser?.name || 'เพื่อนร่วมทีม'}
                    </strong>
                  </span>
                </div>
                <button
                  onClick={() => setScreenViewerOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-300 hover:text-white underline cursor-pointer"
                >
                  <MonitorPlay className="w-3 h-3" /> เปิดดูหน้าจอแบบเต็ม
                </button>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">Start the conversation</h4>
                  <p className="text-xs max-w-sm">
                    Say hello to {activeDirectUser.name} or share project files directly!
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    currentUser={user}
                  />
                ))
              )}

              {/* Typing indicator */}
              {typingList.length > 0 && (
                <div className="text-xs text-indigo-400 italic px-4 py-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  {typingList.join(', ')} {typingList.length === 1 ? 'is' : 'are'} typing...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <ChatInput
              placeholder={`Message ${activeDirectUser.name}...`}
              onSendMessage={sendMessage}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
            <MessageSquare className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-200">Select a colleague</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Choose a team member on the left to start direct messaging in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

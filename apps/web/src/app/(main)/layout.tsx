'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { useTaskStore } from '../../stores/taskStore';
import { useUIStore } from '../../stores/uiStore';
import { useHuddleStore } from '../../stores/huddleStore';
import { useCallStore } from '../../stores/callStore';
import { getSocket } from '../../lib/socket';
import { playMessageSound, playNotificationSound, playSuccessSound } from '../../lib/sound';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import { HuddleBar } from '../../components/huddle/HuddleBar';
import { ScreenShareModal } from '../../components/huddle/ScreenShareModal';
import { IncomingCallModal } from '../../components/huddle/IncomingCallModal';
import { OutgoingCallModal } from '../../components/huddle/OutgoingCallModal';
import { Loader2 } from 'lucide-react';
import { UserStatus } from '../../types';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, initAuth } = useAuthStore();
  const { initTheme } = useUIStore();
  const { initSocketListeners: initHuddleListeners } = useHuddleStore();
  const { initSocketListeners: initCallListeners } = useCallStore();
  const {
    fetchConversations,
    receiveMessage,
    updateMessageInState,
    updateMessageReactions,
    removeMessageFromState,
    setUserOnline,
    setTyping,
  } = useChatStore();

  const {
    onTaskCreated,
    onTaskUpdated,
    onTaskStatusChanged,
    onTaskDeleted,
    onTaskCommentAdded,
  } = useTaskStore();

  useEffect(() => {
    initAuth();
    initTheme();
  }, [initAuth, initTheme]);

  // Auth Protection Guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Real-time Socket Setup
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    fetchConversations();

    const socket = getSocket();
    if (!socket) return;

    initHuddleListeners();
    initCallListeners();

    // Listen for presence changes
    socket.on('presence:status', ({ userId, status }: { userId: string; status: UserStatus }) => {
      setUserOnline(userId, status === 'ONLINE');
    });

    // Listen for incoming messages
    socket.on('message:received', (msg) => {
      receiveMessage(msg);
      if (useUIStore.getState().soundEnabled && msg.senderId !== user?.id) {
        playMessageSound();
      }
    });

    // Listen for edited messages
    socket.on('message:edited', (msg) => {
      updateMessageInState(msg);
    });

    // Listen for deleted messages
    socket.on('message:deleted', ({ messageId }: { messageId: string }) => {
      removeMessageFromState(messageId);
    });

    // Listen for message reactions
    socket.on('message:reaction_updated', (data: any) => {
      updateMessageReactions(data);
    });

    // Listen for typing events
    socket.on('typing:status', ({ userId, name, isTyping }: any) => {
      setTyping(userId, name, isTyping);
    });

    // Listen for task events
    socket.on('task:created', (task) => {
      onTaskCreated(task);
      if (useUIStore.getState().soundEnabled) {
        playNotificationSound();
      }
    });

    socket.on('task:updated', (task) => {
      onTaskUpdated(task);
    });

    socket.on('task:status_changed', (data) => {
      onTaskStatusChanged(data);
      if (useUIStore.getState().soundEnabled) {
        if (data.status === 'DONE') {
          playSuccessSound();
        } else {
          playNotificationSound();
        }
      }
    });

    socket.on('task:deleted', (data) => {
      onTaskDeleted(data);
    });

    socket.on('task:comment_added', (data) => {
      onTaskCommentAdded(data);
      if (useUIStore.getState().soundEnabled) {
        playMessageSound();
      }
    });

    return () => {
      socket.off('presence:status');
      socket.off('message:received');
      socket.off('message:edited');
      socket.off('message:deleted');
      socket.off('typing:status');
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:status_changed');
      socket.off('task:deleted');
      socket.off('task:comment_added');
    };
  }, [
    isAuthenticated,
    user,
    fetchConversations,
    receiveMessage,
    updateMessageInState,
    removeMessageFromState,
    setUserOnline,
    setTyping,
    onTaskCreated,
    onTaskUpdated,
    onTaskStatusChanged,
    onTaskDeleted,
    onTaskCommentAdded,
  ]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold animate-pulse">
            C
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* Global Live Audio Huddle Dock, Screen Viewer & Discord-Style Call Modals */}
      <HuddleBar />
      <ScreenShareModal />
      <IncomingCallModal />
      <OutgoingCallModal />
    </div>
  );
}

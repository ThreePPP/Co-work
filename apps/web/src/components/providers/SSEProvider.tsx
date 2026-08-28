'use client';

import React, { useEffect, createContext, useContext, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { useTaskStore } from '../../stores/taskStore';
import { useUIStore } from '../../stores/uiStore';
import { getSSEClient } from '../../lib/sse';
import { playMessageSound, playNotificationSound, playSuccessSound } from '../../lib/sound';
import { UserStatus } from '../../types';

interface SSEContextType {
  isConnected: boolean;
}

const SSEContext = createContext<SSEContextType>({ isConnected: false });

export const useSSE = () => useContext(SSEContext);

export const SSEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, token } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);

  const {
    receiveMessage,
    updateMessageInState,
    updateMessageReactions,
    removeMessageFromState,
    setUserOnline,
  } = useChatStore();

  const {
    onTaskCreated,
    onTaskUpdated,
    onTaskStatusChanged,
    onTaskDeleted,
    onTaskCommentAdded,
  } = useTaskStore();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      getSSEClient().disconnect();
      setIsConnected(false);
      return;
    }

    const sse = getSSEClient();
    sse.connect(token);

    // Track connection status
    const unsubStatus = sse.on('connection:status', ({ status }) => {
      setIsConnected(status === 'CONNECTED');
    });

    const unsubConnected = sse.on('connected', (data) => {
      console.log('⚡ [SSE Handshake Verified]', data);
      setIsConnected(true);
    });

    // 1. Presence Status Event
    const unsubPresence = sse.on('presence:status', ({ userId, status }: { userId: string; status: UserStatus }) => {
      setUserOnline(userId, status === 'ONLINE');
    });

    // 2. Chat Message Events
    const unsubMsgReceived = sse.on('message:new', (msg) => {
      receiveMessage(msg);
      if (useUIStore.getState().soundEnabled && msg.senderId !== user?.id) {
        playMessageSound();
      }
    });

    const unsubMsgEdited = sse.on('message:edited', (msg) => {
      updateMessageInState(msg);
    });

    const unsubMsgDeleted = sse.on('message:deleted', ({ messageId }: { messageId: string }) => {
      removeMessageFromState(messageId);
    });

    const unsubMsgReactions = sse.on('message:reaction_updated', (data: any) => {
      updateMessageReactions(data);
    });

    // 3. Task Kanban Events
    const unsubTaskCreated = sse.on('task:created', (task) => {
      onTaskCreated(task);
      if (useUIStore.getState().soundEnabled) {
        playNotificationSound();
      }
    });

    const unsubTaskUpdated = sse.on('task:updated', (task) => {
      onTaskUpdated(task);
    });

    const unsubTaskStatus = sse.on('task:status_changed', (data) => {
      onTaskStatusChanged(data);
      if (useUIStore.getState().soundEnabled) {
        if (data.status === 'DONE') {
          playSuccessSound();
        } else {
          playNotificationSound();
        }
      }
    });

    const unsubTaskDeleted = sse.on('task:deleted', (data) => {
      onTaskDeleted(data);
    });

    const unsubTaskComment = sse.on('task:comment_added', (data) => {
      onTaskCommentAdded(data);
      if (useUIStore.getState().soundEnabled) {
        playMessageSound();
      }
    });

    return () => {
      unsubStatus();
      unsubConnected();
      unsubPresence();
      unsubMsgReceived();
      unsubMsgEdited();
      unsubMsgDeleted();
      unsubMsgReactions();
      unsubTaskCreated();
      unsubTaskUpdated();
      unsubTaskStatus();
      unsubTaskDeleted();
      unsubTaskComment();
      sse.disconnect();
    };
  }, [
    isAuthenticated,
    token,
    user?.id,
    receiveMessage,
    updateMessageInState,
    updateMessageReactions,
    removeMessageFromState,
    setUserOnline,
    onTaskCreated,
    onTaskUpdated,
    onTaskStatusChanged,
    onTaskDeleted,
    onTaskCommentAdded,
  ]);

  return (
    <SSEContext.Provider value={{ isConnected }}>
      {children}
    </SSEContext.Provider>
  );
};

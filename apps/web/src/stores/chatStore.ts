import { create } from 'zustand';
import { Message, User } from '../types';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

interface ChatState {
  directConversations: Array<{ user: User; lastMessage?: Message }>;
  activeDirectUser: User | null;
  messages: Message[];
  isLoadingMessages: boolean;
  onlineUserIds: Set<string>;
  typingUsers: { [key: string]: string }; // id -> name

  fetchConversations: () => Promise<void>;
  selectDirectUser: (user: User) => Promise<void>;
  fetchDirectMessages: (userId: string) => Promise<void>;
  sendMessage: (content: string, attachmentIds?: string[]) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  receiveMessage: (message: Message) => void;
  updateMessageInState: (message: Message) => void;
  updateMessageReactions: (data: { messageId: string; reactions: any[] }) => void;
  removeMessageFromState: (messageId: string) => void;
  setUserOnline: (userId: string, isOnline: boolean) => void;
  setTyping: (id: string, name: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  directConversations: [],
  activeDirectUser: null,
  messages: [],
  isLoadingMessages: false,
  onlineUserIds: new Set<string>(),
  typingUsers: {},

  fetchConversations: async () => {
    try {
      const res: any = await api.get('/messages/conversations');
      if (res?.data) {
        set({ directConversations: res.data });
      }
    } catch (e) {
      console.error('Failed to fetch conversations', e);
    }
  },

  selectDirectUser: async (user: User) => {
    set({ activeDirectUser: user, messages: [], isLoadingMessages: true });
    await get().fetchDirectMessages(user.id);
  },

  fetchDirectMessages: async (userId: string) => {
    try {
      const res: any = await api.get(`/messages/dm/${userId}`);
      set({ messages: res.data?.messages || [], isLoadingMessages: false });
    } catch (e) {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (content: string, attachmentIds?: string[]) => {
    const { activeDirectUser } = get();
    const socket = getSocket();

    if (activeDirectUser) {
      const res: any = await api.post('/messages/dm', {
        receiverId: activeDirectUser.id,
        content,
        attachmentIds,
      });
      const newMsg = res.data;
      if (socket) {
        socket.emit('message:new', newMsg);
      }
    }
  },

  editMessage: async (messageId: string, content: string) => {
    const { activeDirectUser } = get();
    const socket = getSocket();

    try {
      const res: any = await api.patch(`/messages/${messageId}`, { content });
      const updated = res.data;
      get().updateMessageInState(updated);

      if (socket) {
        socket.emit('message:edit', {
          ...updated,
          receiverId: activeDirectUser?.id,
        });
      }
    } catch (err) {
      console.error('Failed to edit message', err);
      throw err;
    }
  },

  deleteMessage: async (messageId: string) => {
    const { activeDirectUser } = get();
    const socket = getSocket();

    // Optimistically remove from state immediately
    get().removeMessageFromState(messageId);

    try {
      await api.delete(`/messages/${messageId}`);
    } catch (err: any) {
      if (!err.message?.includes('not found')) {
        console.warn('Delete message error:', err.message);
      }
    }

    if (socket) {
      socket.emit('message:delete', {
        messageId,
        receiverId: activeDirectUser?.id,
      });
    }
  },

  receiveMessage: (message: Message) => {
    const { activeDirectUser, messages } = get();

    if (
      activeDirectUser &&
      (message.senderId === activeDirectUser.id || message.receiverId === activeDirectUser.id)
    ) {
      if (!messages.some((m) => m.id === message.id)) {
        set({ messages: [...messages, message] });
      }
    }

    // Refresh conversation list in background
    get().fetchConversations();
  },

  toggleReaction: async (messageId: string, emoji: string) => {
    try {
      const res: any = await api.post(`/messages/${messageId}/reactions`, { emoji });
      if (res?.data) {
        const { reactions, receiverId } = res.data;
        get().updateMessageReactions({ messageId, reactions });

        const socket = getSocket();
        if (socket) {
          socket.emit('message:reaction', {
            messageId,
            receiverId,
            reactions,
          });
        }
      }
    } catch (e) {
      console.error('Failed to toggle reaction', e);
    }
  },

  updateMessageInState: (message: Message) => {
    const { messages } = get();
    set({
      messages: messages.map((m) => (m.id === message.id ? { ...m, ...message } : m)),
    });
  },

  updateMessageReactions: ({ messageId, reactions }: { messageId: string; reactions: any[] }) => {
    const { messages } = get();
    set({
      messages: messages.map((m) =>
        m.id === messageId ? { ...m, reactions } : m
      ),
    });
  },

  removeMessageFromState: (messageId: string) => {
    const { messages } = get();
    set({
      messages: messages.filter((m) => m.id !== messageId),
    });
  },

  setUserOnline: (userId: string, isOnline: boolean) => {
    const online = new Set(get().onlineUserIds);
    if (isOnline) {
      online.add(userId);
    } else {
      online.delete(userId);
    }
    set({ onlineUserIds: online });
  },

  setTyping: (id: string, name: string, isTyping: boolean) => {
    const typing = { ...get().typingUsers };
    if (isTyping) {
      typing[id] = name;
    } else {
      delete typing[id];
    }
    set({ typingUsers: typing });
  },
}));

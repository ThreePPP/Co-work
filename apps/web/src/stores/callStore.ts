import { create } from 'zustand';
import { getSocket } from '../lib/socket';
import {
  startRingtoneLoop,
  stopRingtoneLoop,
  startOutgoingCallTone,
  stopOutgoingCallTone,
  playCallDeclineSound,
} from '../lib/sound';
import { useUIStore } from './uiStore';
import { useHuddleStore } from './huddleStore';

export interface CallUser {
  id: string;
  name: string;
  avatarUrl?: string | null;
  position?: string | null;
}

export interface IncomingCallData {
  caller: CallUser;
  channelId: string;
  channelName: string;
  callType: 'voice' | 'screen';
}

export interface OutgoingCallData {
  receiver: CallUser;
  channelId: string;
  channelName: string;
  callType: 'voice' | 'screen';
  status: 'calling' | 'declined' | 'accepted';
}

interface CallState {
  incomingCall: IncomingCallData | null;
  outgoingCall: OutgoingCallData | null;

  startCall: (
    receiver: CallUser,
    channelId: string,
    channelName: string,
    callType?: 'voice' | 'screen'
  ) => void;
  cancelCall: () => void;
  acceptCall: () => void;
  declineCall: () => void;
  initSocketListeners: () => void;
}

let callTimeout: any = null;

export const useCallStore = create<CallState>((set, get) => ({
  incomingCall: null,
  outgoingCall: null,

  startCall: (
    receiver: CallUser,
    channelId: string,
    channelName: string,
    callType: 'voice' | 'screen' = 'voice'
  ) => {
    const socket = getSocket();
    if (!socket) return;

    if (useUIStore.getState().soundEnabled) {
      startOutgoingCallTone();
    }

    set({
      outgoingCall: {
        receiver,
        channelId,
        channelName,
        callType,
        status: 'calling',
      },
    });

    // Auto-timeout after 35 seconds if no answer
    if (callTimeout) clearTimeout(callTimeout);
    callTimeout = setTimeout(() => {
      get().cancelCall();
    }, 35000);

    socket.emit('call:start', {
      receiverId: receiver.id,
      channelId,
      channelName,
      callType,
    });
  },

  cancelCall: () => {
    const socket = getSocket();
    const { outgoingCall } = get();

    stopOutgoingCallTone();
    if (callTimeout) {
      clearTimeout(callTimeout);
      callTimeout = null;
    }

    if (socket && outgoingCall) {
      socket.emit('call:cancel', {
        receiverId: outgoingCall.receiver.id,
        channelId: outgoingCall.channelId,
      });
    }

    set({ outgoingCall: null });
  },

  acceptCall: () => {
    const socket = getSocket();
    const { incomingCall } = get();
    if (!incomingCall) return;

    stopRingtoneLoop();

    if (socket) {
      socket.emit('call:accept', {
        callerId: incomingCall.caller.id,
        channelId: incomingCall.channelId,
      });
    }

    // Join the huddle room
    useHuddleStore.getState().joinHuddle(incomingCall.channelId, incomingCall.channelName);

    if (incomingCall.callType === 'screen') {
      useHuddleStore.getState().setScreenViewerOpen(true);
    }

    set({ incomingCall: null });
  },

  declineCall: () => {
    const socket = getSocket();
    const { incomingCall } = get();

    stopRingtoneLoop();
    if (useUIStore.getState().soundEnabled) {
      playCallDeclineSound();
    }

    if (socket && incomingCall) {
      socket.emit('call:decline', {
        callerId: incomingCall.caller.id,
        channelId: incomingCall.channelId,
      });
    }

    set({ incomingCall: null });
  },

  initSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off('call:incoming');
    socket.off('call:accepted');
    socket.off('call:declined');
    socket.off('call:cancelled');

    // Received incoming call from someone
    socket.on('call:incoming', (data: IncomingCallData) => {
      set({ incomingCall: data });
      if (useUIStore.getState().soundEnabled) {
        startRingtoneLoop();
      }
    });

    // Caller receives acceptance
    socket.on('call:accepted', ({ channelId, receiverName }: any) => {
      stopOutgoingCallTone();
      if (callTimeout) {
        clearTimeout(callTimeout);
        callTimeout = null;
      }

      const { outgoingCall } = get();
      if (outgoingCall) {
        set({ outgoingCall: null });
        useHuddleStore.getState().joinHuddle(channelId, outgoingCall.channelName || receiverName || 'DM');
      }
    });

    // Caller receives rejection
    socket.on('call:declined', () => {
      stopOutgoingCallTone();
      if (useUIStore.getState().soundEnabled) {
        playCallDeclineSound();
      }
      if (callTimeout) {
        clearTimeout(callTimeout);
        callTimeout = null;
      }

      const { outgoingCall } = get();
      if (outgoingCall) {
        set({
          outgoingCall: {
            ...outgoingCall,
            status: 'declined',
          },
        });
        setTimeout(() => {
          set({ outgoingCall: null });
        }, 2500);
      }
    });

    // Receiver notified caller hung up before answer
    socket.on('call:cancelled', () => {
      stopRingtoneLoop();
      set({ incomingCall: null });
    });
  },
}));

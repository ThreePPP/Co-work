import { create } from 'zustand';
import { getSocket } from '../lib/socket';
import { playHuddleJoinSound, playHuddleLeaveSound } from '../lib/sound';
import { useUIStore } from './uiStore';

export interface HuddleParticipant {
  socketId: string;
  userId: string;
  name: string;
  avatarUrl?: string | null;
  position?: string | null;
  isMuted: boolean;
  isSharingScreen: boolean;
}

interface HuddleState {
  isInHuddle: boolean;
  activeChannelId: string | null;
  activeChannelName: string;
  isMuted: boolean;
  isScreenSharing: boolean;
  participants: HuddleParticipant[];
  screenStream: MediaStream | null;
  remoteStream: MediaStream | null;
  activeScreenShareUser: HuddleParticipant | null;
  isScreenViewerOpen: boolean;

  joinHuddle: (channelId: string, channelName: string) => Promise<void>;
  leaveHuddle: () => void;
  toggleMute: () => void;
  toggleScreenShare: () => Promise<void>;
  setScreenViewerOpen: (open: boolean) => void;
  initSocketListeners: () => void;
}

// Peer connection map: socketId -> RTCPeerConnection
const peerConnections = new Map<string, RTCPeerConnection>();

const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useHuddleStore = create<HuddleState>((set, get) => ({
  isInHuddle: false,
  activeChannelId: null,
  activeChannelName: '',
  isMuted: false,
  isScreenSharing: false,
  participants: [],
  screenStream: null,
  remoteStream: null,
  activeScreenShareUser: null,
  isScreenViewerOpen: false,

  joinHuddle: async (channelId: string, channelName: string) => {
    const socket = getSocket();
    if (!socket) return;

    const { isInHuddle, activeChannelId } = get();
    if (isInHuddle && activeChannelId === channelId) return;

    // If currently in another huddle, leave it first
    if (isInHuddle) {
      get().leaveHuddle();
    }

    if (useUIStore.getState().soundEnabled) {
      playHuddleJoinSound();
    }

    set({
      isInHuddle: true,
      activeChannelId: channelId,
      activeChannelName: channelName,
      isMuted: false,
      isScreenSharing: false,
      participants: [],
      remoteStream: null,
      screenStream: null,
    });

    socket.emit('huddle:join', {
      channelId,
      channelName,
      isMuted: false,
    });
  },

  leaveHuddle: () => {
    const socket = getSocket();
    const { activeChannelId, screenStream } = get();

    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }

    // Close all WebRTC peer connections
    peerConnections.forEach((pc) => pc.close());
    peerConnections.clear();

    if (socket && activeChannelId) {
      socket.emit('huddle:leave', { channelId: activeChannelId });
    }

    if (useUIStore.getState().soundEnabled) {
      playHuddleLeaveSound();
    }

    set({
      isInHuddle: false,
      activeChannelId: null,
      activeChannelName: '',
      isMuted: false,
      isScreenSharing: false,
      participants: [],
      screenStream: null,
      remoteStream: null,
      activeScreenShareUser: null,
      isScreenViewerOpen: false,
    });
  },

  toggleMute: () => {
    const socket = getSocket();
    const { isMuted, activeChannelId } = get();
    const nextMuted = !isMuted;

    set({ isMuted: nextMuted });

    if (socket && activeChannelId) {
      socket.emit('huddle:toggle_media', {
        channelId: activeChannelId,
        isMuted: nextMuted,
      });
    }
  },

  toggleScreenShare: async () => {
    const { isScreenSharing, screenStream, activeChannelId } = get();
    const socket = getSocket();

    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
      set({ isScreenSharing: false, screenStream: null });
      if (socket && activeChannelId) {
        socket.emit('huddle:toggle_media', {
          channelId: activeChannelId,
          isSharingScreen: false,
        });
      }
    } else {
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 },
            },
            audio: false,
          });

          stream.getVideoTracks()[0].onended = () => {
            get().toggleScreenShare();
          };

          set({ isScreenSharing: true, screenStream: stream });

          // Send video tracks to peers if any
          peerConnections.forEach(async (pc, targetSocketId) => {
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              if (socket) {
                socket.emit('huddle:signal', {
                  toSocketId: targetSocketId,
                  signal: { sdp: offer },
                });
              }
            } catch (err) {
              console.warn('WebRTC offer error:', err);
            }
          });

          if (socket && activeChannelId) {
            socket.emit('huddle:toggle_media', {
              channelId: activeChannelId,
              isSharingScreen: true,
            });
          }
        }
      } catch (err) {
        console.warn('Screen sharing cancelled or not supported:', err);
      }
    }
  },

  setScreenViewerOpen: (isScreenViewerOpen: boolean) => set({ isScreenViewerOpen }),

  initSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off('huddle:room_state');
    socket.off('huddle:user_joined');
    socket.off('huddle:user_left');
    socket.off('huddle:user_updated');
    socket.off('huddle:signal');

    socket.on('huddle:room_state', ({ channelId, channelName, participants }) => {
      set({
        activeChannelId: channelId,
        activeChannelName: channelName,
        participants,
      });

      const sharing = participants.find((p: HuddleParticipant) => p.isSharingScreen);
      set({ activeScreenShareUser: sharing || null });
    });

    socket.on('huddle:user_joined', ({ participant, participants }) => {
      set({ participants });

      // Create WebRTC peer connection for new participant if we are sharing
      if (typeof RTCPeerConnection !== 'undefined' && participant.socketId !== socket.id) {
        const pc = new RTCPeerConnection(rtcConfig);
        peerConnections.set(participant.socketId, pc);

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('huddle:signal', {
              toSocketId: participant.socketId,
              signal: { candidate: event.candidate },
            });
          }
        };

        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            set({ remoteStream: event.streams[0] });
          }
        };

        const { screenStream } = get();
        if (screenStream) {
          screenStream.getTracks().forEach((track) => pc.addTrack(track, screenStream));
          pc.createOffer()
            .then((offer) => pc.setLocalDescription(offer))
            .then(() => {
              socket.emit('huddle:signal', {
                toSocketId: participant.socketId,
                signal: { sdp: pc.localDescription },
              });
            })
            .catch(console.warn);
        }
      }
    });

    socket.on('huddle:user_left', ({ socketId, participants }) => {
      set({ participants });
      if (peerConnections.has(socketId)) {
        peerConnections.get(socketId)?.close();
        peerConnections.delete(socketId);
      }
      const sharing = participants.find((p: HuddleParticipant) => p.isSharingScreen);
      set({ activeScreenShareUser: sharing || null });
      if (!sharing) {
        set({ remoteStream: null });
      }
    });

    socket.on('huddle:user_updated', ({ participants }) => {
      set({ participants });
      const sharing = participants.find((p: HuddleParticipant) => p.isSharingScreen);
      set({ activeScreenShareUser: sharing || null });
      if (!sharing && !get().isScreenSharing) {
        set({ remoteStream: null });
      }
    });

    socket.on('huddle:signal', async ({ fromSocketId, signal }) => {
      if (typeof RTCPeerConnection === 'undefined') return;

      let pc = peerConnections.get(fromSocketId);
      if (!pc) {
        pc = new RTCPeerConnection(rtcConfig);
        peerConnections.set(fromSocketId, pc);

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('huddle:signal', {
              toSocketId: fromSocketId,
              signal: { candidate: event.candidate },
            });
          }
        };

        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            set({ remoteStream: event.streams[0] });
          }
        };

        const { screenStream } = get();
        if (screenStream) {
          screenStream.getTracks().forEach((track) => pc!.addTrack(track, screenStream));
        }
      }

      try {
        if (signal.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          if (signal.sdp.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('huddle:signal', {
              toSocketId: fromSocketId,
              signal: { sdp: answer },
            });
          }
        } else if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.warn('Error handling WebRTC signal:', err);
      }
    });
  },
}));

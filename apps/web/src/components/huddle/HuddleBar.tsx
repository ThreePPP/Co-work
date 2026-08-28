'use client';

import React from 'react';
import { useHuddleStore } from '../../stores/huddleStore';
import { Avatar } from '../ui/Avatar';
import {
  Mic,
  MicOff,
  ScreenShare,
  PhoneOff,
  Radio,
  MonitorPlay,
  Volume2,
} from 'lucide-react';

export const HuddleBar: React.FC = () => {
  const {
    isInHuddle,
    activeChannelName,
    participants,
    isMuted,
    isScreenSharing,
    activeScreenShareUser,
    toggleMute,
    toggleScreenShare,
    leaveHuddle,
    setScreenViewerOpen,
  } = useHuddleStore();

  if (!isInHuddle) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in flex items-center gap-3 p-2.5 px-4 rounded-3xl bg-slate-900/95 border border-indigo-500/50 shadow-2xl backdrop-blur-xl max-w-[95vw] sm:max-w-2xl">
      {/* Live Badge & Channel Info */}
      <div className="flex items-center gap-2.5 pr-3 border-r border-slate-800">
        <div className="relative flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="absolute w-4 h-4 rounded-full bg-emerald-500/30 animate-ping" />
        </div>
        <div className="hidden sm:block">
          <p className="text-xs font-bold text-white flex items-center gap-1.5 leading-none">
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            #{activeChannelName}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {participants.length} in Huddle
          </p>
        </div>
      </div>

      {/* Participant Avatars & Speaking Indicators */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-[140px] sm:max-w-[200px] py-1 px-1">
        {participants.map((p) => (
          <div
            key={p.socketId}
            className={`relative rounded-full p-0.5 transition-all ${
              !p.isMuted ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900 animate-pulse' : 'opacity-70'
            }`}
            title={`${p.name} ${p.isMuted ? '(Muted)' : '(Speaking)'}`}
          >
            <Avatar name={p.name} src={p.avatarUrl} size="xs" />
            {p.isMuted && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-600 border border-slate-900 flex items-center justify-center text-[7px] text-white font-bold">
                ✕
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
        {/* Mute / Unmute Button */}
        <button
          onClick={toggleMute}
          className={`p-2.5 rounded-2xl font-bold transition-all ${
            isMuted
              ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40'
              : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Screen Share Button */}
        <button
          onClick={toggleScreenShare}
          className={`p-2.5 rounded-2xl font-bold transition-all ${
            isScreenSharing
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400 animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
          title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
        >
          <ScreenShare className="w-4 h-4" />
        </button>

        {/* View Shared Screen Button (If active) */}
        {activeScreenShareUser && (
          <button
            onClick={() => setScreenViewerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 animate-pulse"
            title="View Screen Share"
          >
            <MonitorPlay className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Screen</span>
          </button>
        )}

        {/* Leave Huddle Button */}
        <button
          onClick={leaveHuddle}
          className="p-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all ml-1"
          title="Leave Huddle"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

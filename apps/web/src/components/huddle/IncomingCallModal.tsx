'use client';

import React from 'react';
import { useCallStore } from '../../stores/callStore';
import { Avatar } from '../ui/Avatar';
import { Phone, PhoneOff, ScreenShare, Radio, Volume2 } from 'lucide-react';

export const IncomingCallModal: React.FC = () => {
  const { incomingCall, acceptCall, declineCall } = useCallStore();

  if (!incomingCall) return null;

  const isScreenCall = incomingCall.callType === 'screen';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col items-center text-center space-y-5 ring-1 ring-white/10">
        {/* Background glow effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Screen Share Call Badge (shown only if sharing screen) */}
        {isScreenCall && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-xs font-semibold text-indigo-300 shadow-inner">
            <ScreenShare className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>สายเรียกเข้าแชร์หน้าจอ</span>
          </div>
        )}

        {/* Pulsing Avatar with Discord-style ringing rings */}
        <div className="relative my-2">
          {/* Ring waves */}
          <div className="absolute -inset-4 rounded-full bg-indigo-500/20 animate-ping" />
          <div className="absolute -inset-8 rounded-full bg-indigo-500/10 animate-pulse" />

          <div className="relative ring-4 ring-indigo-500/50 rounded-full p-1 bg-slate-800 shadow-xl">
            <Avatar
              name={incomingCall.caller.name}
              src={incomingCall.caller.avatarUrl}
              size="lg"
            />
          </div>
        </div>

        {/* Caller Info */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white tracking-tight">
            {incomingCall.caller.name}
          </h3>
          <p className="text-xs text-slate-400">
            {incomingCall.caller.position || 'เพื่อนร่วมทีม'} กำลังโทรหาคุณ...
          </p>
        </div>

        {/* Action Buttons: Accept & Decline */}
        <div className="flex items-center justify-center gap-6 pt-2 w-full">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={declineCall}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="ปฏิเสธสาย (Decline)"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <span className="text-[11px] font-medium text-slate-400">ปฏิเสธ</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={acceptCall}
              className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 hover:scale-105 active:scale-95 transition-all animate-bounce cursor-pointer"
              title="รับสาย (Accept)"
            >
              <Phone className="w-6 h-6" />
            </button>
            <span className="text-[11px] font-medium text-emerald-400 font-semibold">รับสาย</span>
          </div>
        </div>
      </div>
    </div>
  );
};

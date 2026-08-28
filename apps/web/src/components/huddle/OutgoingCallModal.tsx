'use client';

import React from 'react';
import { useCallStore } from '../../stores/callStore';
import { Avatar } from '../ui/Avatar';
import { PhoneOff, ScreenShare, Radio, X } from 'lucide-react';

export const OutgoingCallModal: React.FC = () => {
  const { outgoingCall, cancelCall } = useCallStore();

  if (!outgoingCall) return null;

  const isDeclined = outgoingCall.status === 'declined';
  const isScreenCall = outgoingCall.callType === 'screen';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col items-center text-center space-y-5 ring-1 ring-white/10">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Screen Share Call Badge (shown only if sharing screen) */}
        {isScreenCall && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-xs font-semibold text-indigo-300 shadow-inner">
            <ScreenShare className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>แชร์หน้าจอสด</span>
          </div>
        )}

        {/* Pulsing Avatar with Outgoing Calling Radar Waves */}
        <div className="relative my-2">
          {!isDeclined && (
            <>
              <div className="absolute -inset-4 rounded-full bg-indigo-500/20 animate-ping" />
              <div className="absolute -inset-8 rounded-full bg-indigo-500/10 animate-pulse" />
            </>
          )}

          <div
            className={`relative ring-4 rounded-full p-1 bg-slate-800 shadow-xl transition-all ${
              isDeclined ? 'ring-rose-500/50' : 'ring-indigo-500/50'
            }`}
          >
            <Avatar
              name={outgoingCall.receiver.name}
              src={outgoingCall.receiver.avatarUrl}
              size="lg"
            />
          </div>
        </div>

        {/* Receiver Details & Calling Status */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white tracking-tight">
            {outgoingCall.receiver.name}
          </h3>
          <p className="text-xs text-slate-400">
            {isDeclined ? (
              <span className="text-rose-400 font-semibold">สายไม่ว่าง / ปฏิเสธสาย</span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                กำลังรอสายตอบรับ...
              </span>
            )}
          </p>
        </div>

        {/* Action Button: Cancel / Close */}
        <div className="flex flex-col items-center gap-1.5 pt-2 w-full">
          <button
            onClick={cancelCall}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title={isDeclined ? 'ปิด (Close)' : 'ยกเลิกการโทร (Cancel Call)'}
          >
            {isDeclined ? <X className="w-6 h-6" /> : <PhoneOff className="w-6 h-6" />}
          </button>
          <span className="text-[11px] font-medium text-slate-400">
            {isDeclined ? 'ปิด' : 'ยกเลิกการโทร'}
          </span>
        </div>
      </div>
    </div>
  );
};

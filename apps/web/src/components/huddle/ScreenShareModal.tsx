'use client';

import React, { useEffect, useRef } from 'react';
import { useHuddleStore } from '../../stores/huddleStore';
import { X, Monitor, Maximize2 } from 'lucide-react';

export const ScreenShareModal: React.FC = () => {
  const {
    isScreenViewerOpen,
    setScreenViewerOpen,
    screenStream,
    remoteStream,
    activeScreenShareUser,
    activeChannelName,
  } = useHuddleStore();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeStream = screenStream || remoteStream;

  useEffect(() => {
    if (videoRef.current && activeStream) {
      videoRef.current.srcObject = activeStream;
      videoRef.current.play().catch(console.warn);
    }
  }, [activeStream, isScreenViewerOpen]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.warn);
    } else {
      document.exitFullscreen().catch(console.warn);
    }
  };

  if (!isScreenViewerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-fade-in">
      <div
        ref={containerRef}
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Live Screen Share
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 animate-pulse">
                  HD Live 1080p
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Broadcasting in #{activeChannelName || 'Live Room'} by {activeScreenShareUser?.name || (screenStream ? 'You' : 'Teammate')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setScreenViewerOpen(false)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Canvas */}
        <div className="flex-1 bg-black flex items-center justify-center min-h-[400px] overflow-hidden">
          {activeStream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full max-h-[70vh] object-contain rounded-b-2xl"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 space-y-2 p-12">
              <Monitor className="w-10 h-10 text-slate-600 animate-pulse" />
              <p className="text-xs">Waiting for video stream...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

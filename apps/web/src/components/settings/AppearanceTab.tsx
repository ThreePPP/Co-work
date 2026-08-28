'use client';

import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useTranslation } from '../../lib/translations';
import { Moon, Sun, Laptop, Volume2, VolumeX, Sparkles, Palette } from 'lucide-react';
import { playNotificationSound, playSuccessSound } from '../../lib/sound';

export const AppearanceTab: React.FC = () => {
  const { theme, setTheme, soundEnabled, setSoundEnabled, addToast } = useUIStore();
  const { t } = useTranslation();

  return (
    <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-10 max-w-4xl mx-auto w-full">
      {/* 1. Theme Section */}
      <div className="space-y-6">
        <div className="text-center border-b border-slate-800 pb-4">
          <h3 className="text-xl font-bold text-white pb-1 flex items-center justify-center gap-3">
            <Palette className="w-6 h-6 text-indigo-400" />
            {t('themeSettings')}
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            {t('themeDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
          <button
            onClick={() => {
              setTheme('dark');
              addToast({ type: 'success', message: 'Theme set to Midnight Dark' });
            }}
            className={`p-6 sm:p-7 rounded-3xl border flex flex-col items-center gap-4 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-indigo-500 bg-indigo-500/20 text-white ring-4 ring-indigo-500/30 scale-[1.03] shadow-2xl'
                : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800/80 hover:scale-[1.01]'
            }`}
          >
            <div className="p-4 rounded-2xl bg-slate-900 text-indigo-400 border border-slate-800 shadow-inner">
              <Moon className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-white">{t('midnightDark')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('midnightDarkDesc')}</p>
            </div>
          </button>

          <button
            onClick={() => {
              setTheme('light');
              addToast({ type: 'success', message: 'Theme set to Clean Light' });
            }}
            className={`p-6 sm:p-7 rounded-3xl border flex flex-col items-center gap-4 transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-indigo-500 bg-indigo-500/20 text-white ring-4 ring-indigo-500/30 scale-[1.03] shadow-2xl'
                : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800/80 hover:scale-[1.01]'
            }`}
          >
            <div className="p-4 rounded-2xl bg-slate-900 text-amber-400 border border-slate-800 shadow-inner">
              <Sun className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-white">{t('cleanLight')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('cleanLightDesc')}</p>
            </div>
          </button>

          <button
            onClick={() => {
              setTheme('system');
              addToast({ type: 'info', message: 'Theme synchronized with System' });
            }}
            className={`p-6 sm:p-7 rounded-3xl border flex flex-col items-center gap-4 transition-all cursor-pointer ${
              theme === 'system'
                ? 'border-indigo-500 bg-indigo-500/20 text-white ring-4 ring-indigo-500/30 scale-[1.03] shadow-2xl'
                : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800/80 hover:scale-[1.01]'
            }`}
          >
            <div className="p-4 rounded-2xl bg-slate-900 text-purple-400 border border-slate-800 shadow-inner">
              <Laptop className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-white">{t('systemAuto')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('systemAutoDesc')}</p>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Sound & Audio Effects Section */}
      <div className="pt-8 border-t border-slate-800 space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-white pb-1 flex items-center justify-center gap-3">
            <Volume2 className="w-6 h-6 text-indigo-400" />
            {t('soundSettings')}
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            {t('soundDesc')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-3xl bg-slate-800/50 border border-slate-800 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-900 text-indigo-400 border border-slate-800 shadow-inner">
              {soundEnabled ? <Volume2 className="w-7 h-7" /> : <VolumeX className="w-7 h-7 text-slate-500" />}
            </div>
            <div>
              <p className="text-base font-bold text-white">{t('notificationSound')}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {soundEnabled ? t('soundEnabled') : t('soundMuted')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                playNotificationSound();
                addToast({ type: 'info', message: 'Testing chime sound' });
              }}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold border border-slate-700 transition-colors cursor-pointer"
            >
              {t('testSound')}
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playSuccessSound();
                addToast({
                  type: next ? 'success' : 'info',
                  message: next ? 'Sound notifications enabled' : 'Sound notifications muted',
                });
              }}
              className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/25'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
              }`}
            >
              {soundEnabled ? t('enabled') : t('muted')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

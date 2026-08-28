'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { useTranslation } from '../../../lib/translations';
import { ProfileTab } from '../../../components/settings/ProfileTab';
import { SecurityTab } from '../../../components/settings/SecurityTab';
import { AppearanceTab } from '../../../components/settings/AppearanceTab';
import { User as UserIcon, Lock, Palette } from 'lucide-react';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';

  const { user } = useAuthStore();
  const { language } = useTranslation();
  const [activeTab, setActiveTab] = useState(initialTab);

  const tabs = [
    {
      id: 'profile',
      label: language === 'th' ? 'ข้อมูลส่วนตัว' : 'My Profile',
      icon: UserIcon,
    },
    {
      id: 'security',
      label: language === 'th' ? 'บัญชีและความปลอดภัย' : 'Account & Security',
      icon: Lock,
    },
    {
      id: 'appearance',
      label: language === 'th' ? 'ธีมและการแสดงผล' : 'Theme & Appearance',
      icon: Palette,
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full animate-fade-in pb-8">
      {/* Enlarged Tabs Switcher Bar */}
      <div className="flex items-center gap-3 p-2.5 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-md overflow-x-auto shadow-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-sm sm:text-base font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-md scale-[1.01]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <div>
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'appearance' && <AppearanceTab />}
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { initAuth, isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (user?.role === 'ADMIN') {
          router.replace('/dashboard');
        } else {
          router.replace('/messages');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-500/25 animate-pulse-glow">
          C
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-indigo-400 mt-2" />
        <p className="text-xs text-slate-400 font-medium">Loading Co-work...</p>
      </div>
    </div>
  );
}

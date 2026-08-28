'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { useUIStore } from '../../../stores/uiStore';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Logo } from '../../../components/ui/Logo';
import { Mail, Lock, Sparkles, Shield, User, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const router = useRouter();
  const { login, googleLogin } = useAuthStore();
  const { addToast } = useUIStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await login({ email, password });
      const loggedUser = useAuthStore.getState().user;
      addToast({
        type: 'success',
        title: 'Welcome back!',
        message: 'Successfully signed in to Co-work Workspace.',
      });
      router.push(loggedUser?.role === 'ADMIN' ? '/dashboard' : '/messages');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setIsLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
      const loggedUser = useAuthStore.getState().user;
      addToast({
        type: 'success',
        title: 'Google Login Successful',
        message: 'Welcome to Co-work Workspace!',
      });
      router.push(loggedUser?.role === 'ADMIN' ? '/dashboard' : '/messages');
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Background glow meshes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-fade-in">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Logo size="lg" className="mb-2" />
          <h1 className="text-xl font-extrabold text-white tracking-tight mt-1">Co-work Workspace</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise collaboration, messaging & file drive
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Work Email"
            type="email"
            placeholder="name@cowork.com"
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="gradient"
            className="w-full mt-2 py-3"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In to Workspace
          </Button>
        </form>

        {/* Google OAuth Section */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google OAuth Login failed')}
              theme="filled_black"
              shape="pill"
              text="continue_with"
            />
          </div>
        </div>

        {/* Demo Fast Login Buttons */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider mb-2.5 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Quick Demo Accounts (1-Click Fill)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@cowork.com', 'Admin@123456')}
              className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-700/50 hover:border-slate-600 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <span className="truncate">Admin Account</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('alex.dev@cowork.com', 'User@123456')}
              className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-700/50 hover:border-slate-600 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span className="truncate">Member (Alex)</span>
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
            Register new account
          </Link>
        </div>
      </div>
    </div>
  );
}

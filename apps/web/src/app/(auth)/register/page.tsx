'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { useUIStore } from '../../../stores/uiStore';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Logo } from '../../../components/ui/Logo';
import { Mail, Lock, User, Briefcase, Building, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const { addToast } = useUIStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [position, setPosition] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await register({
        name,
        email,
        password,
        department,
        position,
      });

      addToast({
        type: 'success',
        title: 'Account Created',
        message: 'Welcome to Co-work! Your workspace is ready.',
      });
      router.push('/messages');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-fade-in my-8">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size="lg" className="mb-2" />
          <h1 className="text-xl font-extrabold text-white tracking-tight mt-1">Join Co-work Workspace</h1>
          <p className="text-xs text-slate-400 mt-1">
            Create your enterprise company account
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Full Name *"
            type="text"
            placeholder="John Doe"
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Work Email *"
            type="email"
            placeholder="john@cowork.com"
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password *"
            type="password"
            placeholder="At least 6 characters"
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Department"
              type="text"
              placeholder="e.g. Engineering, Design"
              leftIcon={<Building className="w-4 h-4 text-slate-400" />}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />

            <Input
              label="Job Position"
              type="text"
              placeholder="e.g. Software Engineer"
              leftIcon={<Briefcase className="w-4 h-4 text-slate-400" />}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            variant="gradient"
            className="w-full mt-3 py-3"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Workspace Account
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

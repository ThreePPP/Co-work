import React from 'react';
import { cn, getInitials } from '../../lib/utils';
import { UserStatus } from '../../types';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  status?: UserStatus;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base font-semibold',
  xl: 'w-16 h-16 text-lg font-bold',
  '2xl': 'w-24 h-24 text-2xl font-bold',
  '3xl': 'w-32 h-32 text-4xl font-black',
  '4xl': 'w-36 h-36 sm:w-40 sm:h-40 text-5xl font-black',
};

const statusClasses = {
  ONLINE: 'bg-emerald-500 ring-2 ring-slate-900',
  AWAY: 'bg-amber-500 ring-2 ring-slate-900',
  BUSY: 'bg-rose-500 ring-2 ring-slate-900',
  OFFLINE: 'bg-slate-500 ring-2 ring-slate-900',
};

const statusDotSize = {
  xs: 'w-1.5 h-1.5 bottom-0 right-0',
  sm: 'w-2 h-2 bottom-0 right-0',
  md: 'w-2.5 h-2.5 bottom-0 right-0',
  lg: 'w-3 h-3 bottom-0.5 right-0.5',
  xl: 'w-3.5 h-3.5 bottom-1 right-1',
  '2xl': 'w-4 h-4 bottom-1.5 right-1.5',
  '3xl': 'w-5 h-5 bottom-2 right-2',
  '4xl': 'w-6 h-6 bottom-2.5 right-2.5',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  status,
  className,
}) => {
  const initials = getInitials(name);

  // Generate consistent color hash based on name
  const colors = [
    'from-indigo-600 to-purple-600',
    'from-blue-600 to-cyan-600',
    'from-emerald-600 to-teal-600',
    'from-violet-600 to-pink-600',
    'from-amber-600 to-orange-600',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const gradientClass = colors[colorIndex];

  return (
    <div className={cn('relative inline-flex flex-shrink-0 items-center justify-center rounded-full', className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className={cn(
            'rounded-full object-cover border border-white/10 shadow-sm',
            sizeClasses[size]
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-gradient-to-tr text-white flex items-center justify-center font-medium shadow-sm border border-white/10 select-none',
            gradientClass,
            sizeClasses[size]
          )}
        >
          {initials}
        </div>
      )}

      {status && (
        <span
          className={cn(
            'absolute rounded-full ring-2',
            statusClasses[status],
            statusDotSize[size]
          )}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};

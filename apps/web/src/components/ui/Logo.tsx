import React from 'react';
import { cn } from '../../lib/utils';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animateGlow?: boolean;
}

const sizeConfig = {
  sm: {
    container: 'w-10 h-10',
    svg: 'w-10 h-10',
  },
  md: {
    container: 'w-13 h-13',
    svg: 'w-13 h-13',
  },
  lg: {
    container: 'w-18 h-18',
    svg: 'w-18 h-18',
  },
  xl: {
    container: 'w-24 h-24',
    svg: 'w-24 h-24',
  },
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className,
  animateGlow = true,
}) => {
  const config = sizeConfig[size];

  return (
    <div className={cn('relative flex-shrink-0 flex items-center justify-center select-none group', config.container, className)}>
      {/* Soft Ambient Glow Filter */}
      {animateGlow && (
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 via-indigo-500/30 to-purple-500/30 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300 pointer-events-none" />
      )}

      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          'relative z-10 transition-transform duration-300 group-hover:scale-105 drop-shadow-md',
          config.svg
        )}
      >
        <defs>
          {/* Main Neon Gradient */}
          <linearGradient id="coworkGrad1" x1="10%" y1="10%" x2="90%" y2="90%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="45%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>

          {/* Accent Cyan Ribbon */}
          <linearGradient id="coworkGrad2" x1="90%" y1="10%" x2="10%" y2="90%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>

          {/* Inner Depth Shadow Gradient */}
          <radialGradient id="coworkGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#312e81" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Rounded Squircle Container */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="26"
          className="fill-slate-900/90 stroke-white/10"
          strokeWidth="3"
        />

        {/* Inner ambient glow center */}
        <circle cx="50" cy="50" r="28" fill="url(#coworkGlow)" opacity="0.4" />

        {/* Interlocking Infinite Synergy Ribbon (C + O + Connect) */}
        {/* Left Loop (C-curve) */}
        <path
          d="M34 32 C21 32 14 41 14 50 C14 59 21 68 34 68 C45 68 50 56 50 50 C50 44 55 32 66 32 C79 32 86 41 86 50 C86 59 79 68 66 68 C55 68 50 56 50 50"
          stroke="url(#coworkGrad1)"
          strokeWidth="9.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Front Intertwined Ribbon Layer with Highlighting */}
        <path
          d="M36 34 C44 34 48 44 50 50 C52 56 56 66 64 66 C75 66 80 58 80 50 C80 42 75 34 64 34 C56 34 52 44 50 50"
          stroke="url(#coworkGrad2)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />

        {/* Core Collaboration Focal Nodes */}
        <circle cx="34" cy="50" r="4" className="fill-cyan-300 shadow-sm" />
        <circle cx="66" cy="50" r="4" className="fill-purple-300 shadow-sm" />
      </svg>
    </div>
  );
};

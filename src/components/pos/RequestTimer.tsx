'use client';

import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RequestTimerProps {
  createdAt?: number;
  timeAgo?: string;
  className?: string;
  variant?: 'pill' | 'text';
}

function parseTimeAgo(timeAgo?: string): number {
  if (!timeAgo) return Date.now();
  const match = timeAgo.match(/(\d+)\s*(min|m|sec|s|h|hour)/i);
  if (match) {
    const val = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    if (unit.startsWith('h')) return Date.now() - val * 3600_000;
    if (unit.startsWith('m')) return Date.now() - val * 60_000;
    if (unit.startsWith('s')) return Date.now() - val * 1000;
  }
  return Date.now();
}

/**
 * Live ticking stopwatch timer showing how long a customer table request
 * has been waiting. Updates every second.
 */
export function RequestTimer({ createdAt, timeAgo, className, variant = 'pill' }: RequestTimerProps) {
  // Use createdAt if valid and reasonably recent (within 24h), else derive from timeAgo
  const effectiveStart =
    typeof createdAt === 'number' && !isNaN(createdAt) && createdAt > 0 && Date.now() - createdAt < 86_400_000
      ? createdAt
      : parseTimeAgo(timeAgo);

  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    Math.max(0, Math.floor((Date.now() - effectiveStart) / 1000)),
  );

  useEffect(() => {
    // Immediate sync
    setElapsedSeconds(Math.max(0, Math.floor((Date.now() - effectiveStart) / 1000)));

    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - effectiveStart) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [effectiveStart]);

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  const formatted = hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;

  // Severity tiers based on wait time:
  // Under 3 mins: normal
  // 3 to 10 mins: warning (amber)
  // 10+ mins: urgent (rose/red)
  const isUrgent = elapsedSeconds >= 600;
  const isWarning = elapsedSeconds >= 180 && !isUrgent;

  const styleClasses = isUrgent
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : isWarning
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-zinc-100 text-zinc-700 border-zinc-200';

  if (variant === 'text') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 font-mono text-xs font-semibold',
          isUrgent ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-zinc-600',
          className,
        )}
      >
        <Timer size={13} className={cn('shrink-0', isUrgent && 'animate-pulse')} />
        <bdi dir="ltr">{formatted}</bdi>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] font-semibold tracking-tight shadow-2xs transition-colors',
        styleClasses,
        className,
      )}
      title={`Waiting for ${formatted}`}
    >
      <Timer size={12} className={cn('shrink-0', isUrgent && 'animate-pulse text-rose-600')} />
      <bdi dir="ltr">{formatted}</bdi>
    </span>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface CountdownProps {
  deadline: string;
  onExpired?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function calcRemaining(deadline: string): TimeRemaining {
  const totalMs = new Date(deadline).getTime() - Date.now();

  if (totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }

  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalMs };
}

export function Countdown({ deadline, onExpired }: CountdownProps) {
  const [remaining, setRemaining] = useState<TimeRemaining>(() =>
    calcRemaining(deadline),
  );
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;
  const hasFiredExpired = useRef(false);

  const tick = useCallback(() => {
    const next = calcRemaining(deadline);
    setRemaining(next);
    if (next.totalMs <= 0 && !hasFiredExpired.current) {
      hasFiredExpired.current = true;
      onExpiredRef.current?.();
    }
  }, [deadline]);

  useEffect(() => {
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  // EC-18: re-check on tab focus
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        tick();
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tick]);

  if (remaining.totalMs <= 0) {
    return (
      <span className="text-sm font-semibold text-red-800" role="status">
        TENDER CLOSED
      </span>
    );
  }

  const oneHourMs = 60 * 60 * 1000;
  const fiveMinMs = 5 * 60 * 1000;

  let colorClass = 'text-stone-900';
  let pulseClass = '';

  if (remaining.totalMs < fiveMinMs) {
    colorClass = 'text-red-700';
    pulseClass = 'animate-pulse';
  } else if (remaining.totalMs < oneHourMs) {
    colorClass = 'text-amber-700';
  }

  return (
    <span
      className={`text-sm font-mono font-semibold tabular-nums ${colorClass} ${pulseClass}`}
      role="timer"
      aria-live="polite"
    >
      {remaining.days > 0 && `${remaining.days}d `}
      {remaining.hours}h {remaining.minutes}m {remaining.seconds}s
    </span>
  );
}

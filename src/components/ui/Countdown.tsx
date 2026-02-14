'use client';

import { useCountdown } from '@/hooks/useCountdown';

interface CountdownProps {
  targetDate: string;
  label?: string;
}

export default function Countdown({ targetDate, label }: CountdownProps) {
  const { days, hours, minutes, seconds, isPast } = useCountdown(targetDate);

  if (isPast) {
    return <span className="text-gray-400 text-sm">Departed</span>;
  }

  return (
    <div className="flex items-center gap-1">
      {label && <span className="text-xs text-gray-500 mr-1">{label}</span>}
      <div className="flex items-center gap-1 text-sm font-mono">
        {days > 0 && (
          <span className="bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded text-xs font-semibold">
            {days}d
          </span>
        )}
        <span className="bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded text-xs font-semibold">
          {String(hours).padStart(2, '0')}h
        </span>
        <span className="bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded text-xs font-semibold">
          {String(minutes).padStart(2, '0')}m
        </span>
        <span className="bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded text-xs font-semibold">
          {String(seconds).padStart(2, '0')}s
        </span>
      </div>
    </div>
  );
}

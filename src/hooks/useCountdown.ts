'use client';

import { useState, useEffect } from 'react';
import { getCountdown, CountdownValue } from '@/lib/date-utils';

export function useCountdown(targetIso: string): CountdownValue {
  const [countdown, setCountdown] = useState<CountdownValue>(() => getCountdown(targetIso));

  useEffect(() => {
    setCountdown(getCountdown(targetIso));
    const interval = setInterval(() => {
      setCountdown(getCountdown(targetIso));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetIso]);

  return countdown;
}

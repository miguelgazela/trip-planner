'use client';

import { useState, useEffect } from 'react';

interface TravelTimeResult {
  duration: string;
  durationSeconds: number;
  distance: string;
  distanceMeters: number;
}

const CACHE_KEY = 'trip-planner:travel-time-cache';

function getCacheKey(lat1: number, lng1: number, lat2: number, lng2: number): string {
  return `${lat1.toFixed(4)},${lng1.toFixed(4)}->${lat2.toFixed(4)},${lng2.toFixed(4)}`;
}

function getCache(): Record<string, TravelTimeResult & { timestamp: number }> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setCache(key: string, data: TravelTimeResult): void {
  try {
    const cache = getCache();
    cache[key] = { ...data, timestamp: Date.now() };
    const entries = Object.entries(cache);
    if (entries.length > 500) {
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const trimmed = Object.fromEntries(entries.slice(-400));
      localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
  } catch { /* ignore storage errors */ }
}

export function useTravelTime(
  originLat: number, originLng: number,
  destLat: number, destLng: number,
): { data: TravelTimeResult | null; isLoading: boolean } {
  const [data, setData] = useState<TravelTimeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const key = getCacheKey(originLat, originLng, destLat, destLng);

    const cached = getCache()[key];
    if (cached) {
      setData(cached);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetch(`/api/directions?originLat=${originLat}&originLng=${originLng}&destLat=${destLat}&destLng=${destLng}`)
      .then((res) => res.json())
      .then((result) => {
        if (cancelled) return;
        if (result.duration) {
          setData(result);
          setCache(key, result);
        }
      })
      .catch(() => { /* silently fail */ })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [originLat, originLng, destLat, destLng]);

  return { data, isLoading };
}

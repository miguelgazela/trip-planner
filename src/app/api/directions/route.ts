import { NextRequest, NextResponse } from 'next/server';

// Server-side in-memory cache — directions between two fixed points rarely change.
const cache = new Map<string, { data: object; timestamp: number }>();
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_CACHE_SIZE = 2000;

const OSRM_PROFILES: Record<string, string> = {
  walking: 'foot',
  driving: 'car',
};

function getCacheKey(oLat: string, oLng: string, dLat: string, dLng: string, mode: string) {
  return `${Number(oLat).toFixed(4)},${Number(oLng).toFixed(4)}->${Number(dLat).toFixed(4)},${Number(dLng).toFixed(4)}:${mode}`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return '1 min';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''}`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs} h ${rem} min` : `${hrs} h`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const originLat = searchParams.get('originLat');
  const originLng = searchParams.get('originLng');
  const destLat = searchParams.get('destLat');
  const destLng = searchParams.get('destLng');
  const mode = searchParams.get('mode') ?? 'walking';

  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
  }

  const key = getCacheKey(originLat, originLng, destLat, destLng, mode);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const profile = OSRM_PROFILES[mode] ?? 'foot';

  try {
    // OSRM uses lng,lat order (not lat,lng)
    const url = `https://router.project-osrm.org/route/v1/${profile}/${originLng},${originLat};${destLng},${destLat}?overview=false`;
    const res = await fetch(url);
    const json = await res.json();

    if (json.code !== 'Ok' || !json.routes?.[0]) {
      return NextResponse.json({ error: 'No route found' }, { status: 404 });
    }

    const route = json.routes[0];
    const data = {
      duration: formatDuration(route.duration),
      durationSeconds: Math.round(route.duration),
      distance: formatDistance(route.distance),
      distanceMeters: Math.round(route.distance),
    };

    // Evict oldest entries if cache is too large
    if (cache.size >= MAX_CACHE_SIZE) {
      const oldest = Array.from(cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < 200; i++) cache.delete(oldest[i][0]);
    }
    cache.set(key, { data, timestamp: Date.now() });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch directions' }, { status: 500 });
  }
}

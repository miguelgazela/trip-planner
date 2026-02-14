import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const photoUrl = body.url;
  if (!photoUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(photoUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: `Photo fetch failed: ${res.status}` }, { status: res.status });
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: `Not an image: ${contentType}` }, { status: 422 });
    }

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return NextResponse.json({ dataUrl: `data:${contentType.split(';')[0]};base64,${base64}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Failed: ${message}` }, { status: 500 });
  }
}

// Keep GET for backwards compatibility (used by PlaceSearchInput)
export async function GET(request: NextRequest) {
  const photoUrl = request.nextUrl.searchParams.get('url');
  if (!photoUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Forward to POST handler logic
  const fakeRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ url: photoUrl }),
    headers: { 'content-type': 'application/json' },
  });
  return POST(fakeRequest);
}

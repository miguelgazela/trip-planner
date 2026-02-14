'use client';

import { useState, useEffect } from 'react';
import { getImage } from '@/lib/image-cache';

interface PlaceImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function PlaceImage({ src, alt, className }: PlaceImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(
    src.startsWith('idb:') ? null : src
  );

  useEffect(() => {
    if (!src.startsWith('idb:')) {
      setResolvedSrc(src);
      return;
    }
    const id = src.slice(4);
    getImage(id).then((dataUrl) => {
      if (dataUrl) setResolvedSrc(dataUrl);
    }).catch(() => {});
  }, [src]);

  if (!resolvedSrc) return null;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={resolvedSrc} alt={alt} className={className} />;
}

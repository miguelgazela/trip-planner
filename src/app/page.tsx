'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTripContext } from '@/providers/TripProvider';
import TripCard from '@/components/trips/TripCard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { saveImage, getAllImages } from '@/lib/image-cache';

const BACKUP_KEYS = [
  'trip-planner:trips',
  'trip-planner:flights',
  'trip-planner:accommodations',
  'trip-planner:places',
  'trip-planner:expenses',
  'trip-planner:transports',
  'trip-planner:packing',
  'trip-planner:dayplans',
] as const;

export default function HomePage() {
  const { trips, deleteTrip, places, updatePlace } = useTripContext();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [repairStatus, setRepairStatus] = useState<{ running: boolean; message?: string }>({ running: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const data: Record<string, unknown> = {};
    for (const key of BACKUP_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) data[key] = JSON.parse(raw);
    }
    // Include images from IndexedDB
    try {
      const images = await getAllImages();
      if (Object.keys(images).length > 0) {
        data['trip-planner:images'] = images;
      }
    } catch { /* IndexedDB not available */ }

    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        let restored = 0;
        for (const key of BACKUP_KEYS) {
          if (data[key]) {
            localStorage.setItem(key, JSON.stringify(data[key]));
            restored++;
          }
        }
        // Restore images to IndexedDB
        const images = data['trip-planner:images'] as Record<string, string> | undefined;
        if (images) {
          for (const [id, dataUrl] of Object.entries(images)) {
            await saveImage(id, dataUrl);
          }
        }
        setImportStatus({ type: 'success', message: `Restored ${restored} data sets. Reloading...` });
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        setImportStatus({ type: 'error', message: 'Invalid backup file.' });
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be selected again
    e.target.value = '';
  };

  // Migrate existing data: URLs from localStorage to IndexedDB on mount
  useEffect(() => {
    const dataUrlPlaces = places.filter((p) => p.imageUrl && p.imageUrl.startsWith('data:'));
    if (dataUrlPlaces.length === 0) return;
    (async () => {
      for (const place of dataUrlPlaces) {
        await saveImage(place.id, place.imageUrl!);
        updatePlace(place.id, { imageUrl: `idb:${place.id}` });
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const brokenImageCount = places.filter(
    (p) => p.imageUrl && !p.imageUrl.startsWith('data:') && !p.imageUrl.startsWith('idb:')
  ).length;

  const handleRepairImages = async () => {
    const toFix = places.filter((p) => p.imageUrl && !p.imageUrl.startsWith('data:') && !p.imageUrl.startsWith('idb:'));
    if (toFix.length === 0) return;

    setRepairStatus({ running: true, message: `Fixing 0/${toFix.length} images...` });
    let fixed = 0;
    let cleared = 0;
    const errors: string[] = [];

    for (let i = 0; i < toFix.length; i++) {
      const place = toFix[i];
      setRepairStatus({ running: true, message: `Fixing ${i + 1}/${toFix.length}... (${fixed} saved, ${cleared} cleared)` });
      try {
        const res = await fetch('/api/place-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: place.imageUrl }),
        });
        const data = await res.json();
        if (data.dataUrl) {
          await saveImage(place.id, data.dataUrl);
          updatePlace(place.id, { imageUrl: `idb:${place.id}` });
          fixed++;
        } else {
          updatePlace(place.id, { imageUrl: undefined });
          cleared++;
          if (data.error) errors.push(`${place.name}: ${data.error}`);
        }
      } catch (err) {
        updatePlace(place.id, { imageUrl: undefined });
        cleared++;
        errors.push(`${place.name}: ${err instanceof Error ? err.message : 'failed'}`);
      }
    }

    let msg = `Done! ${fixed} image${fixed !== 1 ? 's' : ''} saved, ${cleared} expired image${cleared !== 1 ? 's' : ''} removed.`;
    if (errors.length > 0) msg += ` Errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? ` (+${errors.length - 3} more)` : ''}`;

    setRepairStatus({ running: false, message: msg });
  };

  const sortedTrips = [...trips].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
          <p className="text-sm text-gray-500 mt-1">
            {trips.length} {trips.length === 1 ? 'trip' : 'trips'} planned
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Export backup"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Import backup"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <Link href="/trips/new">
            <Button size="lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Trip
            </Button>
          </Link>
        </div>
      </div>

      {importStatus && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${
          importStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {importStatus.message}
        </div>
      )}

      {brokenImageCount > 0 && !repairStatus.running && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-amber-800">
              {brokenImageCount} place image{brokenImageCount !== 1 ? 's' : ''} still linked to Google API (may expire).
            </span>
          </div>
          <button
            onClick={handleRepairImages}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors flex-shrink-0"
          >
            Download &amp; Save
          </button>
        </div>
      )}

      {repairStatus.message && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${
          repairStatus.running ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
        }`}>
          {repairStatus.message}
        </div>
      )}

      {sortedTrips.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="No trips yet"
          description="Start planning your next adventure by creating a new trip."
          action={
            <Link href="/trips/new">
              <Button>Create Your First Trip</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onDelete={setDeleteId} />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteTrip(deleteId)}
        title="Delete Trip"
        message="Are you sure you want to delete this trip? All flights, accommodation, places, and plans associated with this trip will be permanently removed."
      />
    </div>
  );
}

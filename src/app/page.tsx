'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTripContext } from '@/providers/TripProvider';
import { useAuth } from '@/providers/AuthProvider';
import TripCard from '@/components/trips/TripCard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { hasLocalData, hasMigrated, migrateToSupabase, importBackupToSupabase, MigrationProgress } from '@/lib/migration';

export default function HomePage() {
  const { trips, flights, accommodations, places, expenses, transports, dayPlans, deleteTrip, loading } = useTripContext();
  const { user } = useAuth();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Migration state
  const [showMigration, setShowMigration] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; error?: string } | null>(null);

  // File import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (user && hasLocalData() && !hasMigrated()) {
      setShowMigration(true);
    }
  }, [user]);

  const handleMigrate = async () => {
    if (!user) return;
    setMigrating(true);
    setMigrationResult(null);
    const result = await migrateToSupabase(user.id, setMigrationProgress);
    setMigrationResult(result);
    setMigrating(false);
    if (result.success) {
      // Reload to fetch fresh data from Supabase
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleSkipMigration = () => {
    setShowMigration(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result as string;
      setMigrating(true);
      setImportStatus(null);
      const result = await importBackupToSupabase(user.id, content, setMigrationProgress);
      setMigrating(false);
      if (result.success) {
        setImportStatus({ type: 'success', message: 'Backup imported successfully! Reloading...' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setImportStatus({ type: 'error', message: result.error ?? 'Import failed' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    const data: Record<string, unknown> = {
      'trip-planner:trips': trips,
      'trip-planner:flights': flights,
      'trip-planner:accommodations': accommodations,
      'trip-planner:places': places,
      'trip-planner:expenses': expenses,
      'trip-planner:transports': transports,
      'trip-planner:dayplans': dayPlans,
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortedTrips = [...trips].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Loading your trips...</p>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Migration Banner */}
      {showMigration && !migrationResult?.success && (
        <div className="mb-6 px-4 py-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">
                We found trip data saved in this browser.
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Would you like to import it to your account so it&apos;s accessible everywhere?
              </p>

              {migrating && migrationProgress && (
                <div className="mt-3">
                  <div className="text-xs text-blue-600 mb-1">
                    {migrationProgress.step}... ({migrationProgress.current}/{migrationProgress.total})
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${migrationProgress.total > 0 ? (migrationProgress.current / migrationProgress.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {migrationResult && !migrationResult.success && (
                <p className="text-sm text-red-600 mt-2">
                  Migration failed: {migrationResult.error}
                </p>
              )}

              {!migrating && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleMigrate}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Import Data
                  </button>
                  <button
                    onClick={handleSkipMigration}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    Skip
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {migrationResult?.success && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-green-50 text-green-700 text-sm">
          Data imported successfully! Reloading...
        </div>
      )}

      {importStatus && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${
          importStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {importStatus.message}
        </div>
      )}

      {migrating && migrationProgress && !showMigration && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-blue-50 text-sm">
          <div className="text-xs text-blue-600 mb-1">
            {migrationProgress.step}... ({migrationProgress.current}/{migrationProgress.total})
          </div>
          <div className="w-full bg-blue-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${migrationProgress.total > 0 ? (migrationProgress.current / migrationProgress.total) * 100 : 0}%` }}
            />
          </div>
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

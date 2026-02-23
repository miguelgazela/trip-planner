'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTripContext } from '@/providers/TripProvider';
import TripSidebar from '@/components/layout/TripSidebar';
import MobileNav from '@/components/layout/MobileNav';

export default function TripLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;
  const { getTrip, initializeDayPlans, loading } = useTripContext();
  const trip = getTrip(tripId);

  useEffect(() => {
    if (trip) {
      initializeDayPlans(trip);
    }
  }, [trip, initializeDayPlans]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading trip...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Trip not found</h2>
          <p className="text-sm text-gray-500 mb-4">This trip may have been deleted.</p>
          <button
            onClick={() => router.push('/')}
            className="text-brand-600 hover:text-brand-700 text-sm font-medium"
          >
            Go back to trips
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row">
      <TripSidebar tripId={tripId} tripName={trip.name} />
      <div className="flex-1 pb-20 md:pb-0">
        {children}
      </div>
      <MobileNav tripId={tripId} />
    </div>
  );
}

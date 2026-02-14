'use client';

import { useParams } from 'next/navigation';
import { useTripContext } from '@/providers/TripProvider';
import DailyPlanner from '@/components/planner/DailyPlanner';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function PlannerPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { getTrip, getPlacesForTrip, getTransportsForTrip } = useTripContext();
  const trip = getTrip(tripId);
  const places = getPlacesForTrip(tripId);
  const transports = getTransportsForTrip(tripId);

  if (!trip) return null;

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Daily Planner</h1>
        <p className="text-sm text-gray-500 mt-1">
          Drag places and transport from the bucket list into each day to build your itinerary.
        </p>
      </div>

      {places.length === 0 && transports.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          title="Add places first"
          description="Add places to your bucket list before planning your daily itinerary."
          action={
            <Link href={`/trips/${tripId}/places`}>
              <Button>Go to Places</Button>
            </Link>
          }
        />
      ) : (
        <DailyPlanner trip={trip} />
      )}
    </div>
  );
}

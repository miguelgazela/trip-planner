'use client';

import Link from 'next/link';
import Card from '@/components/ui/Card';
import { Trip } from '@/types/trip';
import { formatTripDates, getDaysBetween } from '@/lib/date-utils';

interface TripCardProps {
  trip: Trip;
  onDelete: (id: string) => void;
}

export default function TripCard({ trip, onDelete }: TripCardProps) {
  const days = getDaysBetween(trip.startDate, trip.endDate);

  return (
    <Card hover className="group relative overflow-hidden">
      <Link href={`/trips/${trip.id}`} className="block">
        {trip.imageUrl ? (
          <div className="h-36 w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={trip.imageUrl}
              alt={trip.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="h-2 bg-gradient-to-r from-brand-500 to-brand-400" />
        )}
        <div className="p-5">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
            {trip.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{trip.destination}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatTripDates(trip.startDate, trip.endDate, trip.dateMode)}
            </span>
            {trip.dateMode !== 'month' && (
              <span className="bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">
                {days} {days === 1 ? 'day' : 'days'}
              </span>
            )}
          </div>
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          onDelete(trip.id);
        }}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 bg-white/80 backdrop-blur-sm hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </Card>
  );
}

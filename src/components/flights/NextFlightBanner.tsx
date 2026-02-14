'use client';

import Countdown from '@/components/ui/Countdown';
import { Flight } from '@/types/trip';

interface NextFlightBannerProps {
  flights: Flight[];
}

export default function NextFlightBanner({ flights }: NextFlightBannerProps) {
  const now = new Date();
  const nextFlight = flights.find((f) => new Date(f.departureTime) > now);

  if (!nextFlight) return null;

  return (
    <div className="bg-gradient-to-r from-brand-600 to-brand-500 rounded-xl p-4 text-white mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-brand-100">Next Flight</p>
          <p className="text-lg font-bold">
            {nextFlight.flightNumber}: {nextFlight.departureAirport} → {nextFlight.arrivalAirport}
          </p>
        </div>
        <div className="bg-white/20 rounded-lg px-4 py-2 backdrop-blur-sm">
          <Countdown targetDate={nextFlight.departureTime} />
        </div>
      </div>
    </div>
  );
}

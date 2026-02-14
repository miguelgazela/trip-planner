'use client';

import Card from '@/components/ui/Card';
import Countdown from '@/components/ui/Countdown';
import { Flight, Currency } from '@/types/trip';
import { formatDateTime } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/currency';

interface FlightCardProps {
  flight: Flight;
  currency: Currency;
  onEdit: (flight: Flight) => void;
  onDelete: (id: string) => void;
}

export default function FlightCard({ flight, currency, onEdit, onDelete }: FlightCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg font-bold text-brand-600">{flight.flightNumber}</span>
            {flight.airline && (
              <span className="text-sm text-gray-500">{flight.airline}</span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{flight.departureAirport}</p>
              <p className="text-xs text-gray-500">{formatDateTime(flight.departureTime)}</p>
            </div>

            <div className="flex-1 flex items-center">
              <div className="h-px bg-gray-300 flex-1" />
              <svg className="w-5 h-5 text-gray-400 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <div className="h-px bg-gray-300 flex-1" />
            </div>

            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{flight.arrivalAirport}</p>
              <p className="text-xs text-gray-500">{formatDateTime(flight.arrivalTime)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3">
            {flight.cost !== undefined && flight.cost > 0 && (
              <span className="text-sm font-medium text-gray-700">
                {formatCurrency(flight.cost, currency)}
              </span>
            )}
            {flight.confirmationCode && (
              <span className="text-xs text-gray-400">Conf: {flight.confirmationCode}</span>
            )}
            <div className="ml-auto">
              <Countdown targetDate={flight.departureTime} />
            </div>
          </div>
        </div>

        <div className="flex gap-1 ml-3">
          <button
            onClick={() => onEdit(flight)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(flight.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </Card>
  );
}

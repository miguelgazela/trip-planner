import { Flight } from '@/types/trip';
import { formatTime } from '@/lib/date-utils';
import { parseISO, isSameDay, format } from 'date-fns';

interface FlightBlockProps {
  flight: Flight;
}

export default function FlightBlock({ flight }: FlightBlockProps) {
  const depDate = parseISO(flight.departureTime);
  const arrDate = parseISO(flight.arrivalTime);
  const multiDay = !isSameDay(depDate, arrDate);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
      <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-blue-700 font-medium truncate">
            {flight.departureAirport}
            <span className="mx-1 text-blue-400">&rarr;</span>
            {flight.arrivalAirport}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-blue-500">
          <span>
            {formatTime(flight.departureTime)}
            <span className="mx-0.5 text-blue-300">&rarr;</span>
            {formatTime(flight.arrivalTime)}
            {multiDay && (
              <span className="text-blue-400 ml-0.5">({format(arrDate, 'MMM dd')})</span>
            )}
          </span>
          {flight.flightNumber && (
            <>
              <span className="text-blue-300">·</span>
              <span>{flight.airline ? `${flight.airline} ${flight.flightNumber}` : flight.flightNumber}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

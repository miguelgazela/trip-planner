'use client';

import Card from '@/components/ui/Card';
import { Accommodation, Currency } from '@/types/trip';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/currency';

interface AccommodationCardProps {
  accommodation: Accommodation;
  currency: Currency;
  onEdit: (accommodation: Accommodation) => void;
  onDelete: (id: string) => void;
}

export default function AccommodationCard({ accommodation, currency, onEdit, onDelete }: AccommodationCardProps) {
  return (
    <Card className="overflow-hidden">
      {accommodation.imageUrl && (
        <div className="h-40 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={accommodation.imageUrl}
            alt={accommodation.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{accommodation.name}</h3>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {accommodation.address}
            </p>

            <div className="flex items-center gap-6 mt-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Check-in</p>
                <p className="text-sm font-medium text-gray-700">{formatDate(accommodation.checkIn)}</p>
                {accommodation.checkInTime && (
                  <p className="text-xs text-gray-500">at {accommodation.checkInTime}</p>
                )}
              </div>
              <div className="text-gray-300">&rarr;</div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Check-out</p>
                <p className="text-sm font-medium text-gray-700">{formatDate(accommodation.checkOut)}</p>
                {accommodation.checkOutTime && (
                  <p className="text-xs text-gray-500">by {accommodation.checkOutTime}</p>
                )}
              </div>
            </div>

            {accommodation.cost !== undefined && accommodation.cost > 0 && (
              <div className="mt-3">
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(accommodation.cost / (accommodation.splitCount ?? 1), currency)}
                </p>
                {accommodation.splitCount && accommodation.splitCount > 1 && (
                  <p className="text-sm text-gray-500">
                    {formatCurrency(accommodation.cost, currency)} split {accommodation.splitCount} ways
                  </p>
                )}
              </div>
            )}

            {accommodation.freeCancellationBefore && (() => {
              const deadline = new Date(accommodation.freeCancellationBefore + 'T00:00:00');
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              const diffMs = deadline.getTime() - now.getTime();
              const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              const isExpired = daysLeft < 0;
              return (
                <p className={`text-xs font-medium mt-2 flex items-center gap-1.5 ${isExpired ? 'text-red-500' : 'text-green-600'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isExpired ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    )}
                  </svg>
                  {isExpired
                    ? `Free cancellation expired ${formatDate(accommodation.freeCancellationBefore)}`
                    : `Free cancellation before ${formatDate(accommodation.freeCancellationBefore)}`
                  }
                  {!isExpired && (
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      daysLeft <= 3 ? 'bg-red-100 text-red-700' : daysLeft <= 7 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {daysLeft === 0 ? 'Today' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
                    </span>
                  )}
                </p>
              );
            })()}

            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {accommodation.confirmationCode && (
                <span className="text-xs text-gray-400">Conf: {accommodation.confirmationCode}</span>
              )}
              {accommodation.bookingUrl && (
                <a
                  href={accommodation.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                >
                  View Booking
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          <div className="flex gap-1 ml-3">
            <button
              onClick={() => onEdit(accommodation)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(accommodation.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

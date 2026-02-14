'use client';

import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PlaceImage from '@/components/ui/PlaceImage';
import { Place, Currency } from '@/types/trip';
import { formatCurrency } from '@/lib/currency';
import { format, parseISO } from 'date-fns';

interface PlaceCardProps {
  place: Place;
  currency: Currency;
  onEdit: (place: Place) => void;
  onDelete: (id: string) => void;
  isHighlighted?: boolean;
  scheduledDates?: string[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <svg className="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span className="text-xs font-medium text-gray-600">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function PlaceCard({ place, currency, onEdit, onDelete, isHighlighted, scheduledDates }: PlaceCardProps) {
  const handleCardClick = () => {
    if (place.website) {
      window.open(place.website, '_blank', 'noopener,noreferrer');
    }
  };

  const isScheduled = place.scheduleStatus === 'scheduled';

  return (
    <Card className={`overflow-hidden relative ${isHighlighted ? 'ring-2 ring-brand-400' : ''} ${place.website ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div onClick={handleCardClick}>
        {place.imageUrl ? (
          <div className="h-32 w-full overflow-hidden relative">
            <PlaceImage
              src={place.imageUrl}
              alt={place.name}
              className="w-full h-full object-cover"
            />
            {isScheduled && (
              <div className="absolute inset-0 z-10 bg-green-900/50 flex items-center justify-center">
                <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-full shadow-sm">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs font-semibold text-green-700">
                    {scheduledDates && scheduledDates.length > 0
                      ? scheduledDates.map((d) => format(parseISO(d), 'EEE, MMM d')).join(' · ')
                      : 'Scheduled'}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : isScheduled ? (
          <div className="bg-green-50 border-b border-green-200 flex items-center justify-center py-2">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs font-semibold text-green-700">
                {scheduledDates && scheduledDates.length > 0
                  ? scheduledDates.map((d) => format(parseISO(d), 'EEE, MMM d')).join(' · ')
                  : 'Scheduled'}
              </span>
            </div>
          </div>
        ) : null}
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{place.name}</h3>
              </div>

              {place.rating !== undefined && place.rating > 0 && (
                <div className="mt-1">
                  <StarRating rating={place.rating} />
                </div>
              )}

              {place.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{place.description}</p>
              )}

              <div className="flex flex-wrap gap-1 mt-2">
                {place.categories.map((cat) => (
                  <Badge key={cat} category={cat} />
                ))}
              </div>

              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                {place.city && (
                  <span className="flex-shrink-0 text-brand-500 font-medium">{place.city}</span>
                )}
                {place.address && (
                  <span className="truncate">{place.address}</span>
                )}
                {place.cost !== undefined && place.cost > 0 && (
                  <span className="flex-shrink-0">{formatCurrency(place.cost, currency)}</span>
                )}
              </div>
            </div>

            <div className="flex gap-1 ml-2 flex-shrink-0 relative z-20" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onEdit(place)}
                className="p-1 rounded text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(place.id)}
                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

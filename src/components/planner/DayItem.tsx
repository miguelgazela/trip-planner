'use client';

import { Draggable } from '@hello-pangea/dnd';
import Badge from '@/components/ui/Badge';
import PlaceImage from '@/components/ui/PlaceImage';
import { Place, Currency } from '@/types/trip';
import { formatCurrency } from '@/lib/currency';

interface DayItemProps {
  place: Place;
  index: number;
  currency?: Currency;
  draggableIdPrefix?: string;
  isLocked?: boolean;
  compactMode?: boolean;
  onRemove?: (placeId: string) => void;
  onToggleLock?: (placeId: string) => void;
  onEdit?: (place: Place) => void;
}

export default function DayItem({ place, index, currency, draggableIdPrefix, isLocked, compactMode, onRemove, onToggleLock, onEdit }: DayItemProps) {
  const draggableId = draggableIdPrefix ? `${draggableIdPrefix}${place.id}` : `place-${place.id}`;
  return (
    <Draggable draggableId={draggableId} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onDoubleClick={onEdit ? () => onEdit(place) : undefined}
          className={`group bg-white border rounded-lg p-3 transition-shadow ${
            snapshot.isDragging ? 'shadow-lg border-brand-300 ring-2 ring-brand-200'
            : isLocked ? 'border-amber-300 bg-amber-50/30 hover:border-amber-400'
            : 'border-gray-200 hover:border-gray-300'
          } ${onEdit ? 'cursor-pointer' : ''}`}
        >
          <div className="flex items-start gap-2">
            {place.imageUrl && (
              <div className="w-9 h-9 rounded overflow-hidden flex-shrink-0">
                <PlaceImage src={place.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <p className="text-sm font-medium text-gray-900 line-clamp-2">{place.name}</p>
                {place.estimatedDuration != null && place.estimatedDuration > 0 && (
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{place.estimatedDuration >= 60 ? `${Math.floor(place.estimatedDuration / 60)}h${place.estimatedDuration % 60 ? place.estimatedDuration % 60 : ''}` : `${place.estimatedDuration}m`}</span>
                )}
                {place.cost != null && place.cost > 0 && currency && (
                  <span className="text-xs text-green-700 font-medium flex-shrink-0">{formatCurrency(place.cost, currency)}</span>
                )}
              </div>
              {!compactMode && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {place.categories.slice(0, 2).map((cat) => (
                    <Badge key={cat} category={cat} />
                  ))}
                </div>
              )}
              {place.tip && (
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 whitespace-pre-line">{place.tip}</p>
              )}
            </div>
            {onToggleLock && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleLock(place.id); }}
                className={`p-1 rounded transition-all flex-shrink-0 ${
                  isLocked
                    ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-100'
                    : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                }`}
                title={isLocked ? 'Unlock from day' : 'Lock to day'}
              >
                {isLocked ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            )}
            {onRemove && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(place.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                title="Remove from day"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

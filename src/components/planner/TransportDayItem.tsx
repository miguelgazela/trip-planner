'use client';

import { Draggable } from '@hello-pangea/dnd';
import { Transport, Currency } from '@/types/trip';
import { formatCurrency } from '@/lib/currency';
import { TRANSPORT_TYPES } from '@/lib/transport-types';

interface TransportDayItemProps {
  transport: Transport;
  index: number;
  currency?: Currency;
  draggableIdPrefix?: string;
  isLocked?: boolean;
  onRemove?: (transportId: string) => void;
  onToggleLock?: (transportId: string) => void;
  onEdit?: (transport: Transport) => void;
  onDelete?: (transportId: string) => void;
}

export default function TransportDayItem({ transport, index, currency, draggableIdPrefix, isLocked, onRemove, onToggleLock, onEdit, onDelete }: TransportDayItemProps) {
  const draggableId = draggableIdPrefix ? `${draggableIdPrefix}${transport.id}` : `transport-${transport.id}`;

  const hours = Math.floor(transport.durationMinutes / 60);
  const mins = transport.durationMinutes % 60;
  const durationLabel = hours > 0 ? `${hours}h${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;

  return (
    <Draggable draggableId={draggableId} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group border rounded-lg p-3 transition-shadow ${
            snapshot.isDragging ? 'shadow-lg border-teal-300 ring-2 ring-teal-200 bg-white'
            : isLocked ? 'border-amber-300 bg-amber-50/30 hover:border-amber-400'
            : 'border-teal-200 bg-teal-50/50 hover:border-teal-300'
          }`}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded flex-shrink-0">
                  {TRANSPORT_TYPES[transport.type].label}
                </span>
                <span className="text-xs text-gray-400">{durationLabel}</span>
                {transport.cost != null && transport.cost > 0 && currency && (
                  <span className="text-xs text-green-700 font-medium flex-shrink-0 ml-auto">
                    {formatCurrency(transport.cost / (transport.splitCount ?? 1), currency)}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-900 mt-1 line-clamp-1">
                {transport.from} <span className="text-gray-400">→</span> {transport.to}
              </p>
              {transport.notes && (
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 whitespace-pre-line">{transport.notes}</p>
              )}
            </div>
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(transport); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-all flex-shrink-0"
                title="Edit transport"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(transport.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                title="Delete transport"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            {onToggleLock && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleLock(transport.id); }}
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
                onClick={(e) => { e.stopPropagation(); onRemove(transport.id); }}
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

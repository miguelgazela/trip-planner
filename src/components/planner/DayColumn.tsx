'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Droppable } from '@hello-pangea/dnd';
import DayItem from './DayItem';
import TransportDayItem from './TransportDayItem';
import TravelTimeConnector from './TravelTimeConnector';
import AccommodationBlockComponent from './AccommodationBlock';
import FlightBlock from './FlightBlock';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import TransportForm from '@/components/transport/TransportForm';
import PlaceForm from '@/components/places/PlaceForm';
import { useTripContext } from '@/providers/TripProvider';
import { DayPlan } from '@/types/planner';
import { Place, Accommodation, Flight, Transport, Currency, Expense } from '@/types/trip';
import { formatDayLabel, getAccommodationForDay } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/currency';
import { AccommodationBlock, TimeOfDay } from '@/types/planner';
import { parseISO, isSameDay } from 'date-fns';

const MapView = dynamic(() => import('@/components/places/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-lg bg-gray-100 animate-pulse flex items-center justify-center">
      <span className="text-gray-400 text-xs">Loading map...</span>
    </div>
  ),
});

interface FlightOnDay {
  flight: Flight;
  timeOfDay: TimeOfDay;
  time: Date;
}

type SectionItem = {
  type: 'place' | 'transport';
  entityId: string;
  locked: boolean;
};

interface DayColumnProps {
  dayPlan: DayPlan;
  places: Place[];
  transports: Transport[];
  flights: Flight[];
  accommodations: Accommodation[];
  currency: Currency;
  expenses: Expense[];
  compactMode?: boolean;
}

const TIME_SECTIONS: { key: TimeOfDay; label: string; icon: JSX.Element }[] = [
  {
    key: 'morning',
    label: 'Morning',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    key: 'afternoon',
    label: 'Afternoon',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    key: 'night',
    label: 'Night',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
];

function getAccommodationBlocks(
  date: string,
  accommodations: Accommodation[]
): { start?: AccommodationBlock; end?: AccommodationBlock } {
  let start: AccommodationBlock | undefined;
  let end: AccommodationBlock | undefined;

  for (const acc of accommodations) {
    const status = getAccommodationForDay(date, acc.checkIn, acc.checkOut);
    if (!status) continue;

    if (status === 'check-out') {
      start = {
        type: 'check-out',
        accommodationId: acc.id,
        accommodationName: acc.name,
        time: acc.checkOutTime,
      };
    }

    if (status === 'overnight') {
      if (!start) {
        start = {
          type: 'overnight',
          accommodationId: acc.id,
          accommodationName: acc.name,
        };
      }
      end = {
        type: 'overnight',
        accommodationId: acc.id,
        accommodationName: acc.name,
      };
    }

    if (status === 'check-in') {
      end = {
        type: 'check-in',
        accommodationId: acc.id,
        accommodationName: acc.name,
        time: acc.checkInTime,
      };
    }
  }

  return { start, end };
}

function getTimeOfDayForTime(time?: string, fallback: TimeOfDay = 'morning'): TimeOfDay {
  if (!time) return fallback;
  const hour = parseInt(time.split(':')[0], 10);
  if (isNaN(hour)) return fallback;
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'night';
}

function TimeSection({
  section,
  dayPlanId,
  items,
  places,
  transports,
  currency,
  flightsInSection,
  accBefore,
  accAfter,
  lockedEntityIds,
  compactMode,
  onRemoveItem,
  onToggleLock,
  onEditTransport,
  onEditPlace,
}: {
  section: (typeof TIME_SECTIONS)[number];
  dayPlanId: string;
  items: SectionItem[];
  places: Place[];
  transports: Transport[];
  currency: Currency;
  flightsInSection: FlightOnDay[];
  accBefore?: AccommodationBlock;
  accAfter?: AccommodationBlock;
  lockedEntityIds: Set<string>;
  onRemoveItem: (entityId: string, type: 'place' | 'transport') => void;
  onToggleLock: (entityId: string) => void;
  onEditTransport: (transport: Transport) => void;
  onEditPlace: (place: Place) => void;
  compactMode?: boolean;
}) {
  const droppableId = `droppable-day-${dayPlanId}-${section.key}`;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`${
          section.key === 'morning' ? 'text-amber-400' :
          section.key === 'afternoon' ? 'text-orange-400' :
          'text-indigo-400'
        }`}>
          {section.icon}
        </span>
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
          {section.label}
        </span>
      </div>
      {!compactMode && [...flightsInSection].sort((a, b) => a.time.getTime() - b.time.getTime()).map((f) => (
        <div key={`flight-${f.flight.id}`} className="mb-1.5"><FlightBlock flight={f.flight} /></div>
      ))}
      {!compactMode && accBefore && <div className="mb-1.5"><AccommodationBlockComponent block={accBefore} position="start" /></div>}
      {!compactMode && accAfter && <div className="mb-1.5"><AccommodationBlockComponent block={accAfter} position="end" /></div>}
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[36px] rounded-lg transition-colors space-y-1.5 ${
              snapshot.isDraggingOver ? 'bg-brand-50 border-2 border-dashed border-brand-300 p-1.5' : ''
            }`}
          >
            {items.map((item, localIndex) => {
              if (item.type === 'transport') {
                const transport = transports.find((t) => t.id === item.entityId);
                if (!transport) return null;
                return (
                  <div key={`t-${transport.id}`}>
                    <TransportDayItem
                      transport={transport}
                      index={localIndex}
                      currency={currency}
                      draggableIdPrefix={`${dayPlanId}-transport-`}
                      isLocked={lockedEntityIds.has(transport.id)}
                      onRemove={(id) => onRemoveItem(id, 'transport')}
                      onToggleLock={onToggleLock}
                      onEdit={onEditTransport}
                    />
                  </div>
                );
              }
              const place = places.find((p) => p.id === item.entityId);
              if (!place) return null;
              // TravelTimeConnector only between consecutive places
              const prevPlaceItem = items.slice(0, localIndex).reverse().find((i) => i.type === 'place');
              const prevPlace = prevPlaceItem ? places.find((p) => p.id === prevPlaceItem.entityId) : null;
              return (
                <div key={`p-${place.id}`}>
                  {prevPlace && prevPlace.latitude != null && prevPlace.longitude != null && place.latitude != null && place.longitude != null && (
                    <TravelTimeConnector
                      originLat={prevPlace.latitude}
                      originLng={prevPlace.longitude}
                      destLat={place.latitude}
                      destLng={place.longitude}
                    />
                  )}
                  <DayItem
                    place={place}
                    index={localIndex}
                    currency={currency}
                    draggableIdPrefix={`${dayPlanId}-place-`}
                    isLocked={lockedEntityIds.has(place.id)}
                    compactMode={compactMode}
                    onRemove={(id) => onRemoveItem(id, 'place')}
                    onToggleLock={onToggleLock}
                    onEdit={onEditPlace}
                  />
                </div>
              );
            })}
            {provided.placeholder}
            {items.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-[10px] text-gray-300 text-center py-2">
                Drop here
              </p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

function MealSlot({
  label,
  timeOfDay,
  dayPlanId,
  item,
  places,
  currency,
  lockedEntityIds,
  onRemoveItem,
  onToggleLock,
  onEditPlace,
  compactMode,
}: {
  label: string;
  timeOfDay: TimeOfDay;
  dayPlanId: string;
  item?: SectionItem;
  places: Place[];
  currency: Currency;
  lockedEntityIds: Set<string>;
  onRemoveItem: (entityId: string, type: 'place' | 'transport') => void;
  onToggleLock: (entityId: string) => void;
  onEditPlace: (place: Place) => void;
  compactMode?: boolean;
}) {
  const droppableId = `droppable-day-${dayPlanId}-${timeOfDay}`;
  const place = item?.type === 'place' ? places.find((p) => p.id === item.entityId) : null;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-orange-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </span>
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`rounded-lg transition-colors ${
              snapshot.isDraggingOver
                ? 'bg-orange-50 border-2 border-dashed border-orange-300 p-1.5'
                : place
                ? ''
                : 'border border-dashed border-gray-200 bg-gray-50/50'
            }`}
          >
            {place ? (
              <DayItem
                place={place}
                index={0}
                currency={currency}
                draggableIdPrefix={`${dayPlanId}-place-`}
                isLocked={lockedEntityIds.has(place.id)}
                compactMode={compactMode}
                onRemove={(id) => onRemoveItem(id, 'place')}
                onToggleLock={onToggleLock}
                onEdit={onEditPlace}
              />
            ) : (
              !snapshot.isDraggingOver && (
                <p className="text-[10px] text-gray-300 text-center py-2.5 flex items-center justify-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Restaurant
                </p>
              )
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default function DayColumn({ dayPlan, places, transports, flights, accommodations, currency, expenses, compactMode }: DayColumnProps) {
  const { unschedulePlace, unscheduleTransport, toggleLockPlace, updateDayPlan, updateTransport, updatePlace } = useTripContext();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [editingTransport, setEditingTransport] = useState<Transport | null>(null);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);

  const { start, end } = getAccommodationBlocks(dayPlan.date, accommodations);

  // Match flights to this day (one entry per flight, deduplicated)
  const dayDate = parseISO(dayPlan.date);
  const flightEntriesMap = new Map<string, FlightOnDay>();
  for (const flight of flights) {
    const depOnDay = isSameDay(parseISO(flight.departureTime), dayDate);
    const arrOnDay = isSameDay(parseISO(flight.arrivalTime), dayDate);
    if (!depOnDay && !arrOnDay) continue;
    const refTime = depOnDay ? parseISO(flight.departureTime) : parseISO(flight.arrivalTime);
    const timeStr = `${refTime.getHours()}:00`;
    flightEntriesMap.set(flight.id, { flight, timeOfDay: getTimeOfDayForTime(timeStr), time: refTime });
  }
  const flightsOnDay = Array.from(flightEntriesMap.values());
  const flightsBySection: Record<TimeOfDay, FlightOnDay[]> = {
    morning: [], lunch: [], afternoon: [], dinner: [], night: [],
  };
  flightsOnDay.forEach((f) => flightsBySection[f.timeOfDay].push(f));
  const totalItems = dayPlan.items.length;

  // Day budget: sum of place costs + transport costs + matching day expenses
  const placeCostTotal = dayPlan.items.reduce((sum, item) => {
    if (!item.placeId) return sum;
    const place = places.find((p) => p.id === item.placeId);
    return sum + (place?.cost ?? 0);
  }, 0);
  const transportCostTotal = dayPlan.items.reduce((sum, item) => {
    if (!item.transportId) return sum;
    const transport = transports.find((t) => t.id === item.transportId);
    return sum + ((transport?.cost ?? 0) / (transport?.splitCount ?? 1));
  }, 0);
  const dayExpensesTotal = expenses
    .filter((e) => e.date === dayPlan.date && (e.status === 'paid' || e.status === 'planned'))
    .reduce((sum, e) => sum + e.amount / (e.splitCount ?? 1), 0);
  const dayCostTotal = placeCostTotal + transportCostTotal + dayExpensesTotal;

  const itemsBySection: Record<TimeOfDay, SectionItem[]> = {
    morning: [],
    lunch: [],
    afternoon: [],
    dinner: [],
    night: [],
  };

  dayPlan.items.forEach((item) => {
    const section = item.timeOfDay ?? 'morning';
    if (item.transportId) {
      itemsBySection[section].push({ type: 'transport', entityId: item.transportId, locked: !!item.locked });
    } else if (item.placeId) {
      itemsBySection[section].push({ type: 'place', entityId: item.placeId, locked: !!item.locked });
    }
  });

  const handleRemoveFromDay = (entityId: string, type: 'place' | 'transport') => {
    if (type === 'transport') {
      unscheduleTransport(entityId, dayPlan.id);
    } else {
      unschedulePlace(entityId, dayPlan.id);
    }
  };

  const handleClearDay = () => {
    dayPlan.items.filter((item) => !item.locked).forEach((item) => {
      if (item.transportId) {
        unscheduleTransport(item.transportId, dayPlan.id);
      } else if (item.placeId) {
        unschedulePlace(item.placeId, dayPlan.id);
      }
    });
  };

  // Map pins for places with coordinates scheduled on this day
  const mapPins = dayPlan.items
    .filter((item) => item.placeId)
    .map((item) => places.find((p) => p.id === item.placeId))
    .filter((p): p is Place => !!p && p.latitude != null && p.longitude != null)
    .map((p) => ({
      id: p.id,
      position: [p.latitude!, p.longitude!] as [number, number],
      title: p.name,
      description: p.tip || p.address,
      categories: p.categories,
      isScheduled: true,
    }));

  const lockedCount = dayPlan.items.filter((item) => item.locked).length;
  const lockedEntityIds = new Set(
    dayPlan.items.filter((item) => item.locked).map((item) => item.transportId ?? item.placeId ?? '')
  );

  // toggleLock needs to work for both places and transports, scoped to this day
  const handleToggleLock = (entityId: string) => {
    toggleLockPlace(entityId, dayPlan.id);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl min-w-[280px] flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{formatDayLabel(dayPlan.date)}</h3>
            <p className="text-xs text-gray-400">
              {totalItems} {totalItems === 1 ? 'activity' : 'activities'}
              {dayCostTotal > 0 && (
                <span className="ml-1.5 text-brand-600 font-medium">
                  · {formatCurrency(dayCostTotal, currency)}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setIsEditingInfo(!isEditingInfo)}
              className={`p-1 rounded transition-colors ${
                isEditingInfo || dayPlan.theme || dayPlan.notes
                  ? 'text-brand-500 hover:text-brand-600 hover:bg-brand-50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title="Edit day info"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            {mapPins.length > 0 && (
              <button
                onClick={() => { setMapKey((k) => k + 1); setShowMap(true); }}
                className="p-1 rounded text-gray-400 hover:text-brand-500 hover:bg-brand-50 transition-colors"
                title="View day map"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </button>
            )}
            {totalItems > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Clear all activities"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {isEditingInfo && (
          <div className="mt-2 space-y-2">
            <input
              type="text"
              value={dayPlan.theme ?? ''}
              onChange={(e) => updateDayPlan(dayPlan.id, { theme: e.target.value || undefined })}
              placeholder="Day theme (e.g. Beach day, Old town...)"
              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 bg-white"
            />
            <textarea
              value={dayPlan.notes ?? ''}
              onChange={(e) => updateDayPlan(dayPlan.id, { notes: e.target.value || undefined })}
              placeholder="Tips & notes..."
              rows={2}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 bg-white resize-none"
            />
          </div>
        )}
        {!isEditingInfo && dayPlan.theme && (
          <p className="mt-1.5 text-xs font-medium text-brand-600">{dayPlan.theme}</p>
        )}
        {!isEditingInfo && dayPlan.notes && (
          <p className="mt-1 text-[11px] text-gray-500 whitespace-pre-line line-clamp-3">{dayPlan.notes}</p>
        )}
      </div>

      <div className="flex-1 p-3 space-y-3">
        {TIME_SECTIONS.map((section, idx) => {
          const accBefore = start && getTimeOfDayForTime(start.time, 'morning') === section.key ? start : undefined;
          const accAfter = end && getTimeOfDayForTime(end.time, 'night') === section.key ? end : undefined;
          return (
            <React.Fragment key={section.key}>
              <TimeSection
                section={section}
                dayPlanId={dayPlan.id}
                items={itemsBySection[section.key]}
                places={places}
                transports={transports}
                currency={currency}
                flightsInSection={flightsBySection[section.key]}
                accBefore={accBefore}
                accAfter={accAfter}
                lockedEntityIds={lockedEntityIds}
                onRemoveItem={handleRemoveFromDay}
                onToggleLock={handleToggleLock}
                onEditTransport={setEditingTransport}
                onEditPlace={setEditingPlace}
                compactMode={compactMode}
              />
              {idx === 0 && (
                <MealSlot
                  label="Lunch"
                  timeOfDay="lunch"
                  dayPlanId={dayPlan.id}
                  item={itemsBySection.lunch[0]}
                  places={places}
                  currency={currency}
                  lockedEntityIds={lockedEntityIds}
                  onRemoveItem={handleRemoveFromDay}
                  onToggleLock={handleToggleLock}
                  onEditPlace={setEditingPlace}
                  compactMode={compactMode}
                />
              )}
              {idx === 1 && (
                <MealSlot
                  label="Dinner"
                  timeOfDay="dinner"
                  dayPlanId={dayPlan.id}
                  item={itemsBySection.dinner[0]}
                  places={places}
                  currency={currency}
                  lockedEntityIds={lockedEntityIds}
                  onRemoveItem={handleRemoveFromDay}
                  onToggleLock={handleToggleLock}
                  onEditPlace={setEditingPlace}
                  compactMode={compactMode}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearDay}
        title="Clear Day"
        message={`Remove ${lockedCount > 0 ? `${totalItems - lockedCount} unlocked` : `all ${totalItems}`} activities from this day? They will return to the bucket list.${lockedCount > 0 ? ` ${lockedCount} locked ${lockedCount === 1 ? 'item' : 'items'} will stay.` : ''}`}
      />

      <Modal
        isOpen={!!editingTransport}
        onClose={() => setEditingTransport(null)}
        title="Edit Transport"
        className="max-w-lg"
      >
        {editingTransport && (
          <TransportForm
            onSubmit={(data) => {
              updateTransport(editingTransport.id, data);
              setEditingTransport(null);
            }}
            onCancel={() => setEditingTransport(null)}
            initialData={editingTransport}
          />
        )}
      </Modal>

      <Modal
        isOpen={!!editingPlace}
        onClose={() => setEditingPlace(null)}
        title="Edit Place"
        className="max-w-xl"
      >
        {editingPlace && (
          <PlaceForm
            onSubmit={(data) => {
              updatePlace(editingPlace.id, data);
              setEditingPlace(null);
            }}
            onCancel={() => setEditingPlace(null)}
            initialData={editingPlace}
          />
        )}
      </Modal>

      <Modal
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        title={`${formatDayLabel(dayPlan.date)} — Map`}
        className="max-w-5xl"
      >
        <div className="h-[800px] rounded-lg overflow-hidden">
          {showMap && mapPins.length > 0 && (
            <MapView key={mapKey} pins={mapPins} />
          )}
        </div>
      </Modal>
    </div>
  );
}

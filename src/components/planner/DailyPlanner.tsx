'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import DayColumn from './DayColumn';
import UnscheduledPool from './UnscheduledPool';
import { useTripContext } from '@/providers/TripProvider';
import { Trip } from '@/types/trip';
import { TimeOfDay } from '@/types/planner';

const MAX_COLUMNS = 5;

interface DailyPlannerProps {
  trip: Trip;
}

function parseDayDroppableId(droppableId: string): { dayPlanId: string; timeOfDay: TimeOfDay } | null {
  const match = droppableId.match(/^droppable-day-(.+)-(morning|lunch|afternoon|dinner|night)$/);
  if (!match) return null;
  return { dayPlanId: match[1], timeOfDay: match[2] as TimeOfDay };
}

function parseDraggableId(draggableId: string): { type: 'place' | 'transport'; entityId: string } {
  // Pool items: pool-transport-{id}, pool-place-{id}, pool-{id}
  if (draggableId.startsWith('pool-transport-')) {
    return { type: 'transport', entityId: draggableId.slice('pool-transport-'.length) };
  }
  if (draggableId.startsWith('pool-place-')) {
    return { type: 'place', entityId: draggableId.slice('pool-place-'.length) };
  }
  if (draggableId.startsWith('pool-')) {
    return { type: 'place', entityId: draggableId.slice('pool-'.length) };
  }
  // Day items: {dayPlanId}-transport-{id} or {dayPlanId}-place-{id}
  const transportMatch = draggableId.match(/-transport-([^-].*)$/);
  if (transportMatch) {
    return { type: 'transport', entityId: transportMatch[1] };
  }
  const placeMatch = draggableId.match(/-place-([^-].*)$/);
  if (placeMatch) {
    return { type: 'place', entityId: placeMatch[1] };
  }
  // Legacy fallbacks
  if (draggableId.startsWith('transport-')) {
    return { type: 'transport', entityId: draggableId.slice('transport-'.length) };
  }
  if (draggableId.startsWith('place-')) {
    return { type: 'place', entityId: draggableId.slice('place-'.length) };
  }
  return { type: 'place', entityId: draggableId };
}

const MEAL_SLOTS: TimeOfDay[] = ['lunch', 'dinner'];

export default function DailyPlanner({ trip }: DailyPlannerProps) {
  const {
    getPlacesForTrip,
    getFlightsForTrip,
    getAccommodationsForTrip,
    getExpensesForTrip,
    getTransportsForTrip,
    getDayPlansForTrip,
    schedulePlace,
    unschedulePlace,
    scheduleTransport,
    unscheduleTransport,
    reorderInDay,
    moveBetweenDays,
  } = useTripContext();

  const [isMounted, setIsMounted] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const places = getPlacesForTrip(trip.id);
  const flights = getFlightsForTrip(trip.id);
  const accommodations = getAccommodationsForTrip(trip.id);
  const expenses = getExpensesForTrip(trip.id);
  const transports = getTransportsForTrip(trip.id);
  const dayPlans = getDayPlansForTrip(trip.id);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const parsed = parseDraggableId(draggableId);
    const destParsed = parseDayDroppableId(destination.droppableId);
    const srcParsed = parseDayDroppableId(source.droppableId);

    // Validate meal slot drops: only restaurants, no transports
    if (destParsed && MEAL_SLOTS.includes(destParsed.timeOfDay)) {
      if (parsed.type === 'transport') return;
      const place = places.find((p) => p.id === parsed.entityId);
      if (!place || !place.categories.includes('restaurant')) return;
      const dayPlan = dayPlans.find((d) => d.id === destParsed.dayPlanId);
      const existing = dayPlan?.items.filter((i) => (i.timeOfDay ?? 'morning') === destParsed.timeOfDay && i.placeId !== parsed.entityId);
      if (existing && existing.length > 0) return;
    }

    const isFromPool = source.droppableId === 'droppable-unscheduled';
    const isToPool = destination.droppableId === 'droppable-unscheduled';

    if (isFromPool && destParsed) {
      if (parsed.type === 'transport') {
        scheduleTransport(parsed.entityId, destParsed.dayPlanId, destination.index, destParsed.timeOfDay);
      } else {
        schedulePlace(parsed.entityId, destParsed.dayPlanId, destination.index, destParsed.timeOfDay);
      }
    } else if (srcParsed && isToPool) {
      if (parsed.type === 'transport') {
        unscheduleTransport(parsed.entityId, srcParsed.dayPlanId);
      } else {
        unschedulePlace(parsed.entityId, srcParsed.dayPlanId);
      }
    } else if (srcParsed && destParsed && srcParsed.dayPlanId === destParsed.dayPlanId) {
      reorderInDay(srcParsed.dayPlanId, parsed.entityId, destination.index, destParsed.timeOfDay);
    } else if (srcParsed && destParsed) {
      moveBetweenDays(parsed.entityId, srcParsed.dayPlanId, destParsed.dayPlanId, destination.index, destParsed.timeOfDay);
    }
  };

  if (!isMounted) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[280px] h-64 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div>
        <div className="sticky top-0 z-10 bg-white pb-4">
          <UnscheduledPool places={places} transports={transports} currency={trip.currency} />
        </div>

        <div className="flex items-center justify-end mb-3">
          <button
            onClick={() => setCompactMode(!compactMode)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors flex items-center gap-1 ${
              compactMode
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Compact
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-min">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(dayPlans.length, MAX_COLUMNS)}, minmax(220px, 1fr))` }}>
              {dayPlans.map((dayPlan) => (
                <DayColumn
                  key={dayPlan.id}
                  dayPlan={dayPlan}
                  places={places}
                  transports={transports}
                  flights={flights}
                  accommodations={accommodations}
                  currency={trip.currency}
                  expenses={expenses}
                  compactMode={compactMode}
                />
              ))}
            </div>
            {dayPlans.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">
                No days to plan. Check your trip dates.
              </p>
            )}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}

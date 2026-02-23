'use client';

import React, { createContext, useContext, useCallback, useMemo, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { generateId } from '@/lib/id';
import { getTripDays } from '@/lib/date-utils';
import { Trip, Flight, Accommodation, Place, Expense, Transport } from '@/types/trip';
import { DayPlan, DayPlanItem, TimeOfDay } from '@/types/planner';
import { PackingItem } from '@/types/packing';
import {
  tripToRow, rowToTrip,
  flightToRow, rowToFlight,
  accommodationToRow, rowToAccommodation,
  placeToRow, rowToPlace,
  expenseToRow, rowToExpense,
  transportToRow, rowToTransport,
  packingItemToRow, rowToPackingItem,
  dayPlanToRow, rowToDayPlan,
  partialToSnake,
} from '@/lib/supabase/mappers';

interface TripContextValue {
  loading: boolean;
  trips: Trip[];
  createTrip: (data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => Trip;
  updateTrip: (id: string, data: Partial<Trip>) => void;
  deleteTrip: (tripId: string) => void;
  getTrip: (tripId: string) => Trip | undefined;

  flights: Flight[];
  addFlight: (tripId: string, data: Omit<Flight, 'id' | 'tripId' | 'createdAt'>) => void;
  updateFlight: (id: string, data: Partial<Flight>) => void;
  deleteFlight: (id: string) => void;
  getFlightsForTrip: (tripId: string) => Flight[];

  accommodations: Accommodation[];
  addAccommodation: (tripId: string, data: Omit<Accommodation, 'id' | 'tripId' | 'createdAt'>) => void;
  updateAccommodation: (id: string, data: Partial<Accommodation>) => void;
  deleteAccommodation: (id: string) => void;
  getAccommodationsForTrip: (tripId: string) => Accommodation[];

  places: Place[];
  addPlace: (tripId: string, data: Omit<Place, 'id' | 'tripId' | 'createdAt' | 'scheduleStatus' | 'scheduledDayIds'>) => void;
  updatePlace: (id: string, data: Partial<Place>) => void;
  deletePlace: (id: string) => void;
  getPlacesForTrip: (tripId: string) => Place[];

  expenses: Expense[];
  addExpense: (tripId: string, data: Omit<Expense, 'id' | 'tripId' | 'createdAt'>) => void;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  getExpensesForTrip: (tripId: string) => Expense[];

  transports: Transport[];
  addTransport: (tripId: string, data: Omit<Transport, 'id' | 'tripId' | 'createdAt' | 'scheduleStatus' | 'scheduledDayIds'>) => void;
  updateTransport: (id: string, data: Partial<Transport>) => void;
  deleteTransport: (id: string) => void;
  getTransportsForTrip: (tripId: string) => Transport[];
  scheduleTransport: (transportId: string, dayPlanId: string, sectionIndex: number, timeOfDay?: TimeOfDay) => void;
  unscheduleTransport: (transportId: string, dayPlanId?: string) => void;

  packingItems: PackingItem[];
  addPackingItem: (tripId: string, data: Omit<PackingItem, 'id' | 'tripId' | 'createdAt'>) => void;
  deletePackingItem: (id: string) => void;
  togglePackingItem: (id: string) => void;
  getPackingItemsForTrip: (tripId: string) => PackingItem[];

  dayPlans: DayPlan[];
  getDayPlansForTrip: (tripId: string) => DayPlan[];
  initializeDayPlans: (trip: Trip) => void;
  updateDayPlan: (dayPlanId: string, data: Partial<Pick<DayPlan, 'theme' | 'notes'>>) => void;
  schedulePlace: (placeId: string, dayPlanId: string, sectionIndex: number, timeOfDay?: TimeOfDay) => void;
  unschedulePlace: (placeId: string, dayPlanId?: string) => void;
  toggleLockPlace: (entityId: string, dayPlanId: string) => void;
  reorderInDay: (dayPlanId: string, entityId: string, destSectionIndex: number, timeOfDay?: TimeOfDay) => void;
  moveBetweenDays: (entityId: string, sourceDayId: string, destDayId: string, destSectionIndex: number, timeOfDay?: TimeOfDay) => void;
}

const TripContext = createContext<TripContextValue | null>(null);

export function useTripContext() {
  const context = useContext(TripContext);
  if (!context) throw new Error('useTripContext must be used within TripProvider');
  return context;
}

// ---------------------------------------------------------------------------
// Helper: fire-and-forget Supabase mutation with error logging
// ---------------------------------------------------------------------------
function bg(promise: Promise<{ error: { message: string } | null }>) {
  promise.then(({ error }) => {
    if (error) console.error('[Supabase]', error.message);
  });
}

export function TripProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? '';

  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transports, setTransports] = useState<Transport[]>([]);
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);

  // --- Initial fetch from Supabase ---
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setTrips([]);
      setFlights([]);
      setAccommodations([]);
      setPlaces([]);
      setExpenses([]);
      setTransports([]);
      setPackingItems([]);
      setDayPlans([]);
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    async function fetchAll() {
      const [
        { data: tripsData },
        { data: flightsData },
        { data: accData },
        { data: placesData },
        { data: expensesData },
        { data: transportsData },
        { data: packingData },
        { data: dayPlansData },
      ] = await Promise.all([
        supabase.from('trips').select('*'),
        supabase.from('flights').select('*'),
        supabase.from('accommodations').select('*'),
        supabase.from('places').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('transports').select('*'),
        supabase.from('packing_items').select('*'),
        supabase.from('day_plans').select('*'),
      ]);

      if (cancelled) return;

      setTrips((tripsData ?? []).map(rowToTrip));
      setFlights((flightsData ?? []).map(rowToFlight));
      setAccommodations((accData ?? []).map(rowToAccommodation));
      setPlaces((placesData ?? []).map(rowToPlace));
      setExpenses((expensesData ?? []).map(rowToExpense));
      setTransports((transportsData ?? []).map(rowToTransport));
      setPackingItems((packingData ?? []).map(rowToPackingItem));
      setDayPlans((dayPlansData ?? []).map(rowToDayPlan));
      setLoading(false);
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  const supabaseRef = useRef<ReturnType<typeof getSupabaseBrowserClient> | null>(null);
  function getClient() {
    if (!supabaseRef.current) supabaseRef.current = getSupabaseBrowserClient();
    return supabaseRef.current;
  }

  // --- Trips ---
  const createTrip = useCallback((data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Trip => {
    const now = new Date().toISOString();
    const trip: Trip = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    setTrips((prev) => [...prev, trip]);
    bg(getClient().from('trips').insert(tripToRow(trip, userId)));
    return trip;
  }, [userId]);

  const updateTrip = useCallback((id: string, data: Partial<Trip>) => {
    setTrips((prev) => prev.map((t) => t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t));
    bg(getClient().from('trips').update({ ...partialToSnake(data), updated_at: new Date().toISOString() }).eq('id', id));
  }, []);

  const deleteTrip = useCallback((tripId: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
    setFlights((prev) => prev.filter((f) => f.tripId !== tripId));
    setAccommodations((prev) => prev.filter((a) => a.tripId !== tripId));
    setPlaces((prev) => prev.filter((p) => p.tripId !== tripId));
    setExpenses((prev) => prev.filter((e) => e.tripId !== tripId));
    setTransports((prev) => prev.filter((t) => t.tripId !== tripId));
    setPackingItems((prev) => prev.filter((p) => p.tripId !== tripId));
    setDayPlans((prev) => prev.filter((d) => d.tripId !== tripId));
    // CASCADE handles children in DB — just delete the trip
    bg(getClient().from('trips').delete().eq('id', tripId));
  }, []);

  const getTrip = useCallback((tripId: string) => trips.find((t) => t.id === tripId), [trips]);

  // --- Flights ---
  const addFlight = useCallback((tripId: string, data: Omit<Flight, 'id' | 'tripId' | 'createdAt'>) => {
    const flight: Flight = { ...data, id: generateId(), tripId, createdAt: new Date().toISOString() };
    setFlights((prev) => [...prev, flight]);
    bg(getClient().from('flights').insert(flightToRow(flight, userId)));
  }, [userId]);

  const updateFlight = useCallback((id: string, data: Partial<Flight>) => {
    setFlights((prev) => prev.map((f) => f.id === id ? { ...f, ...data } : f));
    bg(getClient().from('flights').update(partialToSnake(data)).eq('id', id));
  }, []);

  const deleteFlight = useCallback((id: string) => {
    setFlights((prev) => prev.filter((f) => f.id !== id));
    bg(getClient().from('flights').delete().eq('id', id));
  }, []);

  const getFlightsForTrip = useCallback((tripId: string) => {
    return flights.filter((f) => f.tripId === tripId).sort((a, b) =>
      new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
    );
  }, [flights]);

  // --- Accommodations ---
  const addAccommodation = useCallback((tripId: string, data: Omit<Accommodation, 'id' | 'tripId' | 'createdAt'>) => {
    const acc: Accommodation = { ...data, id: generateId(), tripId, createdAt: new Date().toISOString() };
    setAccommodations((prev) => [...prev, acc]);
    bg(getClient().from('accommodations').insert(accommodationToRow(acc, userId)));
  }, [userId]);

  const updateAccommodation = useCallback((id: string, data: Partial<Accommodation>) => {
    setAccommodations((prev) => prev.map((a) => a.id === id ? { ...a, ...data } : a));
    bg(getClient().from('accommodations').update(partialToSnake(data)).eq('id', id));
  }, []);

  const deleteAccommodation = useCallback((id: string) => {
    setAccommodations((prev) => prev.filter((a) => a.id !== id));
    bg(getClient().from('accommodations').delete().eq('id', id));
  }, []);

  const getAccommodationsForTrip = useCallback((tripId: string) => {
    return accommodations.filter((a) => a.tripId === tripId).sort((a, b) =>
      new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
    );
  }, [accommodations]);

  // --- Places ---
  const addPlace = useCallback((tripId: string, data: Omit<Place, 'id' | 'tripId' | 'createdAt' | 'scheduleStatus' | 'scheduledDayIds'>) => {
    const place: Place = { ...data, id: generateId(), tripId, scheduleStatus: 'unscheduled', scheduledDayIds: [], createdAt: new Date().toISOString() };
    setPlaces((prev) => [...prev, place]);
    bg(getClient().from('places').insert(placeToRow(place, userId)));
  }, [userId]);

  const updatePlace = useCallback((id: string, data: Partial<Place>) => {
    setPlaces((prev) => prev.map((p) => p.id === id ? { ...p, ...data } : p));
    bg(getClient().from('places').update(partialToSnake(data)).eq('id', id));
  }, []);

  const deletePlace = useCallback((id: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== id));
    setDayPlans((prev) => {
      const updated = prev.map((dp) => ({
        ...dp,
        items: dp.items.filter((item) => item.placeId !== id),
      }));
      // Sync affected day plans to Supabase
      updated.forEach((dp) => {
        const original = prev.find((o) => o.id === dp.id);
        if (original && original.items.length !== dp.items.length) {
          bg(getClient().from('day_plans').update({ items: dp.items }).eq('id', dp.id));
        }
      });
      return updated;
    });
    bg(getClient().from('places').delete().eq('id', id));
  }, []);

  const getPlacesForTrip = useCallback((tripId: string) => {
    return places.filter((p) => p.tripId === tripId);
  }, [places]);

  // --- Expenses ---
  const addExpense = useCallback((tripId: string, data: Omit<Expense, 'id' | 'tripId' | 'createdAt'>) => {
    const expense: Expense = { ...data, id: generateId(), tripId, createdAt: new Date().toISOString() };
    setExpenses((prev) => [...prev, expense]);
    bg(getClient().from('expenses').insert(expenseToRow(expense, userId)));
  }, [userId]);

  const updateExpense = useCallback((id: string, data: Partial<Expense>) => {
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, ...data } : e));
    bg(getClient().from('expenses').update(partialToSnake(data)).eq('id', id));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    bg(getClient().from('expenses').delete().eq('id', id));
  }, []);

  const getExpensesForTrip = useCallback((tripId: string) => {
    return expenses.filter((e) => e.tripId === tripId).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [expenses]);

  // --- Transports ---
  const addTransport = useCallback((tripId: string, data: Omit<Transport, 'id' | 'tripId' | 'createdAt' | 'scheduleStatus' | 'scheduledDayIds'>) => {
    const transport: Transport = { ...data, id: generateId(), tripId, scheduleStatus: 'unscheduled', scheduledDayIds: [], createdAt: new Date().toISOString() };
    setTransports((prev) => [...prev, transport]);
    bg(getClient().from('transports').insert(transportToRow(transport, userId)));
  }, [userId]);

  const updateTransport = useCallback((id: string, data: Partial<Transport>) => {
    setTransports((prev) => prev.map((t) => t.id === id ? { ...t, ...data } : t));
    bg(getClient().from('transports').update(partialToSnake(data)).eq('id', id));
  }, []);

  const deleteTransport = useCallback((id: string) => {
    setTransports((prev) => prev.filter((t) => t.id !== id));
    setDayPlans((prev) => {
      const updated = prev.map((dp) => ({
        ...dp,
        items: dp.items.filter((item) => item.transportId !== id),
      }));
      updated.forEach((dp) => {
        const original = prev.find((o) => o.id === dp.id);
        if (original && original.items.length !== dp.items.length) {
          bg(getClient().from('day_plans').update({ items: dp.items }).eq('id', dp.id));
        }
      });
      return updated;
    });
    bg(getClient().from('transports').delete().eq('id', id));
  }, []);

  const getTransportsForTrip = useCallback((tripId: string) => {
    return transports.filter((t) => t.tripId === tripId).sort((a, b) =>
      new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
    );
  }, [transports]);

  const scheduleTransport = useCallback((transportId: string, dayPlanId: string, sectionIndex: number, timeOfDay?: TimeOfDay) => {
    const tod = timeOfDay ?? 'morning';
    const newItem: DayPlanItem = { id: generateId(), transportId, order: 0, timeOfDay: tod };
    setDayPlans((prev) => {
      const updated = prev.map((dp) => {
        if (dp.id !== dayPlanId) return dp;
        const sectionItems = dp.items.filter((i) => (i.timeOfDay ?? 'morning') === tod);
        const otherItems = dp.items.filter((i) => (i.timeOfDay ?? 'morning') !== tod);
        sectionItems.splice(sectionIndex, 0, newItem);
        const combined = [...otherItems, ...sectionItems];
        return { ...dp, items: combined.map((item, i) => ({ ...item, order: i })) };
      });
      const changed = updated.find((dp) => dp.id === dayPlanId);
      if (changed) bg(getClient().from('day_plans').update({ items: changed.items }).eq('id', dayPlanId));
      return updated;
    });
    setTransports((prev) => {
      const updated = prev.map((t) =>
        t.id === transportId ? { ...t, scheduleStatus: 'scheduled' as const, scheduledDayIds: [...(t.scheduledDayIds ?? []).filter((id) => id !== dayPlanId), dayPlanId] } : t
      );
      const changed = updated.find((t) => t.id === transportId);
      if (changed) bg(getClient().from('transports').update({ schedule_status: changed.scheduleStatus, scheduled_day_ids: changed.scheduledDayIds }).eq('id', transportId));
      return updated;
    });
  }, []);

  const unscheduleTransport = useCallback((transportId: string, dayPlanId?: string) => {
    if (dayPlanId) {
      setDayPlans((prev) => {
        const updated = prev.map((dp) =>
          dp.id === dayPlanId
            ? { ...dp, items: dp.items.filter((item) => item.transportId !== transportId).map((item, i) => ({ ...item, order: i })) }
            : dp
        );
        const changed = updated.find((dp) => dp.id === dayPlanId);
        if (changed) bg(getClient().from('day_plans').update({ items: changed.items }).eq('id', dayPlanId));
        return updated;
      });
      setTransports((prev) => {
        const updated = prev.map((t) => {
          if (t.id !== transportId) return t;
          const remaining = (t.scheduledDayIds ?? []).filter((id) => id !== dayPlanId);
          return { ...t, scheduledDayIds: remaining, scheduleStatus: remaining.length > 0 ? 'scheduled' as const : 'unscheduled' as const };
        });
        const changed = updated.find((t) => t.id === transportId);
        if (changed) bg(getClient().from('transports').update({ schedule_status: changed.scheduleStatus, scheduled_day_ids: changed.scheduledDayIds }).eq('id', transportId));
        return updated;
      });
    } else {
      setDayPlans((prev) => {
        const updated = prev.map((dp) => ({
          ...dp,
          items: dp.items.filter((item) => item.transportId !== transportId).map((item, i) => ({ ...item, order: i })),
        }));
        // Sync all affected day plans
        updated.forEach((dp) => {
          const original = prev.find((o) => o.id === dp.id);
          if (original && original.items.length !== dp.items.length) {
            bg(getClient().from('day_plans').update({ items: dp.items }).eq('id', dp.id));
          }
        });
        return updated;
      });
      setTransports((prev) => {
        const updated = prev.map((t) =>
          t.id === transportId ? { ...t, scheduleStatus: 'unscheduled' as const, scheduledDayIds: [] } : t
        );
        bg(getClient().from('transports').update({ schedule_status: 'unscheduled', scheduled_day_ids: [] }).eq('id', transportId));
        return updated;
      });
    }
  }, []);

  // --- Packing ---
  const addPackingItem = useCallback((tripId: string, data: Omit<PackingItem, 'id' | 'tripId' | 'createdAt'>) => {
    const item: PackingItem = { ...data, id: generateId(), tripId, createdAt: new Date().toISOString() };
    setPackingItems((prev) => [...prev, item]);
    bg(getClient().from('packing_items').insert(packingItemToRow(item, userId)));
  }, [userId]);

  const deletePackingItem = useCallback((id: string) => {
    setPackingItems((prev) => prev.filter((p) => p.id !== id));
    bg(getClient().from('packing_items').delete().eq('id', id));
  }, []);

  const togglePackingItem = useCallback((id: string) => {
    setPackingItems((prev) => {
      const updated = prev.map((p) => p.id === id ? { ...p, checked: !p.checked } : p);
      const changed = updated.find((p) => p.id === id);
      if (changed) bg(getClient().from('packing_items').update({ checked: changed.checked }).eq('id', id));
      return updated;
    });
  }, []);

  const getPackingItemsForTrip = useCallback((tripId: string) => {
    return packingItems.filter((p) => p.tripId === tripId).sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [packingItems]);

  // --- Day Plans ---
  const getDayPlansForTrip = useCallback((tripId: string) => {
    return dayPlans.filter((d) => d.tripId === tripId).sort((a, b) => a.date.localeCompare(b.date));
  }, [dayPlans]);

  const initializeDayPlans = useCallback((trip: Trip) => {
    setDayPlans((prev) => {
      const existing = prev.filter((d) => d.tripId === trip.id);
      if (existing.length > 0) return prev;

      const days = getTripDays(trip.startDate, trip.endDate);
      const newPlans: DayPlan[] = days.map((date) => ({
        id: generateId(),
        tripId: trip.id,
        date,
        items: [],
      }));

      // Insert all new day plans to Supabase
      if (userId) {
        const rows = newPlans.map((dp) => dayPlanToRow(dp, userId));
        bg(getClient().from('day_plans').insert(rows));
      }

      return [...prev, ...newPlans];
    });
  }, [userId]);

  const updateDayPlan = useCallback((dayPlanId: string, data: Partial<Pick<DayPlan, 'theme' | 'notes'>>) => {
    setDayPlans((prev) => prev.map((dp) =>
      dp.id === dayPlanId ? { ...dp, ...data } : dp
    ));
    bg(getClient().from('day_plans').update(partialToSnake(data)).eq('id', dayPlanId));
  }, []);

  const schedulePlace = useCallback((placeId: string, dayPlanId: string, sectionIndex: number, timeOfDay?: TimeOfDay) => {
    const tod = timeOfDay ?? 'morning';
    const newItem: DayPlanItem = { id: generateId(), placeId, order: 0, timeOfDay: tod };
    setDayPlans((prev) => {
      const updated = prev.map((dp) => {
        if (dp.id !== dayPlanId) return dp;
        const sectionItems = dp.items.filter((i) => (i.timeOfDay ?? 'morning') === tod);
        const otherItems = dp.items.filter((i) => (i.timeOfDay ?? 'morning') !== tod);
        sectionItems.splice(sectionIndex, 0, newItem);
        const combined = [...otherItems, ...sectionItems];
        return { ...dp, items: combined.map((item, i) => ({ ...item, order: i })) };
      });
      const changed = updated.find((dp) => dp.id === dayPlanId);
      if (changed) bg(getClient().from('day_plans').update({ items: changed.items }).eq('id', dayPlanId));
      return updated;
    });
    setPlaces((prev) => {
      const updated = prev.map((p) =>
        p.id === placeId ? { ...p, scheduleStatus: 'scheduled' as const, scheduledDayIds: [...(p.scheduledDayIds ?? []).filter((id) => id !== dayPlanId), dayPlanId] } : p
      );
      const changed = updated.find((p) => p.id === placeId);
      if (changed) bg(getClient().from('places').update({ schedule_status: changed.scheduleStatus, scheduled_day_ids: changed.scheduledDayIds }).eq('id', placeId));
      return updated;
    });
  }, []);

  const unschedulePlace = useCallback((placeId: string, dayPlanId?: string) => {
    if (dayPlanId) {
      setDayPlans((prev) => {
        const updated = prev.map((dp) =>
          dp.id === dayPlanId
            ? { ...dp, items: dp.items.filter((item) => item.placeId !== placeId).map((item, i) => ({ ...item, order: i })) }
            : dp
        );
        const changed = updated.find((dp) => dp.id === dayPlanId);
        if (changed) bg(getClient().from('day_plans').update({ items: changed.items }).eq('id', dayPlanId));
        return updated;
      });
      setPlaces((prev) => {
        const updated = prev.map((p) => {
          if (p.id !== placeId) return p;
          const remaining = (p.scheduledDayIds ?? []).filter((id) => id !== dayPlanId);
          return { ...p, scheduledDayIds: remaining, scheduleStatus: remaining.length > 0 ? 'scheduled' as const : 'unscheduled' as const };
        });
        const changed = updated.find((p) => p.id === placeId);
        if (changed) bg(getClient().from('places').update({ schedule_status: changed.scheduleStatus, scheduled_day_ids: changed.scheduledDayIds }).eq('id', placeId));
        return updated;
      });
    } else {
      setDayPlans((prev) => {
        const updated = prev.map((dp) => ({
          ...dp,
          items: dp.items.filter((item) => item.placeId !== placeId).map((item, i) => ({ ...item, order: i })),
        }));
        updated.forEach((dp) => {
          const original = prev.find((o) => o.id === dp.id);
          if (original && original.items.length !== dp.items.length) {
            bg(getClient().from('day_plans').update({ items: dp.items }).eq('id', dp.id));
          }
        });
        return updated;
      });
      setPlaces((prev) => {
        const updated = prev.map((p) =>
          p.id === placeId ? { ...p, scheduleStatus: 'unscheduled' as const, scheduledDayIds: [] } : p
        );
        bg(getClient().from('places').update({ schedule_status: 'unscheduled', scheduled_day_ids: [] }).eq('id', placeId));
        return updated;
      });
    }
  }, []);

  const toggleLockPlace = useCallback((entityId: string, dayPlanId: string) => {
    setDayPlans((prev) => {
      const updated = prev.map((dp) => {
        if (dp.id !== dayPlanId) return dp;
        return {
          ...dp,
          items: dp.items.map((item) =>
            item.placeId === entityId || item.transportId === entityId ? { ...item, locked: !item.locked } : item
          ),
        };
      });
      const changed = updated.find((dp) => dp.id === dayPlanId);
      if (changed) bg(getClient().from('day_plans').update({ items: changed.items }).eq('id', dayPlanId));
      return updated;
    });
  }, []);

  const findItemByEntityId = (items: DayPlanItem[], entityId: string) =>
    items.find((i) => i.placeId === entityId || i.transportId === entityId);

  const reorderInDay = useCallback((dayPlanId: string, entityId: string, destSectionIndex: number, timeOfDay?: TimeOfDay) => {
    const tod = timeOfDay ?? 'morning';
    setDayPlans((prev) => {
      const updated = prev.map((dp) => {
        if (dp.id !== dayPlanId) return dp;
        const movedItem = findItemByEntityId(dp.items, entityId);
        if (!movedItem) return dp;
        const remaining = dp.items.filter((i) => i !== movedItem);
        const sectionItems = remaining.filter((i) => (i.timeOfDay ?? 'morning') === tod);
        const otherItems = remaining.filter((i) => (i.timeOfDay ?? 'morning') !== tod);
        sectionItems.splice(destSectionIndex, 0, { ...movedItem, timeOfDay: tod });
        const combined = [...otherItems, ...sectionItems];
        return { ...dp, items: combined.map((item, i) => ({ ...item, order: i })) };
      });
      const changed = updated.find((dp) => dp.id === dayPlanId);
      if (changed) bg(getClient().from('day_plans').update({ items: changed.items }).eq('id', dayPlanId));
      return updated;
    });
  }, []);

  const moveBetweenDays = useCallback((entityId: string, sourceDayId: string, destDayId: string, destSectionIndex: number, timeOfDay?: TimeOfDay) => {
    const tod = timeOfDay ?? 'morning';
    let isTransport = false;
    setDayPlans((prev) => {
      let movedItem: DayPlanItem | undefined;
      const updated = prev.map((dp) => {
        if (dp.id === sourceDayId) {
          const items = [...dp.items];
          const idx = items.findIndex((item) => item.placeId === entityId || item.transportId === entityId);
          if (idx !== -1) {
            [movedItem] = items.splice(idx, 1);
            if (movedItem.transportId) isTransport = true;
          }
          return { ...dp, items: items.map((item, i) => ({ ...item, order: i })) };
        }
        return dp;
      });

      if (!movedItem) return prev;

      const final = updated.map((dp) => {
        if (dp.id === destDayId) {
          const sectionItems = dp.items.filter((i) => (i.timeOfDay ?? 'morning') === tod);
          const otherItems = dp.items.filter((i) => (i.timeOfDay ?? 'morning') !== tod);
          sectionItems.splice(destSectionIndex, 0, { ...movedItem!, timeOfDay: tod });
          const combined = [...otherItems, ...sectionItems];
          return { ...dp, items: combined.map((item, i) => ({ ...item, order: i })) };
        }
        return dp;
      });

      // Sync both affected day plans
      const src = final.find((dp) => dp.id === sourceDayId);
      const dst = final.find((dp) => dp.id === destDayId);
      if (src) bg(getClient().from('day_plans').update({ items: src.items }).eq('id', sourceDayId));
      if (dst) bg(getClient().from('day_plans').update({ items: dst.items }).eq('id', destDayId));

      return final;
    });

    if (isTransport) {
      setTransports((prev) => {
        const updated = prev.map((t) => {
          if (t.id !== entityId) return t;
          const ids = (t.scheduledDayIds ?? []).filter((id) => id !== sourceDayId);
          if (!ids.includes(destDayId)) ids.push(destDayId);
          return { ...t, scheduledDayIds: ids };
        });
        const changed = updated.find((t) => t.id === entityId);
        if (changed) bg(getClient().from('transports').update({ scheduled_day_ids: changed.scheduledDayIds }).eq('id', entityId));
        return updated;
      });
    } else {
      setPlaces((prev) => {
        const updated = prev.map((p) => {
          if (p.id !== entityId) return p;
          const ids = (p.scheduledDayIds ?? []).filter((id) => id !== sourceDayId);
          if (!ids.includes(destDayId)) ids.push(destDayId);
          return { ...p, scheduledDayIds: ids };
        });
        const changed = updated.find((p) => p.id === entityId);
        if (changed) bg(getClient().from('places').update({ scheduled_day_ids: changed.scheduledDayIds }).eq('id', entityId));
        return updated;
      });
    }
  }, []);

  const value = useMemo<TripContextValue>(() => ({
    loading,
    trips, createTrip, updateTrip, deleteTrip, getTrip,
    flights, addFlight, updateFlight, deleteFlight, getFlightsForTrip,
    accommodations, addAccommodation, updateAccommodation, deleteAccommodation, getAccommodationsForTrip,
    places, addPlace, updatePlace, deletePlace, getPlacesForTrip,
    expenses, addExpense, updateExpense, deleteExpense, getExpensesForTrip,
    transports, addTransport, updateTransport, deleteTransport, getTransportsForTrip, scheduleTransport, unscheduleTransport,
    packingItems, addPackingItem, deletePackingItem, togglePackingItem, getPackingItemsForTrip,
    dayPlans, getDayPlansForTrip, initializeDayPlans, updateDayPlan, schedulePlace, unschedulePlace, toggleLockPlace, reorderInDay, moveBetweenDays,
  }), [
    loading,
    trips, createTrip, updateTrip, deleteTrip, getTrip,
    flights, addFlight, updateFlight, deleteFlight, getFlightsForTrip,
    accommodations, addAccommodation, updateAccommodation, deleteAccommodation, getAccommodationsForTrip,
    places, addPlace, updatePlace, deletePlace, getPlacesForTrip,
    expenses, addExpense, updateExpense, deleteExpense, getExpensesForTrip,
    transports, addTransport, updateTransport, deleteTransport, getTransportsForTrip, scheduleTransport, unscheduleTransport,
    packingItems, addPackingItem, deletePackingItem, togglePackingItem, getPackingItemsForTrip,
    dayPlans, getDayPlansForTrip, initializeDayPlans, updateDayPlan, schedulePlace, unschedulePlace, toggleLockPlace, reorderInDay, moveBetweenDays,
  ]);

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

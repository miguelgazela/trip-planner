'use client';

import React, { createContext, useContext, useCallback, useMemo, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { generateId } from '@/lib/id';
import { getTripDays } from '@/lib/date-utils';
import { Trip, Flight, Accommodation, Place, Expense, Transport } from '@/types/trip';
import { DayPlan, DayPlanItem, TimeOfDay } from '@/types/planner';
import { PackingItem } from '@/types/packing';

interface TripContextValue {
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

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [trips, setTrips] = useLocalStorage<Trip[]>('trip-planner:trips', []);
  const [flights, setFlights] = useLocalStorage<Flight[]>('trip-planner:flights', []);
  const [accommodations, setAccommodations] = useLocalStorage<Accommodation[]>('trip-planner:accommodations', []);
  const [places, setPlaces] = useLocalStorage<Place[]>('trip-planner:places', []);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('trip-planner:expenses', []);
  const [transports, setTransports] = useLocalStorage<Transport[]>('trip-planner:transports', []);
  const [packingItems, setPackingItems] = useLocalStorage<PackingItem[]>('trip-planner:packing', []);
  const [dayPlans, setDayPlans] = useLocalStorage<DayPlan[]>('trip-planner:dayplans', []);

  // Migrate: rename 'food' category → 'restaurant'
  useEffect(() => {
    const needsMigration = places.some((p) =>
      (p.categories as string[]).includes('food')
    );
    if (needsMigration) {
      setPlaces((prev) =>
        prev.map((p) => ({
          ...p,
          categories: (p.categories as string[]).map((c) =>
            c === 'food' ? 'restaurant' : c
          ) as Place['categories'],
        }))
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Migrate: scheduledDayId (string) → scheduledDayIds (array)
  useEffect(() => {
    const needsMigration = places.some((p) => !Array.isArray(p.scheduledDayIds));
    if (needsMigration) {
      setPlaces((prev) =>
        prev.map((p) => {
          if (Array.isArray(p.scheduledDayIds)) return p;
          const oldId = (p as unknown as { scheduledDayId?: string }).scheduledDayId;
          return { ...p, scheduledDayIds: oldId ? [oldId] : [] };
        })
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Trips ---
  const createTrip = useCallback((data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Trip => {
    const now = new Date().toISOString();
    const trip: Trip = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    setTrips((prev) => [...prev, trip]);
    return trip;
  }, [setTrips]);

  const updateTrip = useCallback((id: string, data: Partial<Trip>) => {
    setTrips((prev) => prev.map((t) => t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t));
  }, [setTrips]);

  const deleteTrip = useCallback((tripId: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
    setFlights((prev) => prev.filter((f) => f.tripId !== tripId));
    setAccommodations((prev) => prev.filter((a) => a.tripId !== tripId));
    setPlaces((prev) => prev.filter((p) => p.tripId !== tripId));
    setExpenses((prev) => prev.filter((e) => e.tripId !== tripId));
    setTransports((prev) => prev.filter((t) => t.tripId !== tripId));
    setPackingItems((prev) => prev.filter((p) => p.tripId !== tripId));
    setDayPlans((prev) => prev.filter((d) => d.tripId !== tripId));
  }, [setTrips, setFlights, setAccommodations, setPlaces, setExpenses, setTransports, setPackingItems, setDayPlans]);

  const getTrip = useCallback((tripId: string) => trips.find((t) => t.id === tripId), [trips]);

  // --- Flights ---
  const addFlight = useCallback((tripId: string, data: Omit<Flight, 'id' | 'tripId' | 'createdAt'>) => {
    const flight: Flight = { ...data, id: generateId(), tripId, createdAt: new Date().toISOString() };
    setFlights((prev) => [...prev, flight]);
  }, [setFlights]);

  const updateFlight = useCallback((id: string, data: Partial<Flight>) => {
    setFlights((prev) => prev.map((f) => f.id === id ? { ...f, ...data } : f));
  }, [setFlights]);

  const deleteFlight = useCallback((id: string) => {
    setFlights((prev) => prev.filter((f) => f.id !== id));
  }, [setFlights]);

  const getFlightsForTrip = useCallback((tripId: string) => {
    return flights.filter((f) => f.tripId === tripId).sort((a, b) =>
      new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
    );
  }, [flights]);

  // --- Accommodations ---
  const addAccommodation = useCallback((tripId: string, data: Omit<Accommodation, 'id' | 'tripId' | 'createdAt'>) => {
    const acc: Accommodation = { ...data, id: generateId(), tripId, createdAt: new Date().toISOString() };
    setAccommodations((prev) => [...prev, acc]);
  }, [setAccommodations]);

  const updateAccommodation = useCallback((id: string, data: Partial<Accommodation>) => {
    setAccommodations((prev) => prev.map((a) => a.id === id ? { ...a, ...data } : a));
  }, [setAccommodations]);

  const deleteAccommodation = useCallback((id: string) => {
    setAccommodations((prev) => prev.filter((a) => a.id !== id));
  }, [setAccommodations]);

  const getAccommodationsForTrip = useCallback((tripId: string) => {
    return accommodations.filter((a) => a.tripId === tripId).sort((a, b) =>
      new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
    );
  }, [accommodations]);

  // --- Places ---
  const addPlace = useCallback((tripId: string, data: Omit<Place, 'id' | 'tripId' | 'createdAt' | 'scheduleStatus' | 'scheduledDayIds'>) => {
    const place: Place = { ...data, id: generateId(), tripId, scheduleStatus: 'unscheduled', scheduledDayIds: [], createdAt: new Date().toISOString() };
    setPlaces((prev) => [...prev, place]);
  }, [setPlaces]);

  const updatePlace = useCallback((id: string, data: Partial<Place>) => {
    setPlaces((prev) => prev.map((p) => p.id === id ? { ...p, ...data } : p));
  }, [setPlaces]);

  const deletePlace = useCallback((id: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== id));
    setDayPlans((prev) => prev.map((dp) => ({
      ...dp,
      items: dp.items.filter((item) => item.placeId !== id),
    })));
  }, [setPlaces, setDayPlans]);

  const getPlacesForTrip = useCallback((tripId: string) => {
    return places.filter((p) => p.tripId === tripId);
  }, [places]);

  // --- Expenses ---
  const addExpense = useCallback((tripId: string, data: Omit<Expense, 'id' | 'tripId' | 'createdAt'>) => {
    const expense: Expense = { ...data, id: generateId(), tripId, createdAt: new Date().toISOString() };
    setExpenses((prev) => [...prev, expense]);
  }, [setExpenses]);

  const updateExpense = useCallback((id: string, data: Partial<Expense>) => {
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, ...data } : e));
  }, [setExpenses]);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, [setExpenses]);

  const getExpensesForTrip = useCallback((tripId: string) => {
    return expenses.filter((e) => e.tripId === tripId).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [expenses]);

  // --- Transports ---
  const addTransport = useCallback((tripId: string, data: Omit<Transport, 'id' | 'tripId' | 'createdAt' | 'scheduleStatus' | 'scheduledDayIds'>) => {
    const transport: Transport = { ...data, id: generateId(), tripId, scheduleStatus: 'unscheduled', scheduledDayIds: [], createdAt: new Date().toISOString() };
    setTransports((prev) => [...prev, transport]);
  }, [setTransports]);

  const updateTransport = useCallback((id: string, data: Partial<Transport>) => {
    setTransports((prev) => prev.map((t) => t.id === id ? { ...t, ...data } : t));
  }, [setTransports]);

  const deleteTransport = useCallback((id: string) => {
    setTransports((prev) => prev.filter((t) => t.id !== id));
    setDayPlans((prev) => prev.map((dp) => ({
      ...dp,
      items: dp.items.filter((item) => item.transportId !== id),
    })));
  }, [setTransports, setDayPlans]);

  const getTransportsForTrip = useCallback((tripId: string) => {
    return transports.filter((t) => t.tripId === tripId).sort((a, b) =>
      new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
    );
  }, [transports]);

  const scheduleTransport = useCallback((transportId: string, dayPlanId: string, sectionIndex: number, timeOfDay?: TimeOfDay) => {
    const tod = timeOfDay ?? 'morning';
    const newItem: DayPlanItem = { id: generateId(), transportId, order: 0, timeOfDay: tod };
    setDayPlans((prev) => prev.map((dp) => {
      if (dp.id !== dayPlanId) return dp;
      const sectionItems = dp.items.filter((i) => (i.timeOfDay ?? 'morning') === tod);
      const otherItems = dp.items.filter((i) => (i.timeOfDay ?? 'morning') !== tod);
      sectionItems.splice(sectionIndex, 0, newItem);
      const combined = [...otherItems, ...sectionItems];
      return { ...dp, items: combined.map((item, i) => ({ ...item, order: i })) };
    }));
    setTransports((prev) => prev.map((t) =>
      t.id === transportId ? { ...t, scheduleStatus: 'scheduled' as const, scheduledDayIds: [...(t.scheduledDayIds ?? []).filter((id) => id !== dayPlanId), dayPlanId] } : t
    ));
  }, [setDayPlans, setTransports]);

  const unscheduleTransport = useCallback((transportId: string, dayPlanId?: string) => {
    if (dayPlanId) {
      setDayPlans((prev) => prev.map((dp) =>
        dp.id === dayPlanId
          ? { ...dp, items: dp.items.filter((item) => item.transportId !== transportId).map((item, i) => ({ ...item, order: i })) }
          : dp
      ));
      setTransports((prev) => prev.map((t) => {
        if (t.id !== transportId) return t;
        const remaining = (t.scheduledDayIds ?? []).filter((id) => id !== dayPlanId);
        return { ...t, scheduledDayIds: remaining, scheduleStatus: remaining.length > 0 ? 'scheduled' as const : 'unscheduled' as const };
      }));
    } else {
      setDayPlans((prev) => prev.map((dp) => ({
        ...dp,
        items: dp.items.filter((item) => item.transportId !== transportId).map((item, i) => ({ ...item, order: i })),
      })));
      setTransports((prev) => prev.map((t) =>
        t.id === transportId ? { ...t, scheduleStatus: 'unscheduled' as const, scheduledDayIds: [] } : t
      ));
    }
  }, [setDayPlans, setTransports]);

  // --- Packing ---
  const addPackingItem = useCallback((tripId: string, data: Omit<PackingItem, 'id' | 'tripId' | 'createdAt'>) => {
    const item: PackingItem = { ...data, id: generateId(), tripId, createdAt: new Date().toISOString() };
    setPackingItems((prev) => [...prev, item]);
  }, [setPackingItems]);

  const deletePackingItem = useCallback((id: string) => {
    setPackingItems((prev) => prev.filter((p) => p.id !== id));
  }, [setPackingItems]);

  const togglePackingItem = useCallback((id: string) => {
    setPackingItems((prev) => prev.map((p) => p.id === id ? { ...p, checked: !p.checked } : p));
  }, [setPackingItems]);

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
      return [...prev, ...newPlans];
    });
  }, [setDayPlans]);

  const updateDayPlan = useCallback((dayPlanId: string, data: Partial<Pick<DayPlan, 'theme' | 'notes'>>) => {
    setDayPlans((prev) => prev.map((dp) =>
      dp.id === dayPlanId ? { ...dp, ...data } : dp
    ));
  }, [setDayPlans]);

  const schedulePlace = useCallback((placeId: string, dayPlanId: string, sectionIndex: number, timeOfDay?: TimeOfDay) => {
    const tod = timeOfDay ?? 'morning';
    const newItem: DayPlanItem = { id: generateId(), placeId, order: 0, timeOfDay: tod };
    setDayPlans((prev) => prev.map((dp) => {
      if (dp.id !== dayPlanId) return dp;
      const sectionItems = dp.items.filter((i) => (i.timeOfDay ?? 'morning') === tod);
      const otherItems = dp.items.filter((i) => (i.timeOfDay ?? 'morning') !== tod);
      sectionItems.splice(sectionIndex, 0, newItem);
      const combined = [...otherItems, ...sectionItems];
      return { ...dp, items: combined.map((item, i) => ({ ...item, order: i })) };
    }));
    setPlaces((prev) => prev.map((p) =>
      p.id === placeId ? { ...p, scheduleStatus: 'scheduled' as const, scheduledDayIds: [...(p.scheduledDayIds ?? []).filter((id) => id !== dayPlanId), dayPlanId] } : p
    ));
  }, [setDayPlans, setPlaces]);

  const unschedulePlace = useCallback((placeId: string, dayPlanId?: string) => {
    if (dayPlanId) {
      // Remove from specific day only
      setDayPlans((prev) => prev.map((dp) =>
        dp.id === dayPlanId
          ? { ...dp, items: dp.items.filter((item) => item.placeId !== placeId).map((item, i) => ({ ...item, order: i })) }
          : dp
      ));
      setPlaces((prev) => prev.map((p) => {
        if (p.id !== placeId) return p;
        const remaining = (p.scheduledDayIds ?? []).filter((id) => id !== dayPlanId);
        return { ...p, scheduledDayIds: remaining, scheduleStatus: remaining.length > 0 ? 'scheduled' as const : 'unscheduled' as const };
      }));
    } else {
      // Remove from all days
      setDayPlans((prev) => prev.map((dp) => ({
        ...dp,
        items: dp.items.filter((item) => item.placeId !== placeId).map((item, i) => ({ ...item, order: i })),
      })));
      setPlaces((prev) => prev.map((p) =>
        p.id === placeId ? { ...p, scheduleStatus: 'unscheduled' as const, scheduledDayIds: [] } : p
      ));
    }
  }, [setDayPlans, setPlaces]);

  const toggleLockPlace = useCallback((entityId: string, dayPlanId: string) => {
    setDayPlans((prev) => prev.map((dp) => {
      if (dp.id !== dayPlanId) return dp;
      return {
        ...dp,
        items: dp.items.map((item) =>
          item.placeId === entityId || item.transportId === entityId ? { ...item, locked: !item.locked } : item
        ),
      };
    }));
  }, [setDayPlans]);

  const findItemByEntityId = (items: DayPlanItem[], entityId: string) =>
    items.find((i) => i.placeId === entityId || i.transportId === entityId);

  const reorderInDay = useCallback((dayPlanId: string, entityId: string, destSectionIndex: number, timeOfDay?: TimeOfDay) => {
    const tod = timeOfDay ?? 'morning';
    setDayPlans((prev) => prev.map((dp) => {
      if (dp.id !== dayPlanId) return dp;
      const movedItem = findItemByEntityId(dp.items, entityId);
      if (!movedItem) return dp;
      const remaining = dp.items.filter((i) => i !== movedItem);
      const sectionItems = remaining.filter((i) => (i.timeOfDay ?? 'morning') === tod);
      const otherItems = remaining.filter((i) => (i.timeOfDay ?? 'morning') !== tod);
      sectionItems.splice(destSectionIndex, 0, { ...movedItem, timeOfDay: tod });
      const combined = [...otherItems, ...sectionItems];
      return { ...dp, items: combined.map((item, i) => ({ ...item, order: i })) };
    }));
  }, [setDayPlans]);

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

      return updated.map((dp) => {
        if (dp.id === destDayId) {
          const sectionItems = dp.items.filter((i) => (i.timeOfDay ?? 'morning') === tod);
          const otherItems = dp.items.filter((i) => (i.timeOfDay ?? 'morning') !== tod);
          sectionItems.splice(destSectionIndex, 0, { ...movedItem!, timeOfDay: tod });
          const combined = [...otherItems, ...sectionItems];
          return { ...dp, items: combined.map((item, i) => ({ ...item, order: i })) };
        }
        return dp;
      });
    });

    if (isTransport) {
      setTransports((prev) => prev.map((t) => {
        if (t.id !== entityId) return t;
        const ids = (t.scheduledDayIds ?? []).filter((id) => id !== sourceDayId);
        if (!ids.includes(destDayId)) ids.push(destDayId);
        return { ...t, scheduledDayIds: ids };
      }));
    } else {
      setPlaces((prev) => prev.map((p) => {
        if (p.id !== entityId) return p;
        const ids = (p.scheduledDayIds ?? []).filter((id) => id !== sourceDayId);
        if (!ids.includes(destDayId)) ids.push(destDayId);
        return { ...p, scheduledDayIds: ids };
      }));
    }
  }, [setDayPlans, setPlaces, setTransports]);

  const value = useMemo<TripContextValue>(() => ({
    trips, createTrip, updateTrip, deleteTrip, getTrip,
    flights, addFlight, updateFlight, deleteFlight, getFlightsForTrip,
    accommodations, addAccommodation, updateAccommodation, deleteAccommodation, getAccommodationsForTrip,
    places, addPlace, updatePlace, deletePlace, getPlacesForTrip,
    expenses, addExpense, updateExpense, deleteExpense, getExpensesForTrip,
    transports, addTransport, updateTransport, deleteTransport, getTransportsForTrip, scheduleTransport, unscheduleTransport,
    packingItems, addPackingItem, deletePackingItem, togglePackingItem, getPackingItemsForTrip,
    dayPlans, getDayPlansForTrip, initializeDayPlans, updateDayPlan, schedulePlace, unschedulePlace, toggleLockPlace, reorderInDay, moveBetweenDays,
  }), [
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

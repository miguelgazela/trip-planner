import { Trip, Flight, Accommodation, Place, Expense, Transport } from '@/types/trip';
import { DayPlan } from '@/types/planner';

// ---------------------------------------------------------------------------
// Generic snake_case <-> camelCase helpers
// ---------------------------------------------------------------------------

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

// ---------------------------------------------------------------------------
// Trip
// ---------------------------------------------------------------------------

export function tripToRow(trip: Trip, userId: string) {
  return {
    id: trip.id,
    user_id: userId,
    name: trip.name,
    destination: trip.destination,
    start_date: trip.startDate,
    end_date: trip.endDate,
    date_mode: trip.dateMode ?? null,
    currency: trip.currency,
    image_url: trip.imageUrl ?? null,
    budget: trip.budget ?? null,
    daily_food_budget: trip.dailyFoodBudget ?? null,
    created_at: trip.createdAt,
    updated_at: trip.updatedAt,
  };
}

export function rowToTrip(row: Record<string, unknown>): Trip {
  return {
    id: row.id as string,
    name: row.name as string,
    destination: row.destination as string,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    dateMode: (row.date_mode as Trip['dateMode']) ?? undefined,
    currency: row.currency as Trip['currency'],
    imageUrl: (row.image_url as string) ?? undefined,
    budget: (row.budget as number) ?? undefined,
    dailyFoodBudget: (row.daily_food_budget as number) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// Flight
// ---------------------------------------------------------------------------

export function flightToRow(flight: Flight, userId: string) {
  return {
    id: flight.id,
    user_id: userId,
    trip_id: flight.tripId,
    flight_number: flight.flightNumber,
    airline: flight.airline ?? null,
    departure_airport: flight.departureAirport,
    arrival_airport: flight.arrivalAirport,
    departure_time: flight.departureTime,
    arrival_time: flight.arrivalTime,
    cost: flight.cost ?? null,
    confirmation_code: flight.confirmationCode ?? null,
    notes: flight.notes ?? null,
    created_at: flight.createdAt,
  };
}

export function rowToFlight(row: Record<string, unknown>): Flight {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    flightNumber: row.flight_number as string,
    airline: (row.airline as string) ?? undefined,
    departureAirport: row.departure_airport as string,
    arrivalAirport: row.arrival_airport as string,
    departureTime: row.departure_time as string,
    arrivalTime: row.arrival_time as string,
    cost: (row.cost as number) ?? undefined,
    confirmationCode: (row.confirmation_code as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// Accommodation
// ---------------------------------------------------------------------------

export function accommodationToRow(acc: Accommodation, userId: string) {
  return {
    id: acc.id,
    user_id: userId,
    trip_id: acc.tripId,
    name: acc.name,
    address: acc.address,
    check_in: acc.checkIn,
    check_out: acc.checkOut,
    check_in_time: acc.checkInTime ?? null,
    check_out_time: acc.checkOutTime ?? null,
    booking_url: acc.bookingUrl ?? null,
    image_url: acc.imageUrl ?? null,
    cost: acc.cost ?? null,
    split_count: acc.splitCount ?? null,
    confirmation_code: acc.confirmationCode ?? null,
    free_cancellation_before: acc.freeCancellationBefore ?? null,
    latitude: acc.latitude ?? null,
    longitude: acc.longitude ?? null,
    notes: acc.notes ?? null,
    created_at: acc.createdAt,
  };
}

export function rowToAccommodation(row: Record<string, unknown>): Accommodation {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    name: row.name as string,
    address: row.address as string,
    checkIn: row.check_in as string,
    checkOut: row.check_out as string,
    checkInTime: (row.check_in_time as string) ?? undefined,
    checkOutTime: (row.check_out_time as string) ?? undefined,
    bookingUrl: (row.booking_url as string) ?? undefined,
    imageUrl: (row.image_url as string) ?? undefined,
    cost: (row.cost as number) ?? undefined,
    splitCount: (row.split_count as number) ?? undefined,
    confirmationCode: (row.confirmation_code as string) ?? undefined,
    freeCancellationBefore: (row.free_cancellation_before as string) ?? undefined,
    latitude: (row.latitude as number) ?? undefined,
    longitude: (row.longitude as number) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// Place
// ---------------------------------------------------------------------------

export function placeToRow(place: Place, userId: string) {
  return {
    id: place.id,
    user_id: userId,
    trip_id: place.tripId,
    name: place.name,
    description: place.description ?? null,
    address: place.address ?? null,
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
    categories: place.categories,
    website: place.website ?? null,
    estimated_duration: place.estimatedDuration ?? null,
    cost: place.cost ?? null,
    image_url: place.imageUrl ?? null,
    city: place.city ?? null,
    rating: place.rating ?? null,
    schedule_status: place.scheduleStatus,
    scheduled_day_ids: place.scheduledDayIds,
    tip: place.tip ?? null,
    notes: place.notes ?? null,
    is_event: place.isEvent ?? null,
    start_time: place.startTime ?? null,
    created_at: place.createdAt,
  };
}

export function rowToPlace(row: Record<string, unknown>): Place {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    address: (row.address as string) ?? undefined,
    latitude: (row.latitude as number) ?? undefined,
    longitude: (row.longitude as number) ?? undefined,
    categories: (row.categories as Place['categories']) ?? [],
    website: (row.website as string) ?? undefined,
    estimatedDuration: (row.estimated_duration as number) ?? undefined,
    cost: (row.cost as number) ?? undefined,
    imageUrl: (row.image_url as string) ?? undefined,
    city: (row.city as string) ?? undefined,
    rating: (row.rating as number) ?? undefined,
    scheduleStatus: (row.schedule_status as Place['scheduleStatus']) ?? 'unscheduled',
    scheduledDayIds: (row.scheduled_day_ids as string[]) ?? [],
    tip: (row.tip as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    isEvent: (row.is_event as boolean) ?? undefined,
    startTime: (row.start_time as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// Expense
// ---------------------------------------------------------------------------

export function expenseToRow(expense: Expense, userId: string) {
  return {
    id: expense.id,
    user_id: userId,
    trip_id: expense.tripId,
    description: expense.description,
    amount: expense.amount,
    split_count: expense.splitCount ?? null,
    category: expense.category,
    status: expense.status,
    date: expense.date ?? null,
    notes: expense.notes ?? null,
    created_at: expense.createdAt,
  };
}

export function rowToExpense(row: Record<string, unknown>): Expense {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    description: row.description as string,
    amount: row.amount as number,
    splitCount: (row.split_count as number) ?? undefined,
    category: row.category as Expense['category'],
    status: row.status as Expense['status'],
    date: (row.date as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

export function transportToRow(transport: Transport, userId: string) {
  return {
    id: transport.id,
    user_id: userId,
    trip_id: transport.tripId,
    type: transport.type,
    from: transport.from,
    to: transport.to,
    departure_time: transport.departureTime,
    duration_minutes: transport.durationMinutes,
    cost: transport.cost ?? null,
    split_count: transport.splitCount ?? null,
    notes: transport.notes ?? null,
    schedule_status: transport.scheduleStatus,
    scheduled_day_ids: transport.scheduledDayIds,
    created_at: transport.createdAt,
  };
}

export function rowToTransport(row: Record<string, unknown>): Transport {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    type: row.type as Transport['type'],
    from: row.from as string,
    to: row.to as string,
    departureTime: row.departure_time as string,
    durationMinutes: row.duration_minutes as number,
    cost: (row.cost as number) ?? undefined,
    splitCount: (row.split_count as number) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    scheduleStatus: (row.schedule_status as Transport['scheduleStatus']) ?? 'unscheduled',
    scheduledDayIds: (row.scheduled_day_ids as string[]) ?? [],
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// DayPlan
// ---------------------------------------------------------------------------

export function dayPlanToRow(dayPlan: DayPlan, userId: string) {
  return {
    id: dayPlan.id,
    user_id: userId,
    trip_id: dayPlan.tripId,
    date: dayPlan.date,
    items: dayPlan.items,
    theme: dayPlan.theme ?? null,
    notes: dayPlan.notes ?? null,
  };
}

export function rowToDayPlan(row: Record<string, unknown>): DayPlan {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    date: row.date as string,
    items: (row.items as DayPlan['items']) ?? [],
    theme: (row.theme as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Generic partial update helper — converts camelCase keys to snake_case
// Used for updateTrip, updateFlight etc. where we send Partial<Entity>
// ---------------------------------------------------------------------------

const SPECIAL_KEY_MAP: Record<string, string> = {
  tripId: 'trip_id',
  userId: 'user_id',
  startDate: 'start_date',
  endDate: 'end_date',
  dateMode: 'date_mode',
  imageUrl: 'image_url',
  dailyFoodBudget: 'daily_food_budget',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  flightNumber: 'flight_number',
  departureAirport: 'departure_airport',
  arrivalAirport: 'arrival_airport',
  departureTime: 'departure_time',
  arrivalTime: 'arrival_time',
  confirmationCode: 'confirmation_code',
  checkIn: 'check_in',
  checkOut: 'check_out',
  checkInTime: 'check_in_time',
  checkOutTime: 'check_out_time',
  bookingUrl: 'booking_url',
  splitCount: 'split_count',
  freeCancellationBefore: 'free_cancellation_before',
  estimatedDuration: 'estimated_duration',
  scheduleStatus: 'schedule_status',
  scheduledDayIds: 'scheduled_day_ids',
  isEvent: 'is_event',
  startTime: 'start_time',
  durationMinutes: 'duration_minutes',
};

export function partialToSnake(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'id') continue; // never update the PK
    const snakeKey = SPECIAL_KEY_MAP[key] ?? toSnakeCase(key);
    result[snakeKey] = value === undefined ? null : value;
  }
  return result;
}

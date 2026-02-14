export type CategoryTag =
  | 'restaurant'
  | 'sightseeing'
  | 'shopping'
  | 'nightlife'
  | 'culture'
  | 'nature'
  | 'adventure';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'BRL' | 'CAD' | 'AUD';

export type ScheduleStatus = 'unscheduled' | 'scheduled';

export type ExpenseCategory = 'accommodation' | 'transport' | 'food' | 'activities' | 'shopping' | 'other';
export type ExpenseStatus = 'paid' | 'planned' | 'wishlist';

export interface Expense {
  id: string;
  tripId: string;
  description: string;
  amount: number;
  splitCount?: number;
  category: ExpenseCategory;
  status: ExpenseStatus;
  date?: string;
  notes?: string;
  createdAt: string;
}

export type DateMode = 'specific' | 'month';

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  dateMode?: DateMode;
  currency: Currency;
  imageUrl?: string;
  budget?: number;
  dailyFoodBudget?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Flight {
  id: string;
  tripId: string;
  flightNumber: string;
  airline?: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  cost?: number;
  confirmationCode?: string;
  notes?: string;
  createdAt: string;
}

export interface Accommodation {
  id: string;
  tripId: string;
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
  checkInTime?: string;
  checkOutTime?: string;
  bookingUrl?: string;
  imageUrl?: string;
  cost?: number;
  splitCount?: number;
  confirmationCode?: string;
  freeCancellationBefore?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  createdAt: string;
}

export interface Place {
  id: string;
  tripId: string;
  name: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  categories: CategoryTag[];
  website?: string;
  estimatedDuration?: number;
  cost?: number;
  imageUrl?: string;
  city?: string;
  rating?: number;
  scheduleStatus: ScheduleStatus;
  scheduledDayIds: string[];
  tip?: string;
  notes?: string;
  createdAt: string;
}

export type TransportType = 'train' | 'bus' | 'ferry' | 'taxi' | 'metro' | 'rental_car';

export interface Transport {
  id: string;
  tripId: string;
  type: TransportType;
  from: string;
  to: string;
  departureTime: string;
  durationMinutes: number;
  cost?: number;
  splitCount?: number;
  notes?: string;
  scheduleStatus: ScheduleStatus;
  scheduledDayIds: string[];
  createdAt: string;
}

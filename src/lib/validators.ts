import { z } from 'zod';

export const tripSchema = z.object({
  name: z.string().min(1, 'Trip name is required').max(100),
  destination: z.string().min(1, 'Destination is required').max(200),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'BRL', 'CAD', 'AUD']),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  budget: z.number().min(0, 'Budget must be positive').optional(),
  dailyFoodBudget: z.number().min(0, 'Must be positive').optional(),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const flightSchema = z.object({
  flightNumber: z.string().min(1, 'Flight number is required'),
  airline: z.string().optional(),
  departureAirport: z.string().min(2, 'Departure airport is required').max(4),
  arrivalAirport: z.string().min(2, 'Arrival airport is required').max(4),
  departureTime: z.string().min(1, 'Departure time is required'),
  arrivalTime: z.string().min(1, 'Arrival time is required'),
  cost: z.number().min(0).optional(),
  confirmationCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const accommodationSchema = z.object({
  name: z.string().min(1, 'Hotel name is required'),
  address: z.string().min(1, 'Address is required'),
  checkIn: z.string().min(1, 'Check-in date is required'),
  checkOut: z.string().min(1, 'Check-out date is required'),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  bookingUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  cost: z.number().min(0).optional(),
  splitCount: z.number().int().min(1).optional(),
  confirmationCode: z.string().optional(),
  freeCancellationBefore: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  notes: z.string().max(500).optional(),
});

export const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.number({ error: 'Amount is required' }).min(0, 'Amount must be positive'),
  splitCount: z.number().int().min(1).optional(),
  category: z.enum(['accommodation', 'transport', 'food', 'activities', 'shopping', 'other']),
  status: z.enum(['paid', 'planned', 'wishlist']),
  date: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const placeSchema = z.object({
  name: z.string().min(1, 'Place name is required'),
  description: z.string().max(500).optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  categories: z.array(z.enum([
    'restaurant', 'sightseeing', 'shopping', 'nightlife',
    'culture', 'nature', 'adventure'
  ])).min(1, 'Select at least one category'),
  city: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  website: z.string().url().optional().or(z.literal('')),
  estimatedDuration: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  tip: z.string().max(300).optional(),
  notes: z.string().max(500).optional(),
  isEvent: z.boolean().optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:mm format').optional(),
}).refine((data) => !data.isEvent || !!data.startTime, {
  message: 'Start time is required for events',
  path: ['startTime'],
});

export const transportSchema = z.object({
  type: z.enum(['train', 'bus', 'ferry', 'taxi', 'metro', 'rental_car']),
  from: z.string().min(1, 'Departure location is required').max(200),
  to: z.string().min(1, 'Arrival location is required').max(200),
  departureTime: z.string().min(1, 'Departure time is required'),
  durationMinutes: z.number({ error: 'Duration is required' }).int().min(1, 'Must be at least 1 minute'),
  cost: z.number().min(0).optional(),
  splitCount: z.number().int().min(1).optional(),
  notes: z.string().max(500).optional(),
});

export const packingItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(100),
  category: z.enum(['documents', 'clothing', 'electronics', 'toiletries', 'health', 'other']),
});

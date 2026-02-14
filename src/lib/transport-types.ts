import { TransportType } from '@/types/trip';

export const TRANSPORT_TYPES: Record<TransportType, { label: string }> = {
  train: { label: 'Train' },
  bus: { label: 'Bus' },
  ferry: { label: 'Ferry' },
  taxi: { label: 'Taxi / Uber' },
  metro: { label: 'Metro' },
  rental_car: { label: 'Rental Car' },
};

export const ALL_TRANSPORT_TYPES = Object.keys(TRANSPORT_TYPES) as TransportType[];

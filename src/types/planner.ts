export interface DayPlan {
  id: string;
  tripId: string;
  date: string;
  items: DayPlanItem[];
  theme?: string;
  notes?: string;
}

export type TimeOfDay = 'morning' | 'lunch' | 'afternoon' | 'dinner' | 'night';

export interface DayPlanItem {
  id: string;
  placeId?: string;
  transportId?: string;
  order: number;
  timeOfDay?: TimeOfDay;
  startTime?: string;
  endTime?: string;
  notes?: string;
  locked?: boolean;
}

export interface AccommodationBlock {
  type: 'check-in' | 'check-out' | 'overnight';
  accommodationId: string;
  accommodationName: string;
  time?: string;
}

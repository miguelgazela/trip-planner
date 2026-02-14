import {
  format,
  parseISO,
  differenceInCalendarDays,
  differenceInSeconds,
  eachDayOfInterval,
  isWithinInterval,
  isSameDay,
  isBefore,
  startOfDay,
  lastDayOfMonth,
} from 'date-fns';
import { DateMode } from '@/types/trip';

export const formatDate = (iso: string) => format(parseISO(iso), 'MMM dd, yyyy');
export const formatDateTime = (iso: string) => format(parseISO(iso), 'MMM dd, yyyy HH:mm');
export const formatTime = (iso: string) => format(parseISO(iso), 'HH:mm');
export const formatShortDate = (iso: string) => format(parseISO(iso), 'EEE, MMM dd');
export const formatDayLabel = (iso: string) => format(parseISO(iso), 'EEEE, MMM dd');
export const formatMonth = (iso: string) => format(parseISO(iso), 'MMMM yyyy');

export const formatTripDates = (startDate: string, endDate: string, dateMode?: DateMode): string => {
  if (dateMode === 'month') return formatMonth(startDate);
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

export const monthToDateRange = (monthValue: string): { startDate: string; endDate: string } => {
  const start = parseISO(`${monthValue}-01`);
  const end = lastDayOfMonth(start);
  return { startDate: format(start, 'yyyy-MM-dd'), endDate: format(end, 'yyyy-MM-dd') };
};

export const getTripDays = (startDate: string, endDate: string): string[] => {
  return eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  }).map((date) => format(date, 'yyyy-MM-dd'));
};

export const getDaysBetween = (startDate: string, endDate: string): number => {
  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });
  return days.length;
};

export interface CountdownValue {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  totalSeconds: number;
}

export const getCountdown = (targetIso: string): CountdownValue => {
  const target = parseISO(targetIso);
  const now = new Date();
  const isPast = isBefore(target, now);
  const days = Math.abs(differenceInCalendarDays(target, now));
  const nextDayBoundary = startOfDay(isPast ? now : target);
  const remainderSeconds = Math.abs(differenceInSeconds(isPast ? now : nextDayBoundary, isPast ? nextDayBoundary : now));
  const totalSeconds = Math.abs(differenceInSeconds(target, now));

  return {
    days,
    hours: Math.floor((remainderSeconds % 86400) / 3600),
    minutes: Math.floor((remainderSeconds % 3600) / 60),
    seconds: remainderSeconds % 60,
    isPast,
    totalSeconds,
  };
};

export const getAccommodationForDay = (
  date: string,
  checkIn: string,
  checkOut: string
): 'check-in' | 'check-out' | 'overnight' | null => {
  const d = parseISO(date);
  const ci = parseISO(checkIn);
  const co = parseISO(checkOut);

  if (isSameDay(d, ci)) return 'check-in';
  if (isSameDay(d, co)) return 'check-out';
  if (isWithinInterval(d, { start: ci, end: co })) return 'overnight';
  return null;
};

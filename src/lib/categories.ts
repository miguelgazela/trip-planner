import { CategoryTag } from '@/types/trip';

interface CategoryConfig {
  label: string;
  bgColor: string;
  textColor: string;
}

export const CATEGORIES: Record<CategoryTag, CategoryConfig> = {
  restaurant:  { label: 'Restaurant',  bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  sightseeing: { label: 'Sightseeing', bgColor: 'bg-blue-100',   textColor: 'text-blue-800' },
  shopping:    { label: 'Shopping',    bgColor: 'bg-pink-100',   textColor: 'text-pink-800' },
  nightlife:   { label: 'Nightlife',   bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
  culture:     { label: 'Culture',     bgColor: 'bg-amber-100',  textColor: 'text-amber-800' },
  nature:      { label: 'Nature',      bgColor: 'bg-green-100',  textColor: 'text-green-800' },
  adventure:   { label: 'Adventure',   bgColor: 'bg-red-100',    textColor: 'text-red-800' },
};

export const ALL_CATEGORIES: CategoryTag[] = Object.keys(CATEGORIES) as CategoryTag[];

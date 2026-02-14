import { ExpenseCategory } from '@/types/trip';

export interface ExpenseCategoryInfo {
  value: ExpenseCategory;
  label: string;
  color: string;
  icon: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategoryInfo[] = [
  { value: 'accommodation', label: 'Accommodation', color: 'bg-blue-100 text-blue-700', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { value: 'transport', label: 'Transport', color: 'bg-purple-100 text-purple-700', icon: 'M8 7h12l-2 5H8m0 0l-2 5h12M8 12H4m4 0V7m0 5v5m-4 0h4' },
  { value: 'food', label: 'Food & Dining', color: 'bg-orange-100 text-orange-700', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z' },
  { value: 'activities', label: 'Activities', color: 'bg-green-100 text-green-700', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { value: 'shopping', label: 'Shopping', color: 'bg-pink-100 text-pink-700', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700', icon: 'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z' },
];

export const EXPENSE_CATEGORY_MAP: Record<ExpenseCategory, ExpenseCategoryInfo> =
  Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.value, c])) as Record<ExpenseCategory, ExpenseCategoryInfo>;

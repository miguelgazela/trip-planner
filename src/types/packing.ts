export type PackingCategory = 'documents' | 'clothing' | 'electronics' | 'toiletries' | 'health' | 'other';

export interface PackingItem {
  id: string;
  tripId: string;
  name: string;
  category: PackingCategory;
  checked: boolean;
  createdAt: string;
}

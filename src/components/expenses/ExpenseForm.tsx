'use client';

import { useState } from 'react';
import { expenseSchema } from '@/lib/validators';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Expense, ExpenseCategory, ExpenseStatus } from '@/types/trip';

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'transport', label: 'Transport' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'activities', label: 'Activities' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'other', label: 'Other' },
];

interface ExpenseFormProps {
  onSubmit: (data: Omit<Expense, 'id' | 'tripId' | 'createdAt'>) => void;
  onCancel: () => void;
  initialData?: Expense;
}

export default function ExpenseForm({ onSubmit, onCancel, initialData }: ExpenseFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    description: initialData?.description ?? '',
    amount: initialData?.amount?.toString() ?? '',
    splitCount: initialData?.splitCount?.toString() ?? '1',
    category: initialData?.category ?? 'other' as ExpenseCategory,
    status: initialData?.status ?? 'planned' as ExpenseStatus,
    date: initialData?.date ?? '',
    notes: initialData?.notes ?? '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const splitNum = formData.splitCount ? Number(formData.splitCount) : undefined;
    const parsed = {
      ...formData,
      amount: formData.amount ? Number(formData.amount) : undefined,
      splitCount: splitNum && splitNum > 1 ? splitNum : undefined,
      date: formData.date || undefined,
      notes: formData.notes || undefined,
    };

    const result = expenseSchema.safeParse(parsed);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    onSubmit(result.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="description"
        label="Description"
        placeholder="Museum tickets, taxi to airport..."
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        error={errors.description}
      />
      <div className="grid grid-cols-3 gap-4">
        <Input
          id="amount"
          label="Total Amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="25.00"
          value={formData.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
          error={errors.amount}
        />
        <Input
          id="splitCount"
          label="Split between"
          type="number"
          min="1"
          step="1"
          placeholder="1"
          value={formData.splitCount}
          onChange={(e) => handleChange('splitCount', e.target.value)}
        />
        <Input
          id="date"
          label="Date (optional)"
          type="date"
          value={formData.date}
          onChange={(e) => handleChange('date', e.target.value)}
        />
      </div>
      {formData.amount && Number(formData.splitCount) > 1 && (
        <p className="text-xs text-brand-600 -mt-2">
          Your share: {(Number(formData.amount) / Number(formData.splitCount)).toFixed(2)} per person
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="planned">Planned</option>
            <option value="paid">Paid</option>
            <option value="wishlist">Wishlist</option>
          </select>
        </div>
      </div>
      <Input
        id="notes"
        label="Notes (optional)"
        placeholder="Additional details..."
        value={formData.notes}
        onChange={(e) => handleChange('notes', e.target.value)}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initialData ? 'Update' : 'Add'} Expense</Button>
      </div>
    </form>
  );
}

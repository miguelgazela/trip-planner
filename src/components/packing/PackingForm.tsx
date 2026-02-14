'use client';

import { useState } from 'react';
import { packingItemSchema } from '@/lib/validators';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { PackingCategory } from '@/types/packing';
import { PACKING_CATEGORIES } from '@/lib/packing-categories';

interface PackingFormProps {
  onSubmit: (data: { name: string; category: PackingCategory; checked: boolean }) => void;
  onCancel: () => void;
}

export default function PackingForm({ onSubmit, onCancel }: PackingFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PackingCategory>('other');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = packingItemSchema.safeParse({ name, category });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    onSubmit({ name: result.data.name, category: result.data.category as PackingCategory, checked: false });
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="name"
        label="Item Name"
        placeholder="Passport, charger, sunscreen..."
        value={name}
        onChange={(e) => { setName(e.target.value); setErrors({}); }}
        error={errors.name}
      />
      <div className="space-y-1">
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as PackingCategory)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        >
          {PACKING_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Add Item</Button>
      </div>
    </form>
  );
}

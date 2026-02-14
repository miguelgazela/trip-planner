'use client';

import { useState } from 'react';
import { transportSchema } from '@/lib/validators';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Transport, TransportType } from '@/types/trip';
import { ALL_TRANSPORT_TYPES, TRANSPORT_TYPES } from '@/lib/transport-types';

interface TransportFormProps {
  onSubmit: (data: Omit<Transport, 'id' | 'tripId' | 'createdAt' | 'scheduleStatus' | 'scheduledDayIds'>) => void;
  onCancel: () => void;
  initialData?: Transport;
}

export default function TransportForm({ onSubmit, onCancel, initialData }: TransportFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    type: initialData?.type ?? ('train' as TransportType),
    from: initialData?.from ?? '',
    to: initialData?.to ?? '',
    departureTime: initialData?.departureTime?.slice(0, 16) ?? '',
    durationMinutes: initialData?.durationMinutes?.toString() ?? '',
    cost: initialData?.cost?.toString() ?? '',
    splitCount: initialData?.splitCount?.toString() ?? '',
    notes: initialData?.notes ?? '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = {
      ...formData,
      durationMinutes: formData.durationMinutes ? Number(formData.durationMinutes) : undefined,
      cost: formData.cost ? Number(formData.cost) : undefined,
      splitCount: formData.splitCount ? Number(formData.splitCount) : undefined,
      notes: formData.notes || undefined,
    };

    const result = transportSchema.safeParse(parsed);
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <div className="flex flex-wrap gap-2">
          {ALL_TRANSPORT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleChange('type', t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                formData.type === t
                  ? 'bg-teal-100 text-teal-700 ring-1 ring-teal-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {TRANSPORT_TYPES[t].label}
            </button>
          ))}
        </div>
        {errors.type && <p className="text-sm text-red-600 mt-1">{errors.type}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="from"
          label="From"
          placeholder="Lisbon Santa Apolónia"
          value={formData.from}
          onChange={(e) => handleChange('from', e.target.value)}
          error={errors.from}
        />
        <Input
          id="to"
          label="To"
          placeholder="Porto Campanhã"
          value={formData.to}
          onChange={(e) => handleChange('to', e.target.value)}
          error={errors.to}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="departureTime"
          label="Departure"
          type="datetime-local"
          value={formData.departureTime}
          onChange={(e) => handleChange('departureTime', e.target.value)}
          error={errors.departureTime}
        />
        <Input
          id="durationMinutes"
          label="Duration (minutes)"
          type="number"
          min="1"
          placeholder="180"
          value={formData.durationMinutes}
          onChange={(e) => handleChange('durationMinutes', e.target.value)}
          error={errors.durationMinutes}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="cost"
          label="Cost (optional)"
          type="number"
          step="0.01"
          min="0"
          placeholder="25.00"
          value={formData.cost}
          onChange={(e) => handleChange('cost', e.target.value)}
          error={errors.cost}
        />
        <Input
          id="splitCount"
          label="Split (optional)"
          type="number"
          min="1"
          placeholder="2"
          value={formData.splitCount}
          onChange={(e) => handleChange('splitCount', e.target.value)}
          error={errors.splitCount}
        />
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Platform 3, book in advance..."
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initialData ? 'Update' : 'Add'} Transport</Button>
      </div>
    </form>
  );
}

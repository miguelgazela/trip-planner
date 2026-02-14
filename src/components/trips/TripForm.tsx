'use client';

import { useState } from 'react';
import { tripSchema } from '@/lib/validators';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Trip, Currency, DateMode } from '@/types/trip';
import { monthToDateRange } from '@/lib/date-utils';

const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'BRL', label: 'BRL - Brazilian Real' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
];

interface TripFormProps {
  onSubmit: (data: { name: string; destination: string; startDate: string; endDate: string; dateMode?: DateMode; currency: Currency; imageUrl?: string; budget?: number; dailyFoodBudget?: number }) => void;
  onCancel: () => void;
  initialData?: Trip;
}

export default function TripForm({ onSubmit, onCancel, initialData }: TripFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dateMode, setDateMode] = useState<DateMode>(initialData?.dateMode ?? 'specific');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    let startDate: string;
    let endDate: string;

    if (dateMode === 'month') {
      const monthVal = formData.get('month') as string;
      if (!monthVal) {
        setErrors({ startDate: 'Month is required' });
        return;
      }
      const range = monthToDateRange(monthVal);
      startDate = range.startDate;
      endDate = range.endDate;
    } else {
      startDate = formData.get('startDate') as string;
      endDate = formData.get('endDate') as string;
    }

    const data = {
      name: formData.get('name') as string,
      destination: formData.get('destination') as string,
      startDate,
      endDate,
      dateMode,
      currency: formData.get('currency') as Currency,
      imageUrl: (formData.get('imageUrl') as string) || undefined,
      budget: formData.get('budget') ? Number(formData.get('budget')) : undefined,
      dailyFoodBudget: formData.get('dailyFoodBudget') ? Number(formData.get('dailyFoodBudget')) : undefined,
    };

    const result = tripSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    onSubmit({ ...result.data, dateMode });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        id="name"
        name="name"
        label="Trip Name"
        placeholder="Summer in Tokyo"
        defaultValue={initialData?.name}
        error={errors.name}
      />
      <Input
        id="destination"
        name="destination"
        label="Destination"
        placeholder="Tokyo, Japan"
        defaultValue={initialData?.destination}
        error={errors.destination}
      />
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-gray-700">When</span>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => { setDateMode('specific'); setErrors({}); }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                dateMode === 'specific' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Specific dates
            </button>
            <button
              type="button"
              onClick={() => { setDateMode('month'); setErrors({}); }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                dateMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Month
            </button>
          </div>
        </div>
        {dateMode === 'specific' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="startDate"
              name="startDate"
              label="Start Date"
              type="date"
              defaultValue={initialData?.dateMode !== 'month' ? initialData?.startDate : undefined}
              error={errors.startDate}
            />
            <Input
              id="endDate"
              name="endDate"
              label="End Date"
              type="date"
              defaultValue={initialData?.dateMode !== 'month' ? initialData?.endDate : undefined}
              error={errors.endDate}
            />
          </div>
        ) : (
          <Input
            id="month"
            name="month"
            label="Month"
            type="month"
            defaultValue={initialData?.dateMode === 'month' ? initialData.startDate.slice(0, 7) : undefined}
            error={errors.startDate}
          />
        )}
      </div>
      <Select
        id="currency"
        name="currency"
        label="Currency"
        options={currencyOptions}
        defaultValue={initialData?.currency}
        error={errors.currency}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          id="budget"
          name="budget"
          label="Budget (optional)"
          type="number"
          step="0.01"
          min="0"
          placeholder="2000.00"
          defaultValue={initialData?.budget?.toString() ?? ''}
          error={errors.budget}
        />
        <Input
          id="dailyFoodBudget"
          name="dailyFoodBudget"
          label="Daily food budget (optional)"
          type="number"
          step="0.01"
          min="0"
          placeholder="50.00"
          defaultValue={initialData?.dailyFoodBudget?.toString() ?? ''}
          error={errors.dailyFoodBudget}
        />
      </div>
      <Input
        id="imageUrl"
        name="imageUrl"
        label="Cover Image URL (optional)"
        type="url"
        placeholder="https://images.unsplash.com/..."
        defaultValue={initialData?.imageUrl}
        error={errors.imageUrl}
      />
      <div className="flex gap-3 pt-2">
        <Button type="submit" size="lg" className="flex-1">
          {initialData ? 'Save Changes' : 'Create Trip'}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

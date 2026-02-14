'use client';

import { useState, useCallback } from 'react';
import { accommodationSchema } from '@/lib/validators';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PlaceSearchInput from '@/components/places/PlaceSearchInput';
import { Accommodation } from '@/types/trip';

interface AccommodationFormProps {
  onSubmit: (data: Omit<Accommodation, 'id' | 'tripId' | 'createdAt'>) => void;
  onCancel: () => void;
  initialData?: Accommodation;
}

export default function AccommodationForm({ onSubmit, onCancel, initialData }: AccommodationFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    address: initialData?.address ?? '',
    latitude: initialData?.latitude?.toString() ?? '',
    longitude: initialData?.longitude?.toString() ?? '',
    checkIn: initialData?.checkIn?.slice(0, 10) ?? '',
    checkOut: initialData?.checkOut?.slice(0, 10) ?? '',
    checkInTime: initialData?.checkInTime ?? '',
    checkOutTime: initialData?.checkOutTime ?? '',
    bookingUrl: initialData?.bookingUrl ?? '',
    imageUrl: initialData?.imageUrl ?? '',
    cost: initialData?.cost?.toString() ?? '',
    splitCount: initialData?.splitCount?.toString() ?? '',
    confirmationCode: initialData?.confirmationCode ?? '',
    freeCancellationBefore: initialData?.freeCancellationBefore ?? '',
    notes: initialData?.notes ?? '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handlePlaceSelected = useCallback((place: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    website?: string;
    imageUrl?: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      name: place.name,
      address: place.address,
      latitude: place.latitude.toString(),
      longitude: place.longitude.toString(),
      imageUrl: place.imageUrl ?? prev.imageUrl,
    }));
    setErrors({});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = {
      ...formData,
      cost: formData.cost ? Number(formData.cost) : undefined,
      splitCount: formData.splitCount ? Number(formData.splitCount) : undefined,
      latitude: formData.latitude ? Number(formData.latitude) : undefined,
      longitude: formData.longitude ? Number(formData.longitude) : undefined,
      checkInTime: formData.checkInTime || undefined,
      checkOutTime: formData.checkOutTime || undefined,
      bookingUrl: formData.bookingUrl || undefined,
      imageUrl: formData.imageUrl || undefined,
      confirmationCode: formData.confirmationCode || undefined,
      freeCancellationBefore: formData.freeCancellationBefore || undefined,
      notes: formData.notes || undefined,
    };

    const result = accommodationSchema.safeParse(parsed);
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
      <PlaceSearchInput onPlaceSelected={handlePlaceSelected} />
      <Input
        id="name"
        label="Hotel / Property Name"
        placeholder="Hotel Gracery Shinjuku"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        error={errors.name}
      />
      <Input
        id="address"
        label="Address"
        placeholder="1-17-1 Kabukicho, Shinjuku, Tokyo"
        value={formData.address}
        onChange={(e) => handleChange('address', e.target.value)}
        error={errors.address}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="checkIn"
          label="Check-in Date"
          type="date"
          value={formData.checkIn}
          onChange={(e) => handleChange('checkIn', e.target.value)}
          error={errors.checkIn}
        />
        <Input
          id="checkInTime"
          label="Check-in Time (optional)"
          type="time"
          value={formData.checkInTime}
          onChange={(e) => handleChange('checkInTime', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="checkOut"
          label="Check-out Date"
          type="date"
          value={formData.checkOut}
          onChange={(e) => handleChange('checkOut', e.target.value)}
          error={errors.checkOut}
        />
        <Input
          id="checkOutTime"
          label="Check-out Time (optional)"
          type="time"
          value={formData.checkOutTime}
          onChange={(e) => handleChange('checkOutTime', e.target.value)}
        />
      </div>
      <Input
        id="imageUrl"
        label="Cover Image URL (optional)"
        type="url"
        placeholder="https://images.unsplash.com/..."
        value={formData.imageUrl}
        onChange={(e) => handleChange('imageUrl', e.target.value)}
        error={errors.imageUrl}
      />
      {formData.imageUrl && (
        <div className="h-32 rounded-lg overflow-hidden border border-gray-200 -mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={formData.imageUrl} alt={formData.name || 'Accommodation'} className="w-full h-full object-cover" />
        </div>
      )}
      <Input
        id="bookingUrl"
        label="Booking URL (optional)"
        type="url"
        placeholder="https://booking.com/..."
        value={formData.bookingUrl}
        onChange={(e) => handleChange('bookingUrl', e.target.value)}
        error={errors.bookingUrl}
      />
      <div className="grid grid-cols-3 gap-4">
        <Input
          id="cost"
          label="Total Cost (optional)"
          type="number"
          step="0.01"
          min="0"
          placeholder="500.00"
          value={formData.cost}
          onChange={(e) => handleChange('cost', e.target.value)}
          error={errors.cost}
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
          id="confirmationCode"
          label="Confirmation Code"
          placeholder="BK-12345"
          value={formData.confirmationCode}
          onChange={(e) => handleChange('confirmationCode', e.target.value)}
        />
      </div>
      <Input
        id="freeCancellationBefore"
        label="Free cancellation before (optional)"
        type="date"
        value={formData.freeCancellationBefore}
        onChange={(e) => handleChange('freeCancellationBefore', e.target.value)}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initialData ? 'Update' : 'Add'} Accommodation</Button>
      </div>
    </form>
  );
}

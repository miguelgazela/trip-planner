'use client';

import { useState, useCallback } from 'react';
import { flightSchema } from '@/lib/validators';
import { lookupAirline } from '@/lib/airlines';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Flight } from '@/types/trip';

interface FlightFormProps {
  onSubmit: (data: Omit<Flight, 'id' | 'tripId' | 'createdAt'>) => void;
  onCancel: () => void;
  initialData?: Flight;
}

export default function FlightForm({ onSubmit, onCancel, initialData }: FlightFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [formData, setFormData] = useState({
    flightNumber: initialData?.flightNumber ?? '',
    airline: initialData?.airline ?? '',
    departureAirport: initialData?.departureAirport ?? '',
    arrivalAirport: initialData?.arrivalAirport ?? '',
    departureTime: initialData?.departureTime?.slice(0, 16) ?? '',
    arrivalTime: initialData?.arrivalTime?.slice(0, 16) ?? '',
    cost: initialData?.cost?.toString() ?? '',
    confirmationCode: initialData?.confirmationCode ?? '',
    notes: initialData?.notes ?? '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleFlightLookup = useCallback(async (flightNumber: string) => {
    if (!flightNumber || flightNumber.trim().length < 3) return;

    // Step 1: Always try local airline lookup
    const airlineName = lookupAirline(flightNumber);
    if (airlineName) {
      setFormData((prev) => ({
        ...prev,
        airline: prev.airline || airlineName,
      }));
    }

    // Step 2: Try API lookup for full details
    setLookupStatus('loading');
    try {
      const res = await fetch(`/api/flight-lookup?flight=${encodeURIComponent(flightNumber.replace(/\s+/g, ''))}`);
      if (res.status === 501) {
        // API not configured — local-only mode
        setLookupStatus(airlineName ? 'done' : 'idle');
        return;
      }
      if (!res.ok) {
        setLookupStatus(airlineName ? 'done' : 'error');
        return;
      }
      const data = await res.json();
      setFormData((prev) => ({
        ...prev,
        airline: data.airline || prev.airline,
        departureAirport: data.departureAirport || prev.departureAirport,
        arrivalAirport: data.arrivalAirport || prev.arrivalAirport,
        departureTime: data.departureTime ? data.departureTime.slice(0, 16) : prev.departureTime,
        arrivalTime: data.arrivalTime ? data.arrivalTime.slice(0, 16) : prev.arrivalTime,
      }));
      setLookupStatus('done');
    } catch {
      setLookupStatus(airlineName ? 'done' : 'error');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = {
      ...formData,
      departureAirport: formData.departureAirport.toUpperCase(),
      arrivalAirport: formData.arrivalAirport.toUpperCase(),
      cost: formData.cost ? Number(formData.cost) : undefined,
    };

    const result = flightSchema.safeParse(parsed);
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Input
            id="flightNumber"
            label="Flight Number"
            placeholder="AA 1234"
            value={formData.flightNumber}
            onChange={(e) => handleChange('flightNumber', e.target.value)}
            onBlur={() => handleFlightLookup(formData.flightNumber)}
            error={errors.flightNumber}
          />
          {lookupStatus === 'loading' && (
            <p className="text-[10px] text-gray-400">Looking up flight...</p>
          )}
          {lookupStatus === 'done' && (
            <p className="text-[10px] text-green-600">Flight info loaded</p>
          )}
          {lookupStatus === 'error' && (
            <p className="text-[10px] text-gray-400">Flight not found — fill in manually</p>
          )}
        </div>
        <Input
          id="airline"
          label="Airline (optional)"
          placeholder="American Airlines"
          value={formData.airline}
          onChange={(e) => handleChange('airline', e.target.value)}
          error={errors.airline}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="departureAirport"
          label="From (Airport Code)"
          placeholder="JFK"
          maxLength={4}
          value={formData.departureAirport}
          onChange={(e) => handleChange('departureAirport', e.target.value)}
          error={errors.departureAirport}
        />
        <Input
          id="arrivalAirport"
          label="To (Airport Code)"
          placeholder="NRT"
          maxLength={4}
          value={formData.arrivalAirport}
          onChange={(e) => handleChange('arrivalAirport', e.target.value)}
          error={errors.arrivalAirport}
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
          id="arrivalTime"
          label="Arrival"
          type="datetime-local"
          value={formData.arrivalTime}
          onChange={(e) => handleChange('arrivalTime', e.target.value)}
          error={errors.arrivalTime}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="cost"
          label="Cost (optional)"
          type="number"
          step="0.01"
          min="0"
          placeholder="350.00"
          value={formData.cost}
          onChange={(e) => handleChange('cost', e.target.value)}
          error={errors.cost}
        />
        <Input
          id="confirmationCode"
          label="Confirmation Code (optional)"
          placeholder="ABC123"
          value={formData.confirmationCode}
          onChange={(e) => handleChange('confirmationCode', e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initialData ? 'Update' : 'Add'} Flight</Button>
      </div>
    </form>
  );
}

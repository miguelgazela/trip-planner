'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useTripContext } from '@/providers/TripProvider';
import AccommodationCard from '@/components/accommodation/AccommodationCard';
import AccommodationForm from '@/components/accommodation/AccommodationForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Accommodation } from '@/types/trip';
import { MapPin } from '@/types/map';
import { formatCurrency } from '@/lib/currency';

const MapView = dynamic(() => import('@/components/places/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-xl bg-brand-50 animate-pulse flex items-center justify-center min-h-[250px]">
      <span className="text-brand-400 text-sm">Loading map...</span>
    </div>
  ),
});

export default function AccommodationPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { getTrip, getAccommodationsForTrip, addAccommodation, updateAccommodation, deleteAccommodation } = useTripContext();
  const trip = getTrip(tripId);
  const accommodations = getAccommodationsForTrip(tripId);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Accommodation | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!trip) return null;

  const handleSubmit = (data: Omit<Accommodation, 'id' | 'tripId' | 'createdAt'>) => {
    if (editing) {
      updateAccommodation(editing.id, data);
    } else {
      addAccommodation(tripId, data);
    }
    setIsFormOpen(false);
    setEditing(null);
  };

  const handleEdit = (acc: Accommodation) => {
    setEditing(acc);
    setIsFormOpen(true);
  };

  const total = accommodations.reduce((sum, a) => sum + (a.cost ? a.cost / (a.splitCount ?? 1) : 0), 0);

  const pins: MapPin[] = accommodations
    .filter((a) => a.latitude !== undefined && a.longitude !== undefined)
    .map((a) => ({
      id: a.id,
      position: [a.latitude!, a.longitude!] as [number, number],
      title: a.name,
      description: a.address,
      categories: [],
      isScheduled: false,
    }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accommodation</h1>
          {accommodations.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {accommodations.length} {accommodations.length === 1 ? 'booking' : 'bookings'}
              {total > 0 && ` · Total: ${formatCurrency(total, trip.currency)}`}
            </p>
          )}
        </div>
        <Button onClick={() => { setEditing(null); setIsFormOpen(true); }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Accommodation
        </Button>
      </div>

      {pins.length > 0 && (
        <div className="h-[420px] rounded-xl overflow-hidden border border-gray-200 mb-6">
          <MapView pins={pins} />
        </div>
      )}

      {accommodations.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          title="No accommodation added"
          description="Add your hotel and accommodation bookings to track check-in dates and costs."
          action={<Button onClick={() => setIsFormOpen(true)}>Add Your First Booking</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {accommodations.map((acc) => (
            <AccommodationCard
              key={acc.id}
              accommodation={acc}
              currency={trip.currency}
              onEdit={handleEdit}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditing(null); }}
        title={editing ? 'Edit Accommodation' : 'Add Accommodation'}
        className="max-w-xl"
      >
        <AccommodationForm
          onSubmit={handleSubmit}
          onCancel={() => { setIsFormOpen(false); setEditing(null); }}
          initialData={editing ?? undefined}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteAccommodation(deleteId)}
        title="Delete Accommodation"
        message="Are you sure you want to delete this accommodation booking?"
      />
    </div>
  );
}

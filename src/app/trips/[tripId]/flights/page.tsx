'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTripContext } from '@/providers/TripProvider';
import FlightCard from '@/components/flights/FlightCard';
import FlightForm from '@/components/flights/FlightForm';
import NextFlightBanner from '@/components/flights/NextFlightBanner';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Flight } from '@/types/trip';
import { formatCurrency } from '@/lib/currency';
import { totalCost } from '@/lib/currency';

export default function FlightsPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { getTrip, getFlightsForTrip, addFlight, updateFlight, deleteFlight } = useTripContext();
  const trip = getTrip(tripId);
  const flights = getFlightsForTrip(tripId);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!trip) return null;

  const handleSubmit = (data: Omit<Flight, 'id' | 'tripId' | 'createdAt'>) => {
    if (editingFlight) {
      updateFlight(editingFlight.id, data);
    } else {
      addFlight(tripId, data);
    }
    setIsFormOpen(false);
    setEditingFlight(null);
  };

  const handleEdit = (flight: Flight) => {
    setEditingFlight(flight);
    setIsFormOpen(true);
  };

  const total = totalCost(flights);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flights</h1>
          {flights.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {flights.length} {flights.length === 1 ? 'flight' : 'flights'}
              {total > 0 && ` · Total: ${formatCurrency(total, trip.currency)}`}
            </p>
          )}
        </div>
        <Button onClick={() => { setEditingFlight(null); setIsFormOpen(true); }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Flight
        </Button>
      </div>

      <NextFlightBanner flights={flights} />

      {flights.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          }
          title="No flights added"
          description="Add your booked flights to keep track of departure times and costs."
          action={<Button onClick={() => setIsFormOpen(true)}>Add Your First Flight</Button>}
        />
      ) : (
        <div className="space-y-4">
          {flights.map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              currency={trip.currency}
              onEdit={handleEdit}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingFlight(null); }}
        title={editingFlight ? 'Edit Flight' : 'Add Flight'}
        className="max-w-xl"
      >
        <FlightForm
          onSubmit={handleSubmit}
          onCancel={() => { setIsFormOpen(false); setEditingFlight(null); }}
          initialData={editingFlight ?? undefined}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteFlight(deleteId)}
        title="Delete Flight"
        message="Are you sure you want to delete this flight?"
      />
    </div>
  );
}

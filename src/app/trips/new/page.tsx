'use client';

import { useRouter } from 'next/navigation';
import { useTripContext } from '@/providers/TripProvider';
import TripForm from '@/components/trips/TripForm';
import Card from '@/components/ui/Card';

export default function NewTripPage() {
  const router = useRouter();
  const { createTrip } = useTripContext();

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Trip</h1>
      <Card className="p-6">
        <TripForm
          onSubmit={(data) => {
            const trip = createTrip(data);
            router.push(`/trips/${trip.id}`);
          }}
          onCancel={() => router.back()}
        />
      </Card>
    </div>
  );
}

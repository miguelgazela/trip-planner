'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useTripContext } from '@/providers/TripProvider';
import PlaceCard from '@/components/places/PlaceCard';
import PlaceForm from '@/components/places/PlaceForm';
import CategoryFilter from '@/components/places/CategoryFilter';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Place, CategoryTag, ScheduleStatus } from '@/types/trip';
import { MapPin } from '@/types/map';


const MapView = dynamic(() => import('@/components/places/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-xl bg-brand-50 animate-pulse flex items-center justify-center min-h-[300px]">
      <span className="text-brand-400 text-sm">Loading map...</span>
    </div>
  ),
});

export default function PlacesPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { getTrip, getPlacesForTrip, getDayPlansForTrip, addPlace, updatePlace, deletePlace } = useTripContext();
  const trip = getTrip(tripId);
  const places = getPlacesForTrip(tripId);
  const dayPlans = getDayPlansForTrip(tripId);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Place | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<CategoryTag[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [scheduleFilter, setScheduleFilter] = useState<ScheduleStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  if (!trip) return null;

  const dayPlanDateMap: Record<string, string> = {};
  for (const dp of dayPlans) {
    dayPlanDateMap[dp.id] = dp.date;
  }

  const cities = Array.from(new Set(places.map((p) => p.city).filter((c): c is string => !!c)));

  let filteredPlaces = selectedCategories.length === 0
    ? places
    : places.filter((p) => p.categories.some((c) => selectedCategories.includes(c)));

  if (selectedCity) {
    filteredPlaces = filteredPlaces.filter((p) => p.city === selectedCity);
  }

  if (scheduleFilter !== 'all') {
    filteredPlaces = filteredPlaces.filter((p) => p.scheduleStatus === scheduleFilter);
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filteredPlaces = filteredPlaces.filter((p) =>
      p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q)
    );
  }

  filteredPlaces = [...filteredPlaces].sort((a, b) => a.name.localeCompare(b.name));

  const pins: MapPin[] = filteredPlaces.map((place) => ({
    id: place.id,
    position: [place.latitude, place.longitude] as [number, number],
    title: place.name,
    description: place.description,
    categories: place.categories,
    isScheduled: place.scheduleStatus === 'scheduled',
  }));

  const handleSubmit = (data: Omit<Place, 'id' | 'tripId' | 'createdAt' | 'scheduleStatus' | 'scheduledDayIds'>) => {
    if (editing) {
      updatePlace(editing.id, data);
    } else {
      addPlace(tripId, data);
    }
    setIsFormOpen(false);
    setEditing(null);
  };

  const handleEdit = (place: Place) => {
    setEditing(place);
    setIsFormOpen(true);
  };

  const handleExport = () => {
    const grouped: Record<string, Place[]> = {};
    for (const place of filteredPlaces) {
      const key = place.city || 'Other';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(place);
    }
    const sortedCities = Object.keys(grouped).sort((a, b) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return a.localeCompare(b);
    });

    const lines: string[] = [`${trip.name} — Places (${filteredPlaces.length})`, ''];
    for (const city of sortedCities) {
      lines.push(`=== ${city} ===`);
      for (const p of grouped[city].sort((a, b) => a.name.localeCompare(b.name))) {
        lines.push(p.address ? `- ${p.name} — ${p.address}` : `- ${p.name}`);
      }
      lines.push('');
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trip.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-places.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Places to Visit</h1>
          <p className="text-sm text-gray-500 mt-1">
            {places.length} {places.length === 1 ? 'place' : 'places'} ·{' '}
            {places.filter((p) => p.scheduleStatus === 'scheduled').length} scheduled
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search places..."
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 w-48"
            />
          </div>
          {filteredPlaces.length > 0 && (
            <button
              onClick={handleExport}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              title="Export filtered places as text file"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          )}
          <Button onClick={() => { setEditing(null); setIsFormOpen(true); }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Place
          </Button>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        <CategoryFilter selected={selectedCategories} onChange={setSelectedCategories} />
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 self-center mr-1">Status:</span>
          {([
            { value: 'all' as const, label: 'All' },
            { value: 'scheduled' as const, label: 'Scheduled' },
            { value: 'unscheduled' as const, label: 'Unscheduled' },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setScheduleFilter(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                scheduleFilter === opt.value
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
              {opt.value !== 'all' && (
                <span className="ml-1 text-[10px] opacity-70">
                  ({places.filter((p) => p.scheduleStatus === opt.value).length})
                </span>
              )}
            </button>
          ))}
        </div>
        {cities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 self-center mr-1">City:</span>
            <button
              onClick={() => setSelectedCity(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !selectedCity
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {cities.sort().map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(selectedCity === city ? null : city)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCity === city
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>

      {pins.length > 0 && (
        <div className="h-[350px] rounded-xl overflow-hidden border border-gray-200 mb-6">
          <MapView
            pins={pins}
            onPinClick={(id) => setHighlightedId(id === highlightedId ? null : id)}
          />
        </div>
      )}

      {places.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          title="No places added"
          description="Build your bucket list of restaurants, landmarks, museums, and more."
          action={<Button onClick={() => setIsFormOpen(true)}>Add Your First Place</Button>}
        />
      ) : (
        <>
          {(() => {
            if (filteredPlaces.length === 0 && places.length > 0) {
              return (
                <p className="text-sm text-gray-500 text-center py-8">
                  No places match the selected filters.
                </p>
              );
            }

            if (selectedCity || cities.length === 0) {
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredPlaces.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      currency={trip.currency}
                      onEdit={handleEdit}
                      onDelete={setDeleteId}
                      isHighlighted={highlightedId === place.id}
                      scheduledDates={place.scheduledDayIds?.map((id) => dayPlanDateMap[id]).filter(Boolean)}
                    />
                  ))}
                </div>
              );
            }

            const grouped: Record<string, Place[]> = {};
            for (const place of filteredPlaces) {
              const key = place.city || 'Other';
              if (!grouped[key]) grouped[key] = [];
              grouped[key].push(place);
            }
            const sortedKeys = Object.keys(grouped).sort((a, b) => {
              if (a === 'Other') return 1;
              if (b === 'Other') return -1;
              return a.localeCompare(b);
            });

            return sortedKeys.map((city) => {
              const restaurants = grouped[city].filter((p) => p.categories.includes('restaurant'));
              const otherPlaces = grouped[city].filter((p) => !p.categories.includes('restaurant'));

              return (
                <div key={city} className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {city}
                    <span className="text-xs text-gray-400 font-normal">({grouped[city].length})</span>
                  </h3>
                  {restaurants.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-orange-700 mb-2 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                        </svg>
                        Restaurants
                        <span className="text-orange-400 font-normal">({restaurants.length})</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {restaurants.map((place) => (
                          <PlaceCard
                            key={place.id}
                            place={place}
                            currency={trip.currency}
                            onEdit={handleEdit}
                            onDelete={setDeleteId}
                            isHighlighted={highlightedId === place.id}
                            scheduledDates={place.scheduledDayIds?.map((id) => dayPlanDateMap[id]).filter(Boolean)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {otherPlaces.length > 0 && (
                    <div>
                      {restaurants.length > 0 && (
                        <h4 className="text-xs font-medium text-brand-700 mb-2 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Places
                          <span className="text-brand-400 font-normal">({otherPlaces.length})</span>
                        </h4>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {otherPlaces.map((place) => (
                          <PlaceCard
                            key={place.id}
                            place={place}
                            currency={trip.currency}
                            onEdit={handleEdit}
                            onDelete={setDeleteId}
                            isHighlighted={highlightedId === place.id}
                            scheduledDates={place.scheduledDayIds?.map((id) => dayPlanDateMap[id]).filter(Boolean)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditing(null); }}
        title={editing ? 'Edit Place' : 'Add Place'}
        className="max-w-xl"
      >
        <PlaceForm
          onSubmit={handleSubmit}
          onCancel={() => { setIsFormOpen(false); setEditing(null); }}
          initialData={editing ?? undefined}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deletePlace(deleteId)}
        title="Delete Place"
        message="Are you sure you want to delete this place? It will also be removed from the daily planner."
      />
    </div>
  );
}

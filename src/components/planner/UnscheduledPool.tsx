'use client';

import { useState, useMemo } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import DayItem from './DayItem';
import TransportDayItem from './TransportDayItem';
import TransportForm from '@/components/transport/TransportForm';
import Modal from '@/components/ui/Modal';
import { useTripContext } from '@/providers/TripProvider';
import { Place, Transport, Currency } from '@/types/trip';

interface UnscheduledPoolProps {
  places: Place[];
  transports: Transport[];
  currency: Currency;
}

type PoolFilter = 'all' | 'restaurant' | 'transport' | 'other';

type PoolItem =
  | { kind: 'place'; entity: Place; sortName: string }
  | { kind: 'transport'; entity: Transport; sortName: string };

export default function UnscheduledPool({ places, transports, currency }: UnscheduledPoolProps) {
  const { addTransport, updateTransport, deleteTransport } = useTripContext();
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<PoolFilter>('all');
  const [search, setSearch] = useState('');
  const [hideScheduled, setHideScheduled] = useState(true);
  const [isTransportFormOpen, setIsTransportFormOpen] = useState(false);
  const [editingTransport, setEditingTransport] = useState<Transport | null>(null);
  const [expanded, setExpanded] = useState(false);

  const cities = useMemo(() => {
    const citySet = new Set<string>();
    places.forEach((p) => { if (p.city) citySet.add(p.city); });
    return Array.from(citySet).sort();
  }, [places]);

  const restaurantCount = useMemo(() =>
    places.filter((p) => p.categories.includes('restaurant')).length,
    [places]
  );

  // Build unified pool items
  let poolItems: PoolItem[] = [];

  // Add places
  let filteredPlaces = hideScheduled
    ? places.filter((p) => p.scheduleStatus !== 'scheduled')
    : places;
  filteredPlaces = cityFilter
    ? filteredPlaces.filter((p) => p.city === cityFilter)
    : filteredPlaces;

  if (typeFilter === 'restaurant') {
    filteredPlaces = filteredPlaces.filter((p) => p.categories.includes('restaurant'));
  } else if (typeFilter === 'other') {
    filteredPlaces = filteredPlaces.filter((p) => !p.categories.includes('restaurant'));
  } else if (typeFilter === 'transport') {
    filteredPlaces = [];
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filteredPlaces = filteredPlaces.filter((p) =>
      p.name.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q)
    );
  }

  for (const place of filteredPlaces) {
    poolItems.push({ kind: 'place', entity: place, sortName: place.name });
  }

  // Add transports (not filtered by city)
  if (typeFilter !== 'restaurant' && typeFilter !== 'other') {
    let filteredTransports = hideScheduled
      ? transports.filter((t) => t.scheduleStatus !== 'scheduled')
      : transports;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filteredTransports = filteredTransports.filter((t) =>
        t.from.toLowerCase().includes(q) || t.to.toLowerCase().includes(q)
      );
    }
    for (const transport of filteredTransports) {
      poolItems.push({ kind: 'transport', entity: transport, sortName: `${transport.from} → ${transport.to}` });
    }
  }

  poolItems = poolItems.sort((a, b) => a.sortName.localeCompare(b.sortName));

  const tripId = places[0]?.tripId ?? transports[0]?.tripId ?? '';

  const handleTransportSubmit = (data: Omit<Transport, 'id' | 'tripId' | 'createdAt' | 'scheduleStatus' | 'scheduledDayIds'>) => {
    if (editingTransport) {
      updateTransport(editingTransport.id, data);
    } else {
      addTransport(tripId, data);
    }
    setIsTransportFormOpen(false);
    setEditingTransport(null);
  };

  const handleEditTransport = (transport: Transport) => {
    setEditingTransport(transport);
    setIsTransportFormOpen(true);
  };

  const scheduledCount = places.filter((p) => p.scheduleStatus === 'scheduled').length
    + transports.filter((t) => t.scheduleStatus === 'scheduled').length;
  const totalItemCount = places.length + transports.length;

  const unscheduledCount = poolItems.length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl">
      {/* Header — tappable on mobile to expand/collapse */}
      <div
        className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl flex items-center justify-between gap-3 cursor-pointer md:cursor-default"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Chevron — mobile only */}
          <svg
            className={`w-4 h-4 text-gray-400 md:hidden transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Bucket List
              <span className="ml-1.5 text-xs font-normal text-gray-400">({unscheduledCount})</span>
            </h3>
            <p className="text-xs text-gray-400 hidden md:block">
              {places.length} {places.length === 1 ? 'place' : 'places'}
              {transports.length > 0 && (
                <span> · {transports.length} transport{transports.length !== 1 ? 's' : ''}</span>
              )}
            </p>
          </div>
        </div>
        {/* Search + filters — always visible on desktop, hidden on collapsed mobile */}
        <div className={`flex-1 items-center gap-3 justify-end ${expanded ? 'flex' : 'hidden md:flex'}`} onClick={(e) => e.stopPropagation()}>
          <div className="relative flex-1 max-w-[200px]">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div className="flex gap-1.5 flex-shrink-0 overflow-x-auto">
            {scheduledCount > 0 && (
              <button
                onClick={() => setHideScheduled(!hideScheduled)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                  hideScheduled
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                title={hideScheduled ? 'Show scheduled items' : 'Hide scheduled items'}
              >
                {hideScheduled ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
                {scheduledCount}
              </button>
            )}
            {([
              { value: 'all' as PoolFilter, label: 'All' },
              { value: 'restaurant' as PoolFilter, label: 'Restaurants' },
              { value: 'other' as PoolFilter, label: 'Places' },
              { value: 'transport' as PoolFilter, label: 'Transport' },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(typeFilter === opt.value ? 'all' : opt.value)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors whitespace-nowrap ${
                  typeFilter === opt.value
                    ? opt.value === 'restaurant'
                      ? 'bg-orange-100 text-orange-700'
                      : opt.value === 'transport'
                      ? 'bg-teal-100 text-teal-700'
                      : 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
                {opt.value === 'restaurant' && restaurantCount > 0 && (
                  <span className="ml-0.5 opacity-70">({restaurantCount})</span>
                )}
                {opt.value === 'transport' && transports.length > 0 && (
                  <span className="ml-0.5 opacity-70">({transports.length})</span>
                )}
              </button>
            ))}
            <button
              onClick={() => { setEditingTransport(null); setIsTransportFormOpen(true); }}
              className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors flex items-center gap-0.5 whitespace-nowrap"
              title="Add transport"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Transport
            </button>
          </div>
        </div>
      </div>

      {/* Body — collapsible on mobile, always open on desktop */}
      <div className={`${expanded ? 'block' : 'hidden'} md:block`}>
        {cities.length > 1 && typeFilter !== 'transport' && (
          <div className="px-3 pt-2.5 pb-0 flex flex-wrap gap-1.5">
            <button
              onClick={() => setCityFilter(null)}
              className={`px-2 py-1 rounded-full text-[10px] font-medium transition-colors ${
                !cityFilter ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All cities
            </button>
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setCityFilter(cityFilter === city ? null : city)}
                className={`px-2 py-1 rounded-full text-[10px] font-medium transition-colors ${
                  cityFilter === city ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        )}
        <Droppable droppableId="droppable-unscheduled">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`p-3 min-h-[60px] max-h-[40vh] md:max-h-none overflow-y-auto flex flex-wrap gap-2 transition-colors ${
                snapshot.isDraggingOver ? 'bg-brand-50' : ''
              }`}
            >
              {poolItems.map((item, index) => {
                if (item.kind === 'transport') {
                  const transport = item.entity;
                  return (
                    <div key={`t-${transport.id}`} className={`w-[200px] ${transport.scheduleStatus === 'scheduled' ? 'opacity-50' : ''}`}>
                      <TransportDayItem
                        transport={transport}
                        index={index}
                        currency={currency}
                        draggableIdPrefix="pool-transport-"
                        onEdit={handleEditTransport}
                        onDelete={deleteTransport}
                      />
                    </div>
                  );
                }
                const place = item.entity;
                return (
                  <div key={`p-${place.id}`} className={`w-[200px] ${place.scheduleStatus === 'scheduled' ? 'opacity-50' : ''}`}>
                    <DayItem place={place} index={index} currency={currency} draggableIdPrefix="pool-place-" />
                  </div>
                );
              })}
              {provided.placeholder}
              {poolItems.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4 w-full">
                  {totalItemCount === 0 ? 'No items yet. Add places or transport.' : 'No items match this filter.'}
                </p>
              )}
            </div>
          )}
        </Droppable>
      </div>

      <Modal
        isOpen={isTransportFormOpen}
        onClose={() => { setIsTransportFormOpen(false); setEditingTransport(null); }}
        title={editingTransport ? 'Edit Transport' : 'Add Transport'}
        className="max-w-lg"
      >
        <TransportForm
          onSubmit={handleTransportSubmit}
          onCancel={() => { setIsTransportFormOpen(false); setEditingTransport(null); }}
          initialData={editingTransport ?? undefined}
        />
      </Modal>
    </div>
  );
}

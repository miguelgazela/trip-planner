'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTripContext } from '@/providers/TripProvider';
import PackingItemRow from '@/components/packing/PackingItemRow';
import PackingForm from '@/components/packing/PackingForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { PackingItem } from '@/types/packing';
import { PACKING_CATEGORIES, PACKING_CATEGORY_MAP } from '@/lib/packing-categories';

export default function PackingPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { getTrip, getPackingItemsForTrip, addPackingItem, deletePackingItem, togglePackingItem } = useTripContext();
  const trip = getTrip(tripId);
  const items = getPackingItemsForTrip(tripId);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!trip) return null;

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  const handleSubmit = (data: Omit<PackingItem, 'id' | 'tripId' | 'createdAt'>) => {
    addPackingItem(tripId, data);
    setIsFormOpen(false);
  };

  const grouped = PACKING_CATEGORIES
    .map((cat) => ({
      ...cat,
      items: items.filter((i) => i.category === cat.value),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Packing List</h1>
          {totalCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {checkedCount} of {totalCount} packed
            </p>
          )}
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </Button>
      </div>

      {totalCount > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>{progressPercent.toFixed(0)}% packed</span>
            <span>{totalCount - checkedCount} remaining</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${
                progressPercent === 100 ? 'bg-green-500' : 'bg-brand-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {totalCount === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          title="Nothing to pack yet"
          description="Add items to your packing list to keep track of everything you need."
          action={<Button onClick={() => setIsFormOpen(true)}>Add Your First Item</Button>}
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => {
            const catInfo = PACKING_CATEGORY_MAP[group.value];
            return (
              <div key={group.value}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-7 h-7 rounded-lg ${catInfo.color} flex items-center justify-center`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={catInfo.icon} />
                    </svg>
                  </div>
                  <h2 className="text-sm font-semibold text-gray-900">{group.label}</h2>
                  <span className="text-xs text-gray-400">
                    {group.items.filter((i) => i.checked).length}/{group.items.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <PackingItemRow
                      key={item.id}
                      item={item}
                      onToggle={togglePackingItem}
                      onDelete={setDeleteId}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Add Item"
        className="max-w-md"
      >
        <PackingForm
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deletePackingItem(deleteId)}
        title="Delete Item"
        message="Remove this item from your packing list?"
      />
    </div>
  );
}

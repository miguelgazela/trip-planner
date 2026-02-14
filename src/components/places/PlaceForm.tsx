'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { placeSchema } from '@/lib/validators';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import PlaceImage from '@/components/ui/PlaceImage';
import PlaceSearchInput from './PlaceSearchInput';
import { Place, CategoryTag } from '@/types/trip';
import { ALL_CATEGORIES } from '@/lib/categories';

const GOOGLE_TYPE_TO_CATEGORY: Record<string, CategoryTag> = {
  restaurant: 'restaurant',
  food: 'restaurant',
  cafe: 'restaurant',
  bakery: 'restaurant',
  bar: 'nightlife',
  night_club: 'nightlife',
  museum: 'culture',
  art_gallery: 'culture',
  church: 'culture',
  hindu_temple: 'culture',
  mosque: 'culture',
  synagogue: 'culture',
  tourist_attraction: 'sightseeing',
  point_of_interest: 'sightseeing',
  amusement_park: 'adventure',
  aquarium: 'nature',
  zoo: 'nature',
  park: 'nature',
  natural_feature: 'nature',
  campground: 'nature',
  shopping_mall: 'shopping',
  clothing_store: 'shopping',
  store: 'shopping',
  spa: 'nature',
};

function mapGoogleTypesToCategories(types?: string[]): CategoryTag[] {
  if (!types) return [];
  const mapped = new Set<CategoryTag>();
  for (const t of types) {
    const cat = GOOGLE_TYPE_TO_CATEGORY[t];
    if (cat) mapped.add(cat);
  }
  return Array.from(mapped);
}

const MapView = dynamic(() => import('@/components/places/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-lg bg-gray-100 animate-pulse flex items-center justify-center">
      <span className="text-gray-400 text-xs">Loading map...</span>
    </div>
  ),
});

interface PlaceFormProps {
  onSubmit: (data: Omit<Place, 'id' | 'tripId' | 'createdAt' | 'scheduleStatus' | 'scheduledDayIds'>) => void;
  onCancel: () => void;
  initialData?: Place;
}

export default function PlaceForm({ onSubmit, onCancel, initialData }: PlaceFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    address: initialData?.address ?? '',
    latitude: initialData?.latitude?.toString() ?? '',
    longitude: initialData?.longitude?.toString() ?? '',
    categories: initialData?.categories ?? [] as CategoryTag[],
    city: initialData?.city ?? '',
    rating: initialData?.rating?.toString() ?? '',
    website: initialData?.website ?? '',
    estimatedDuration: initialData?.estimatedDuration?.toString() ?? '',
    cost: initialData?.cost?.toString() ?? '',
    imageUrl: initialData?.imageUrl ?? '',
    tip: initialData?.tip ?? '',
    notes: initialData?.notes ?? '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const toggleCategory = (cat: CategoryTag) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
    setErrors((prev) => ({ ...prev, categories: '' }));
  };

  const handlePlaceSelected = useCallback((place: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    city?: string;
    website?: string;
    imageUrl?: string;
    description?: string;
    rating?: number;
    googleTypes?: string[];
  }) => {
    const autoCategories = mapGoogleTypesToCategories(place.googleTypes);
    setFormData((prev) => ({
      ...prev,
      name: place.name,
      address: place.address,
      latitude: place.latitude.toString(),
      longitude: place.longitude.toString(),
      city: place.city ?? prev.city,
      website: place.website ?? prev.website,
      imageUrl: place.imageUrl ?? prev.imageUrl,
      description: place.description ?? prev.description,
      rating: place.rating?.toString() ?? prev.rating,
      categories: autoCategories.length > 0 ? autoCategories : prev.categories,
    }));
    setErrors({});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = {
      ...formData,
      latitude: formData.latitude ? Number(formData.latitude) : undefined,
      longitude: formData.longitude ? Number(formData.longitude) : undefined,
      estimatedDuration: formData.estimatedDuration ? Number(formData.estimatedDuration) : undefined,
      cost: formData.cost ? Number(formData.cost) : undefined,
      city: formData.city || undefined,
      rating: formData.rating ? Number(formData.rating) : undefined,
      website: formData.website || undefined,
      imageUrl: formData.imageUrl || undefined,
      tip: formData.tip || undefined,
      notes: formData.notes || undefined,
      description: formData.description || undefined,
      address: formData.address || undefined,
    };

    const result = placeSchema.safeParse(parsed);
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
        label="Place Name"
        placeholder="Tsukiji Outer Market"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        error={errors.name}
      />
      <Input
        id="description"
        label="Description (optional)"
        placeholder="Famous fish market with fresh sushi stalls"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
      />
      <Input
        id="address"
        label="Address (optional)"
        placeholder="4-16-2 Tsukiji, Chuo City, Tokyo"
        value={formData.address}
        onChange={(e) => handleChange('address', e.target.value)}
      />
      <Input
        id="city"
        label="City (optional)"
        placeholder="Tokyo"
        value={formData.city}
        onChange={(e) => handleChange('city', e.target.value)}
      />
      {formData.latitude && formData.longitude && !isNaN(Number(formData.latitude)) && !isNaN(Number(formData.longitude)) && (
        <div className="h-[180px] rounded-lg overflow-hidden border border-gray-200">
          <MapView
            pins={[{
              id: 'preview',
              position: [Number(formData.latitude), Number(formData.longitude)] as [number, number],
              title: formData.name || 'Selected location',
              categories: [],
              isScheduled: false,
            }]}
            zoom={15}
          />
        </div>
      )}
      {formData.imageUrl && (
        <div className="h-40 rounded-lg overflow-hidden border border-gray-200 -mt-2">
          <PlaceImage
            src={formData.imageUrl}
            alt={formData.name || 'Place'}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Categories</label>
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              category={cat}
              size="md"
              active={formData.categories.includes(cat)}
              onClick={() => toggleCategory(cat)}
            />
          ))}
        </div>
        {errors.categories && <p className="text-sm text-red-600">{errors.categories}</p>}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input
          id="rating"
          label="Rating (optional)"
          type="number"
          step="0.1"
          min="0"
          max="5"
          placeholder="4.5"
          value={formData.rating}
          onChange={(e) => handleChange('rating', e.target.value)}
        />
        <Input
          id="cost"
          label="Est. Cost (optional)"
          type="number"
          step="0.01"
          min="0"
          placeholder="25.00"
          value={formData.cost}
          onChange={(e) => handleChange('cost', e.target.value)}
        />
        <Input
          id="estimatedDuration"
          label="Duration min. (optional)"
          type="number"
          min="0"
          placeholder="120"
          value={formData.estimatedDuration}
          onChange={(e) => handleChange('estimatedDuration', e.target.value)}
        />
      </div>
      <Input
        id="tip"
        label="Tip (optional)"
        placeholder="Book in advance, try the tasting menu..."
        value={formData.tip}
        onChange={(e) => handleChange('tip', e.target.value)}
      />
      <Input
        id="website"
        label="Website (optional)"
        type="url"
        placeholder="https://..."
        value={formData.website}
        onChange={(e) => handleChange('website', e.target.value)}
        error={errors.website}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initialData ? 'Update' : 'Add'} Place</Button>
      </div>
    </form>
  );
}

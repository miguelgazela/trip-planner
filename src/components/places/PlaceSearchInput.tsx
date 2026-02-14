'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface PlaceResult {
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
}

interface PlaceSearchInputProps {
  onPlaceSelected: (place: PlaceResult) => void;
}

interface Prediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

function extractCity(addressComponents: google.maps.GeocoderAddressComponent[]): string | undefined {
  const city = addressComponents.find((c) => c.types.includes('locality'));
  if (city) return city.long_name;
  const sub = addressComponents.find((c) =>
    c.types.includes('sublocality') || c.types.includes('administrative_area_level_2')
  );
  return sub?.long_name;
}

export default function PlaceSearchInput({ onPlaceSelected }: PlaceSearchInputProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const dummyDiv = useRef<HTMLDivElement | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => {
      if (typeof window !== 'undefined' && window.google?.maps?.places) {
        setIsLoaded(true);
        return true;
      }
      return false;
    };
    if (check()) return;
    const interval = setInterval(() => {
      if (check()) clearInterval(interval);
    }, 300);
    const timeout = setTimeout(() => clearInterval(interval), 15000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    autocompleteService.current = new google.maps.places.AutocompleteService();
    sessionToken.current = new google.maps.places.AutocompleteSessionToken();
    if (!dummyDiv.current) {
      dummyDiv.current = document.createElement('div');
    }
    placesService.current = new google.maps.places.PlacesService(dummyDiv.current);
  }, [isLoaded]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchPlaces = useCallback((input: string) => {
    if (!autocompleteService.current || input.length < 2) {
      setPredictions([]);
      return;
    }
    setLoading(true);
    autocompleteService.current.getPlacePredictions(
      { input, sessionToken: sessionToken.current! },
      (results, status) => {
        setLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(
            results.slice(0, 5).map((r) => ({
              placeId: r.place_id,
              mainText: r.structured_formatting.main_text,
              secondaryText: r.structured_formatting.secondary_text,
            }))
          );
          setShowDropdown(true);
        } else {
          setPredictions([]);
        }
      }
    );
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (value.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }
    debounceTimer.current = setTimeout(() => searchPlaces(value), 300);
  };

  const selectPlace = (prediction: Prediction) => {
    if (!placesService.current) return;
    setShowDropdown(false);
    setQuery(prediction.mainText);
    setLoading(true);

    placesService.current.getDetails(
      {
        placeId: prediction.placeId,
        fields: ['name', 'formatted_address', 'geometry', 'website', 'address_components', 'photos', 'editorial_summary', 'types', 'rating'],
        sessionToken: sessionToken.current!,
      },
      (place, status) => {
        // Start a new session token for the next search
        sessionToken.current = new google.maps.places.AutocompleteSessionToken();
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) {
          setLoading(false);
          return;
        }

        const editorial = (place as google.maps.places.PlaceResult & { editorial_summary?: { overview?: string } }).editorial_summary;

        const result: PlaceResult = {
          name: place.name ?? '',
          address: place.formatted_address ?? '',
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          website: place.website,
          city: place.address_components ? extractCity(place.address_components) : undefined,
          description: editorial?.overview,
          rating: place.rating,
          googleTypes: place.types,
        };

        // Convert Google photo to a data URL so we don't keep hitting the Photos API
        if (place.photos && place.photos.length > 0) {
          const googlePhotoUrl = place.photos[0].getUrl({ maxWidth: 400 });
          fetch('/api/place-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: googlePhotoUrl }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.dataUrl) result.imageUrl = data.dataUrl;
            })
            .catch(() => { /* skip image on failure */ })
            .finally(() => {
              setLoading(false);
              onPlaceSelected(result);
              setQuery('');
            });
        } else {
          setLoading(false);
          onPlaceSelected(result);
          setQuery('');
        }
      }
    );
  };

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700">
        Search Google Places
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => predictions.length > 0 && setShowDropdown(true)}
        placeholder={isLoaded ? 'Search for a restaurant, hotel, landmark...' : 'Loading Google Places...'}
        disabled={!isLoaded}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
      />
      {showDropdown && predictions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {predictions.map((p) => (
            <li key={p.placeId}>
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 hover:bg-brand-50 transition-colors flex flex-col"
                onClick={() => selectPlace(p)}
              >
                <span className="text-sm font-medium text-gray-900">{p.mainText}</span>
                <span className="text-xs text-gray-500">{p.secondaryText}</span>
              </button>
            </li>
          ))}
          <li className="px-3 py-1.5 text-[10px] text-gray-400 border-t border-gray-100">
            Powered by Google
          </li>
        </ul>
      )}
      {loading && (
        <p className="text-[10px] text-gray-400">Searching...</p>
      )}
    </div>
  );
}

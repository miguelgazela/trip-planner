'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { fixLeafletIcons } from '@/lib/map-utils';
import { MapPin } from '@/types/map';
import 'leaflet/dist/leaflet.css';

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function FitBounds({ pins }: { pins: MapPin[] }) {
  const map = useMap();
  // Only refit when pin IDs or positions actually change, not on every render
  const pinsKey = useMemo(
    () => pins.map((p) => { const pos = p.position as [number, number]; return `${p.id}:${pos[0]},${pos[1]}`; }).join('|'),
    [pins]
  );
  const prevKey = useRef(pinsKey);
  const isInitial = useRef(true);

  useEffect(() => {
    if (pins.length === 0) return;
    // Always fit on initial mount; after that, only when pins actually change
    if (!isInitial.current && prevKey.current === pinsKey) return;
    isInitial.current = false;
    prevKey.current = pinsKey;

    const timer = setTimeout(() => {
      const bounds = pins.map((p) => p.position as [number, number]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }, 150);
    return () => clearTimeout(timer);
  }, [pins, pinsKey, map]);
  return null;
}

interface MapViewProps {
  pins: MapPin[];
  center?: LatLngExpression;
  zoom?: number;
  onPinClick?: (pinId: string) => void;
  className?: string;
}

export default function MapView({ pins, center, zoom = 13, onPinClick, className }: MapViewProps) {
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const defaultCenter: LatLngExpression = center ?? (
    pins.length > 0 ? pins[0].position : [48.8566, 2.3522]
  );

  return (
    <MapContainer
      center={defaultCenter}
      zoom={zoom}
      className={`h-full w-full rounded-xl ${className ?? ''}`}
      scrollWheelZoom={true}
    >
      <InvalidateSize />
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pins.length > 0 && <FitBounds pins={pins} />}
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={pin.position}
          eventHandlers={{
            click: () => onPinClick?.(pin.id),
          }}
        >
          <Popup>
            <div>
              <strong>{pin.title}</strong>
              {pin.description && <p className="mt-1">{pin.description}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapPin } from 'lucide-react';

type Coordinates = {
  lat: number;
  lng: number;
};

type MapboxLocationPickerProps = {
  token: string;
  initialCenter: Coordinates;
  onCenterChange: (coords: Coordinates) => void;
};

export default function MapboxLocationPicker({
  token,
  initialCenter,
  onCenterChange,
}: MapboxLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const onCenterChangeRef = useRef(onCenterChange);
  const initialCenterRef = useRef(initialCenter);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onCenterChangeRef.current = onCenterChange;
  }, [onCenterChange]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;
    if (!token) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialCenterRef.current.lng, initialCenterRef.current.lat],
      zoom: 13,
      scrollZoom: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

    map.on('load', () => {
      setReady(true);
    });

    map.on('moveend', () => {
      const center = map.getCenter();
      onCenterChangeRef.current({ lat: center.lat, lng: center.lng });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [token]);

  useEffect(() => {
    if (!mapRef.current || !ready) return;
    const center = mapRef.current.getCenter();
    const changed = Math.abs(center.lat - initialCenter.lat) > 0.0001 || Math.abs(center.lng - initialCenter.lng) > 0.0001;
    if (changed) {
      mapRef.current.easeTo({
        center: [initialCenter.lng, initialCenter.lat],
        duration: 500,
      });
    }
  }, [initialCenter.lat, initialCenter.lng, ready]);

  return (
    <div className="relative h-64 w-full">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#2286BE] text-white shadow-lg">
          <MapPin size={18} />
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 shadow">
        Move map and set center as location
      </div>
    </div>
  );
}

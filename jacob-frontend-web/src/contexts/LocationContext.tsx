'use client';

import React, { createContext, useContext } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setLocationCity,
  setLocationCoordinates,
  setLocationRadius,
} from '@/store/slices/locationSlice';

interface LocationState {
  city: string;
  setCity: (city: string) => void;
  radius: number; // in miles
  setRadius: (radius: number) => void;
  coordinates: { lat: number; lng: number } | null;
  detectLocation: () => void;
}

const LocationContext = createContext<LocationState | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const city = useAppSelector((state) => state.location.city);
  const radius = useAppSelector((state) => state.location.radius);
  const coordinates = useAppSelector((state) => state.location.coordinates);

  const setCity = (newCity: string) => {
    dispatch(setLocationCity(newCity));
  };

  const setRadius = (nextRadius: number) => {
    dispatch(setLocationRadius(nextRadius));
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          dispatch(setLocationCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }));
          dispatch(setLocationCity('Current Location'));
        },
        (error) => {
          console.error('Error detecting location:', error);
          dispatch(setLocationCity('New York, USA'));
        }
      );
    }
  };

  return (
    <LocationContext.Provider value={{ city, setCity, radius, setRadius, coordinates, detectLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

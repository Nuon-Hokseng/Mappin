import React, { useEffect, useState } from 'react';
import { useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import { MapPoint } from '@/types';

interface MapEventsProps {
  mode: 'VIEW' | 'DRAW' | 'IMPORT' | 'REVIEW' | 'MANUAL';
  onMapClick: (lat: number, lng: number) => void;
}

export function MapEvents({ mode, onMapClick }: MapEventsProps) {
  useMapEvents({
    click(e) {
      if (mode === 'DRAW') {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return null;
}

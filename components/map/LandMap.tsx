"use client";

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap, ZoomControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPoint, SavedProperty } from '@/types';
import { MapEvents } from './MapEvents';

// Fix Leaflet's default icon path issues in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to handle map view fitting when points change
function MapBounds({ points, userLocation }: { points: MapPoint[], userLocation: { lat: number, lng: number } | null }) {
  const map = useMap();
  const prevPointsLength = useRef(0);

  useEffect(() => {
    // Only auto-fit if we just loaded multiple points at once (e.g. confirming OCR or Manual entry)
    // This prevents the map from sliding/moving when drawing points one by one or dragging them.
    if (points.length >= 3 && Math.abs(points.length - prevPointsLength.current) > 1) {
      const bounds = L.latLngBounds(points.map(p => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
    prevPointsLength.current = points.length;
  }, [points, map]);

  useEffect(() => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 16);
    }
  }, [userLocation, map]);

  return null;
}

// Component to track map zoom level
function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });
  
  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);
  
  return null;
}

interface LandMapProps {
  points: MapPoint[];
  savedProperties?: SavedProperty[];
  mode: 'VIEW' | 'DRAW' | 'IMPORT' | 'REVIEW' | 'MANUAL';
  userLocation: { lat: number; lng: number } | null;
  onPointDrag: (id: string, lat: number, lng: number) => void;
  onMapClick: (lat: number, lng: number) => void;
}

export default function LandMap({ points, savedProperties = [], mode, userLocation, onPointDrag, onMapClick }: LandMapProps) {
  // Default to Cambodia region (approx center)
  const defaultCenter: [number, number] = [11.5564, 104.9282];
  const [currentZoom, setCurrentZoom] = useState(13);

  const createNumberedIcon = (num: number) => {
    const svgHTML = `
      <div style="position: relative; width: 50px; height: 87px;">
        <svg width="50" height="87" viewBox="0 0 50 87" fill="none" xmlns="http://www.w3.org/2000/svg" style="position: absolute; top: 0; left: 0;">
          <g filter="url(#filter0_d_220_4541)">
            <rect x="20" y="6" width="10" height="10" rx="5" fill="white"/>
          </g>
          <path d="M25 17.6719C29.2214 23.3442 34.9932 30.8759 39.8389 38.6631C42.4163 42.8052 44.7141 46.995 46.3652 50.9873C48.0202 54.9888 49 58.7328 49 62C49 75.2548 38.2548 86 25 86C11.7452 86 1 75.2548 1 62C1 58.7328 1.97982 54.9888 3.63477 50.9873C5.28593 46.995 7.58367 42.8052 10.1611 38.6631C15.0068 30.8759 20.7786 23.3442 25 17.6719Z" fill="#E5484D" fill-opacity="0.5" stroke="white" stroke-width="2"/>
          <path d="M28.6008 50.8C27.9358 50.8 27.4008 51.335 27.4008 52C27.4008 52.665 27.9358 53.2 28.6008 53.2H32.1058L25.0008 60.305L17.8958 53.2H21.4008C22.0658 53.2 22.6008 52.665 22.6008 52C22.6008 51.335 22.0658 50.8 21.4008 50.8H15.0008C14.3358 50.8 13.8008 51.335 13.8008 52V58.4C13.8008 59.065 14.3358 59.6 15.0008 59.6C15.6658 59.6 16.2008 59.065 16.2008 58.4V54.895L23.3058 62L16.2008 69.105V65.6C16.2008 64.935 15.6658 64.4 15.0008 64.4C14.3358 64.4 13.8008 64.935 13.8008 65.6V72C13.8008 72.665 14.3358 73.2 15.0008 73.2H21.4008C22.0658 73.2 22.6008 72.665 22.6008 72C22.6008 71.335 22.0658 70.8 21.4008 70.8H17.8958L25.0008 63.695L32.1058 70.8H28.6008C27.9358 70.8 27.4008 71.335 27.4008 72C27.4008 72.665 27.9358 73.2 28.6008 73.2H35.0008C35.6658 73.2 36.2008 72.665 36.2008 72V65.6C36.2008 64.935 35.6658 64.4 35.0008 64.4C34.3358 64.4 33.8008 64.935 33.8008 65.6V69.105L26.6958 62L33.8008 54.895V58.4C33.8008 59.065 34.3358 59.6 35.0008 59.6C35.6658 59.6 36.2008 59.065 36.2008 58.4V52C36.2008 51.335 35.6658 50.8 35.0008 50.8H28.6008Z" fill="white"/>
          <defs>
            <filter id="filter0_d_220_4541" x="12" y="0" width="26" height="26" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feFlood flood-opacity="0" result="BackgroundImageFix"/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset dy="2"/>
              <feGaussianBlur stdDeviation="4"/>
              <feComposite in2="hardAlpha" operator="out"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_220_4541"/>
              <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_220_4541" result="shape"/>
            </filter>
          </defs>
        </svg>
        <div style="position: absolute; top: 31px; left: 0; width: 100%; text-align: center; color: white; font-weight: bold; font-size: 14px; z-index: 10; pointer-events: none;">${num}</div>
      </div>
    `;
    
    return L.divIcon({
      className: 'custom-div-icon',
      html: svgHTML,
      iconSize: [50, 87],
      iconAnchor: [25, 11] // Anchor on the center of the top white circle (y=6 + 5)
    });
  };

  const userLocationIcon = L.divIcon({
    className: 'user-location-icon',
    html: `<div style="background-color: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.4), 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  const savedPropertyIcon = L.divIcon({
    className: 'saved-property-icon',
    html: `<div style="display: flex; justify-content: center; align-items: center; width: 57px; height: 57px;">
      <svg width="57" height="57" viewBox="0 0 57 57" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_d_356_47221)">
        <rect x="16" y="12" width="25" height="25" rx="12.5" fill="#028752"/>
        <rect x="16.5" y="12.5" width="24" height="24" rx="12" stroke="#E5E7EB"/>
        </g>
        <defs>
        <filter id="filter0_d_356_47221" x="0" y="0" width="57" height="57" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="4"/>
        <feGaussianBlur stdDeviation="8"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.16 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_356_47221"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_356_47221" result="shape"/>
        </filter>
        </defs>
      </svg>
    </div>`,
    iconSize: [57, 57],
    iconAnchor: [28.5, 24.5]
  });

  const createVertexBadgeIcon = (num: number) => {
    return L.divIcon({
      className: 'vertex-badge-icon',
      html: `<div style="background: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color: #374151; box-shadow: 0 1px 3px rgba(0,0,0,0.3); border: 1px solid #e5e7eb; transform: translate(-50%, -50%);">${num}</div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
  };

  const createDistanceBadgeIcon = (distance: number) => {
    return L.divIcon({
      className: 'distance-badge-icon',
      html: `<div style="background: white; border-radius: 9999px; padding: 2px 8px; font-size: 11px; font-weight: bold; color: #374151; box-shadow: 0 1px 3px rgba(0,0,0,0.3); white-space: nowrap; border: 1px solid #e5e7eb; display: inline-block; transform: translate(-50%, -50%);">${distance.toLocaleString(undefined, {maximumFractionDigits: 0})} m</div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
  };

  const createAreaBadgeIcon = (area: number) => {
    return L.divIcon({
      className: 'area-badge-icon',
      html: `<div style="background: white; border-radius: 9999px; padding: 4px 10px; font-size: 12px; font-weight: bold; color: #374151; box-shadow: 0 1px 3px rgba(0,0,0,0.3); white-space: nowrap; border: 1px solid #e5e7eb; display: inline-block; transform: translate(-50%, 35px);">${area.toLocaleString(undefined, {maximumFractionDigits: 0})} m²</div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
  };

  const polygonPositions = points.map(p => [p.latitude, p.longitude] as [number, number]);

  return (
    <div className="w-full h-full flex-1 relative rounded-xl overflow-hidden border border-gray-200 shadow-sm z-0">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        maxZoom={24}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <ZoomTracker onZoomChange={setCurrentZoom} />
        <ZoomControl position="topright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={24}
          maxNativeZoom={19}
        />

        <MapEvents mode={mode} onMapClick={onMapClick} />
        <MapBounds points={points} userLocation={userLocation} />

        {points.length >= 3 && (
          <Polygon
            positions={polygonPositions}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.2,
              weight: 2,
              dashArray: '5, 5'
            }}
          />
        )}

        {points.map((point, i) => (
          <Marker
            key={point.id}
            position={[point.latitude, point.longitude]}
            icon={createNumberedIcon(i + 1)}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                onPointDrag(point.id, position.lat, position.lng);
              },
            }}
          >
            <Popup>
              <div className="text-sm">
                <strong>Point {i + 1}</strong><br />
                Lat: {point.latitude.toFixed(6)}<br />
                Lng: {point.longitude.toFixed(6)}
              </div>
            </Popup>
          </Marker>
        ))}

        {savedProperties.map((property) => (
          <React.Fragment key={property.id}>
            {currentZoom >= 16 && (
              <>
                {/* Polygon Outline & Fill */}
                <Polygon
                  positions={property.points.map(p => [p.latitude, p.longitude] as [number, number])}
                  pathOptions={{
                    color: 'white',
                    fillColor: 'white',
                    fillOpacity: 0.15,
                    weight: 2
                  }}
                />

                {/* Vertices */}
                {property.points.map((p, i) => (
                  <Marker
                    key={`vertex-${property.id}-${i}`}
                    position={[p.latitude, p.longitude]}
                    icon={createVertexBadgeIcon(i + 1)}
                  />
                ))}

                {/* Side Lengths */}
                {property.points.map((p, i) => {
                  const nextP = property.points[(i + 1) % property.points.length];
                  const midLat = (p.latitude + nextP.latitude) / 2;
                  const midLng = (p.longitude + nextP.longitude) / 2;
                  return (
                    <Marker
                      key={`side-${property.id}-${i}`}
                      position={[midLat, midLng]}
                      icon={createDistanceBadgeIcon(property.sides && property.sides[i] ? property.sides[i] : 0)}
                    />
                  );
                })}

                {/* Center Area Badge */}
                <Marker
                  position={[property.center.latitude, property.center.longitude]}
                  icon={createAreaBadgeIcon(property.area)}
                />
              </>
            )}

            {/* Green Pin (Always visible) */}
            <Marker
              position={[property.center.latitude, property.center.longitude]}
              icon={savedPropertyIcon}
            >
              <Popup>
                <div className="text-sm">
                  <strong>Saved Property</strong><br />
                  Area: {property.area.toLocaleString(undefined, { maximumFractionDigits: 2 })} m²<br />
                  Points: {property.points.length}
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
          >
            <Popup>My Location</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Mode Indicator Overlay */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] pointer-events-none">
        {mode === 'DRAW' && (
          <div className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg font-medium text-sm">
            Draw Mode: Click 4 points on the map ({points.length}/4)
          </div>
        )}
      </div>
    </div>
  );
}

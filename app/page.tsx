"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { UTMCoordinate, MapPoint, LandMeasurements as MeasurementsType, SavedProperty } from '@/types';
import { convertUTMtoLatLng } from '@/lib/coordinates/utm';
import { calculateMeasurements } from '@/lib/geometry/measurements';
import { CoordinateUploader } from '@/components/ocr/CoordinateUploader';
import { CoordinateReviewTable } from '@/components/ocr/CoordinateReviewTable';
import { LandMeasurements } from '@/components/land/LandMeasurements';
import MapContainer from '@/components/map/MapContainer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { MapPin, Navigation, Trash2, Camera, Pointer, Play, Keyboard, Save } from 'lucide-react';

type AppMode = 'VIEW' | 'DRAW' | 'IMPORT' | 'REVIEW' | 'MANUAL';

export default function Home() {
  const [mode, setMode] = useState<AppMode>('VIEW');
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [extractedCoords, setExtractedCoords] = useState<UTMCoordinate[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('landmap_properties');
      if (stored) {
        setSavedProperties(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load saved properties', e);
    }
  }, []);

  const handleSaveProperty = () => {
    if (points.length < 3 || !measurements || measurements.area === 0) return;
    
    const lats = points.map(p => p.latitude);
    const lngs = points.map(p => p.longitude);
    const center = {
      latitude: (Math.max(...lats) + Math.min(...lats)) / 2,
      longitude: (Math.max(...lngs) + Math.min(...lngs)) / 2
    };

    const newProperty: SavedProperty = {
      id: crypto.randomUUID(),
      center,
      points: [...points],
      area: measurements.area,
      sides: measurements.sides
    };

    const updated = [...savedProperties, newProperty];
    setSavedProperties(updated);
    try {
      localStorage.setItem('landmap_properties', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save property', e);
    }

    setPoints([]);
    setMode('VIEW');
  };

  // Derived state for measurements
  const measurements = useMemo(() => calculateMeasurements(points), [points]);

  // Manual mode handler
  const startManualMode = () => {
    setExtractedCoords([
      { id: crypto.randomUUID(), index: 0, x: 0, y: 0 },
      { id: crypto.randomUUID(), index: 1, x: 0, y: 0 },
      { id: crypto.randomUUID(), index: 2, x: 0, y: 0 }
    ]);
    setMode('MANUAL');
  };

  const handlePointDrag = useCallback((id: string, lat: number, lng: number) => {
    setPoints(prev => prev.map(p => 
      p.id === id ? { ...p, latitude: lat, longitude: lng } : p
    ));
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (mode === 'DRAW') {
      setPoints(prev => {
        return [...prev, {
          id: crypto.randomUUID(),
          index: prev.length,
          latitude: lat,
          longitude: lng
        }];
      });
    }
  }, [mode]);

  const startDrawMode = () => {
    setPoints([]);
    setMode('DRAW');
  };

  const startImportMode = () => {
    setMode('IMPORT');
  };

  const handleOcrExtracted = (coords: UTMCoordinate[]) => {
    setExtractedCoords(coords);
    setMode('REVIEW');
  };

  const confirmOcrCoordinates = (coords: UTMCoordinate[]) => {
    const mapPoints: MapPoint[] = coords.map((coord, idx) => {
      const { latitude, longitude } = convertUTMtoLatLng(coord.x, coord.y);
      return {
        id: crypto.randomUUID(),
        index: idx,
        latitude,
        longitude
      };
    });
    setPoints(mapPoints);
    setMode('VIEW');
  };

  const cancelOcr = () => {
    setExtractedCoords([]);
    setMode('VIEW');
  };

  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not determine your location. Please check browser permissions.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const clearMap = () => {
    if (points.length > 0) {
      const confirmed = window.confirm("Are you sure you want to clear the map?");
      if (!confirmed) return;
    }
    setPoints([]);
    setExtractedCoords([]);
    setMode('VIEW');
  };

  return (
    <div className="relative h-[100dvh] w-full flex flex-col md:flex-row overflow-hidden font-sans bg-gray-100">
      
      {/* MAP AREA (Background on mobile, right side on desktop) */}
      <div className="absolute inset-0 z-0 md:relative md:flex-1 md:h-full md:order-2 flex flex-col">
        <MapContainer 
          points={points} 
          mode={mode} 
          userLocation={userLocation}
          savedProperties={savedProperties}
          onPointDrag={handlePointDrag}
          onMapClick={handleMapClick}
        />
      </div>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex md:relative md:order-1 md:w-96 md:h-full md:flex-col md:border-r md:border-gray-200 md:bg-gray-50 overflow-hidden z-10">
        <div className="p-4 md:p-6 flex flex-col gap-6 overflow-y-auto flex-1">
          {/* HEADER (Desktop only)
          <div className="flex items-center justify-between bg-transparent p-0 rounded-none shadow-none border-none mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="text-blue-600" size={24} />
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">LandMap <span className="text-blue-600">POC</span></h1>
            </div>
            <Button variant="outline" size="sm" onClick={requestUserLocation} title="My Location" className="!p-2 bg-white">
              <Navigation size={18} className="text-gray-600" />
            </Button>
          </div> */}

          {/* CONTROLS */}
          <Card className="shrink-0">
            <CardContent className="space-y-4">
              <h2 className="text-sm font-bold text-gray-700 tracking-wider">LAND DATA</h2>
              
              {(mode === 'REVIEW' || mode === 'MANUAL') ? (
                <CoordinateReviewTable 
                  initialCoordinates={extractedCoords} 
                  onConfirm={confirmOcrCoordinates} 
                  onCancel={cancelOcr} 
                  title={mode === 'MANUAL' ? "Manual Entry" : "Extracted Coordinates"}
                />
              ) : mode === 'IMPORT' ? (
                <div className="space-y-4">
                  <CoordinateUploader onCoordinatesExtracted={handleOcrExtracted} />
                  <Button variant="secondary" className="w-full" onClick={() => setMode('VIEW')}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full flex justify-start gap-3 py-6"
                    onClick={startImportMode}
                  >
                    <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
                      <Camera size={20} />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-gray-900">Import Coordinates</div>
                      <div className="text-xs text-gray-500 font-normal">Extract from image table via OCR</div>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full flex justify-start gap-3 py-6"
                    onClick={startManualMode}
                  >
                    <div className="bg-purple-100 text-purple-700 p-2 rounded-lg">
                      <Keyboard size={20} />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-gray-900">Manual Input</div>
                      <div className="text-xs text-gray-500 font-normal">Type coordinates manually</div>
                    </div>
                  </Button>
                  
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">OR</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  <Button 
                    variant={mode === 'DRAW' ? 'primary' : 'outline'} 
                    className="w-full flex justify-start gap-3 py-6"
                    onClick={startDrawMode}
                  >
                    <div className={`${mode === 'DRAW' ? 'bg-blue-700' : 'bg-green-100'} ${mode === 'DRAW' ? 'text-white' : 'text-green-700'} p-2 rounded-lg`}>
                      <Pointer size={20} />
                    </div>
                    <div className="text-left flex-1">
                      <div className={`font-semibold ${mode === 'DRAW' ? 'text-white' : 'text-gray-900'}`}>Draw Polygon</div>
                      <div className={`text-xs ${mode === 'DRAW' ? 'text-blue-100' : 'text-gray-500'} font-normal`}>Manually click on map</div>
                    </div>
                  </Button>
                </div>
              )}
              {(mode !== 'REVIEW' && mode !== 'MANUAL' && mode !== 'IMPORT') && points.length > 0 && (
                <div className="pt-4 mt-2 border-t border-gray-100 flex gap-2 w-full animate-in fade-in zoom-in duration-200">
                  <Button variant="outline" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200" onClick={clearMap}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                  {points.length >= 3 && (
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleSaveProperty}>
                      <Save className="w-4 h-4 mr-2" /> Save
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* MEASUREMENTS */}
          <LandMeasurements measurements={measurements} onSave={points.length >= 3 ? handleSaveProperty : undefined} />
        </div>
      </div>

      {/* MOBILE UI OVERLAYS */}
      <div className="md:hidden">
        
        {/* Floating Header */}
        {/* <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-gray-100 pointer-events-auto">
          <div className="flex items-center gap-2">
            <MapPin className="text-blue-600" size={24} />
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">LandMap <span className="text-blue-600">POC</span></h1>
          </div>
        </div> */}

        {/* Floating Action Buttons */}
        <div className="absolute right-4 bottom-24 z-10 flex flex-col gap-3 pointer-events-auto">
          <button onClick={requestUserLocation} className="bg-white p-3 rounded-full shadow-lg border border-gray-200 text-gray-700 active:bg-gray-50">
            <Navigation size={20} />
          </button>
          {(points.length >= 3) && (
            <button onClick={handleSaveProperty} className="bg-green-600 p-3 rounded-full shadow-lg border border-green-700 text-white active:bg-green-700">
              <Save size={20} />
            </button>
          )}
          {(points.length > 0) && (
            <button onClick={clearMap} className="bg-white p-3 rounded-full shadow-lg border border-gray-200 text-red-600 active:bg-red-50">
              <Trash2 size={20} />
            </button>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 flex justify-around items-center pt-2 pb-4 px-2 pointer-events-auto">
          <button 
            className={`flex flex-col items-center p-2 rounded-lg ${mode === 'VIEW' ? 'text-blue-600' : 'text-gray-500'}`} 
            onClick={() => setMode('VIEW')}
          >
            <MapPin size={24} className={mode === 'VIEW' ? 'fill-blue-100' : ''} />
            <span className="text-[10px] mt-1 font-medium">Explore</span>
          </button>
          
          <button 
            className={`flex flex-col items-center p-2 rounded-lg ${(mode === 'IMPORT' || mode === 'REVIEW') ? 'text-blue-600' : 'text-gray-500'}`} 
            onClick={startImportMode}
          >
            <Camera size={24} className={(mode === 'IMPORT' || mode === 'REVIEW') ? 'fill-blue-100' : ''} />
            <span className="text-[10px] mt-1 font-medium">Import</span>
          </button>
          
          <button 
            className={`flex flex-col items-center p-2 rounded-lg ${mode === 'DRAW' ? 'text-blue-600' : 'text-gray-500'}`} 
            onClick={startDrawMode}
          >
            <Pointer size={24} className={mode === 'DRAW' ? 'fill-blue-100' : ''} />
            <span className="text-[10px] mt-1 font-medium">Draw</span>
          </button>

          <button 
            className={`flex flex-col items-center p-2 rounded-lg ${(mode === 'MANUAL' || mode === 'REVIEW') ? 'text-blue-600' : 'text-gray-500'}`} 
            onClick={startManualMode}
          >
            <Keyboard size={24} className={(mode === 'MANUAL' || mode === 'REVIEW') ? 'text-blue-600' : ''} />
            <span className="text-[10px] mt-1 font-medium">Manual</span>
          </button>
        </div>

        {/* Conditional Bottom Sheets for Active Modes */}
        {(mode === 'IMPORT' || mode === 'REVIEW' || mode === 'MANUAL' || (mode === 'VIEW' && points.length > 2)) && (
          <div className="absolute bottom-24 left-2 right-2 z-10 bg-white rounded-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border border-gray-200 max-h-[60dvh] overflow-y-auto overflow-x-hidden pointer-events-auto">
            <div className="p-4 flex flex-col gap-4">
              {(mode === 'REVIEW' || mode === 'MANUAL') ? (
                <CoordinateReviewTable 
                  initialCoordinates={extractedCoords} 
                  onConfirm={confirmOcrCoordinates} 
                  onCancel={cancelOcr} 
                  title={mode === 'MANUAL' ? "Manual Entry" : "Extracted Coordinates"}
                />
              ) : mode === 'IMPORT' ? (
                <div className="space-y-4">
                  <CoordinateUploader onCoordinatesExtracted={handleOcrExtracted} />
                  <Button variant="secondary" className="w-full" onClick={() => setMode('VIEW')}>
                    Cancel
                  </Button>
                </div>
              ) : (mode === 'VIEW' && points.length > 2) ? (
                <LandMeasurements measurements={measurements} onSave={points.length >= 3 ? handleSaveProperty : undefined} />
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

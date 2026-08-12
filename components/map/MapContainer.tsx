"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the map component with ssr: false because Leaflet needs the window object
const MapWithNoSSR = dynamic(() => import('./LandMap').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-gray-500 font-medium">Loading Map...</p>
      </div>
    </div>
  )
});

export default function MapContainer(props: any) {
  return <MapWithNoSSR {...props} />;
}

'use client';

import dynamic from 'next/dynamic';

// CRITICAL: Must use dynamic import with ssr: false
// Leaflet uses window object which doesn't exist on server
const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  )
});

export default Map;

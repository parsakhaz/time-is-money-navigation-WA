'use client';

import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

interface Place {
  displayName: string;
  lat: number;
  lng: number;
}

interface RouteInputProps {
  onRouteRequest: (params: {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    wage: number;
    hasGoodToGo: boolean;
  }) => void;
  isLoading?: boolean;
}

export default function RouteInput({ onRouteRequest, isLoading }: RouteInputProps) {
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [originResults, setOriginResults] = useState<Place[]>([]);
  const [destResults, setDestResults] = useState<Place[]>([]);
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [wage, setWage] = useState(25);
  const [hasGoodToGo, setHasGoodToGo] = useState(true);

  const searchPlaces = useDebouncedCallback(async (query: string, setter: (places: Place[]) => void) => {
    if (query.length < 2) {
      setter([]);
      return;
    }

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setter(data.places || []);
    } catch (error) {
      console.error('Search error:', error);
      setter([]);
    }
  }, 300);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;

    onRouteRequest({
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      wage,
      hasGoodToGo
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Origin Input */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          From
        </label>
        <input
          type="text"
          value={origin ? origin.displayName : originQuery}
          onChange={(e) => {
            setOriginQuery(e.target.value);
            setOrigin(null);
            searchPlaces(e.target.value, setOriginResults);
          }}
          placeholder="Enter starting location"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {originResults.length > 0 && !origin && (
          <ul className="absolute z-[1200] w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-48 overflow-auto shadow-lg">
            {originResults.map((place, i) => (
              <li
                key={i}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setOrigin(place);
                  setOriginResults([]);
                }}
                className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-900 border-b border-gray-100 last:border-0"
              >
                {place.displayName}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Destination Input */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          To
        </label>
        <input
          type="text"
          value={destination ? destination.displayName : destQuery}
          onChange={(e) => {
            setDestQuery(e.target.value);
            setDestination(null);
            searchPlaces(e.target.value, setDestResults);
          }}
          placeholder="Enter destination"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {destResults.length > 0 && !destination && (
          <ul className="absolute z-[1200] w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-48 overflow-auto shadow-lg">
            {destResults.map((place, i) => (
              <li
                key={i}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setDestination(place);
                  setDestResults([]);
                }}
                className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-900 border-b border-gray-100 last:border-0"
              >
                {place.displayName}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Hourly Wage Slider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hourly Wage: <span className="font-bold text-blue-600">${wage}</span>/hr
        </label>
        <input
          type="range"
          min="15"
          max="200"
          step="5"
          value={wage}
          onChange={(e) => setWage(parseInt(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>$15/hr</span>
          <span>$200/hr</span>
        </div>
      </div>

      {/* Good To Go Toggle */}
      <div className="flex items-center gap-2 py-1">
        <input
          type="checkbox"
          id="goodToGo"
          checked={hasGoodToGo}
          onChange={(e) => setHasGoodToGo(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="goodToGo" className="text-sm text-gray-700">
          I have a Good To Go! pass
        </label>
      </div>

      <button
        type="submit"
        disabled={!origin || !destination || isLoading}
        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg
                   hover:bg-blue-700 active:bg-blue-800
                   disabled:bg-gray-300 disabled:cursor-not-allowed
                   transition-colors duration-150"
      >
        {isLoading ? 'Calculating...' : 'Find Best Route'}
      </button>
    </form>
  );
}

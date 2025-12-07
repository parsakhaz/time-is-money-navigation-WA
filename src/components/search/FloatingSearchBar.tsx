'use client';

import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

interface Place {
  displayName: string;
  lat: number;
  lng: number;
}

interface FloatingSearchBarProps {
  placeholder: string;
  value: string;
  selectedPlace?: Place | null;
  onSelect: (place: Place) => void;
  onChange: (value: string) => void;
}

export function FloatingSearchBar({
  placeholder,
  value,
  selectedPlace,
  onSelect,
  onChange
}: FloatingSearchBarProps) {
  const [results, setResults] = useState<Place[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  const searchPlaces = useDebouncedCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.places || []);
    } catch {
      setResults([]);
    }
  }, 300);

  const displayValue = selectedPlace ? selectedPlace.displayName : value;

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={displayValue}
        onChange={(e) => {
          onChange(e.target.value);
          searchPlaces(e.target.value);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white rounded-full shadow-lg border-0
                   focus:ring-2 focus:ring-blue-500 focus:outline-none
                   text-gray-900 placeholder-gray-500"
      />
      {isFocused && results.length > 0 && !selectedPlace && (
        <ul className="absolute z-[1200] w-full mt-2 bg-white rounded-lg shadow-xl
                       max-h-60 overflow-auto border border-gray-100">
          {results.map((place, i) => (
            <li
              key={i}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(place);
                setResults([]);
              }}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-gray-900
                         border-b border-gray-100 last:border-0"
            >
              {place.displayName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

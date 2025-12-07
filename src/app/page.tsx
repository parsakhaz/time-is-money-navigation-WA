'use client';

import { useState } from 'react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import MapDynamic from '@/components/MapDynamic';
import RouteInput from '@/components/RouteInput';
import RouteComparison from '@/components/RouteComparison';

interface RouteData {
  tollRoute: {
    durationSeconds: number;
    distanceMeters: number;
    tollCost: number;
    effectiveCostSeconds: number;
    geometry: GeoJSON.LineString;
  };
  freeRoute: {
    durationSeconds: number;
    distanceMeters: number;
    tollCost: number;
    effectiveCostSeconds: number;
    geometry: GeoJSON.LineString;
  };
  recommendation: 'toll' | 'free';
  timeSavedSeconds: number;
  moneySpent: number;
  breakEvenWage: number;
  hourlyWage: number;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);

  const handleRouteRequest = async (params: {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    wage: number;
    hasGoodToGo: boolean;
  }) => {
    setIsLoading(true);
    setError(null);
    setOrigin(params.origin);
    setDestination(params.destination);

    try {
      const queryParams = new URLSearchParams({
        originLat: params.origin.lat.toString(),
        originLng: params.origin.lng.toString(),
        destLat: params.destination.lat.toString(),
        destLng: params.destination.lng.toString(),
        wage: params.wage.toString(),
        goodToGo: params.hasGoodToGo.toString()
      });

      const res = await fetch(`/api/route?${queryParams}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to calculate route');
      }

      if (data.singleRoute) {
        setError(data.message);
        setRouteData(null);
      } else {
        setRouteData(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setRouteData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveLayout
      map={
        <MapDynamic
          tollRoute={routeData?.tollRoute.geometry}
          freeRoute={routeData?.freeRoute.geometry}
          recommendation={routeData?.recommendation}
          origin={origin}
          destination={destination}
        />
      }
      panelContent={
        <div className="space-y-4">
          <RouteInput
            onRouteRequest={handleRouteRequest}
            isLoading={isLoading}
          />

          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl">
              <p className="font-semibold">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {routeData && origin && destination && (
            <RouteComparison
              {...routeData}
              origin={origin}
              destination={destination}
            />
          )}

          {!routeData && !error && !isLoading && (
            <div className="p-6 bg-gray-50 border-2 border-gray-200 rounded-xl text-center">
              <p className="text-gray-600 text-sm">
                Enter your starting point and destination above to compare toll vs. free routes.
              </p>
            </div>
          )}
        </div>
      }
    />
  );
}

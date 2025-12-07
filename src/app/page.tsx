'use client';

import { useState } from 'react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import MapDynamic from '@/components/MapDynamic';
import RouteInput from '@/components/RouteInput';
import RouteComparison from '@/components/RouteComparison';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

  // Check if running in production without proper OSRM setup
  const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');

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
          {isProduction && (
            <Alert variant="destructive">
              <AlertTitle>⚠️ Demo Mode Only</AlertTitle>
              <AlertDescription>
                This app requires a local OSRM routing server to function properly.
                The production deployment is not fully configured yet.
                To use this app, clone the repository and run it locally with Docker.
              </AlertDescription>
            </Alert>
          )}

          <RouteInput
            onRouteRequest={handleRouteRequest}
            isLoading={isLoading}
          />

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {routeData && origin && destination && (
            <RouteComparison
              {...routeData}
              origin={origin}
              destination={destination}
            />
          )}

          {!routeData && !error && !isLoading && (
            <Alert>
              <AlertDescription className="text-center">
                Enter your starting point and destination above to compare toll vs. free routes.
              </AlertDescription>
            </Alert>
          )}
        </div>
      }
    />
  );
}

'use client';

import NavigationButtons from './NavigationButtons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Coins, CircleSlash, Clock, MapPin, Banknote, Check, BarChart3 } from 'lucide-react';

interface RouteComparisonProps {
  tollRoute: {
    durationSeconds: number;
    distanceMeters: number;
    tollCost: number;
    effectiveCostSeconds: number;
  };
  freeRoute: {
    durationSeconds: number;
    distanceMeters: number;
    tollCost: number;
    effectiveCostSeconds: number;
  };
  recommendation: 'toll' | 'free';
  timeSavedSeconds: number;
  moneySpent: number;
  breakEvenWage: number;
  hourlyWage: number;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}

function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  return `${miles.toFixed(1)} mi`;
}

export default function RouteComparison({
  tollRoute,
  freeRoute,
  recommendation,
  timeSavedSeconds,
  moneySpent,
  breakEvenWage,
  hourlyWage,
  origin,
  destination
}: RouteComparisonProps) {
  return (
    <div className="space-y-4">
      {/* Recommendation Banner */}
      <Alert className={cn(
        recommendation === 'toll'
          ? 'bg-blue-50 border-blue-200'
          : 'bg-green-50 border-green-200'
      )}>
        <AlertTitle className="text-lg flex items-center gap-2">
          {recommendation === 'toll' ? (
            <>
              <Coins className="h-5 w-5" />
              Take the Toll Road!
            </>
          ) : (
            <>
              <CircleSlash className="h-5 w-5" />
              Take the Free Route!
            </>
          )}
        </AlertTitle>
        <AlertDescription>
          {recommendation === 'toll'
            ? `At $${hourlyWage}/hr, the ${formatDuration(timeSavedSeconds)} saved is worth more than the $${moneySpent.toFixed(2)} toll.`
            : `At $${hourlyWage}/hr, the $${moneySpent.toFixed(2)} toll isn't worth ${formatDuration(timeSavedSeconds)}.`
          }
        </AlertDescription>
      </Alert>

      {/* Route Comparison Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        {/* Toll Route */}
        <Card className={cn(
          "transition-all",
          recommendation === 'toll' && "border-blue-500 bg-blue-50 shadow-md"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-700">Toll Route</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {formatDuration(tollRoute.durationSeconds)}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {formatDistance(tollRoute.distanceMeters)}
              </p>
              <p className="font-semibold text-blue-600 flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                ${tollRoute.tollCost.toFixed(2)}
              </p>
            </div>
            <NavigationButtons
              origin={origin}
              destination={destination}
              routeType="toll"
            />
          </CardContent>
        </Card>

        {/* Free Route */}
        <Card className={cn(
          "transition-all",
          recommendation === 'free' && "border-green-500 bg-green-50 shadow-md"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-green-700">Free Route</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {formatDuration(freeRoute.durationSeconds)}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {formatDistance(freeRoute.distanceMeters)}
              </p>
              <p className="font-semibold text-green-600 flex items-center gap-2">
                <Check className="h-4 w-4" />
                Free!
              </p>
            </div>
            <NavigationButtons
              origin={origin}
              destination={destination}
              routeType="free"
            />
          </CardContent>
        </Card>
      </div>

      {/* Break-Even Info */}
      <Card>
        <CardContent className="pt-6">
          <p className="font-medium text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Break-even wage: <span className="text-blue-600">${breakEvenWage.toFixed(2)}/hr</span>
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            If you earn more than ${breakEvenWage.toFixed(2)}/hr, the toll road is worth it.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

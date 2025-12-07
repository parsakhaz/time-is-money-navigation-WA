'use client';

import NavigationButtons from './NavigationButtons';

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
      <div className={`p-4 rounded-xl ${
        recommendation === 'toll' ? 'bg-blue-50 border-2 border-blue-200' : 'bg-green-50 border-2 border-green-200'
      }`}>
        <h3 className="font-bold text-lg text-gray-900">
          {recommendation === 'toll' ? '💰 Take the Toll Road!' : '🆓 Take the Free Route!'}
        </h3>
        <p className="text-sm text-gray-700 mt-1">
          {recommendation === 'toll'
            ? `At $${hourlyWage}/hr, the ${formatDuration(timeSavedSeconds)} saved is worth more than the $${moneySpent.toFixed(2)} toll.`
            : `At $${hourlyWage}/hr, the $${moneySpent.toFixed(2)} toll isn't worth ${formatDuration(timeSavedSeconds)}.`
          }
        </p>
      </div>

      {/* Route Comparison Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Toll Route */}
        <div className={`p-3 rounded-xl border-2 transition-all ${
          recommendation === 'toll' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 bg-gray-50'
        }`}>
          <h4 className="font-semibold text-blue-700 mb-2">Toll Route</h4>
          <div className="space-y-1 text-sm text-gray-700">
            <p>⏱️ {formatDuration(tollRoute.durationSeconds)}</p>
            <p>📍 {formatDistance(tollRoute.distanceMeters)}</p>
            <p className="font-semibold text-blue-600">💵 ${tollRoute.tollCost.toFixed(2)}</p>
          </div>
          <NavigationButtons
            origin={origin}
            destination={destination}
            routeType="toll"
          />
        </div>

        {/* Free Route */}
        <div className={`p-3 rounded-xl border-2 transition-all ${
          recommendation === 'free' ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 bg-gray-50'
        }`}>
          <h4 className="font-semibold text-green-700 mb-2">Free Route</h4>
          <div className="space-y-1 text-sm text-gray-700">
            <p>⏱️ {formatDuration(freeRoute.durationSeconds)}</p>
            <p>📍 {formatDistance(freeRoute.distanceMeters)}</p>
            <p className="font-semibold text-green-600">✓ Free!</p>
          </div>
          <NavigationButtons
            origin={origin}
            destination={destination}
            routeType="free"
          />
        </div>
      </div>

      {/* Break-Even Info */}
      <div className="p-3 bg-gray-100 rounded-xl border border-gray-200">
        <p className="font-medium text-gray-900 text-sm">
          📊 Break-even wage: <span className="text-blue-600">${breakEvenWage.toFixed(2)}/hr</span>
        </p>
        <p className="text-gray-600 text-xs mt-1">
          If you earn more than ${breakEvenWage.toFixed(2)}/hr, the toll road is worth it.
        </p>
      </div>
    </div>
  );
}

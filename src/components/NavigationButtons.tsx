'use client';

import { useState } from 'react';
import {
  generateNavigationUrl,
  getPrimaryApp,
  getSecondaryApps,
  NavigationApp,
  Coordinate,
} from '@/lib/navigation-links';

interface NavigationButtonsProps {
  origin: Coordinate;
  destination: Coordinate;
  routeType: 'toll' | 'free';
}

export default function NavigationButtons({
  origin,
  destination,
  routeType,
}: NavigationButtonsProps) {
  const [expanded, setExpanded] = useState(false);
  const avoidTolls = routeType === 'free';

  const primaryApp = getPrimaryApp();
  const secondaryApps = getSecondaryApps();

  const openNavigation = (app: NavigationApp) => {
    const url = generateNavigationUrl(app.id, origin, destination, avoidTolls);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      {/* Primary Action - Google Maps */}
      <button
        onClick={() => openNavigation(primaryApp)}
        className="w-full px-3 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
      >
        Open in {primaryApp.name}
      </button>

      {/* Progressive Disclosure Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        {expanded ? 'Hide other apps' : 'Other navigation apps'}
      </button>

      {/* Secondary Apps - Collapsed by Default */}
      {expanded && (
        <div className="mt-2 space-y-1">
          {secondaryApps.map((app) => (
            <div key={app.id}>
              <button
                onClick={() => openNavigation(app)}
                className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
              >
                {app.name}
              </button>
              {avoidTolls && app.disclaimer && (
                <p className="text-xs text-amber-600 mt-0.5 px-1">
                  {app.disclaimer}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  generateNavigationUrl,
  getPrimaryApp,
  getSecondaryApps,
  NavigationApp,
  Coordinate,
} from '@/lib/navigation-links';
import { Button } from '@/components/ui/button';

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
    <div className="mt-3 pt-3 border-t">
      {/* Primary Action */}
      <Button
        onClick={() => openNavigation(primaryApp)}
        className="w-full flex flex-col h-auto py-2"
        size="sm"
      >
        <span className="text-xs">Open in</span>
        <span>{primaryApp.name}</span>
      </Button>

      {/* Progressive Disclosure Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="w-full mt-2 text-xs"
      >
        {expanded ? 'Hide other apps' : 'Other navigation apps'}
      </Button>

      {/* Secondary Apps - Collapsed by Default */}
      {expanded && (
        <div className="mt-2 space-y-1">
          {secondaryApps.map((app) => (
            <div key={app.id}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openNavigation(app)}
                className="w-full"
              >
                {app.name}
              </Button>
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

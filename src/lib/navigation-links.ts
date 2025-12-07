export interface Coordinate {
  lat: number;
  lng: number;
}

export interface NavigationApp {
  id: string;
  name: string;
  supportsTollAvoidance: boolean;
  disclaimer?: string;
}

export const NAVIGATION_APPS: NavigationApp[] = [
  {
    id: 'google',
    name: 'Google Maps',
    supportsTollAvoidance: true,
  },
  {
    id: 'apple',
    name: 'Apple Maps',
    supportsTollAvoidance: false,
    disclaimer: "Apple Maps doesn't support toll preferences in links.",
  },
  {
    id: 'waze',
    name: 'Waze',
    supportsTollAvoidance: false,
    disclaimer: "Waze doesn't support toll preferences and starts from your current location.",
  },
];

const urlBuilders: Record<string, (origin: Coordinate, destination: Coordinate, avoidTolls: boolean) => string> = {
  google: (origin, destination, avoidTolls) => {
    const url = new URL('https://www.google.com/maps/dir/');
    url.searchParams.set('api', '1');
    url.searchParams.set('origin', `${origin.lat},${origin.lng}`);
    url.searchParams.set('destination', `${destination.lat},${destination.lng}`);
    url.searchParams.set('travelmode', 'driving');
    if (avoidTolls) url.searchParams.set('avoid', 'tolls');
    return url.toString();
  },

  apple: (origin, destination) => {
    const url = new URL('https://maps.apple.com/');
    url.searchParams.set('saddr', `${origin.lat},${origin.lng}`);
    url.searchParams.set('daddr', `${destination.lat},${destination.lng}`);
    url.searchParams.set('dirflg', 'd');
    return url.toString();
  },

  waze: (_, destination) => {
    const url = new URL('https://waze.com/ul');
    url.searchParams.set('ll', `${destination.lat},${destination.lng}`);
    url.searchParams.set('navigate', 'yes');
    return url.toString();
  },
};

export function generateNavigationUrl(
  appId: string,
  origin: Coordinate,
  destination: Coordinate,
  avoidTolls: boolean
): string {
  const builder = urlBuilders[appId];
  if (!builder) throw new Error(`Unknown navigation app: ${appId}`);
  return builder(origin, destination, avoidTolls);
}

export function getApp(appId: string): NavigationApp | undefined {
  return NAVIGATION_APPS.find(app => app.id === appId);
}

export function getPrimaryApp(): NavigationApp {
  return NAVIGATION_APPS[0];
}

export function getSecondaryApps(): NavigationApp[] {
  return NAVIGATION_APPS.slice(1);
}

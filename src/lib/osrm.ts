import { routeCrossesToll } from './toll-detector';
import { findAlternativeRoutes } from './alternative-router';

const OSRM_BASE_URL = process.env.OSRM_URL || 'https://router.project-osrm.org';

export interface Coordinate {
  lng: number;
  lat: number;
}

export interface RouteResult {
  distance: number;      // meters
  duration: number;      // seconds
  geometry: GeoJSON.LineString;
  hasTolls: boolean;
}

export interface OSRMResponse {
  code: string;
  routes: Array<{
    distance: number;
    duration: number;
    geometry: GeoJSON.LineString | string;
    legs: Array<{
      distance: number;
      duration: number;
    }>;
  }>;
}

/**
 * Fetch multiple alternative routes from OSRM
 */
async function getAlternativeRoutes(
  origin: Coordinate,
  destination: Coordinate
): Promise<RouteResult[]> {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM_BASE_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson&alternatives=true`;

  try {
    const response = await fetch(url);
    const data: OSRMResponse = await response.json();

    if (data.code !== 'Ok' || !data.routes.length) {
      return [];
    }

    // Convert all routes and detect tolls
    return data.routes.map(route => {
      const geometry = route.geometry as GeoJSON.LineString;
      return {
        distance: route.distance,
        duration: route.duration,
        geometry,
        hasTolls: routeCrossesToll(geometry)
      };
    });
  } catch (error) {
    console.error('OSRM fetch error:', error);
    return [];
  }
}

/**
 * Fetch both toll and no-toll routes using OSRM alternatives
 * If OSRM doesn't provide enough alternatives, actively search for them
 */
export async function getRouteComparison(
  origin: Coordinate,
  destination: Coordinate
): Promise<{ withTolls: RouteResult | null; withoutTolls: RouteResult | null }> {
  let routes = await getAlternativeRoutes(origin, destination);

  // If OSRM didn't give us multiple routes, actively search for alternatives
  if (routes.length < 2) {
    console.log('OSRM provided < 2 routes, searching for alternatives with waypoints');
    const alternativeRoutes = await findAlternativeRoutes(origin, destination);

    // Add the found alternatives and re-classify them
    const allRoutes = [...routes, ...alternativeRoutes];
    routes = allRoutes.map(route => ({
      ...route,
      hasTolls: routeCrossesToll(route.geometry)
    }));
  }

  if (routes.length === 0) {
    return { withTolls: null, withoutTolls: null };
  }

  // Separate routes by toll status
  const tollRoutes = routes.filter(r => r.hasTolls);
  const freeRoutes = routes.filter(r => !r.hasTolls);

  // Pick the fastest toll route and fastest free route
  const withTolls = tollRoutes.length > 0
    ? tollRoutes.reduce((fastest, current) =>
        current.duration < fastest.duration ? current : fastest
      )
    : null;

  const withoutTolls = freeRoutes.length > 0
    ? freeRoutes.reduce((fastest, current) =>
        current.duration < fastest.duration ? current : fastest
      )
    : null;

  // If we don't have both, use the fastest route as fallback
  // and mark it appropriately
  if (!withTolls && !withoutTolls) {
    // This shouldn't happen since routes.length > 0
    return { withTolls: null, withoutTolls: null };
  }

  if (!withTolls && withoutTolls) {
    // Only free routes available
    return { withTolls: null, withoutTolls };
  }

  if (withTolls && !withoutTolls) {
    // Only toll routes available - this shouldn't happen often now
    return { withTolls, withoutTolls: null };
  }

  return { withTolls, withoutTolls };
}

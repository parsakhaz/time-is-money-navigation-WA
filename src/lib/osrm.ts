const OSRM_BASE_URL = process.env.OSRM_URL || 'http://localhost:5000';

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
 * Fetch route from OSRM
 * @param origin Start coordinates
 * @param destination End coordinates
 * @param excludeToll Whether to exclude toll roads
 */
async function getRoute(
  origin: Coordinate,
  destination: Coordinate,
  excludeToll: boolean = false
): Promise<RouteResult | null> {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const excludeParam = excludeToll ? '&exclude=toll' : '';
  const url = `${OSRM_BASE_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson${excludeParam}`;

  try {
    const response = await fetch(url);
    const data: OSRMResponse = await response.json();

    if (data.code !== 'Ok' || !data.routes.length) {
      return null;
    }

    const route = data.routes[0];
    return {
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry as GeoJSON.LineString,
      hasTolls: !excludeToll
    };
  } catch (error) {
    console.error('OSRM fetch error:', error);
    return null;
  }
}

/**
 * Fetch both toll and no-toll routes
 */
export async function getRouteComparison(
  origin: Coordinate,
  destination: Coordinate
): Promise<{ withTolls: RouteResult | null; withoutTolls: RouteResult | null }> {
  const [withTolls, withoutTolls] = await Promise.all([
    getRoute(origin, destination, false),
    getRoute(origin, destination, true)
  ]);

  return { withTolls, withoutTolls };
}

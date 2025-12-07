import type { Coordinate, RouteResult } from './osrm';

const OSRM_BASE_URL = process.env.OSRM_URL || 'https://router.project-osrm.org';

/**
 * Calculate a waypoint to avoid going through a specific area
 * This forces the route to go around toll facilities
 */
function calculateAvoidanceWaypoint(
  origin: Coordinate,
  destination: Coordinate,
  avoidLat: number
): Coordinate {
  // Calculate midpoint longitude
  const midLng = (origin.lng + destination.lng) / 2;

  // Use the avoidance latitude (forces route north or south of toll)
  return { lng: midLng, lat: avoidLat };
}

/**
 * Fetch a route with a waypoint to force different path
 */
async function getRouteViaWaypoint(
  origin: Coordinate,
  destination: Coordinate,
  waypoint: Coordinate
): Promise<RouteResult | null> {
  const coords = `${origin.lng},${origin.lat};${waypoint.lng},${waypoint.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM_BASE_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes.length) {
      return null;
    }

    const route = data.routes[0];
    return {
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry as GeoJSON.LineString,
      hasTolls: false // Will be checked by toll detector
    };
  } catch (error) {
    console.error('Waypoint route fetch error:', error);
    return null;
  }
}

/**
 * Find alternative routes by trying different waypoints
 * This is used when OSRM doesn't provide natural alternatives
 */
export async function findAlternativeRoutes(
  origin: Coordinate,
  destination: Coordinate
): Promise<RouteResult[]> {
  const routes: (RouteResult | null)[] = [];

  // Strategy: For Seattle-area routing, try routes that avoid SR 520 (lat ~47.64)
  // by forcing routes north (via SR 522) or south (via I-90)

  const avgLat = (origin.lat + destination.lat) / 2;

  // Try different waypoint latitudes to find alternative paths
  const waypointStrategies = [
    avgLat + 0.05,  // Force route north
    avgLat - 0.05,  // Force route south
    avgLat + 0.03,  // Slightly north
    avgLat - 0.03,  // Slightly south
  ];

  // Try each waypoint strategy
  for (const waypointLat of waypointStrategies) {
    const waypoint = calculateAvoidanceWaypoint(origin, destination, waypointLat);
    const route = await getRouteViaWaypoint(origin, destination, waypoint);
    routes.push(route);
  }

  // Filter out nulls and return
  return routes.filter((r): r is RouteResult => r !== null);
}

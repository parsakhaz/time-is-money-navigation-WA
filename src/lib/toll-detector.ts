import tollData from '@/data/wa-tolls.json';

/**
 * Check if a point is within a bounding box
 */
function isPointInBounds(
  point: [number, number],
  bounds: { min: [number, number]; max: [number, number] }
): boolean {
  const [lng, lat] = point;
  const [minLng, minLat] = bounds.min;
  const [maxLng, maxLat] = bounds.max;
  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
}

/**
 * Create bounding box around toll facility coordinates with buffer
 */
function createTollBounds(
  coords: { start?: number[]; end?: number[]; north?: number[]; south?: number[] }
): { min: [number, number]; max: [number, number] } | null {
  const points: number[][] = [];

  if (coords.start) points.push(coords.start);
  if (coords.end) points.push(coords.end);
  if (coords.north) points.push(coords.north);
  if (coords.south) points.push(coords.south);

  if (points.length === 0) return null;

  const lngs = points.map(p => p[0]);
  const lats = points.map(p => p[1]);

  // Add buffer of ~1km (roughly 0.01 degrees)
  const buffer = 0.01;

  return {
    min: [Math.min(...lngs) - buffer, Math.min(...lats) - buffer],
    max: [Math.max(...lngs) + buffer, Math.max(...lats) + buffer]
  };
}

/**
 * Check if a route geometry crosses any toll facilities
 */
export function routeCrossesToll(geometry: GeoJSON.LineString): boolean {
  const coordinates = geometry.coordinates as [number, number][];

  for (const facility of tollData.facilities) {
    const bounds = createTollBounds(facility.coordinates);
    if (!bounds) continue;

    // Check if any point in the route crosses this toll facility
    for (const point of coordinates) {
      if (isPointInBounds(point, bounds)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get list of toll facilities crossed by a route
 */
export function getTollFacilitiesCrossed(geometry: GeoJSON.LineString): string[] {
  const coordinates = geometry.coordinates as [number, number][];
  const crossed: string[] = [];

  for (const facility of tollData.facilities) {
    const bounds = createTollBounds(facility.coordinates);
    if (!bounds) continue;

    // Check if any point in the route crosses this toll facility
    for (const point of coordinates) {
      if (isPointInBounds(point, bounds)) {
        crossed.push(facility.id);
        break; // Don't count the same facility multiple times
      }
    }
  }

  return crossed;
}

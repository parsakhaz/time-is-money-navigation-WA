import { NextRequest, NextResponse } from 'next/server';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const WA_BOUNDS = '-125.0,45.5,-116.9,49.0'; // Washington State bounding box

// Simple rate limiting
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1100; // Slightly over 1 second

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    );
  }

  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_INTERVAL_MS) {
    await new Promise(resolve =>
      setTimeout(resolve, MIN_INTERVAL_MS - timeSinceLastRequest)
    );
  }
  lastRequestTime = Date.now();

  try {
    const url = new URL('/search', NOMINATIM_URL);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('viewbox', WA_BOUNDS);
    url.searchParams.set('bounded', '1');
    url.searchParams.set('limit', '5');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'TimeIsMoneyRouter/1.0 (github.com/time-is-money-router)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim returned ${response.status}`);
    }

    const results: NominatimResult[] = await response.json();

    // Transform to simpler format
    const places = results.map((r) => ({
      displayName: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      type: r.type,
      importance: r.importance
    }));

    return NextResponse.json({ places });
  } catch (error) {
    console.error('Geocode error:', error);
    return NextResponse.json(
      { error: 'Geocoding failed' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getRouteComparison, Coordinate } from '@/lib/osrm';
import { compareRoutes } from '@/lib/wage-calculator';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const originLng = parseFloat(searchParams.get('originLng') || '');
  const originLat = parseFloat(searchParams.get('originLat') || '');
  const destLng = parseFloat(searchParams.get('destLng') || '');
  const destLat = parseFloat(searchParams.get('destLat') || '');
  const hourlyWage = parseFloat(searchParams.get('wage') || '25');
  const hasGoodToGo = searchParams.get('goodToGo') !== 'false';

  // Validate inputs
  if (isNaN(originLng) || isNaN(originLat) || isNaN(destLng) || isNaN(destLat)) {
    return NextResponse.json(
      { error: 'Invalid coordinates' },
      { status: 400 }
    );
  }

  if (hourlyWage <= 0 || hourlyWage > 10000) {
    return NextResponse.json(
      { error: 'Hourly wage must be between $1 and $10,000' },
      { status: 400 }
    );
  }

  const origin: Coordinate = { lng: originLng, lat: originLat };
  const destination: Coordinate = { lng: destLng, lat: destLat };

  try {
    const { withTolls, withoutTolls } = await getRouteComparison(origin, destination);

    if (!withTolls && !withoutTolls) {
      return NextResponse.json(
        { error: 'No route found between these points' },
        { status: 404 }
      );
    }

    // If only one route available, return it
    if (!withTolls || !withoutTolls) {
      const route = withTolls || withoutTolls;
      return NextResponse.json({
        singleRoute: true,
        route,
        message: withTolls
          ? 'No toll-free route available'
          : 'No toll route available'
      });
    }

    // Compare routes
    const comparison = compareRoutes(
      withTolls.duration,
      withTolls.distance,
      withoutTolls.duration,
      withoutTolls.distance,
      hourlyWage,
      hasGoodToGo
    );

    return NextResponse.json({
      tollRoute: {
        ...comparison.tollRoute,
        geometry: withTolls.geometry
      },
      freeRoute: {
        ...comparison.freeRoute,
        geometry: withoutTolls.geometry
      },
      recommendation: comparison.recommendation,
      timeSavedSeconds: comparison.timeSavedSeconds,
      moneySpent: comparison.moneySpent,
      breakEvenWage: comparison.breakEvenWage,
      hourlyWage
    });
  } catch (error) {
    console.error('Route API error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate route' },
      { status: 500 }
    );
  }
}

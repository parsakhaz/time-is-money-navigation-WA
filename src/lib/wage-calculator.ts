import tollData from '@/data/wa-tolls.json';

interface TimeSlot {
  start: string;
  end: string;
  rate: number;
}

interface TollFacility {
  id: string;
  name: string;
  description: string;
  coordinates: {
    start: number[];
    end: number[];
  };
  pricing: {
    type: 'fixed' | 'time-of-day' | 'dynamic';
    hasGoodToGo: boolean;
    payByMailPremium: number;
    rate?: number;
    weekday?: TimeSlot[];
    weekend?: TimeSlot[];
  };
}

/**
 * Convert toll cost to equivalent time in seconds
 * Formula: penalty_seconds = (toll_cost / hourly_wage) * 3600
 */
export function tollToSeconds(tollCost: number, hourlyWage: number): number {
  if (hourlyWage <= 0) return Infinity;
  return (tollCost / hourlyWage) * 3600;
}

/**
 * Get current toll rate for a facility based on time
 */
export function getCurrentTollRate(
  facilityId: string,
  hasGoodToGo: boolean = true,
  date: Date = new Date()
): number {
  const facility = (tollData.facilities as TollFacility[]).find(f => f.id === facilityId);
  if (!facility) return 0;

  const pricing = facility.pricing;

  // Fixed rate facility
  if (pricing.type === 'fixed' && pricing.rate !== undefined) {
    const rate = pricing.rate;
    return hasGoodToGo ? rate : rate + pricing.payByMailPremium;
  }

  // Time-of-day pricing
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const timeSlots = isWeekend ? pricing.weekend : pricing.weekday;

  if (!timeSlots) return 0;

  const currentHour = date.getHours();
  const currentMinute = date.getMinutes();
  const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

  for (const slot of timeSlots) {
    if (currentTime >= slot.start && currentTime < slot.end) {
      return hasGoodToGo ? slot.rate : slot.rate + pricing.payByMailPremium;
    }
  }

  return 0;
}

/**
 * Calculate estimated toll cost for a route
 * MVP: Uses fixed average for simplicity, can be enhanced with route intersection detection
 */
export function estimateTollCost(
  routeContainsTolls: boolean,
  hasGoodToGo: boolean = true
): number {
  if (!routeContainsTolls) return 0;

  // MVP: Use SR 520 peak rate as default estimate
  // TODO: Detect which toll facilities the route crosses
  return getCurrentTollRate('sr520', hasGoodToGo);
}

export interface RouteComparisonResult {
  tollRoute: {
    durationSeconds: number;
    distanceMeters: number;
    tollCost: number;
    effectiveCostSeconds: number; // Duration + toll converted to time
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
  breakEvenWage: number; // Wage at which both routes are equal
}

/**
 * Compare toll vs free route and make recommendation
 */
export function compareRoutes(
  tollDuration: number,
  tollDistance: number,
  freeDuration: number,
  freeDistance: number,
  hourlyWage: number,
  hasGoodToGo: boolean = true
): RouteComparisonResult {
  const tollCost = estimateTollCost(true, hasGoodToGo);
  const tollPenaltySeconds = tollToSeconds(tollCost, hourlyWage);

  const tollEffective = tollDuration + tollPenaltySeconds;
  const freeEffective = freeDuration; // No toll cost

  const timeSaved = freeDuration - tollDuration;

  // Break-even wage: at what wage are both routes equal?
  // tollDuration + (tollCost/wage)*3600 = freeDuration
  // (tollCost/wage)*3600 = freeDuration - tollDuration
  // tollCost/wage = (freeDuration - tollDuration)/3600
  // wage = tollCost / ((freeDuration - tollDuration)/3600)
  const breakEvenWage = timeSaved > 0
    ? tollCost / (timeSaved / 3600)
    : Infinity;

  return {
    tollRoute: {
      durationSeconds: tollDuration,
      distanceMeters: tollDistance,
      tollCost,
      effectiveCostSeconds: tollEffective
    },
    freeRoute: {
      durationSeconds: freeDuration,
      distanceMeters: freeDistance,
      tollCost: 0,
      effectiveCostSeconds: freeEffective
    },
    recommendation: tollEffective < freeEffective ? 'toll' : 'free',
    timeSavedSeconds: timeSaved,
    moneySpent: tollCost,
    breakEvenWage
  };
}

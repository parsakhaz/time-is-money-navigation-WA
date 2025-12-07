/**
 * WSDOT Toll Rate Scraper
 *
 * Scrapes toll rates from WSDOT public pages and updates wa-tolls.json
 * Run with: npm run scrape:tolls
 */

import * as fs from 'fs';
import * as path from 'path';
import { fetchWithRetry } from './lib/fetcher';
import {
  parseSR520,
  parseTacomaNarrows,
  parseSR99,
  parseSR509,
  parseI405,
  parseSR167,
} from './lib/parsers';

// Type definitions matching existing schema
interface TimeSlot {
  start: string;
  end: string;
  rate: number;
  direction?: 'northbound' | 'southbound' | 'both';
}

interface FixedPricing {
  type: 'fixed';
  hasGoodToGo: boolean;
  payByMailPremium: number;
  rate: number;
}

interface TimeOfDayPricing {
  type: 'time-of-day';
  hasGoodToGo: boolean;
  payByMailPremium: number;
  weekday: TimeSlot[];
  weekend: TimeSlot[];
}

interface DynamicPricing {
  type: 'dynamic';
  hasGoodToGo: boolean;
  payByMailPremium: number;
  payByPlatePremium?: number;
  hovFree: boolean;
  operatingHours: {
    weekday: { start: string; end: string } | null;
    weekend: null;
  };
  rateRange: { min: number; max: number };
  estimates: { offPeak: number; typical: number; peak: number };
  note?: string;
}

type Pricing = FixedPricing | TimeOfDayPricing | DynamicPricing;

interface Coordinates {
  start?: [number, number];
  end?: [number, number];
  north?: [number, number];
  south?: [number, number];
}

interface TollFacility {
  id: string;
  name: string;
  description: string;
  type: 'bridge' | 'tunnel' | 'express-lanes' | 'expressway';
  coordinates: Coordinates;
  pricing: Pricing;
}

interface TollData {
  version: string;
  lastUpdated: string;
  sources: string[];
  facilities: TollFacility[];
}

// Facility configurations
const FACILITIES = [
  {
    id: 'sr520',
    name: 'SR 520 Bridge',
    description: 'Evergreen Point Floating Bridge (Seattle to Bellevue)',
    type: 'bridge' as const,
    url: 'https://wsdot.wa.gov/travel/roads-bridges/toll-roads-bridges-tunnels/sr-520-bridge-tolling',
    parser: parseSR520,
  },
  {
    id: 'tacoma-narrows',
    name: 'Tacoma Narrows Bridge',
    description: 'SR 16 Tacoma Narrows (Eastbound only, Gig Harbor to Tacoma)',
    type: 'bridge' as const,
    url: 'https://wsdot.wa.gov/travel/roads-bridges/toll-roads-bridges-tunnels/tacoma-narrows-bridge-tolling',
    parser: parseTacomaNarrows,
  },
  {
    id: 'sr99-tunnel',
    name: 'SR 99 Tunnel',
    description: 'Alaskan Way Viaduct Replacement (Downtown Seattle)',
    type: 'tunnel' as const,
    url: 'https://wsdot.wa.gov/travel/roads-bridges/toll-roads-bridges-tunnels/sr-99-tunnel-tolling',
    parser: parseSR99,
  },
  {
    id: 'i405-express',
    name: 'I-405 Express Toll Lanes',
    description: 'Dynamic toll lanes from Lynnwood to Bellevue (5am-8pm Mon-Fri)',
    type: 'express-lanes' as const,
    url: 'https://wsdot.wa.gov/travel/roads-bridges/toll-roads-bridges-tunnels/i-405-express-toll-lanes',
    parser: parseI405,
  },
  {
    id: 'sr167-express',
    name: 'SR 167 Express Toll Lanes',
    description: 'Dynamic toll lanes from Renton to Auburn',
    type: 'express-lanes' as const,
    url: 'https://wsdot.wa.gov/travel/roads-bridges/toll-roads-bridges-tunnels/sr-167-express-toll-lanes',
    parser: parseSR167,
  },
  {
    id: 'sr509-expressway',
    name: 'SR 509 Expressway',
    description: 'Connects I-5 to SR 509 near SeaTac Airport',
    type: 'expressway' as const,
    url: 'https://wsdot.wa.gov/travel/roads-bridges/toll-roads-bridges-tunnels/sr-509-expressway',
    parser: parseSR509,
  },
];

/**
 * Generate version string in YYYY.MM format
 */
function generateVersion(): string {
  const now = new Date();
  return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Load existing toll data to preserve coordinates
 */
function loadExistingData(): TollData | null {
  const dataPath = path.join(process.cwd(), 'src/data/wa-tolls.json');

  try {
    const content = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(content) as TollData;
  } catch {
    console.warn('Could not load existing wa-tolls.json, coordinates will be empty');
    return null;
  }
}

/**
 * Main scraper function
 */
async function main() {
  console.log('🚗 WSDOT Toll Rate Scraper');
  console.log('==========================\n');

  // Load existing data to preserve coordinates
  const existingData = loadExistingData();
  const existingFacilitiesMap = new Map<string, TollFacility>();

  if (existingData) {
    for (const facility of existingData.facilities) {
      existingFacilitiesMap.set(facility.id, facility);
    }
    console.log(`📂 Loaded ${existingFacilitiesMap.size} existing facilities\n`);
  }

  // Scrape each facility
  const updatedFacilities: TollFacility[] = [];
  const errors: { id: string; error: string }[] = [];

  for (const config of FACILITIES) {
    console.log(`📡 Scraping ${config.name}...`);

    try {
      const html = await fetchWithRetry(config.url);
      const pricing = config.parser(html);

      // Get existing facility for coordinates
      const existing = existingFacilitiesMap.get(config.id);

      const facility: TollFacility = {
        id: config.id,
        name: config.name,
        description: config.description,
        type: config.type,
        coordinates: existing?.coordinates || {},
        pricing,
      };

      updatedFacilities.push(facility);
      console.log(`   ✅ Success`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ Failed: ${errorMessage}`);
      errors.push({ id: config.id, error: errorMessage });

      // Use existing data as fallback
      const existing = existingFacilitiesMap.get(config.id);
      if (existing) {
        console.log(`   ⚠️  Using existing data as fallback`);
        updatedFacilities.push(existing);
      }
    }
  }

  console.log('\n');

  // Build output
  const output: TollData = {
    version: generateVersion(),
    lastUpdated: new Date().toISOString().split('T')[0],
    sources: FACILITIES.map(f => f.url),
    facilities: updatedFacilities,
  };

  // Write to file
  const outputPath = path.join(process.cwd(), 'src/data/wa-tolls.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');

  // Summary
  console.log('📊 Summary');
  console.log('----------');
  console.log(`   Facilities updated: ${updatedFacilities.length}`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Version: ${output.version}`);
  console.log(`   Last updated: ${output.lastUpdated}`);

  if (errors.length > 0) {
    console.log('\n⚠️  Errors encountered:');
    for (const { id, error } of errors) {
      console.log(`   - ${id}: ${error}`);
    }
  }

  console.log(`\n✅ Output written to ${outputPath}`);
}

// Run the scraper
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

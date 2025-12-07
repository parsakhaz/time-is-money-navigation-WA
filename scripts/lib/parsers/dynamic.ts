/**
 * Dynamic pricing toll rate parser
 * Used for: I-405 Express Toll Lanes, SR 167 Express Toll Lanes
 * Pricing type: Dynamic (rates change based on traffic)
 */

import * as cheerio from 'cheerio';
import { convertTo24Hour } from '../time-utils';

interface DynamicPricing {
  type: 'dynamic';
  hasGoodToGo: boolean;
  payByMailPremium: number;
  payByPlatePremium: number;
  hovFree: boolean;
  operatingHours: {
    weekday: { start: string; end: string } | null;
    weekend: null;
  };
  rateRange: {
    min: number;
    max: number;
  };
  estimates: {
    offPeak: number;
    typical: number;
    peak: number;
  };
  note: string;
}

/**
 * Parse I-405 Express Toll Lanes rates from HTML
 */
export function parseI405(html: string): DynamicPricing {
  return parseDynamicFacility(html);
}

/**
 * Parse SR 167 Express Toll Lanes rates from HTML
 */
export function parseSR167(html: string): DynamicPricing {
  return parseDynamicFacility(html);
}

/**
 * Generic parser for dynamic pricing facilities
 */
function parseDynamicFacility(html: string): DynamicPricing {
  const $ = cheerio.load(html);

  // Extract operating hours from text
  // Look for patterns like "5 a.m. to 8 p.m." or "operate from 5 a.m. to 8 p.m."
  const pageText = $('body').text();

  const operatingHours = extractOperatingHours(pageText);
  const rateRange = extractRateRange(pageText);
  const hovFree = checkHovFree(pageText);

  return {
    type: 'dynamic',
    hasGoodToGo: true,
    payByMailPremium: 2.00,
    payByPlatePremium: 0.25,
    hovFree,
    operatingHours: {
      weekday: operatingHours,
      weekend: null, // Dynamic lanes are free on weekends
    },
    rateRange,
    estimates: {
      offPeak: 2.00,
      typical: 5.00,
      peak: 10.00,
    },
    note: `Rates change every 5 minutes based on traffic. Use WSDOT app for real-time rates.`,
  };
}

/**
 * Extract operating hours from page text
 */
function extractOperatingHours(text: string): { start: string; end: string } | null {
  // Look for patterns like:
  // "5 a.m. to 8 p.m."
  // "operate from 5 a.m. to 8 p.m."
  // "The express toll lanes operate from 5 a.m. to 8 p.m. Monday through Friday"

  const patterns = [
    /operate[s]?\s+(?:from\s+)?(\d{1,2})\s*(a\.m\.|p\.m\.)\s*to\s*(\d{1,2})\s*(a\.m\.|p\.m\.)/i,
    /(\d{1,2})\s*(a\.m\.|p\.m\.)\s*to\s*(\d{1,2})\s*(a\.m\.|p\.m\.)\s*(?:monday|mon)/i,
    /hours[:\s]+(\d{1,2})\s*(a\.m\.|p\.m\.)\s*(?:to|-)\s*(\d{1,2})\s*(a\.m\.|p\.m\.)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        start: convertTo24Hour(parseInt(match[1]), match[2]),
        end: convertTo24Hour(parseInt(match[3]), match[4]),
      };
    }
  }

  // Default fallback: 5 AM to 8 PM (common for WA express lanes)
  return { start: '05:00', end: '20:00' };
}

/**
 * Extract rate range from page text
 */
function extractRateRange(text: string): { min: number; max: number } {
  // Look for patterns like:
  // "$1 to $15"
  // "range from $1 to $15"
  // "$0.75 to $10"

  const patterns = [
    /\$(\d+(?:\.\d{2})?)\s*(?:to|-)\s*\$(\d+(?:\.\d{2})?)/,
    /range[s]?\s+(?:from\s+)?\$(\d+(?:\.\d{2})?)\s*(?:to|-)\s*\$(\d+(?:\.\d{2})?)/i,
    /between\s+\$(\d+(?:\.\d{2})?)\s*(?:and|to|-)\s*\$(\d+(?:\.\d{2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        min: parseFloat(match[1]),
        max: parseFloat(match[2]),
      };
    }
  }

  // Default fallback
  return { min: 1.00, max: 15.00 };
}

/**
 * Check if HOV/carpool can travel free
 */
function checkHovFree(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Look for indicators that HOV can travel free
  const hovFreeIndicators = [
    'carpool',
    'hov',
    'vanpool',
    'free for',
    '2+ passengers',
    '3+ passengers',
    'eligible for free',
  ];

  return hovFreeIndicators.some(indicator => lowerText.includes(indicator));
}

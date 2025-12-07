/**
 * Tacoma Narrows Bridge toll rate parser
 * Pricing type: Fixed (same rate all day, eastbound only)
 */

import * as cheerio from 'cheerio';
import { parseRate } from '../time-utils';

interface FixedPricing {
  type: 'fixed';
  hasGoodToGo: boolean;
  payByMailPremium: number;
  rate: number;
}

/**
 * Parse Tacoma Narrows Bridge toll rates from HTML
 * Note: This bridge uses fixed pricing (not time-of-day)
 * and only tolls eastbound (Gig Harbor to Tacoma)
 */
export function parseTacomaNarrows(html: string): FixedPricing {
  const $ = cheerio.load(html);

  // Find the rate table
  const tables = $('table').toArray();

  if (tables.length === 0) {
    throw new Error('Tacoma Narrows: No rate tables found');
  }

  // Look for 2-axle rate in first table
  let rate: number | null = null;

  $(tables[0]).find('tbody tr, tr').each((_, row) => {
    const cells = $(row).find('td');

    if (cells.length < 2) return;

    const vehicleType = cells.eq(0).text().toLowerCase();

    // Look for "two-axle" or "2-axle" or similar
    if (vehicleType.includes('two') || vehicleType.includes('2-axle') || vehicleType.includes('motorcycle')) {
      // Good To Go rate is typically in second column
      const rateText = cells.eq(1).text().trim();

      try {
        rate = parseRate(rateText);
        return false; // Break the loop
      } catch {
        // Try next cell if first rate parse fails
        if (cells.length > 2) {
          try {
            rate = parseRate(cells.eq(2).text().trim());
            return false;
          } catch {
            // Continue looking
          }
        }
      }
    }
  });

  if (rate === null) {
    // Fallback: look for any rate that looks like a passenger vehicle rate
    $(tables[0]).find('td').each((_, cell) => {
      const text = $(cell).text().trim();
      if (text.match(/^\$?\d+\.\d{2}$/) && rate === null) {
        try {
          const parsed = parseRate(text);
          // Reasonable 2-axle rate range
          if (parsed >= 4 && parsed <= 10) {
            rate = parsed;
            return false;
          }
        } catch {
          // Continue
        }
      }
    });
  }

  if (rate === null) {
    throw new Error('Tacoma Narrows: Could not find 2-axle rate');
  }

  return {
    type: 'fixed',
    hasGoodToGo: true,
    payByMailPremium: 2.00,
    rate,
  };
}

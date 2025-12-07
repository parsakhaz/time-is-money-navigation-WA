/**
 * SR 99 Tunnel toll rate parser
 * Pricing type: Time-of-day (weekday and weekend rates)
 */

import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { parseTimeRange, parseRate } from '../time-utils';

interface TimeSlot {
  start: string;
  end: string;
  rate: number;
}

interface TimeOfDayPricing {
  type: 'time-of-day';
  hasGoodToGo: boolean;
  payByMailPremium: number;
  weekday: TimeSlot[];
  weekend: TimeSlot[];
}

/**
 * Parse SR 99 Tunnel toll rates from HTML
 */
export function parseSR99(html: string): TimeOfDayPricing {
  const $ = cheerio.load(html);

  // Find tables - SR 99 has separate weekday and weekend tables
  const tables = $('table').toArray();

  if (tables.length < 2) {
    throw new Error('SR 99: Expected at least 2 rate tables');
  }

  // Parse weekday rates (first table for 2-axle vehicles)
  const weekdayRates = parseRateTable($, tables[0]);

  // Parse weekend rates (second table for 2-axle vehicles)
  // Weekend may have just one "all day" rate
  const weekendRates = parseRateTable($, tables[1]);

  return {
    type: 'time-of-day',
    hasGoodToGo: true,
    payByMailPremium: 2.00,
    weekday: weekdayRates,
    weekend: weekendRates,
  };
}

/**
 * Parse a rate table into TimeSlot array
 */
function parseRateTable($: cheerio.CheerioAPI, table: Element): TimeSlot[] {
  const rows: TimeSlot[] = [];

  $(table).find('tbody tr, tr').each((_, row) => {
    const cells = $(row).find('td');

    // Skip header rows (no td cells)
    if (cells.length < 2) return;

    try {
      // Cell 0: Time period (e.g., "11 p.m. to 6 a.m.")
      const timeText = cells.eq(0).text().trim();

      // Skip if this looks like a header
      if (timeText.toLowerCase().includes('time') || timeText.toLowerCase().includes('period')) {
        return;
      }

      // Handle "All day" weekend rates
      if (timeText.toLowerCase().includes('all day')) {
        const rateText = cells.eq(1).text().trim();
        const rate = parseRate(rateText);

        rows.push({
          start: '00:00',
          end: '24:00',
          rate,
        });
        return;
      }

      const { start, end } = parseTimeRange(timeText);

      // Cell 1: Good To Go rate (e.g., "$1.25")
      const rateText = cells.eq(1).text().trim();
      const rate = parseRate(rateText);

      rows.push({ start, end, rate });
    } catch (error) {
      // Skip rows that can't be parsed (likely headers or footnotes)
      console.warn(`SR 99: Skipping row - ${(error as Error).message}`);
    }
  });

  if (rows.length === 0) {
    throw new Error('SR 99: No rate rows found in table');
  }

  return rows;
}

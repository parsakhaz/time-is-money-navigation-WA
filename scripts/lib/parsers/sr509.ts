/**
 * SR 509 Expressway toll rate parser
 * Pricing type: Time-of-day with direction-specific rates
 */

import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { parseTimeRange, parseRate } from '../time-utils';

interface TimeSlot {
  start: string;
  end: string;
  rate: number;
  direction?: 'northbound' | 'southbound' | 'both';
}

interface TimeOfDayPricing {
  type: 'time-of-day';
  hasGoodToGo: boolean;
  payByMailPremium: number;
  weekday: TimeSlot[];
  weekend: TimeSlot[];
}

/**
 * Parse SR 509 Expressway toll rates from HTML
 * Note: This facility has direction-specific rates during peak hours
 */
export function parseSR509(html: string): TimeOfDayPricing {
  const $ = cheerio.load(html);

  // Find tables
  const tables = $('table').toArray();

  // SR 509 may have separate tables for each direction
  // or combined tables with direction columns
  const weekdayRates: TimeSlot[] = [];
  const weekendRates: TimeSlot[] = [];

  // Look for direction-specific tables or sections
  const northboundRates = parseDirectionTable($, tables, 'northbound');
  const southboundRates = parseDirectionTable($, tables, 'southbound');

  if (northboundRates.length > 0 && southboundRates.length > 0) {
    // Merge direction-specific rates
    weekdayRates.push(...northboundRates);
    weekdayRates.push(...southboundRates);
  } else {
    // Fallback: parse as generic time-of-day with assumed directions
    const genericRates = parseGenericTable($, tables[0]);
    weekdayRates.push(...genericRates);
  }

  // Weekend rates (typically same for both directions)
  if (tables.length > 1) {
    const weekendTable = findWeekendTable($, tables);
    if (weekendTable) {
      const rates = parseGenericTable($, weekendTable);
      weekendRates.push(...rates);
    }
  }

  // If no weekend rates found, use flat rate
  if (weekendRates.length === 0) {
    weekendRates.push({
      start: '00:00',
      end: '24:00',
      rate: 1.20, // Default weekend rate for SR 509
    });
  }

  return {
    type: 'time-of-day',
    hasGoodToGo: true,
    payByMailPremium: 2.00,
    weekday: weekdayRates,
    weekend: weekendRates,
  };
}

/**
 * Parse rates for a specific direction
 */
function parseDirectionTable(
  $: cheerio.CheerioAPI,
  tables: Element[],
  direction: 'northbound' | 'southbound'
): TimeSlot[] {
  const rates: TimeSlot[] = [];

  // Look for a heading or table that mentions the direction
  for (const table of tables) {
    const tableText = $(table).text().toLowerCase();
    const prevHeading = $(table).prev('h2, h3, h4').text().toLowerCase();

    if (tableText.includes(direction) || prevHeading.includes(direction)) {
      $(table).find('tbody tr, tr').each((_, row) => {
        const cells = $(row).find('td');

        if (cells.length < 2) return;

        try {
          const timeText = cells.eq(0).text().trim();

          if (timeText.toLowerCase().includes('time') || timeText.toLowerCase().includes('period')) {
            return;
          }

          const { start, end } = parseTimeRange(timeText);
          const rateText = cells.eq(1).text().trim();
          const rate = parseRate(rateText);

          rates.push({ start, end, rate, direction });
        } catch {
          // Skip unparseable rows
        }
      });

      if (rates.length > 0) break;
    }
  }

  return rates;
}

/**
 * Parse generic rate table without direction specifics
 */
function parseGenericTable($: cheerio.CheerioAPI, table: Element): TimeSlot[] {
  const rates: TimeSlot[] = [];

  $(table).find('tbody tr, tr').each((_, row) => {
    const cells = $(row).find('td');

    if (cells.length < 2) return;

    try {
      const timeText = cells.eq(0).text().trim();

      if (timeText.toLowerCase().includes('time') || timeText.toLowerCase().includes('period')) {
        return;
      }

      // Handle "All day" rates
      if (timeText.toLowerCase().includes('all day')) {
        const rateText = cells.eq(1).text().trim();
        const rate = parseRate(rateText);

        rates.push({
          start: '00:00',
          end: '24:00',
          rate,
          direction: 'both',
        });
        return;
      }

      const { start, end } = parseTimeRange(timeText);
      const rateText = cells.eq(1).text().trim();
      const rate = parseRate(rateText);

      rates.push({ start, end, rate, direction: 'both' });
    } catch {
      // Skip unparseable rows
    }
  });

  return rates;
}

/**
 * Find the weekend rate table
 */
function findWeekendTable($: cheerio.CheerioAPI, tables: Element[]): Element | null {
  for (const table of tables) {
    const prevHeading = $(table).prev('h2, h3, h4, p').text().toLowerCase();
    const caption = $(table).find('caption').text().toLowerCase();

    if (prevHeading.includes('weekend') || prevHeading.includes('holiday') ||
        caption.includes('weekend') || caption.includes('holiday')) {
      return table;
    }
  }

  return null;
}

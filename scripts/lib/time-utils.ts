/**
 * Time parsing utilities for WSDOT toll rate scraping
 */

/**
 * Convert 12-hour time format to 24-hour format
 * @param hour - Hour value (1-12)
 * @param period - "a.m." or "p.m."
 * @returns Time string in "HH:00" format
 */
export function convertTo24Hour(hour: number, period: string): string {
  let h = hour;
  const isPM = period.toLowerCase().includes('p.m.');
  const isAM = period.toLowerCase().includes('a.m.');

  if (isPM && hour !== 12) {
    h += 12;
  } else if (isAM && hour === 12) {
    h = 0;
  }

  return h.toString().padStart(2, '0') + ':00';
}

/**
 * Parse time range text from WSDOT tables
 * @param text - Time range text (e.g., "12 a.m. to 5 a.m.", "6 a.m. to 7 a.m.")
 * @returns Object with start and end times in 24-hour format
 */
export function parseTimeRange(text: string): { start: string; end: string } {
  // Handle various formats:
  // "12 a.m. to 5 a.m."
  // "6 a.m. to 7 a.m."
  // "11 p.m. to midnight" (edge case)
  // "midnight to 5 a.m." (edge case)

  const normalizedText = text.toLowerCase().trim();

  // Handle midnight special cases
  if (normalizedText.includes('midnight')) {
    if (normalizedText.startsWith('midnight')) {
      // "midnight to X a.m."
      const match = normalizedText.match(/midnight\s*to\s*(\d+)\s*(a\.m\.|p\.m\.)/i);
      if (match) {
        return {
          start: '00:00',
          end: convertTo24Hour(parseInt(match[1]), match[2]),
        };
      }
    } else {
      // "X p.m. to midnight"
      const match = normalizedText.match(/(\d+)\s*(a\.m\.|p\.m\.)\s*to\s*midnight/i);
      if (match) {
        return {
          start: convertTo24Hour(parseInt(match[1]), match[2]),
          end: '24:00',
        };
      }
    }
  }

  // Standard format: "X a.m./p.m. to Y a.m./p.m."
  const match = text.match(/(\d+)\s*(a\.m\.|p\.m\.)\s*to\s*(\d+)\s*(a\.m\.|p\.m\.)/i);

  if (!match) {
    throw new Error(`Cannot parse time range: ${text}`);
  }

  const [, startHour, startPeriod, endHour, endPeriod] = match;

  return {
    start: convertTo24Hour(parseInt(startHour), startPeriod),
    end: convertTo24Hour(parseInt(endHour), endPeriod),
  };
}

/**
 * Parse a rate string to a number
 * @param rateText - Rate text (e.g., "$1.35", "1.35", "$2.00")
 * @returns Rate as a number
 */
export function parseRate(rateText: string): number {
  const cleaned = rateText.replace(/[$,]/g, '').trim();
  const rate = parseFloat(cleaned);

  if (isNaN(rate)) {
    throw new Error(`Cannot parse rate: ${rateText}`);
  }

  return rate;
}

/**
 * HTTP fetcher with retry logic for scraping WSDOT toll pages
 */

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Fetch a URL with automatic retry on failure
 */
export async function fetchWithRetry(url: string): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TollRateScraper/1.0 (Educational Project)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt} failed for ${url}: ${lastError.message}`);

      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS * attempt); // Exponential backoff
      }
    }
  }

  throw new Error(`Failed to fetch ${url} after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

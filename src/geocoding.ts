import { fetchJson, NetworkError, ParseError } from "./http.js";
import { MemoryCache } from "./cache.js";
import { API_URLS, MAX_GEO_RESULTS } from "./constants.js";
import type { GeocodingResponse, GeoResult, FetchOptions } from "./types.js";

const geoCache = new MemoryCache<GeoResult[]>(30 * 60 * 1_000); // 30-minute TTL for geocoding

/**
 * Geocode a city name to one or more candidate locations.
 * Uses Open-Meteo's free geocoding API — no API key required.
 *
 * @throws {NetworkError} on connectivity problems
 * @throws {ParseError} on malformed API response
 * @throws {Error} when no results are found
 */
export async function geocodeCity(
  cityName: string,
  language = "en",
  options: FetchOptions = {},
): Promise<GeoResult[]> {
  const cacheKey = `geo:${cityName.toLowerCase().trim()}:${language}`;
  const cached = geoCache.get(cacheKey);
  if (cached) return cached;

  const raw = await fetchJson<GeocodingResponse>(
    API_URLS.GEOCODING,
    {
      name: cityName.trim(),
      count: MAX_GEO_RESULTS,
      language,
      format: "json",
    },
    options,
  );

  if (!raw || typeof raw !== "object") {
    throw new ParseError("Geocoding API returned unexpected format");
  }

  if (!raw.results || raw.results.length === 0) {
    throw new Error(
      `No location found for "${cityName}". ` +
      "Please check the spelling or try a nearby major city.",
    );
  }

  // Validate each result has required fields
  const results: GeoResult[] = raw.results.filter(
    (r): r is GeoResult =>
      typeof r.latitude === "number" &&
      typeof r.longitude === "number" &&
      typeof r.name === "string",
  );

  if (results.length === 0) {
    throw new ParseError("Geocoding results are missing required coordinate fields");
  }

  geoCache.set(cacheKey, results);
  return results;
}

/**
 * Format a GeoResult into a human-readable location label.
 * e.g. "Tokyo, Tokyo, Japan"
 */
export function formatLocationLabel(geo: GeoResult): string {
  const parts: string[] = [geo.name];
  if (geo.admin1 && geo.admin1 !== geo.name) parts.push(geo.admin1);
  parts.push(geo.country);
  return parts.join(", ");
}

/**
 * Clear the geocoding cache (useful for testing).
 */
export function clearGeoCache(): void {
  geoCache.clear();
}

export { NetworkError };

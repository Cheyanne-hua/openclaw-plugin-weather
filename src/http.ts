import { REQUEST_TIMEOUT_MS } from "./constants.js";
import type { FetchOptions } from "./types.js";

/** Typed HTTP error with status code */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly url: string,
  ) {
    super(`HTTP ${status} ${statusText} — ${url}`);
    this.name = "HttpError";
  }
}

/** Network/timeout error */
export class NetworkError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "NetworkError";
  }
}

/** Parse error (bad JSON, missing fields, …) */
export class ParseError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "ParseError";
  }
}

/**
 * Fetch JSON from a URL with timeout and abort support.
 * Throws HttpError, NetworkError, or ParseError on failure.
 */
export async function fetchJson<T>(
  url: string,
  params: Record<string, string | number | boolean>,
  options: FetchOptions = {},
): Promise<T> {
  const { signal, timeoutMs = REQUEST_TIMEOUT_MS } = options;

  // Build URL with query parameters
  const fullUrl = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    fullUrl.searchParams.set(key, String(value));
  }

  // Compose abort signals: caller's signal + our timeout signal
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  const composedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const response = await fetch(fullUrl.toString(), {
      signal: composedSignal,
      headers: {
        Accept: "application/json",
        "User-Agent": "openclaw-plugin-weather/1.0 (https://github.com/your-org/openclaw-plugin-weather)",
      },
    });

    if (!response.ok) {
      throw new HttpError(response.status, response.statusText, fullUrl.toString());
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch (err) {
      throw new ParseError("Failed to parse JSON response", err);
    }

    return data as T;
  } catch (err) {
    if (err instanceof HttpError || err instanceof ParseError) {
      throw err;
    }

    if (err instanceof Error && err.name === "AbortError") {
      if (signal?.aborted) {
        throw new NetworkError("Request was cancelled by caller");
      }
      throw new NetworkError(`Request timed out after ${timeoutMs}ms`);
    }

    throw new NetworkError(
      `Network request failed: ${err instanceof Error ? err.message : String(err)}`,
      err,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Round a number to a given number of decimal places.
 */
export function round(value: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/** Convert Celsius to Fahrenheit */
export function celsiusToFahrenheit(c: number): number {
  return round(c * 9 / 5 + 32);
}

/** Convert m/s to km/h */
export function msToKmh(ms: number): number {
  return round(ms * 3.6);
}

/**
 * WMO Weather Interpretation Codes (WW)
 * https://open-meteo.com/en/docs#weathervariables
 */
export const WMO_CODES: Record<number, { description: string; emoji: string }> = {
  0:  { description: "Clear sky",                        emoji: "☀️" },
  1:  { description: "Mainly clear",                     emoji: "🌤️" },
  2:  { description: "Partly cloudy",                    emoji: "⛅" },
  3:  { description: "Overcast",                         emoji: "☁️" },
  45: { description: "Fog",                              emoji: "🌫️" },
  48: { description: "Depositing rime fog",              emoji: "🌫️" },
  51: { description: "Light drizzle",                    emoji: "🌦️" },
  53: { description: "Moderate drizzle",                 emoji: "🌦️" },
  55: { description: "Dense drizzle",                    emoji: "🌧️" },
  56: { description: "Light freezing drizzle",           emoji: "🌨️" },
  57: { description: "Heavy freezing drizzle",           emoji: "🌨️" },
  61: { description: "Slight rain",                      emoji: "🌧️" },
  63: { description: "Moderate rain",                    emoji: "🌧️" },
  65: { description: "Heavy rain",                       emoji: "🌧️" },
  66: { description: "Light freezing rain",              emoji: "🌨️" },
  67: { description: "Heavy freezing rain",              emoji: "🌨️" },
  71: { description: "Slight snow",                      emoji: "🌨️" },
  73: { description: "Moderate snow",                    emoji: "❄️" },
  75: { description: "Heavy snow",                       emoji: "❄️" },
  77: { description: "Snow grains",                      emoji: "🌨️" },
  80: { description: "Slight rain showers",              emoji: "🌦️" },
  81: { description: "Moderate rain showers",            emoji: "🌧️" },
  82: { description: "Violent rain showers",             emoji: "⛈️" },
  85: { description: "Slight snow showers",              emoji: "🌨️" },
  86: { description: "Heavy snow showers",               emoji: "❄️" },
  95: { description: "Thunderstorm",                     emoji: "⛈️" },
  96: { description: "Thunderstorm with slight hail",    emoji: "⛈️" },
  99: { description: "Thunderstorm with heavy hail",     emoji: "⛈️" },
};

/** Wind direction degrees to compass bearing */
export function windDirectionToCompass(degrees: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(degrees / 22.5) % 16;
  return dirs[index] ?? "N";
}

/** Resolve WMO code to human-readable info, with fallback */
export function resolveWeatherCode(code: number): { description: string; emoji: string } {
  return WMO_CODES[code] ?? { description: `Weather code ${code}`, emoji: "🌡️" };
}

/** API base URLs */
export const API_URLS = {
  GEOCODING: "https://geocoding-api.open-meteo.com/v1/search",
  FORECAST:  "https://api.open-meteo.com/v1/forecast",
} as const;

/** Default request timeout in milliseconds */
export const REQUEST_TIMEOUT_MS = 10_000;

/** Default cache TTL in milliseconds (5 minutes) */
export const CACHE_TTL_MS = 5 * 60 * 1_000;

/** Maximum number of geocoding results to keep */
export const MAX_GEO_RESULTS = 5;

/** Beaufort scale labels for wind speed (m/s) */
export function windSpeedBeaufort(mps: number): string {
  if (mps < 0.3)  return "Calm";
  if (mps < 1.6)  return "Light air";
  if (mps < 3.4)  return "Light breeze";
  if (mps < 5.5)  return "Gentle breeze";
  if (mps < 8.0)  return "Moderate breeze";
  if (mps < 10.8) return "Fresh breeze";
  if (mps < 13.9) return "Strong breeze";
  if (mps < 17.2) return "Near gale";
  if (mps < 20.8) return "Gale";
  if (mps < 24.5) return "Strong gale";
  if (mps < 28.5) return "Storm";
  if (mps < 32.7) return "Violent storm";
  return "Hurricane";
}

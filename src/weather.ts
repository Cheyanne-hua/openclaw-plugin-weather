import { fetchJson, celsiusToFahrenheit, msToKmh, round } from "./http.js";
import { MemoryCache } from "./cache.js";
import { API_URLS, CACHE_TTL_MS, resolveWeatherCode, windDirectionToCompass, windSpeedBeaufort } from "./constants.js";
import { geocodeCity, formatLocationLabel } from "./geocoding.js";
import type {
  OpenMeteoForecastResponse,
  CurrentWeather,
  WeatherForecast,
  ForecastDay,
  GeoResult,
  FetchOptions,
  WeatherPluginConfig,
} from "./types.js";

const weatherCache = new MemoryCache<CurrentWeather>(CACHE_TTL_MS);
const forecastCache = new MemoryCache<WeatherForecast>(CACHE_TTL_MS);

// ─── Raw fetch ────────────────────────────────────────────────────────────────

async function fetchForecast(
  geo: GeoResult,
  options: FetchOptions,
): Promise<OpenMeteoForecastResponse> {
  return fetchJson<OpenMeteoForecastResponse>(
    API_URLS.FORECAST,
    {
      latitude: geo.latitude,
      longitude: geo.longitude,
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "precipitation",
        "weather_code",
        "wind_speed_10m",
        "wind_direction_10m",
        "surface_pressure",
        "visibility",
        "uv_index",
        "is_day",
      ].join(","),
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "precipitation_probability_max",
        "wind_speed_10m_max",
        "sunrise",
        "sunset",
      ].join(","),
      wind_speed_unit: "ms",
      timezone: "auto",
      forecast_days: 7,
    },
    options,
  );
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

function parseCurrentWeather(
  raw: OpenMeteoForecastResponse,
  geo: GeoResult,
): CurrentWeather {
  const c = raw.current;
  if (!c) throw new Error("API response missing 'current' block");

  const location = formatLocationLabel(geo);
  const { description, emoji } = resolveWeatherCode(c.weather_code);
  const windKmh = msToKmh(c.wind_speed_10m);
  const beaufort = windSpeedBeaufort(c.wind_speed_10m);
  const compassDir = windDirectionToCompass(c.wind_direction_10m);

  const tempC = round(c.temperature_2m);
  const feelsC = round(c.apparent_temperature);

  const isDay = c.is_day === 1;

  const summary =
    `${emoji} ${description} in ${location}. ` +
    `Temperature: ${tempC}°C (feels like ${feelsC}°C). ` +
    `Humidity: ${c.relative_humidity_2m}%. ` +
    `Wind: ${beaufort} (${windKmh} km/h ${compassDir}). ` +
    `UV index: ${round(c.uv_index, 0)}. ` +
    (c.precipitation > 0 ? `Precipitation: ${c.precipitation} mm. ` : "") +
    `${isDay ? "Daytime" : "Nighttime"}.`;

  return {
    location,
    country: geo.country,
    latitude: round(raw.latitude, 4),
    longitude: round(raw.longitude, 4),
    timezone: raw.timezone,
    time: c.time,
    temperature_c: tempC,
    temperature_f: celsiusToFahrenheit(c.temperature_2m),
    feels_like_c: feelsC,
    feels_like_f: celsiusToFahrenheit(c.apparent_temperature),
    humidity_pct: c.relative_humidity_2m,
    precipitation_mm: c.precipitation,
    weather_description: description,
    weather_emoji: emoji,
    wind_speed_kmh: windKmh,
    wind_direction: compassDir,
    pressure_hpa: round(c.surface_pressure),
    visibility_km: round(c.visibility / 1000),
    uv_index: round(c.uv_index, 1),
    is_day: isDay,
    beaufort_description: beaufort,
    summary,
  };
}

function parseForecast(
  raw: OpenMeteoForecastResponse,
  geo: GeoResult,
): WeatherForecast {
  const d = raw.daily;
  if (!d) throw new Error("API response missing 'daily' block");

  const location = formatLocationLabel(geo);

  const days: ForecastDay[] = d.time.map((date, i) => {
    const { description, emoji } = resolveWeatherCode(d.weather_code[i] ?? 0);
    const maxC = round(d.temperature_2m_max[i] ?? 0);
    const minC = round(d.temperature_2m_min[i] ?? 0);

    return {
      date,
      weather_description: description,
      weather_emoji: emoji,
      temp_max_c: maxC,
      temp_max_f: celsiusToFahrenheit(maxC),
      temp_min_c: minC,
      temp_min_f: celsiusToFahrenheit(minC),
      precipitation_mm: round(d.precipitation_sum[i] ?? 0),
      precipitation_probability_pct: d.precipitation_probability_max[i] ?? 0,
      wind_speed_max_kmh: msToKmh(d.wind_speed_10m_max[i] ?? 0),
      sunrise: d.sunrise[i] ?? "",
      sunset: d.sunset[i] ?? "",
    };
  });

  const today = days[0];
  const summary = today
    ? `7-day forecast for ${location}. ` +
      `Today: ${today.weather_emoji} ${today.weather_description}, ` +
      `${today.temp_min_c}–${today.temp_max_c}°C. ` +
      `Rain chance: ${today.precipitation_probability_pct}%.`
    : `Forecast data for ${location}.`;

  return {
    location,
    country: geo.country,
    latitude: round(raw.latitude, 4),
    longitude: round(raw.longitude, 4),
    timezone: raw.timezone,
    days,
    summary,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch current weather for a city name.
 */
export async function getCurrentWeatherByCity(
  cityName: string,
  config: WeatherPluginConfig = {},
  options: FetchOptions = {},
): Promise<CurrentWeather> {
  const language = config.language ?? "en";
  const ttlMs = (config.cache_ttl_seconds ?? 300) * 1000;

  const cacheKey = `current:${cityName.toLowerCase().trim()}`;
  const cached = weatherCache.get(cacheKey);
  if (cached) return cached;

  const [geo] = await geocodeCity(cityName, language, options);
  if (!geo) throw new Error(`Could not resolve coordinates for "${cityName}"`);

  const raw = await fetchForecast(geo, options);
  const result = parseCurrentWeather(raw, geo);

  weatherCache.set(cacheKey, result, ttlMs);
  return result;
}

/**
 * Fetch current weather by explicit coordinates.
 */
export async function getCurrentWeatherByCoords(
  latitude: number,
  longitude: number,
  locationLabel: string,
  config: WeatherPluginConfig = {},
  options: FetchOptions = {},
): Promise<CurrentWeather> {
  const ttlMs = (config.cache_ttl_seconds ?? 300) * 1000;
  const cacheKey = `current:${latitude.toFixed(4)}:${longitude.toFixed(4)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached) return cached;

  const fakeGeo: GeoResult = {
    id: 0,
    name: locationLabel,
    latitude,
    longitude,
    country: "",
    country_code: "",
    timezone: "auto",
  };

  const raw = await fetchForecast(fakeGeo, options);
  const result = parseCurrentWeather(raw, {
    ...fakeGeo,
    // Use the resolved timezone from the response
    timezone: raw.timezone,
  });

  weatherCache.set(cacheKey, result, ttlMs);
  return result;
}

/**
 * Fetch 7-day forecast for a city name.
 */
export async function getForecastByCity(
  cityName: string,
  config: WeatherPluginConfig = {},
  options: FetchOptions = {},
): Promise<WeatherForecast> {
  const language = config.language ?? "en";
  const ttlMs = (config.cache_ttl_seconds ?? 300) * 1000;

  const cacheKey = `forecast:${cityName.toLowerCase().trim()}`;
  const cached = forecastCache.get(cacheKey);
  if (cached) return cached;

  const [geo] = await geocodeCity(cityName, language, options);
  if (!geo) throw new Error(`Could not resolve coordinates for "${cityName}"`);

  const raw = await fetchForecast(geo, options);
  const result = parseForecast(raw, geo);

  forecastCache.set(cacheKey, result, ttlMs);
  return result;
}

/**
 * Clear all weather caches (useful for testing or forced refresh).
 */
export function clearWeatherCache(): void {
  weatherCache.clear();
  forecastCache.clear();
}

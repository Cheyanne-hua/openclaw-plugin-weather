/** A geocoding result from Open-Meteo */
export interface GeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  admin1?: string; // state / province
  admin2?: string; // county / district
  timezone: string;
  population?: number;
}

export interface GeocodingResponse {
  results?: GeoResult[];
  generationtime_ms?: number;
}

/** Current weather block from Open-Meteo forecast */
export interface OpenMeteoCurrentWeather {
  time: string;
  interval: number;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  precipitation: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  surface_pressure: number;
  visibility: number;
  uv_index: number;
  is_day: 0 | 1;
}

/** Daily forecast block from Open-Meteo */
export interface OpenMeteoDailyForecast {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
  sunrise: string[];
  sunset: string[];
}

export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  generationtime_ms: number;
  current?: OpenMeteoCurrentWeather;
  daily?: OpenMeteoDailyForecast;
}

/** Parsed current weather returned by the plugin tool */
export interface CurrentWeather {
  location: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  time: string;
  temperature_c: number;
  temperature_f: number;
  feels_like_c: number;
  feels_like_f: number;
  humidity_pct: number;
  precipitation_mm: number;
  weather_description: string;
  weather_emoji: string;
  wind_speed_kmh: number;
  wind_direction: string;
  pressure_hpa: number;
  visibility_km: number;
  uv_index: number;
  is_day: boolean;
  beaufort_description: string;
  summary: string;
}

/** A single day in a forecast */
export interface ForecastDay {
  date: string;
  weather_description: string;
  weather_emoji: string;
  temp_max_c: number;
  temp_max_f: number;
  temp_min_c: number;
  temp_min_f: number;
  precipitation_mm: number;
  precipitation_probability_pct: number;
  wind_speed_max_kmh: number;
  sunrise: string;
  sunset: string;
}

/** Multi-day forecast returned by the plugin tool */
export interface WeatherForecast {
  location: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  days: ForecastDay[];
  summary: string;
}

/** Air quality info (optional enrichment) */
export interface AirQualityInfo {
  location: string;
  latitude: number;
  longitude: number;
  time: string;
  us_aqi?: number;
  pm2_5?: number;
  pm10?: number;
  aqi_description: string;
  summary: string;
}

/** Shared fetch options */
export interface FetchOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

/** Plugin configuration (all optional — no API key needed) */
export interface WeatherPluginConfig {
  units?: "metric" | "imperial";
  language?: string;
  cache_ttl_seconds?: number;
}

/** Simple in-memory cache entry */
export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

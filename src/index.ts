import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

import {
  getCurrentWeatherByCity,
  getCurrentWeatherByCoords,
  getForecastByCity,
  clearWeatherCache,
} from "./weather.js";
import { geocodeCity, formatLocationLabel } from "./geocoding.js";

// ─── Config Schema ────────────────────────────────────────────────────────────

const configSchema = Type.Object({
  units: Type.Optional(
    Type.Union([Type.Literal("metric"), Type.Literal("imperial")], {
      description: 'Temperature unit preference: "metric" (Celsius) or "imperial" (Fahrenheit). Default: metric.',
      default: "metric",
    }),
  ),
  language: Type.Optional(
    Type.String({
      description: "Language code for location names (e.g. en, zh, de). Default: en.",
      default: "en",
    }),
  ),
  cache_ttl_seconds: Type.Optional(
    Type.Number({
      description: "How long to cache weather results in seconds. Default: 300 (5 minutes).",
      default: 300,
      minimum: 30,
      maximum: 3600,
    }),
  ),
});

// ─── Plugin definition ────────────────────────────────────────────────────────

export default defineToolPlugin({
  id: "weather",
  name: "Weather",
  description:
    "Real-time weather and 7-day forecasts for any city or coordinates worldwide. " +
    "Powered by Open-Meteo — completely free, no API key required. " +
    "Data sources: ECMWF, NOAA, DWD, Météo-France and other national weather services.",

  configSchema,

  tools: (tool) => [
    // ── Tool 1: Current weather by city name ──────────────────────────────────
    tool({
      name: "weather_current",
      label: "Current Weather",
      description:
        "Get current real-time weather conditions for a city or location by name. " +
        "Returns temperature, humidity, wind, UV index, pressure, visibility, and weather description.",
      parameters: Type.Object({
        city: Type.String({
          description:
            "City or location name to look up. Examples: 'Tokyo', 'New York', 'London', 'Singapore', '北京'.",
          minLength: 1,
          maxLength: 200,
        }),
      }),
      async execute({ city }, config, context) {
        context.signal?.throwIfAborted();

        try {
          const result = await getCurrentWeatherByCity(city, config ?? {}, {
            signal: context.signal,
          });
          return result;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            error: true,
            city,
            message,
            hint: "Check spelling or try a nearby major city.",
          };
        }
      },
    }),

    // ── Tool 2: Current weather by coordinates ────────────────────────────────
    tool({
      name: "weather_current_coords",
      label: "Current Weather by Coordinates",
      description:
        "Get current weather for an exact latitude/longitude coordinate pair. " +
        "Useful when you already have coordinates (e.g. from a GPS device or map).",
      parameters: Type.Object({
        latitude: Type.Number({
          description: "Latitude in decimal degrees (e.g. 35.6762 for Tokyo).",
          minimum: -90,
          maximum: 90,
        }),
        longitude: Type.Number({
          description: "Longitude in decimal degrees (e.g. 139.6503 for Tokyo).",
          minimum: -180,
          maximum: 180,
        }),
        label: Type.Optional(
          Type.String({
            description: "Optional human-readable name for this location (e.g. 'My Home').",
            maxLength: 100,
          }),
        ),
      }),
      async execute({ latitude, longitude, label }, config, context) {
        context.signal?.throwIfAborted();

        try {
          const locationLabel = label ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          const result = await getCurrentWeatherByCoords(
            latitude,
            longitude,
            locationLabel,
            config ?? {},
            { signal: context.signal },
          );
          return result;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            error: true,
            latitude,
            longitude,
            message,
          };
        }
      },
    }),

    // ── Tool 3: 7-day forecast ────────────────────────────────────────────────
    tool({
      name: "weather_forecast",
      label: "7-Day Weather Forecast",
      description:
        "Get a 7-day weather forecast for any city. " +
        "Includes daily high/low temperatures, precipitation probability, wind speed, sunrise, and sunset.",
      parameters: Type.Object({
        city: Type.String({
          description:
            "City or location name. Examples: 'Paris', 'Sydney', 'Cairo'.",
          minLength: 1,
          maxLength: 200,
        }),
      }),
      async execute({ city }, config, context) {
        context.signal?.throwIfAborted();

        try {
          const result = await getForecastByCity(city, config ?? {}, {
            signal: context.signal,
          });
          return result;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            error: true,
            city,
            message,
            hint: "Check spelling or try a nearby major city.",
          };
        }
      },
    }),

    // ── Tool 4: Location search ───────────────────────────────────────────────
    tool({
      name: "weather_search_location",
      label: "Search Location",
      description:
        "Search for locations by name and return matching candidates with coordinates. " +
        "Useful when a city name is ambiguous (e.g. 'Springfield' exists in many countries).",
      parameters: Type.Object({
        query: Type.String({
          description: "Location name to search for.",
          minLength: 1,
          maxLength: 200,
        }),
      }),
      async execute({ query }, config, context) {
        context.signal?.throwIfAborted();

        try {
          const results = await geocodeCity(
            query,
            (config as { language?: string } | null)?.language ?? "en",
            { signal: context.signal },
          );
          return {
            query,
            count: results.length,
            locations: results.map((geo) => ({
              label: formatLocationLabel(geo),
              name: geo.name,
              country: geo.country,
              country_code: geo.country_code,
              admin1: geo.admin1,
              latitude: geo.latitude,
              longitude: geo.longitude,
              timezone: geo.timezone,
              population: geo.population,
            })),
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return { error: true, query, message };
        }
      },
    }),

    // ── Tool 5: Clear cache ───────────────────────────────────────────────────
    tool({
      name: "weather_clear_cache",
      label: "Clear Weather Cache",
      description:
        "Clear all cached weather data to force fresh API calls on the next query. " +
        "Use this if weather data appears stale or incorrect.",
      parameters: Type.Object({}),
      optional: true,
      execute: (_params, _config) => {
        clearWeatherCache();
        return { success: true, message: "Weather cache cleared." };
      },
    }),
  ],
});

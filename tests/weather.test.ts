/**
 * Weather service tests — mocks globalThis.fetch so no real HTTP calls are made.
 */

import { clearWeatherCache, getCurrentWeatherByCity, getForecastByCity } from "../src/weather.js";
import { clearGeoCache } from "../src/geocoding.js";

// ─── Mock helpers ──────────────────────────────────────────────────────────────

const mockGeoResponse = {
  results: [
    {
      id: 1850147,
      name: "Tokyo",
      latitude: 35.6895,
      longitude: 139.6917,
      country: "Japan",
      country_code: "JP",
      admin1: "Tokyo",
      timezone: "Asia/Tokyo",
      population: 8336599,
    },
  ],
};

const mockForecastResponse = {
  latitude: 35.6895,
  longitude: 139.6917,
  timezone: "Asia/Tokyo",
  timezone_abbreviation: "JST",
  generationtime_ms: 1.23,
  current: {
    time: "2026-06-02T10:00",
    interval: 900,
    temperature_2m: 25.3,
    relative_humidity_2m: 65,
    apparent_temperature: 27.1,
    precipitation: 0.0,
    weather_code: 1,
    wind_speed_10m: 3.5,
    wind_direction_10m: 180,
    surface_pressure: 1013.2,
    visibility: 10000,
    uv_index: 5.2,
    is_day: 1,
  },
  daily: {
    time: ["2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05", "2026-06-06", "2026-06-07", "2026-06-08"],
    weather_code:                 [1,    2,    61,   61,   80,   3,    1],
    temperature_2m_max:           [28.0, 27.5, 24.0, 23.5, 26.0, 29.0, 30.0],
    temperature_2m_min:           [20.0, 19.5, 18.0, 17.5, 19.0, 21.0, 22.0],
    precipitation_sum:            [0.0,  0.1,  5.2,  3.1,  0.5,  0.0,  0.0],
    precipitation_probability_max:[5,    10,   80,   70,   40,   10,   5],
    wind_speed_10m_max:           [4.0,  5.0,  8.0,  6.0,  5.0,  3.5,  3.0],
    sunrise: [
      "2026-06-02T04:25", "2026-06-03T04:25", "2026-06-04T04:24",
      "2026-06-05T04:24", "2026-06-06T04:24", "2026-06-07T04:23", "2026-06-08T04:23",
    ],
    sunset: [
      "2026-06-02T18:57", "2026-06-03T18:58", "2026-06-04T18:58",
      "2026-06-05T18:59", "2026-06-06T18:59", "2026-06-07T19:00", "2026-06-08T19:00",
    ],
  },
};

function makeMockFetch(...responses: object[]): jest.Mock {
  let callIndex = 0;
  return jest.fn(async (_url: string) => {
    const body = responses[callIndex % responses.length];
    callIndex++;
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => body,
    };
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  clearGeoCache();
  clearWeatherCache();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("getCurrentWeatherByCity", () => {
  it("returns structured current weather data for a city", async () => {
    globalThis.fetch = makeMockFetch(mockGeoResponse, mockForecastResponse) as unknown as typeof fetch;

    const result = await getCurrentWeatherByCity("Tokyo");

    expect(result.location).toContain("Tokyo");
    expect(result.country).toBe("Japan");
    expect(result.temperature_c).toBe(25.3);
    expect(result.temperature_f).toBeCloseTo(77.5, 0);
    expect(result.humidity_pct).toBe(65);
    expect(result.wind_speed_kmh).toBe(12.6);
    expect(result.wind_direction).toBe("S");
    expect(result.is_day).toBe(true);
    expect(result.weather_description).toBe("Mainly clear");
    expect(result.weather_emoji).toBe("🌤️");
    expect(result.summary).toContain("Tokyo");
    expect(result.summary).toContain("25.3°C");
  });

  it("caches results on second call", async () => {
    const mockFetch = makeMockFetch(mockGeoResponse, mockForecastResponse);
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    await getCurrentWeatherByCity("Tokyo");
    await getCurrentWeatherByCity("Tokyo");

    // Fetch should only be called twice total (once geo, once forecast), not 4 times
    expect(mockFetch.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it("returns error object when city not found", async () => {
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ results: [] }),
    })) as unknown as typeof fetch;

    const result = await getCurrentWeatherByCity("XxNotARealCityXx");
    expect((result as unknown as { error: boolean }).error).toBe(true);
  });

  it("returns error object on network failure", async () => {
    globalThis.fetch = jest.fn(async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;

    const result = await getCurrentWeatherByCity("Tokyo");
    expect((result as unknown as { error: boolean }).error).toBe(true);
    expect((result as unknown as { message: string }).message).toBeTruthy();
  });
});

describe("getForecastByCity", () => {
  it("returns 7 days of forecast data", async () => {
    globalThis.fetch = makeMockFetch(mockGeoResponse, mockForecastResponse) as unknown as typeof fetch;

    const result = await getForecastByCity("Tokyo");

    expect(result.location).toContain("Tokyo");
    expect(result.days).toHaveLength(7);

    const today = result.days[0]!;
    expect(today.date).toBe("2026-06-02");
    expect(today.temp_max_c).toBe(28);
    expect(today.temp_min_c).toBe(20);
    expect(today.precipitation_probability_pct).toBe(5);
    expect(today.weather_emoji).toBe("🌤️");
    expect(today.sunrise).toBe("2026-06-02T04:25");
  });

  it("summary contains location and today's conditions", async () => {
    globalThis.fetch = makeMockFetch(mockGeoResponse, mockForecastResponse) as unknown as typeof fetch;

    const result = await getForecastByCity("Tokyo");
    expect(result.summary).toContain("Tokyo");
    expect(result.summary).toContain("°C");
  });
});

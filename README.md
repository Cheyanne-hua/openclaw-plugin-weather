# @openclaw/plugin-weather

> Real-time weather & 7-day forecasts for OpenClaw — **completely free, no API key required.**

Powered by [Open-Meteo](https://open-meteo.com/) — an open-source weather API using data from ECMWF, NOAA, DWD, Météo-France, JMA, and other national weather services.

---

## Features

- **Real-time current weather** — temperature, humidity, wind, UV index, pressure, visibility
- **7-day forecast** — daily highs/lows, precipitation probability, sunrise/sunset
- **Location search** — disambiguate city names (e.g. multiple "Springfield"s)
- **Coordinate lookup** — query any lat/lon directly
- **Zero cost** — Open-Meteo is free for non-commercial use, no signup, no API key
- **Caching** — configurable TTL (default 5 minutes) to avoid redundant requests
- **Robust error handling** — graceful failures with descriptive messages
- **Fully typed** — TypeScript-native with strict mode

---

## Installation

```bash
openclaw plugins install clawhub:your-org/weather
openclaw gateway restart
```

Or from a local checkout:

```bash
openclaw plugins install ./openclaw-plugin-weather
openclaw gateway restart
```

---

## Configuration

All fields are **optional**. The plugin works out of the box with no configuration.

Add to your Gateway config under `plugins.entries.weather`:

```json
{
  "plugins": {
    "entries": {
      "weather": {
        "enabled": true,
        "config": {
          "units": "metric",
          "language": "en",
          "cache_ttl_seconds": 300
        }
      }
    }
  }
}
```

| Option | Type | Default | Description |
|---|---|---|---|
| `units` | `"metric"` \| `"imperial"` | `"metric"` | Temperature display preference |
| `language` | `string` | `"en"` | Language for place names (ISO 639-1 code) |
| `cache_ttl_seconds` | `number` | `300` | Cache lifetime (30–3600 seconds) |

---

## Tools

### `weather_current`

Get real-time weather by city name.

```
What's the weather in Tokyo?
Tell me the current temperature in Singapore.
Is it raining in London right now?
```

**Returns:** temperature (°C & °F), feels-like, humidity, precipitation, wind (speed, direction, Beaufort scale), pressure, visibility, UV index, day/night flag, and a human-readable summary.

---

### `weather_current_coords`

Get real-time weather by latitude/longitude.

```
Weather at 35.6895, 139.6917
```

**Parameters:**
- `latitude` (required): decimal degrees, −90 to 90
- `longitude` (required): decimal degrees, −180 to 180
- `label` (optional): friendly name for the location

---

### `weather_forecast`

7-day forecast by city name.

```
Give me the forecast for Paris this week.
Will it rain in Seoul on Friday?
What's the weekly forecast for New York?
```

**Returns:** 7 days of daily weather — high/low temperatures, precipitation sum and probability, max wind speed, sunrise, and sunset.

---

### `weather_search_location`

Search for and disambiguate location names.

```
Search for locations named Springfield.
Which Tokyo does the weather plugin mean?
```

**Returns:** up to 5 matching locations with coordinates, country, region, timezone, and population.

---

### `weather_clear_cache` *(optional — must be allowlisted)*

Force a fresh fetch by clearing all cached weather data.

```
Clear the weather cache.
```

---

## Data Sources

Open-Meteo aggregates forecasts from national weather services worldwide:

| Service | Coverage |
|---|---|
| ECMWF IFS | Global |
| NOAA GFS | Global |
| DWD ICON | Europe, Global |
| Météo-France AROME | France, Europe |
| JMA MSM | Japan |
| KMA UMKR | South Korea |
| BOM ACCESS | Australia |
| CMA GFS | China |

Historical data is available from 1940 via ERA5 reanalysis.

---

## Development

### Requirements

- Node.js ≥ 22
- pnpm or npm

### Setup

```bash
git clone https://github.com/your-org/openclaw-plugin-weather
cd openclaw-plugin-weather
npm install
```

### Build

```bash
npm run build          # compile TypeScript → dist/
npm run build:watch    # watch mode
```

### Test

```bash
npm test               # run all tests
npm run test:watch     # watch mode
npm run test:coverage  # with coverage report
```

### Lint & type-check

```bash
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
```

### Validate plugin manifest

```bash
npm run plugin:build   # build + regenerate manifest
npm run plugin:check   # CI check (fails if manifest is stale)
npm run plugin:validate
```

### Local install for testing

```bash
npm run build
openclaw plugins install ./
openclaw gateway restart
```

---

## Architecture

```
src/
├── index.ts        # Plugin entry — defineToolPlugin with all 5 tools
├── weather.ts      # Core weather service (fetch + parse + cache)
├── geocoding.ts    # City name → coordinates (Open-Meteo Geocoding API)
├── cache.ts        # MemoryCache<T> with TTL support
├── http.ts         # fetchJson with timeout, retry, typed errors
├── constants.ts    # WMO code table, unit conversions, Beaufort scale
└── types.ts        # All TypeScript interfaces

tests/
├── cache.test.ts
├── constants.test.ts
├── http.test.ts
└── weather.test.ts
```

---

## License

MIT. Weather data: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — attribution to Open-Meteo and the respective national weather services is required.

---

## Attribution

> Weather data provided by [Open-Meteo](https://open-meteo.com/) — CC BY 4.0.
> Original data from ECMWF, NOAA, DWD, Météo-France, JMA, KMA, BOM, CMA, and others.

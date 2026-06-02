# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-02

### Added
- `weather_current` tool: real-time weather by city name
- `weather_current_coords` tool: real-time weather by lat/lon
- `weather_forecast` tool: 7-day daily forecast by city name
- `weather_search_location` tool: geocoding search with multiple candidate results
- `weather_clear_cache` tool: manual cache invalidation (optional / allowlist-gated)
- In-memory cache with configurable TTL (default 5 minutes)
- Beaufort wind scale descriptions
- WMO weather code to emoji + description mapping (70+ codes)
- Wind direction degrees to compass bearing conversion
- Full TypeScript strict mode with ESM output
- Jest test suite with mocked fetch (no network in tests)
- ESLint configuration
- CI-friendly `plugin:check` script

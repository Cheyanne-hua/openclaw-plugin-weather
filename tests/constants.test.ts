import {
  resolveWeatherCode,
  windDirectionToCompass,
  windSpeedBeaufort,
} from "../src/constants.js";

describe("resolveWeatherCode", () => {
  it("resolves known WMO codes", () => {
    expect(resolveWeatherCode(0).description).toBe("Clear sky");
    expect(resolveWeatherCode(0).emoji).toBe("☀️");
  });

  it("resolves thunderstorm code", () => {
    expect(resolveWeatherCode(95).description).toBe("Thunderstorm");
    expect(resolveWeatherCode(95).emoji).toBe("⛈️");
  });

  it("returns fallback for unknown codes", () => {
    const result = resolveWeatherCode(999);
    expect(result.description).toContain("999");
    expect(result.emoji).toBe("🌡️");
  });
});

describe("windDirectionToCompass", () => {
  it("converts 0° to N", () => {
    expect(windDirectionToCompass(0)).toBe("N");
  });

  it("converts 90° to E", () => {
    expect(windDirectionToCompass(90)).toBe("E");
  });

  it("converts 180° to S", () => {
    expect(windDirectionToCompass(180)).toBe("S");
  });

  it("converts 270° to W", () => {
    expect(windDirectionToCompass(270)).toBe("W");
  });

  it("converts 45° to NE", () => {
    expect(windDirectionToCompass(45)).toBe("NE");
  });

  it("wraps 360° back to N", () => {
    expect(windDirectionToCompass(360)).toBe("N");
  });
});

describe("windSpeedBeaufort", () => {
  it("identifies calm wind", () => {
    expect(windSpeedBeaufort(0)).toBe("Calm");
    expect(windSpeedBeaufort(0.2)).toBe("Calm");
  });

  it("identifies light breeze", () => {
    expect(windSpeedBeaufort(2.0)).toBe("Light breeze");
  });

  it("identifies strong breeze", () => {
    expect(windSpeedBeaufort(12.0)).toBe("Strong breeze");
  });

  it("identifies hurricane winds", () => {
    expect(windSpeedBeaufort(35)).toBe("Hurricane");
  });
});

import { HttpError, NetworkError, ParseError, round, celsiusToFahrenheit, msToKmh } from "../src/http.js";

describe("round", () => {
  it("rounds to 1 decimal by default", () => {
    expect(round(3.14159)).toBe(3.1);
  });

  it("rounds to specified decimals", () => {
    expect(round(3.14159, 2)).toBe(3.14);
    expect(round(3.14159, 0)).toBe(3);
  });

  it("handles negative numbers", () => {
    expect(round(-3.76, 1)).toBe(-3.8);
  });
});

describe("celsiusToFahrenheit", () => {
  it("converts 0°C to 32°F", () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
  });

  it("converts 100°C to 212°F", () => {
    expect(celsiusToFahrenheit(100)).toBe(212);
  });

  it("converts -40°C to -40°F", () => {
    expect(celsiusToFahrenheit(-40)).toBe(-40);
  });

  it("converts 20°C to 68°F", () => {
    expect(celsiusToFahrenheit(20)).toBe(68);
  });
});

describe("msToKmh", () => {
  it("converts 0 m/s to 0 km/h", () => {
    expect(msToKmh(0)).toBe(0);
  });

  it("converts 10 m/s to 36 km/h", () => {
    expect(msToKmh(10)).toBe(36);
  });

  it("converts 1 m/s to 3.6 km/h", () => {
    expect(msToKmh(1)).toBe(3.6);
  });
});

describe("Custom error classes", () => {
  it("HttpError has correct properties", () => {
    const err = new HttpError(404, "Not Found", "https://example.com");
    expect(err.status).toBe(404);
    expect(err.statusText).toBe("Not Found");
    expect(err.url).toBe("https://example.com");
    expect(err.name).toBe("HttpError");
    expect(err).toBeInstanceOf(Error);
  });

  it("NetworkError has correct properties", () => {
    const cause = new Error("underlying");
    const err = new NetworkError("connection failed", cause);
    expect(err.cause).toBe(cause);
    expect(err.name).toBe("NetworkError");
    expect(err).toBeInstanceOf(Error);
  });

  it("ParseError has correct properties", () => {
    const err = new ParseError("invalid JSON");
    expect(err.name).toBe("ParseError");
    expect(err).toBeInstanceOf(Error);
  });
});

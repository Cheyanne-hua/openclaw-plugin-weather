import { MemoryCache } from "../src/cache.js";

describe("MemoryCache", () => {
  let cache: MemoryCache<string>;

  beforeEach(() => {
    cache = new MemoryCache<string>(1000); // 1 second TTL for tests
  });

  it("stores and retrieves values", () => {
    cache.set("key1", "value1");
    expect(cache.get("key1")).toBe("value1");
  });

  it("returns undefined for missing keys", () => {
    expect(cache.get("missing")).toBeUndefined();
  });

  it("expires entries after TTL", async () => {
    cache = new MemoryCache<string>(50); // 50ms TTL
    cache.set("key1", "value1");
    expect(cache.get("key1")).toBe("value1");

    await new Promise((r) => setTimeout(r, 60));
    expect(cache.get("key1")).toBeUndefined();
  });

  it("respects per-entry custom TTL", async () => {
    cache.set("short", "val", 50);
    cache.set("long", "val", 5000);

    await new Promise((r) => setTimeout(r, 60));
    expect(cache.get("short")).toBeUndefined();
    expect(cache.get("long")).toBe("val");
  });

  it("deletes entries", () => {
    cache.set("key1", "value1");
    cache.delete("key1");
    expect(cache.get("key1")).toBeUndefined();
  });

  it("clears all entries", () => {
    cache.set("k1", "v1");
    cache.set("k2", "v2");
    cache.clear();
    expect(cache.get("k1")).toBeUndefined();
    expect(cache.get("k2")).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it("purges expired entries and returns count", async () => {
    cache = new MemoryCache<string>(50);
    cache.set("exp1", "v1");
    cache.set("exp2", "v2");
    cache.set("live", "v3", 5000);

    await new Promise((r) => setTimeout(r, 60));

    const purged = cache.purgeExpired();
    expect(purged).toBe(2);
    expect(cache.size).toBe(1);
    expect(cache.get("live")).toBe("v3");
  });

  it("tracks size correctly", () => {
    expect(cache.size).toBe(0);
    cache.set("a", "1");
    expect(cache.size).toBe(1);
    cache.set("b", "2");
    expect(cache.size).toBe(2);
  });
});

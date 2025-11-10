import { describe, it, expect, beforeEach, vi } from "vitest";
import { BrowserCache } from "./index";

describe("BrowserCache", () => {
  let testCache: BrowserCache;
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
      key: vi.fn(),
      length: 0,
    } as any;

    testCache = new BrowserCache();
  });

  describe("Basic set and get", () => {
    it("should store and retrieve simple data", () => {
      const key = "test:key";
      const data = { name: "Lisinopril", dose: 10 };

      testCache.set(key, data);
      const retrieved = testCache.get(key);

      expect(retrieved).toEqual(data);
    });

    it("should return null for non-existent keys", () => {
      expect(testCache.get("non:existent")).toBeNull();
    });

    it("should handle nested objects", () => {
      const key = "complex:data";
      const data = { nested: { deep: { value: "test" } } };

      testCache.set(key, data);
      expect(testCache.get(key)).toEqual(data);
    });

    it("should handle arrays", () => {
      const key = "array:data";
      const data = [{ id: 1, name: "Item 1" }];

      testCache.set(key, data);
      expect(testCache.get(key)).toEqual(data);
    });

    it("should handle multiple entries independently", () => {
      testCache.set("key1", { data: 1 });
      testCache.set("key2", { data: 2 });

      expect(testCache.get("key1")).toEqual({ data: 1 });
      expect(testCache.get("key2")).toEqual({ data: 2 });
    });
  });

  describe("Cache key prefixing", () => {
    it("should prefix keys with dosematch_cache_", () => {
      const key = "test:key";
      testCache.set(key, { value: "test" });

      const calls = (localStorage.setItem as any).mock.calls;
      const storedKey = calls[0][0];

      expect(storedKey).toContain("dosematch_cache_");
      expect(storedKey).toContain(key);
    });
  });

  describe("TTL and expiration", () => {
    it("should store data with custom TTL", () => {
      const key = "ttl:test";
      const data = { value: "test" };

      testCache.set(key, data, 60000);
      expect(testCache.get(key)).toEqual(data);
    });

    it("should return null for expired data", () => {
      const key = "expired:test";
      const data = { value: "test" };

      // Set with 0ms TTL (already expired)
      testCache.set(key, data, 0);
      expect(testCache.get(key)).toBeNull();
    });

    it("should use 24h default TTL", () => {
      const key = "default:ttl";
      const data = { value: "test" };

      // Should use default TTL
      testCache.set(key, data);
      expect(testCache.get(key)).toEqual(data);
    });
  });

  describe("Error handling", () => {
    it("should handle localStorage write errors gracefully", () => {
      (localStorage.setItem as any).mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      // Should not throw
      expect(() => {
        testCache.set("error:test", { data: "test" });
      }).not.toThrow();
    });

    it("should handle corrupted JSON gracefully", () => {
      mockLocalStorage["dosematch_cache_bad:data"] = '{"invalid json';

      expect(() => {
        testCache.get("bad:data");
      }).not.toThrow();

      expect(testCache.get("bad:data")).toBeNull();
    });
  });

  describe("clear", () => {
    it("should clear all cache entries", () => {
      testCache.set("key1", { data: 1 });
      testCache.set("key2", { data: 2 });

      testCache.clear();

      expect(testCache.get("key1")).toBeNull();
      expect(testCache.get("key2")).toBeNull();
    });
  });

  describe("stats", () => {
    it("should return cache statistics", () => {
      testCache.set("key1", { data: 1 });
      testCache.set("key2", { data: 2 });

      const stats = testCache.stats();

      expect(stats).toBeDefined();
      expect(stats.entries).toBe(2);
    });
  });

  describe("Real-world pharmacy scenarios", () => {
    it("should cache RxNorm drug lookup", () => {
      const key = "RXNORM:lisinopril-10mg";
      const data = {
        rxcui: "12345",
        doseForm: "tablet",
      };

      testCache.set(key, data);
      expect(testCache.get(key)).toEqual(data);
    });

    it("should cache FDA NDC results", () => {
      const key = "FDA:12345";
      const data = [
        { ndc11: "12345000101", packageSize: 30, unit: "EA", status: "ACTIVE" },
      ];

      testCache.set(key, data);
      expect(testCache.get(key)).toEqual(data);
    });
  });
});


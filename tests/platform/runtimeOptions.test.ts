import { describe, expect, it } from "vitest";

import { parseRuntimeOptions } from "../../src/platform/runtimeOptions.ts";

describe("parseRuntimeOptions", () => {
  it("odczytuje jawny seed i zegar scenariusza", () => {
    expect(parseRuntimeOptions("?seed=123456&clock=9")).toEqual({
      seed: 123_456,
      shotClock: 9,
      testMode: false,
    });
  });

  it("wraca do bezpiecznych wartości dla błędnych parametrów", () => {
    expect(parseRuntimeOptions("?seed=-1&clock=0")).toEqual({
      seed: 42,
      shotClock: 14,
      testMode: false,
    });
  });

  it("aktywuje odczytowy most E2E wyłącznie dla jawnej wartości 1", () => {
    expect(parseRuntimeOptions("?e2e=1").testMode).toBe(true);
    expect(parseRuntimeOptions("?e2e=true").testMode).toBe(false);
  });
});

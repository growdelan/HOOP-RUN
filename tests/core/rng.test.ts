import { describe, expect, it } from "vitest";

import {
  normalizeSeed,
  xorshift32RandomSource,
} from "../../src/core/index.ts";

describe("xorshift32RandomSource", () => {
  it("zwraca tę samą sekwencję dla tego samego stanu", () => {
    const first = xorshift32RandomSource.next(123_456);
    const second = xorshift32RandomSource.next(123_456);

    expect(first).toEqual(second);
    expect(first.value).toBeGreaterThanOrEqual(0);
    expect(first.value).toBeLessThan(1);
  });

  it("normalizuje zero do stabilnego, niezerowego seeda", () => {
    expect(normalizeSeed(0)).not.toBe(0);
    expect(normalizeSeed(0)).toBe(normalizeSeed(0));
  });
});

export interface RuntimeOptions {
  readonly seed: number;
  readonly shotClock: number;
  readonly testMode: boolean;
}

const DEFAULT_SEED = 42;
const DEFAULT_SHOT_CLOCK = 14;

export function parseRuntimeOptions(search: string): RuntimeOptions {
  const parameters = new URLSearchParams(search);
  return {
    seed: parseInteger(parameters.get("seed"), DEFAULT_SEED, 1, 0xffff_ffff),
    shotClock: parseInteger(parameters.get("clock"), DEFAULT_SHOT_CLOCK, 1, 99),
    testMode: parameters.get("e2e") === "1",
  };
}

function parseInteger(
  rawValue: string | null,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (rawValue === null || !/^\d+$/.test(rawValue)) return fallback;
  const value = Number(rawValue);
  return Number.isSafeInteger(value) && value >= minimum && value <= maximum
    ? value
    : fallback;
}

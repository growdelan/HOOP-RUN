export interface RandomStep {
  readonly state: number;
  readonly value: number;
}

export interface RandomSource {
  next(state: number): RandomStep;
}

const NON_ZERO_FALLBACK_SEED = 0x6d2b79f5;

export function normalizeSeed(seed: number): number {
  const normalized = seed >>> 0;
  return normalized === 0 ? NON_ZERO_FALLBACK_SEED : normalized;
}

export const xorshift32RandomSource: RandomSource = {
  next(state) {
    let nextState = normalizeSeed(state);
    nextState ^= nextState << 13;
    nextState ^= nextState >>> 17;
    nextState ^= nextState << 5;
    nextState >>>= 0;

    return {
      state: nextState,
      value: nextState / 0x1_0000_0000,
    };
  },
};

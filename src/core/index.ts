export type * from "./model.ts";
export type * from "./defense.ts";
export {
  createDefensePossession,
  getLegalDefenseTargets,
  playDefenseCard,
  previewDefenseCardImpact,
  resolveOpponentShot,
} from "./defense.ts";
export type * from "./match.ts";
export {
  advanceMatch,
  completeMatchPossession,
  createMatch,
  isWinningScore,
  resetMatch,
} from "./match.ts";
export {
  createPossession,
  calculateShotQuality,
  playCard,
  resetPossession,
  resolveShot,
  startPossession,
} from "./possession.ts";
export {
  normalizeSeed,
  xorshift32RandomSource,
} from "./rng.ts";
export type { RandomSource, RandomStep } from "./rng.ts";
export { categorizeShotScore, clampShotScore } from "./shotQuality.ts";

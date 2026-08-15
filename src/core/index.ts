export type * from "./model.ts";
export type * from "./defense.ts";
export {
  createDefensePossession,
  getLegalDefenseTargets,
  playDefenseCard,
  previewDefenseCardImpact,
  resolveOpponentShot,
  selectOpponentDefenseIntent,
  selectOpponentPlan,
  selectWeightedOpponentIntent,
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
  previewOffenseCardImpact,
  resetPossession,
  resolveShot,
  startPossession,
} from "./possession.ts";
export type {
  OffenseCardImpact,
  OffenseCardPreviewStatus,
} from "./possession.ts";
export {
  normalizeSeed,
  xorshift32RandomSource,
} from "./rng.ts";
export type { RandomSource, RandomStep } from "./rng.ts";
export type * from "./run.ts";
export {
  createRun,
  FIRST_RUN_OPPONENT_ORDER,
  getRunRngState,
  reduceRun,
  resetRun,
} from "./run.ts";
export type * from "./runCheckpoint.ts";
export {
  createRunCheckpoint,
  decodeRunCheckpoint,
  encodeRunCheckpoint,
  restoreRunFromCheckpoint,
  RUN_CHECKPOINT_CONTENT_VERSION,
  RUN_CHECKPOINT_KIND,
  RUN_CHECKPOINT_VERSION,
} from "./runCheckpoint.ts";
export { categorizeShotScore, clampShotScore } from "./shotQuality.ts";

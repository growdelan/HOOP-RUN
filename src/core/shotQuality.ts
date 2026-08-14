import type {
  ShotQualityCategory,
  ShotQualityRules,
} from "./model.ts";

export function clampShotScore(score: number): number {
  return Math.max(5, Math.min(95, score));
}

export function categorizeShotScore(
  score: number,
  minimums: ShotQualityRules["categoryMinimums"],
): ShotQualityCategory {
  if (score < minimums.Contested) return "Bad";
  if (score < minimums.Decent) return "Contested";
  if (score < minimums.Open) return "Decent";
  if (score < minimums.Perfect) return "Open";
  return "Perfect";
}

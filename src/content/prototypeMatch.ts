import type { MatchSetup } from "../core/index.ts";

export const PROTOTYPE_OFFENSE_DECK = [
  "pass",
  "pass",
  "screen",
  "screen",
  "drive",
  "drive",
  "kickOut",
  "kickOut",
  "shot",
  "shot",
] as const;

export const PROTOTYPE_DEFENSE_DECK = [
  "pressure",
  "pressure",
  "switch",
  "switch",
  "goUnder",
  "goUnder",
  "helpDefense",
  "helpDefense",
  "doubleTeam",
  "doubleTeam",
] as const;

export const PROTOTYPE_MATCH_SETUP = {
  offenseDeck: PROTOTYPE_OFFENSE_DECK,
  defenseDeck: PROTOTYPE_DEFENSE_DECK,
  handSize: 5,
  requiredOffenseCards: ["shot"],
  requiredDefenseCards: ["pressure", "pressure", "doubleTeam"],
} as const satisfies MatchSetup;

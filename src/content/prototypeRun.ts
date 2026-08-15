import { FIRST_RUN_OPPONENT_ORDER } from "../core/index.ts";
import type { RunSetup } from "../core/index.ts";
import {
  PROTOTYPE_DEFENSE_DECK,
  PROTOTYPE_OFFENSE_DECK,
} from "./prototypeMatch.ts";

export const RUN_OPPONENT_ORDER = FIRST_RUN_OPPONENT_ORDER;

export const PROTOTYPE_REWARD_CATALOG = [
  { cardId: "backdoorCut", role: "offense" },
  { cardId: "stepBack", role: "offense" },
  { cardId: "hedge", role: "defense" },
  { cardId: "closeOut", role: "defense" },
] as const;

export const PROTOTYPE_RUN_SETUP = {
  opponentIds: RUN_OPPONENT_ORDER,
  offenseDeck: PROTOTYPE_OFFENSE_DECK,
  defenseDeck: PROTOTYPE_DEFENSE_DECK,
  rewardCatalog: PROTOTYPE_REWARD_CATALOG,
  match: {
    handSize: 5,
    requiredOffenseCards: ["shot"],
    requiredDefenseCards: ["pressure", "pressure", "doubleTeam"],
  },
} as const satisfies RunSetup;

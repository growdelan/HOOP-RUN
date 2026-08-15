import type {
  CardCatalog,
  PossessionSetup,
  PossessionState,
} from "../core/index.ts";
import { resetPossession } from "../core/index.ts";

export const PROTOTYPE_CARDS = {
  pass: {
    id: "pass",
    name: "Pass",
    kind: "pass",
    timeCost: 2,
    targetMode: "teammate",
  },
  screen: {
    id: "screen",
    name: "Screen",
    kind: "screen",
    timeCost: 2,
    targetMode: "ballHandler",
  },
  drive: {
    id: "drive",
    name: "Drive",
    kind: "drive",
    timeCost: 3,
    targetMode: "none",
  },
  kickOut: {
    id: "kickOut",
    name: "Kick Out",
    kind: "kickOut",
    timeCost: 2,
    targetMode: "teammate",
  },
  shot: {
    id: "shot",
    name: "Shot",
    kind: "shot",
    timeCost: 3,
    targetMode: "none",
  },
  backdoorCut: {
    id: "backdoorCut",
    name: "Backdoor Cut",
    kind: "backdoorCut",
    timeCost: 2,
    targetMode: "ballHandler",
    effect: {
      kind: "backdoorCut",
      minOnBallPressure: 8,
      requiresNoHelp: true,
    },
  },
  stepBack: {
    id: "stepBack",
    name: "Step Back",
    kind: "stepBack",
    timeCost: 3,
    targetMode: "none",
    effect: {
      kind: "stepBack",
      createdSeparation: 12,
    },
  },
} as const satisfies CardCatalog;

export const PROTOTYPE_SETUP: PossessionSetup = {
  shotClock: 14,
  ballHandlerId: "offense-pg",
  hand: ["pass", "screen", "drive", "kickOut", "shot"],
  deck: ["pass", "screen", "drive", "kickOut", "shot"],
  players: [
    {
      id: "offense-pg",
      name: "Nova",
      side: "offense",
      zone: "topPerimeter",
      shooting: 60,
    },
    {
      id: "offense-sg",
      name: "Echo",
      side: "offense",
      zone: "leftPerimeter",
      shooting: 76,
    },
    {
      id: "offense-c",
      name: "Atlas",
      side: "offense",
      zone: "rightPerimeter",
      shooting: 44,
    },
    {
      id: "defense-g",
      name: "Clamp",
      side: "defense",
      zone: "topPerimeter",
      shooting: 40,
    },
    {
      id: "defense-w",
      name: "Shade",
      side: "defense",
      zone: "leftPerimeter",
      shooting: 40,
    },
    {
      id: "defense-c",
      name: "Wall",
      side: "defense",
      zone: "paint",
      shooting: 30,
    },
  ],
  defense: {
    assignments: [
      { defenderId: "defense-g", offenderId: "offense-pg" },
      { defenderId: "defense-w", offenderId: "offense-sg" },
      { defenderId: "defense-c", offenderId: "offense-c" },
    ],
    intent: {
      id: "pressure-and-help",
      name: "Pressure & Help",
      description: "Nacisk na piłkę i pomoc obrońcy po wejściu w paint.",
      onBallPressure: 6,
      matchupContest: 12,
      helpOnDrive: true,
    },
    helpCommitted: false,
  },
  rules: {
    shotQuality: {
      maxAdvantage: 3,
      advantageBonusPerPoint: 6,
      openLookBonus: 16,
      zoneModifiers: {
        leftPerimeter: 0,
        topPerimeter: 0,
        rightPerimeter: 0,
        paint: -8,
      },
      categoryMinimums: {
        Contested: 35,
        Decent: 50,
        Open: 65,
        Perfect: 80,
      },
    },
  },
};

export function createPrototypePossession(seed: number): PossessionState {
  return resetPossession(PROTOTYPE_SETUP, seed);
}

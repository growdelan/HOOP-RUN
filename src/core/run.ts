import {
  advanceMatch,
  completeMatchPossession,
  createMatch,
} from "./match.ts";
import type {
  MatchPossessionResolution,
  MatchSetup,
  MatchState,
  TeamMatchStats,
} from "./match.ts";
import type { CardId } from "./model.ts";
import { normalizeSeed, xorshift32RandomSource } from "./rng.ts";
import type { RandomSource } from "./rng.ts";

export type RunOpponentId =
  | "fundamentals"
  | "perimeterCrew"
  | "paintKings";
export type RunPhase =
  | "activeMatch"
  | "rewardSelection"
  | "intermission"
  | "completedSuccess"
  | "completedFailure";
export type RewardCardRole = "offense" | "defense";
export type RunOutcome = "success" | "failure";

export const FIRST_RUN_OPPONENT_ORDER = [
  "fundamentals",
  "perimeterCrew",
  "paintKings",
] as const;

export interface RewardCardDefinition {
  readonly cardId: CardId;
  readonly role: RewardCardRole;
}

export interface RewardOfferEntry extends RewardCardDefinition {
  readonly index: 0 | 1 | 2;
}

export type RewardOffer = readonly [
  RewardOfferEntry,
  RewardOfferEntry,
  RewardOfferEntry,
];

export interface SelectedRunReward extends RewardOfferEntry {
  readonly afterOpponentIndex: number;
}

export interface RunMatchResult {
  readonly opponentIndex: number;
  readonly opponentId: RunOpponentId;
  readonly winner: "player" | "opponent";
  readonly score: MatchState["score"];
  readonly stats: Readonly<Record<"player" | "opponent", TeamMatchStats>>;
  readonly possessionCount: number;
}

export interface RunSetup {
  readonly opponentIds: readonly [
    RunOpponentId,
    RunOpponentId,
    RunOpponentId,
  ];
  readonly offenseDeck: readonly CardId[];
  readonly defenseDeck: readonly CardId[];
  readonly rewardCatalog: readonly RewardCardDefinition[];
  readonly match: Pick<
    MatchSetup,
    "handSize" | "requiredOffenseCards" | "requiredDefenseCards"
  >;
}

export interface RunState {
  readonly initialSeed: number;
  readonly rngState?: number;
  readonly phase: RunPhase;
  readonly opponentIndex: number;
  readonly opponentIds: readonly [
    RunOpponentId,
    RunOpponentId,
    RunOpponentId,
  ];
  readonly initialDecks: {
    readonly offense: readonly CardId[];
    readonly defense: readonly CardId[];
  };
  readonly offenseDeck: readonly CardId[];
  readonly defenseDeck: readonly CardId[];
  readonly rewardCatalog: readonly RewardCardDefinition[];
  readonly matchSetup: RunSetup["match"];
  readonly activeMatch?: MatchState;
  readonly rewardOffer?: RewardOffer;
  readonly matchResults: readonly RunMatchResult[];
  readonly selectedRewards: readonly SelectedRunReward[];
  readonly outcome?: RunOutcome;
}

export type RunCommand =
  | {
      readonly type: "completeMatchPossession";
      readonly resolution: MatchPossessionResolution;
    }
  | { readonly type: "advanceMatch" }
  | { readonly type: "chooseReward"; readonly offerIndex: number }
  | { readonly type: "startNextMatch" };

export type RunRejectionCode =
  | "invalidPhase"
  | "invalidMatchCommand"
  | "invalidRewardIndex";

export type RunEvent =
  | { readonly type: "matchUpdated" }
  | { readonly type: "matchCompleted"; readonly result: RunMatchResult }
  | { readonly type: "rewardOffered"; readonly offer: RewardOffer }
  | { readonly type: "rewardChosen"; readonly reward: SelectedRunReward }
  | {
      readonly type: "nextMatchStarted";
      readonly opponentIndex: number;
      readonly opponentId: RunOpponentId;
    }
  | { readonly type: "runCompleted"; readonly outcome: RunOutcome };

export interface RunRejection {
  readonly code: RunRejectionCode;
  readonly message: string;
}

export type RunRuleResult =
  | {
      readonly accepted: true;
      readonly state: RunState;
      readonly events: readonly RunEvent[];
    }
  | {
      readonly accepted: false;
      readonly state: RunState;
      readonly events: readonly [];
      readonly rejection: RunRejection;
    };

export function createRun(
  setup: RunSetup,
  seed: number,
  randomSource: RandomSource = xorshift32RandomSource,
): RunState {
  validateRunSetup(setup);
  const initialSeed = normalizeSeed(seed);
  const activeMatch = createRunMatch(
    setup.offenseDeck,
    setup.defenseDeck,
    setup.match,
    initialSeed,
    randomSource,
  );

  return {
    initialSeed,
    phase: "activeMatch",
    opponentIndex: 0,
    opponentIds: [...setup.opponentIds],
    initialDecks: {
      offense: [...setup.offenseDeck],
      defense: [...setup.defenseDeck],
    },
    offenseDeck: [...setup.offenseDeck],
    defenseDeck: [...setup.defenseDeck],
    rewardCatalog: setup.rewardCatalog.map((card) => ({ ...card })),
    matchSetup: {
      ...setup.match,
      requiredOffenseCards: [...(setup.match.requiredOffenseCards ?? [])],
      requiredDefenseCards: [...(setup.match.requiredDefenseCards ?? [])],
    },
    activeMatch,
    matchResults: [],
    selectedRewards: [],
  };
}

export function reduceRun(
  state: RunState,
  command: RunCommand,
  randomSource: RandomSource = xorshift32RandomSource,
): RunRuleResult {
  switch (command.type) {
    case "completeMatchPossession":
      return reduceMatchCommand(state, (match) =>
        completeMatchPossession(match, command.resolution),
      );
    case "advanceMatch":
      return reduceMatchCommand(
        state,
        (match) => advanceMatch(match, randomSource),
        randomSource,
      );
    case "chooseReward":
      return chooseReward(state, command.offerIndex);
    case "startNextMatch":
      return startNextMatch(state, randomSource);
  }
}

export function resetRun(
  state: RunState,
  seed: number = state.initialSeed,
  randomSource: RandomSource = xorshift32RandomSource,
): RunState {
  return createRun(
    {
      opponentIds: state.opponentIds,
      offenseDeck: state.initialDecks.offense,
      defenseDeck: state.initialDecks.defense,
      rewardCatalog: state.rewardCatalog,
      match: state.matchSetup,
    },
    seed,
    randomSource,
  );
}

export function getRunRngState(state: RunState): number {
  if (state.phase === "activeMatch") {
    if (state.activeMatch === undefined || state.rngState !== undefined) {
      throw new Error("Aktywny mecz musi być jedynym właścicielem kursora RNG.");
    }
    return state.activeMatch.rngState;
  }
  if (state.rngState === undefined || state.activeMatch !== undefined) {
    throw new Error("Poza meczem run musi być jedynym właścicielem kursora RNG.");
  }
  return state.rngState;
}

type MatchUpdate = ReturnType<typeof advanceMatch>;

function reduceMatchCommand(
  state: RunState,
  update: (match: MatchState) => MatchUpdate,
  randomSource: RandomSource = xorshift32RandomSource,
): RunRuleResult {
  if (state.phase !== "activeMatch" || state.activeMatch === undefined) {
    return rejectRun(
      state,
      "invalidPhase",
      "Komendy meczu są dostępne wyłącznie w fazie activeMatch.",
    );
  }

  const result = update(state.activeMatch);
  if (!result.accepted) {
    return rejectRun(
      state,
      "invalidMatchCommand",
      result.rejection.message,
    );
  }

  const synchronized: RunState = withActiveMatch(state, result.state);
  if (result.state.phase !== "completed") {
    return acceptRun(synchronized, [{ type: "matchUpdated" }]);
  }
  return finishMatch(synchronized, result.state, randomSource);
}

function finishMatch(
  state: RunState,
  match: MatchState,
  randomSource: RandomSource,
): RunRuleResult {
  if (match.winner === undefined) {
    throw new Error("Zakończony mecz musi mieć zwycięzcę.");
  }
  const opponentId = state.opponentIds[state.opponentIndex];
  if (opponentId === undefined) {
    throw new Error("Indeks przeciwnika wykracza poza trzy etapy runu.");
  }
  const result: RunMatchResult = {
    opponentIndex: state.opponentIndex,
    opponentId,
    winner: match.winner,
    score: { ...match.score },
    stats: {
      player: { ...match.stats.player },
      opponent: { ...match.stats.opponent },
    },
    possessionCount: match.history.length,
  };
  const matchResults = [...state.matchResults, result];

  if (match.winner === "opponent") {
    return acceptRun(
      {
        ...state,
        rngState: match.rngState,
        phase: "completedFailure",
        activeMatch: undefined,
        matchResults,
        outcome: "failure",
      },
      [
        { type: "matchCompleted", result },
        { type: "runCompleted", outcome: "failure" },
      ],
    );
  }

  if (state.opponentIndex === state.opponentIds.length - 1) {
    return acceptRun(
      {
        ...state,
        rngState: match.rngState,
        phase: "completedSuccess",
        activeMatch: undefined,
        matchResults,
        outcome: "success",
      },
      [
        { type: "matchCompleted", result },
        { type: "runCompleted", outcome: "success" },
      ],
    );
  }

  const generated = generateRewardOffer(
    state.rewardCatalog,
    match.rngState,
    randomSource,
  );
  return acceptRun(
    {
      ...state,
      rngState: generated.rngState,
      phase: "rewardSelection",
      activeMatch: undefined,
      rewardOffer: generated.offer,
      matchResults,
    },
    [
      { type: "matchCompleted", result },
      { type: "rewardOffered", offer: generated.offer },
    ],
  );
}

function chooseReward(state: RunState, offerIndex: number): RunRuleResult {
  if (state.phase !== "rewardSelection" || state.rewardOffer === undefined) {
    return rejectRun(
      state,
      "invalidPhase",
      "Nagrodę można wybrać wyłącznie z nierozstrzygniętej oferty.",
    );
  }
  if (!Number.isInteger(offerIndex) || offerIndex < 0 || offerIndex > 2) {
    return rejectRun(
      state,
      "invalidRewardIndex",
      "Indeks nagrody musi wskazywać jedną z trzech pozycji.",
    );
  }
  const entry = state.rewardOffer[offerIndex];
  if (entry === undefined) {
    return rejectRun(state, "invalidRewardIndex", "Nie znaleziono nagrody.");
  }
  const reward: SelectedRunReward = {
    ...entry,
    afterOpponentIndex: state.opponentIndex,
  };

  return acceptRun(
    {
      ...state,
      phase: "intermission",
      opponentIndex: state.opponentIndex + 1,
      offenseDeck:
        reward.role === "offense"
          ? [...state.offenseDeck, reward.cardId]
          : state.offenseDeck,
      defenseDeck:
        reward.role === "defense"
          ? [...state.defenseDeck, reward.cardId]
          : state.defenseDeck,
      rewardOffer: undefined,
      selectedRewards: [...state.selectedRewards, reward],
    },
    [{ type: "rewardChosen", reward }],
  );
}

function startNextMatch(
  state: RunState,
  randomSource: RandomSource,
): RunRuleResult {
  if (state.phase !== "intermission") {
    return rejectRun(
      state,
      "invalidPhase",
      "Następny mecz można rozpocząć wyłącznie w przerwie.",
    );
  }
  const opponentId = state.opponentIds[state.opponentIndex];
  if (opponentId === undefined) {
    throw new Error("Przerwa musi wskazywać istniejącego przeciwnika.");
  }
  const activeMatch = createRunMatch(
    state.offenseDeck,
    state.defenseDeck,
    state.matchSetup,
    getRunRngState(state),
    randomSource,
  );
  return acceptRun(
    withActiveMatch({ ...state, phase: "activeMatch" }, activeMatch),
    [
      {
        type: "nextMatchStarted",
        opponentIndex: state.opponentIndex,
        opponentId,
      },
    ],
  );
}

function withActiveMatch(state: RunState, activeMatch: MatchState): RunState {
  const { rngState: _inactiveRngState, ...withoutRngState } = state;
  void _inactiveRngState;
  return { ...withoutRngState, activeMatch };
}

function generateRewardOffer(
  catalog: readonly RewardCardDefinition[],
  rngState: number,
  randomSource: RandomSource,
): { readonly offer: RewardOffer; readonly rngState: number } {
  const offense = catalog.filter((card) => card.role === "offense");
  const defense = catalog.filter((card) => card.role === "defense");
  let nextRngState = rngState;
  const first = pick(offense, nextRngState, randomSource);
  nextRngState = first.rngState;
  const second = pick(defense, nextRngState, randomSource);
  nextRngState = second.rngState;
  const remaining = catalog.filter(
    (card) => card.cardId !== first.value.cardId && card.cardId !== second.value.cardId,
  );
  const third = pick(remaining, nextRngState, randomSource);
  nextRngState = third.rngState;

  const entries = [first.value, second.value, third.value];
  for (let index = entries.length - 1; index > 0; index -= 1) {
    const step = randomSource.next(nextRngState);
    nextRngState = step.state;
    const swapIndex = Math.floor(step.value * (index + 1));
    const current = entries[index];
    const swapped = entries[swapIndex];
    if (current === undefined || swapped === undefined) {
      throw new Error("Generator oferty otrzymał niepoprawny indeks.");
    }
    entries[index] = swapped;
    entries[swapIndex] = current;
  }

  return {
    offer: entries.map((entry, index) => ({
      ...entry,
      index: index as 0 | 1 | 2,
    })) as unknown as RewardOffer,
    rngState: nextRngState,
  };
}

function pick<T>(
  values: readonly T[],
  rngState: number,
  randomSource: RandomSource,
): { readonly value: T; readonly rngState: number } {
  const step = randomSource.next(rngState);
  const value = values[Math.floor(step.value * values.length)];
  if (value === undefined) throw new Error("Nie można losować z pustej puli.");
  return { value, rngState: step.state };
}

function createRunMatch(
  offenseDeck: readonly CardId[],
  defenseDeck: readonly CardId[],
  setup: RunSetup["match"],
  rngState: number,
  randomSource: RandomSource,
): MatchState {
  return createMatch(
    {
      offenseDeck,
      defenseDeck,
      ...setup,
    },
    rngState,
    randomSource,
  );
}

function validateRunSetup(setup: RunSetup): void {
  if (
    setup.opponentIds.length !== FIRST_RUN_OPPONENT_ORDER.length ||
    setup.opponentIds.some(
      (opponentId, index) => opponentId !== FIRST_RUN_OPPONENT_ORDER[index],
    )
  ) {
    throw new Error("Run musi prowadzić przez zatwierdzoną kolejność przeciwników.");
  }
  const cardIds = new Set<string>();
  let offenseCount = 0;
  let defenseCount = 0;
  for (const card of setup.rewardCatalog) {
    if (cardIds.has(card.cardId)) {
      throw new Error("Katalog nagród nie może zawierać duplikatów identyfikatorów.");
    }
    cardIds.add(card.cardId);
    if (card.role === "offense") offenseCount += 1;
    else defenseCount += 1;
  }
  if (setup.rewardCatalog.length < 3 || offenseCount === 0 || defenseCount === 0) {
    throw new Error("Katalog nagród musi umożliwiać ofertę obu ról.");
  }
}

function acceptRun(
  state: RunState,
  events: readonly RunEvent[],
): RunRuleResult {
  return { accepted: true, state, events };
}

function rejectRun(
  state: RunState,
  code: RunRejectionCode,
  message: string,
): RunRuleResult {
  return { accepted: false, state, events: [], rejection: { code, message } };
}

import type { CardId, Zone } from "./model.ts";
import type { OpponentProfile } from "./defense.ts";
import { normalizeSeed, xorshift32RandomSource } from "./rng.ts";
import type { RandomSource } from "./rng.ts";

export type MatchTeam = "player" | "opponent";
export type PlayerMatchRole = "offense" | "defense";
export type MatchPhase =
  | "activePossession"
  | "possessionSummary"
  | "completed";
export type MatchPossessionOutcome =
  | "made"
  | "missed"
  | "turnover"
  | "clockExpired";

export interface MatchDeckState {
  readonly drawPile: readonly CardId[];
  readonly hand: readonly CardId[];
  readonly discardPile: readonly CardId[];
}

export interface MatchRules {
  readonly targetScore: number;
  readonly winMargin: number;
  readonly hardCap: number;
  readonly handSize: number;
}

export interface MatchSetup {
  readonly offenseDeck: readonly CardId[];
  readonly defenseDeck: readonly CardId[];
  readonly handSize?: number;
  readonly requiredOffenseCards?: readonly CardId[];
  readonly requiredDefenseCards?: readonly CardId[];
  /** Nagrody pozostają losowe, ale nie są wypychane z ręki przez przygotowanie wymagań. */
  readonly protectedCardIds?: readonly CardId[];
  readonly opponentProfile?: OpponentProfile;
}

export interface ActiveMatchPossession {
  readonly kind: "playerOffense" | "playerDefense";
}

export interface MatchPossessionResolution {
  readonly outcome: MatchPossessionOutcome;
  readonly shotZone?: Zone;
  readonly usedCardIds: readonly CardId[];
  readonly rngState: number;
}

export interface MatchPossessionRecord extends MatchPossessionResolution {
  readonly possessionNumber: number;
  readonly attackingTeam: MatchTeam;
  readonly playerRole: PlayerMatchRole;
  readonly points: number;
}

export interface TeamMatchStats {
  readonly possessions: number;
  readonly made: number;
  readonly missed: number;
  readonly turnovers: number;
  readonly clockExpired: number;
  readonly points: number;
}

export interface MatchState {
  readonly initialSeed: number;
  readonly rngState: number;
  readonly phase: MatchPhase;
  readonly score: Readonly<Record<MatchTeam, number>>;
  readonly attackingTeam: MatchTeam;
  readonly playerRole: PlayerMatchRole;
  readonly possessionNumber: number;
  readonly rules: MatchRules;
  readonly setup: {
    readonly offenseDeck: readonly CardId[];
    readonly defenseDeck: readonly CardId[];
    readonly requiredOffenseCards: readonly CardId[];
    readonly requiredDefenseCards: readonly CardId[];
    readonly protectedCardIds?: readonly CardId[];
    readonly opponentProfile?: OpponentProfile;
  };
  readonly offenseDeck: MatchDeckState;
  readonly defenseDeck: MatchDeckState;
  readonly stats: Readonly<Record<MatchTeam, TeamMatchStats>>;
  readonly history: readonly MatchPossessionRecord[];
  readonly activePossession?: ActiveMatchPossession;
  readonly lastPossession?: MatchPossessionRecord;
  readonly winner?: MatchTeam;
}

export type MatchRejectionCode =
  | "invalidPhase"
  | "missingShotZone"
  | "invalidUsedCards";

export interface MatchRejection {
  readonly code: MatchRejectionCode;
  readonly message: string;
}

export type MatchRuleResult =
  | { readonly accepted: true; readonly state: MatchState }
  | {
      readonly accepted: false;
      readonly state: MatchState;
      readonly rejection: MatchRejection;
    };

const DEFAULT_MATCH_RULES: MatchRules = {
  targetScore: 11,
  winMargin: 2,
  hardCap: 15,
  handSize: 5,
};

export function createMatch(
  setup: MatchSetup,
  seed: number,
  randomSource: RandomSource = xorshift32RandomSource,
): MatchState {
  const handSize = setup.handSize ?? DEFAULT_MATCH_RULES.handSize;
  validateSetup(setup, handSize);

  const normalizedSeed = normalizeSeed(seed);
  const offenseShuffle = shuffleCards(
    setup.offenseDeck,
    normalizedSeed,
    randomSource,
  );
  const defenseShuffle = shuffleCards(
    setup.defenseDeck,
    offenseShuffle.rngState,
    randomSource,
  );
  const offenseDraw = drawToHand(
    createDeck(offenseShuffle.cards),
    handSize,
    defenseShuffle.rngState,
    randomSource,
  );
  const offenseDeck = ensureRequiredCards(
    offenseDraw.deck,
    setup.requiredOffenseCards ?? [],
    setup.protectedCardIds ?? [],
  );

  return {
    initialSeed: normalizedSeed,
    rngState: offenseDraw.rngState,
    phase: "activePossession",
    score: { player: 0, opponent: 0 },
    attackingTeam: "player",
    playerRole: "offense",
    possessionNumber: 1,
    rules: { ...DEFAULT_MATCH_RULES, handSize },
    setup: {
      offenseDeck: [...setup.offenseDeck],
      defenseDeck: [...setup.defenseDeck],
      requiredOffenseCards: [...(setup.requiredOffenseCards ?? [])],
      requiredDefenseCards: [...(setup.requiredDefenseCards ?? [])],
      ...(setup.protectedCardIds === undefined
        ? {}
        : { protectedCardIds: [...setup.protectedCardIds] }),
      ...(setup.opponentProfile === undefined
        ? {}
        : { opponentProfile: cloneOpponentProfile(setup.opponentProfile) }),
    },
    offenseDeck,
    defenseDeck: createDeck(defenseShuffle.cards),
    stats: { player: emptyStats(), opponent: emptyStats() },
    history: [],
    activePossession: { kind: "playerOffense" },
  };
}

export function completeMatchPossession(
  state: MatchState,
  resolution: MatchPossessionResolution,
): MatchRuleResult {
  if (state.phase !== "activePossession") {
    return rejectMatch(
      state,
      "invalidPhase",
      "Posiadanie można rozstrzygnąć tylko w fazie activePossession.",
    );
  }
  if (resolution.outcome === "made" && resolution.shotZone === undefined) {
    return rejectMatch(
      state,
      "missingShotZone",
      "Trafiony rzut wymaga strefy potrzebnej do przyznania punktów.",
    );
  }

  const activeDeck = getActiveDeck(state);
  if (!isSubmultiset(resolution.usedCardIds, activeDeck.hand)) {
    return rejectMatch(
      state,
      "invalidUsedCards",
      "Użyte karty muszą pochodzić z aktywnej ręki.",
    );
  }

  const points = pointsForResolution(resolution);
  const record: MatchPossessionRecord = {
    ...resolution,
    rngState: normalizeSeed(resolution.rngState),
    possessionNumber: state.possessionNumber,
    attackingTeam: state.attackingTeam,
    playerRole: state.playerRole,
    points,
  };
  const score = {
    ...state.score,
    [state.attackingTeam]: state.score[state.attackingTeam] + points,
  };
  const stats = {
    ...state.stats,
    [state.attackingTeam]: applyStats(
      state.stats[state.attackingTeam],
      resolution.outcome,
      points,
    ),
  };
  const discardedDeck = discardHand(activeDeck, resolution.usedCardIds);
  const winner = getWinner(score, state.rules);

  return acceptMatch({
    ...state,
    rngState: record.rngState,
    phase: "possessionSummary",
    score,
    offenseDeck:
      state.playerRole === "offense" ? discardedDeck : state.offenseDeck,
    defenseDeck:
      state.playerRole === "defense" ? discardedDeck : state.defenseDeck,
    stats,
    history: [...state.history, record],
    activePossession: undefined,
    lastPossession: record,
    ...(winner === undefined ? {} : { winner }),
  });
}

export function advanceMatch(
  state: MatchState,
  randomSource: RandomSource = xorshift32RandomSource,
): MatchRuleResult {
  if (state.phase !== "possessionSummary") {
    return rejectMatch(
      state,
      "invalidPhase",
      "Dalej jest dostępne tylko podczas podsumowania posiadania.",
    );
  }
  if (state.winner !== undefined) {
    return acceptMatch({ ...state, phase: "completed" });
  }

  const attackingTeam = otherTeam(state.attackingTeam);
  const playerRole = roleForTeam(attackingTeam);
  const activeDeck = playerRole === "offense" ? state.offenseDeck : state.defenseDeck;
  const draw = drawToHand(
    activeDeck,
    state.rules.handSize,
    state.rngState,
    randomSource,
  );
  const requiredCards =
    playerRole === "offense"
      ? state.setup.requiredOffenseCards
      : state.setup.requiredDefenseCards;
  const preparedDeck = ensureRequiredCards(
    draw.deck,
    requiredCards,
    state.setup.protectedCardIds ?? [],
  );

  return acceptMatch({
    ...state,
    rngState: draw.rngState,
    phase: "activePossession",
    attackingTeam,
    playerRole,
    possessionNumber: state.possessionNumber + 1,
    offenseDeck: playerRole === "offense" ? preparedDeck : state.offenseDeck,
    defenseDeck: playerRole === "defense" ? preparedDeck : state.defenseDeck,
    activePossession: {
      kind: playerRole === "offense" ? "playerOffense" : "playerDefense",
    },
    lastPossession: undefined,
  });
}

export function resetMatch(
  state: MatchState,
  randomSource: RandomSource = xorshift32RandomSource,
): MatchState {
  return createMatch(
    {
      offenseDeck: state.setup.offenseDeck,
      defenseDeck: state.setup.defenseDeck,
      handSize: state.rules.handSize,
      requiredOffenseCards: state.setup.requiredOffenseCards,
      requiredDefenseCards: state.setup.requiredDefenseCards,
      protectedCardIds: state.setup.protectedCardIds,
      opponentProfile: state.setup.opponentProfile,
    },
    state.initialSeed,
    randomSource,
  );
}

export function isWinningScore(
  score: Readonly<Record<MatchTeam, number>>,
  rules: MatchRules = DEFAULT_MATCH_RULES,
): MatchTeam | undefined {
  return getWinner(score, rules);
}

function createDeck(cards: readonly CardId[]): MatchDeckState {
  return { drawPile: [...cards], hand: [], discardPile: [] };
}

function drawToHand(
  deck: MatchDeckState,
  targetSize: number,
  rngState: number,
  randomSource: RandomSource,
): { readonly deck: MatchDeckState; readonly rngState: number } {
  let drawPile = [...deck.drawPile];
  const hand = [...deck.hand];
  let discardPile = [...deck.discardPile];
  let nextRngState = rngState;

  while (hand.length < targetSize) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) break;
      const shuffle = shuffleCards(discardPile, nextRngState, randomSource);
      drawPile = [...shuffle.cards];
      discardPile = [];
      nextRngState = shuffle.rngState;
    }

    const card = drawPile.shift();
    if (card === undefined) break;
    hand.push(card);
  }

  return {
    deck: { drawPile, hand, discardPile },
    rngState: nextRngState,
  };
}

function discardHand(
  deck: MatchDeckState,
  usedCardIds: readonly CardId[],
): MatchDeckState {
  const remainingHand = [...deck.hand];
  for (const usedCardId of usedCardIds) {
    const index = remainingHand.indexOf(usedCardId);
    remainingHand.splice(index, 1);
  }

  return {
    drawPile: [...deck.drawPile],
    hand: [],
    discardPile: [...deck.discardPile, ...usedCardIds, ...remainingHand],
  };
}

function ensureRequiredCards(
  deck: MatchDeckState,
  requiredCards: readonly CardId[],
  protectedCardIds: readonly CardId[] = [],
): MatchDeckState {
  const drawPile = [...deck.drawPile];
  const hand = [...deck.hand];
  const discardPile = [...deck.discardPile];
  const requiredCounts = countCards(requiredCards);

  for (const [cardId, requiredCount] of requiredCounts) {
    while (countIn(hand, cardId) < requiredCount) {
      const source = drawPile.includes(cardId) ? drawPile : discardPile;
      const sourceIndex = source.indexOf(cardId);
      const replacementIndex = findReplaceableHandIndex(
        hand,
        requiredCounts,
        protectedCardIds,
      );
      if (sourceIndex < 0 || replacementIndex < 0) {
        throw new Error("Nie można zbudować wymaganej użytecznej ręki.");
      }
      const replacement = hand[replacementIndex];
      if (replacement === undefined) {
        throw new Error("Nie znaleziono karty do zamiany w wymaganej ręce.");
      }
      hand[replacementIndex] = cardId;
      source[sourceIndex] = replacement;
    }
  }

  return { drawPile, hand, discardPile };
}

function shuffleCards(
  cards: readonly CardId[],
  rngState: number,
  randomSource: RandomSource,
): { readonly cards: readonly CardId[]; readonly rngState: number } {
  const shuffled = [...cards];
  let nextRngState = rngState;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const step = randomSource.next(nextRngState);
    nextRngState = step.state;
    const swapIndex = Math.floor(step.value * (index + 1));
    const current = shuffled[index];
    const swapped = shuffled[swapIndex];
    if (current === undefined || swapped === undefined) {
      throw new Error("Tasowanie otrzymało niepoprawny indeks karty.");
    }
    shuffled[index] = swapped;
    shuffled[swapIndex] = current;
  }

  return { cards: shuffled, rngState: nextRngState };
}

function pointsForResolution(resolution: MatchPossessionResolution): number {
  if (resolution.outcome !== "made") return 0;
  return resolution.shotZone === "paint" ? 1 : 2;
}

function applyStats(
  stats: TeamMatchStats,
  outcome: MatchPossessionOutcome,
  points: number,
): TeamMatchStats {
  return {
    possessions: stats.possessions + 1,
    made: stats.made + (outcome === "made" ? 1 : 0),
    missed: stats.missed + (outcome === "missed" ? 1 : 0),
    turnovers: stats.turnovers + (outcome === "turnover" ? 1 : 0),
    clockExpired: stats.clockExpired + (outcome === "clockExpired" ? 1 : 0),
    points: stats.points + points,
  };
}

function emptyStats(): TeamMatchStats {
  return {
    possessions: 0,
    made: 0,
    missed: 0,
    turnovers: 0,
    clockExpired: 0,
    points: 0,
  };
}

function getActiveDeck(state: MatchState): MatchDeckState {
  return state.playerRole === "offense" ? state.offenseDeck : state.defenseDeck;
}

function getWinner(
  score: Readonly<Record<MatchTeam, number>>,
  rules: MatchRules,
): MatchTeam | undefined {
  if (score.player >= rules.hardCap) return "player";
  if (score.opponent >= rules.hardCap) return "opponent";

  const leader = score.player > score.opponent ? "player" : "opponent";
  const trailer = otherTeam(leader);
  return score[leader] >= rules.targetScore &&
    score[leader] - score[trailer] >= rules.winMargin
    ? leader
    : undefined;
}

function roleForTeam(attackingTeam: MatchTeam): PlayerMatchRole {
  return attackingTeam === "player" ? "offense" : "defense";
}

function otherTeam(team: MatchTeam): MatchTeam {
  return team === "player" ? "opponent" : "player";
}

function isSubmultiset(
  requested: readonly CardId[],
  available: readonly CardId[],
): boolean {
  const remaining = [...available];
  return requested.every((cardId) => {
    const index = remaining.indexOf(cardId);
    if (index < 0) return false;
    remaining.splice(index, 1);
    return true;
  });
}

function countCards(cards: readonly CardId[]): ReadonlyMap<CardId, number> {
  const counts = new Map<CardId, number>();
  for (const cardId of cards) {
    counts.set(cardId, (counts.get(cardId) ?? 0) + 1);
  }
  return counts;
}

function countIn(cards: readonly CardId[], cardId: CardId): number {
  return cards.filter((candidate) => candidate === cardId).length;
}

function findReplaceableHandIndex(
  hand: readonly CardId[],
  requiredCounts: ReadonlyMap<CardId, number>,
  protectedCardIds: readonly CardId[],
): number {
  for (let index = hand.length - 1; index >= 0; index -= 1) {
    const cardId = hand[index];
    if (
      cardId !== undefined &&
      !protectedCardIds.includes(cardId) &&
      countIn(hand, cardId) > (requiredCounts.get(cardId) ?? 0)
    ) {
      return index;
    }
  }
  return -1;
}

function validateSetup(setup: MatchSetup, handSize: number): void {
  if (!Number.isInteger(handSize) || handSize <= 0) {
    throw new Error("Rozmiar ręki musi być dodatnią liczbą całkowitą.");
  }
  if (setup.offenseDeck.length < handSize || setup.defenseDeck.length < handSize) {
    throw new Error("Każda talia musi wystarczyć do dobrania pełnej ręki startowej.");
  }
  validateRequiredCards(
    setup.offenseDeck,
    setup.requiredOffenseCards ?? [],
    handSize,
  );
  validateRequiredCards(
    setup.defenseDeck,
    setup.requiredDefenseCards ?? [],
    handSize,
  );
}

function cloneOpponentProfile(profile: OpponentProfile): OpponentProfile {
  return {
    ...profile,
    plans: Object.fromEntries(
      Object.entries(profile.plans).map(([id, plan]) => [
        id,
        {
          ...plan,
          steps: plan.steps.map((step) => ({ ...step })),
        },
      ]),
    ),
    planWeights: profile.planWeights.map((weight) => ({ ...weight })),
    defenseIntents: profile.defenseIntents.map((intent) => ({ ...intent })),
    intentWeights: profile.intentWeights.map((weight) => ({ ...weight })),
  };
}

function validateRequiredCards(
  deck: readonly CardId[],
  requiredCards: readonly CardId[],
  handSize: number,
): void {
  if (
    requiredCards.length > handSize ||
    !isSubmultiset(requiredCards, deck)
  ) {
    throw new Error("Wymagane karty muszą mieścić się w ręce i występować w talii.");
  }
}

function acceptMatch(state: MatchState): MatchRuleResult {
  return { accepted: true, state };
}

function rejectMatch(
  state: MatchState,
  code: MatchRejectionCode,
  message: string,
): MatchRuleResult {
  return { accepted: false, state, rejection: { code, message } };
}

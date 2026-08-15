import { describe, expect, it } from "vitest";

import {
  advanceMatch,
  completeMatchPossession,
  createDefensePossession,
  createMatch,
  createRun,
  playCard,
  playDefenseCard,
  previewDefenseCardImpact,
  previewOffenseCardImpact,
  resetPossession,
  reduceRun,
  selectOpponentDefenseIntent,
  selectOpponentPlan,
} from "../../src/core/index.ts";
import type {
  CardId,
  DefensePossessionState,
  MatchState,
  OpponentProfile,
  OpponentActionDefinition,
  PossessionSetup,
  PossessionState,
  RandomSource,
  RunRuleResult,
  RunState,
} from "../../src/core/index.ts";
import {
  PROTOTYPE_CARDS,
  PROTOTYPE_SETUP,
} from "../../src/content/prototypePossession.ts";
import {
  PROTOTYPE_DEFENSE_CARDS,
  PROTOTYPE_DEFENSE_SETUP,
  PROTOTYPE_OPPONENT_DEFENSE_INTENTS,
  PROTOTYPE_OPPONENT_PLANS,
  PROTOTYPE_OPPONENT_PROFILES,
} from "../../src/content/prototypeDefense.ts";
import { PROTOTYPE_RUN_SETUP } from "../../src/content/prototypeRun.ts";

describe("Milestone 9 — karty nagród i tożsamość przeciwników", () => {
  it("Backdoor Cut przenosi off-ball cuttera i otwiera go tylko przeciw Deny Perimeter", () => {
    const deny = resetPossession(
      possessionSetup({
        defenseIntent: PROTOTYPE_OPPONENT_DEFENSE_INTENTS[2],
        hand: ["backdoorCut", "pass", "shot"],
      }),
      42,
    );
    const denyResult = playAccepted(deny, {
      cardId: "backdoorCut",
      actorId: "offense-sg",
      targetId: "offense-pg",
    });

    expect(playerZone(denyResult, "offense-sg")).toBe("paint");
    expect(denyResult.ballHandlerId).toBe("offense-pg");
    expect(denyResult.shotClock).toBe(12);
    expect(denyResult.openPlayerIds).toContain("offense-sg");
    expect(denyResult.events).toContainEqual({
      type: "backdoorCutResolved",
      playerId: "offense-sg",
      opened: true,
    });
    const denyPreview = previewOffenseCardImpact(
      deny,
      { cardId: "backdoorCut", actorId: "offense-sg", targetId: "offense-pg" },
      PROTOTYPE_CARDS,
    );
    expect(denyPreview).toMatchObject({
      status: "backdoorOpen",
      openedPlayerId: "offense-sg",
      shotQualityDelta: 32,
    });

    const protect = resetPossession(
      possessionSetup({
        defenseIntent: PROTOTYPE_OPPONENT_DEFENSE_INTENTS[1],
        hand: ["backdoorCut", "pass", "shot"],
      }),
      42,
    );
    const protectResult = playAccepted(protect, {
      cardId: "backdoorCut",
      actorId: "offense-sg",
      targetId: "offense-pg",
    });
    expect(protectResult.openPlayerIds).not.toContain("offense-sg");
    expect(protectResult.shotClock).toBe(12);

    const protectPreview = previewOffenseCardImpact(
      protect,
      { cardId: "backdoorCut", actorId: "offense-sg", targetId: "offense-pg" },
      PROTOTYPE_CARDS,
    );
    expect(protectPreview).toMatchObject({
      status: "backdoorClosed",
      shotQualityDelta: -8,
    });

    const previouslyOpen = {
      ...protect,
      openPlayerIds: ["offense-sg"],
    };
    const staleOpenPreview = previewOffenseCardImpact(
      previouslyOpen,
      { cardId: "backdoorCut", actorId: "offense-sg", targetId: "offense-pg" },
      PROTOTYPE_CARDS,
    );
    expect(staleOpenPreview).toMatchObject({
      status: "backdoorClosed",
      shotQualityDelta: -8,
    });
    expect(staleOpenPreview?.openedPlayerId).toBeUndefined();
  });

  it("Step Back daje jednorazowe +12 pp, zużywa status na rzucie i nie kumuluje się", () => {
    const setup = possessionSetup({
      hand: ["stepBack", "stepBack", "shot", "pass"],
      deck: ["stepBack", "stepBack", "shot", "pass"],
    });
    const initial = resetPossession(setup, 42);
    const prepared = playAccepted(initial, {
      cardId: "stepBack",
      actorId: "offense-pg",
    });
    expect(prepared.stepBackReady).toBe("offense-pg");
    expect(prepared.shotClock).toBe(11);

    const duplicate = playCard(
      prepared,
      { cardId: "stepBack", actorId: "offense-pg" },
      PROTOTYPE_CARDS,
    );
    expect(duplicate.accepted).toBe(false);
    if (duplicate.accepted) throw new Error("Oczekiwano odrzucenia kumulacji.");
    expect(duplicate.rejection.code).toBe("stepBackAlreadyReady");
    expect(duplicate.state).toBe(prepared);

    const shot = playAccepted(prepared, {
      cardId: "shot",
      actorId: "offense-pg",
    });
    expect(shot.stepBackReady).toBeUndefined();
    expect(shot.pendingShot?.quality.modifiers).toContainEqual({
      source: "createdSeparation",
      value: 12,
    });
    expect(shot.pendingShot?.quality.totalScore).toBe(54);
    expect(shot.events).toContainEqual({
      type: "stepBackConsumed",
      playerId: "offense-pg",
    });
    expect(
      previewOffenseCardImpact(
        initial,
        { cardId: "stepBack", actorId: "offense-pg" },
        PROTOTYPE_CARDS,
      ),
    ).toMatchObject({
      status: "stepBackReady",
      createdSeparation: 12,
      shotQualityDelta: 12,
    });

    const cleared = playAccepted(
      resetPossession(setup, 42),
      { cardId: "stepBack", actorId: "offense-pg" },
    );
    const afterOtherCard = playAccepted(cleared, {
      cardId: "pass",
      actorId: "offense-pg",
      targetId: "offense-sg",
    });
    expect(afterOtherCard.stepBackReady).toBeUndefined();

    const shortClock = resetPossession(
      possessionSetup({
        shotClock: 5,
        hand: ["stepBack", "shot"],
        deck: ["stepBack", "shot"],
      }),
      42,
    );
    const risky = playAccepted(shortClock, {
      cardId: "stepBack",
      actorId: "offense-pg",
    });
    expect(risky.stepBackReady).toBe("offense-pg");
    expect(risky.shotClock).toBe(2);
    const blockedShot = playCard(
      risky,
      { cardId: "shot", actorId: "offense-pg" },
      PROTOTYPE_CARDS,
    );
    expect(blockedShot.accepted).toBe(false);
    if (blockedShot.accepted) throw new Error("Oczekiwano ryzykownego odrzucenia rzutu.");
    expect(blockedShot.rejection.code).toBe("notEnoughTime");
    expect(blockedShot.state).toBe(risky);
  });

  it("Hedge kosztuje łącznie 3 sekundy, neutralizuje zasłonę i zużywa odsłonięcie przy następnym kroku", () => {
    const state = createDefensePossession(
      {
        ...PROTOTYPE_DEFENSE_SETUP,
        hand: ["hedge", "pressure"],
      },
      PROTOTYPE_OPPONENT_PLANS,
      42,
      sequenceRandom(0),
    );
    expect(state.currentAction.id).toBe("pnr-screen");

    const hedge = playDefenseAccepted(state, {
      cardId: "hedge",
      targetId: "opponent-pg",
    });
    expect(hedge.shotClock).toBe(11);
    expect(hedge.opponentAdvantage).toBe(0);
    expect(hedge.shotContest).toBe(6);
    expect(hedge.exposedOpponentIds).toEqual(["opponent-c"]);
    expect(previewDefenseCardImpact(state, "hedge", PROTOTYPE_DEFENSE_CARDS)).toMatchObject({
      timeCost: 3,
      nextOpponentAdvantage: 0,
      shotQualityDelta: -6,
      exposureId: "opponent-c",
      exposureAdvantageDelta: 1,
      consumedExposureAdvantageDelta: 0,
    });

    const next = playDefenseAccepted(hedge, {
      cardId: "pressure",
      targetId: "opponent-pg",
    });
    expect(next.currentAction.id).toBe("pnr-shot");
    expect(next.opponentAdvantage).toBe(3);
    expect(next.exposedOpponentIds).toEqual([]);
    expect(next.events).toContainEqual({
      type: "exposureConsumed",
      playerId: "opponent-c",
      advantageDelta: 1,
    });
  });

  it("zwykła ekspozycja Help Defense pozostaje do rzutu po Pass, a Double Team nie emituje fałszywego zużycia", () => {
    let driveAndKick = createDefensePossession(
      {
        ...PROTOTYPE_DEFENSE_SETUP,
        hand: ["helpDefense", "pressure", "pressure"],
      },
      PROTOTYPE_OPPONENT_PLANS,
      42,
      sequenceRandom(0.4),
    );
    driveAndKick = playDefenseAccepted(driveAndKick, {
      cardId: "helpDefense",
      targetId: "opponent-pg",
    });
    expect(driveAndKick.currentAction.id).toBe("dak-pass");
    expect(driveAndKick.exposedOpponentIds).toEqual(["opponent-wing"]);

    driveAndKick = playDefenseAccepted(driveAndKick, {
      cardId: "pressure",
      targetId: "opponent-pg",
    });
    expect(driveAndKick.currentAction.id).toBe("dak-shot");
    expect(driveAndKick.exposedOpponentIds).toEqual(["opponent-wing"]);
    expect(driveAndKick.events).not.toContainEqual(
      expect.objectContaining({ type: "exposureConsumed" }),
    );

    const shot = playDefenseAccepted(driveAndKick, {
      cardId: "pressure",
      targetId: "opponent-wing",
    });
    expect(shot.exposedOpponentIds).toEqual(["opponent-wing"]);
    expect(shot.pendingShot?.quality.modifiers).toContainEqual({
      source: "exposedShooter",
      value: PROTOTYPE_DEFENSE_SETUP.shotQuality.openLookBonus,
    });

    let pickAndRoll = createDefensePossession(
      {
        ...PROTOTYPE_DEFENSE_SETUP,
        hand: ["doubleTeam", "pressure"],
      },
      PROTOTYPE_OPPONENT_PLANS,
      42,
      sequenceRandom(0),
    );
    pickAndRoll = playDefenseAccepted(pickAndRoll, {
      cardId: "doubleTeam",
      targetId: "opponent-pg",
    });
    expect(pickAndRoll.exposedOpponentIds).toEqual(["opponent-c"]);
    pickAndRoll = playDefenseAccepted(pickAndRoll, {
      cardId: "pressure",
      targetId: "opponent-pg",
    });
    expect(pickAndRoll.exposedOpponentIds).toEqual(["opponent-c"]);
    expect(pickAndRoll.events).not.toContainEqual(
      expect.objectContaining({ type: "exposureConsumed" }),
    );
  });

  it("Close Out rozróżnia czysty i spóźniony doskok oraz odrzuca rzut w paint", () => {
    const clean = closeOutState(0, "leftPerimeter");
    const cleanResult = playDefenseAccepted(clean, {
      cardId: "closeOut",
      targetId: "opponent-wing",
    });
    expect(cleanResult.shotContest).toBe(12);
    expect(cleanResult.opponentAdvantage).toBe(0);
    expect(cleanResult.shotClock).toBe(12);
    expect(previewDefenseCardImpact(clean, "closeOut", PROTOTYPE_DEFENSE_CARDS)?.explanation).toContain(
      "Czysty",
    );

    const late = closeOutState(1, "leftPerimeter");
    const lateResult = playDefenseAccepted(late, {
      cardId: "closeOut",
      targetId: "opponent-wing",
    });
    expect(lateResult.shotContest).toBe(4);
    expect(lateResult.opponentAdvantage).toBe(2);
    expect(previewDefenseCardImpact(late, "closeOut", PROTOTYPE_DEFENSE_CARDS)).toMatchObject({
      timeCost: 2,
      nextOpponentAdvantage: 2,
      shotQualityDelta: 2,
      explanation: "Close Out jest spóźniony: ogranicza rzut, ale agresywny doskok oddaje punkt przewagi.",
    });

    const paint = closeOutState(0, "paint");
    const rejected = playDefenseCard(
      paint,
      { cardId: "closeOut", targetId: "opponent-wing" },
      PROTOTYPE_DEFENSE_CARDS,
      PROTOTYPE_OPPONENT_PLANS,
    );
    expect(rejected.accepted).toBe(false);
    if (rejected.accepted) throw new Error("Oczekiwano odrzucenia Close Out w paint.");
    expect(rejected.rejection.code).toBe("cardNotLegalAgainstAction");
    expect(rejected.state).toBe(paint);
  });

  it("profile przeciwnika deterministycznie waży plany i intencje bez ukrytego bonusu", () => {
    const perimeter = PROTOTYPE_OPPONENT_PROFILES.perimeterCrew;
    const paint = PROTOTYPE_OPPONENT_PROFILES.paintKings;
    expect(selectOpponentPlan(perimeter, 42, sequenceRandom(0.8)).plan.id).toBe(
      "quickThree",
    );
    expect(selectOpponentDefenseIntent(perimeter, 42, sequenceRandom(0.8)).intent.id).toBe(
      "deny-perimeter",
    );
    expect(selectOpponentPlan(paint, 42, sequenceRandom(0.1)).plan.id).toBe(
      "pickAndRoll",
    );
    expect(selectOpponentDefenseIntent(paint, 42, sequenceRandom(0.3)).intent.id).toBe(
      "protect-paint",
    );
    expect(
      PROTOTYPE_OPPONENT_PROFILES.fundamentals.planWeights.map((item) => item.weight),
    ).toEqual([1, 1, 1]);
    expect(perimeter.planWeights.map((item) => item.weight)).toEqual([1, 1, 3]);
    expect(paint.planWeights.map((item) => item.weight)).toEqual([3, 1, 1]);
    expect(perimeter.intentWeights.map((item) => item.weight)).toEqual([1, 1, 3]);
    expect(paint.intentWeights.map((item) => item.weight)).toEqual([1, 3, 1]);
  });

  it("audyt seedów odtwarza rozkłady wszystkich profili bez zmiany kursora poza losowaniem", () => {
    const profiles = [
      {
        profile: PROTOTYPE_OPPONENT_PROFILES.fundamentals,
        dominantPlan: undefined,
        dominantIntent: undefined,
      },
      {
        profile: PROTOTYPE_OPPONENT_PROFILES.perimeterCrew,
        dominantPlan: "quickThree",
        dominantIntent: "deny-perimeter",
      },
      {
        profile: PROTOTYPE_OPPONENT_PROFILES.paintKings,
        dominantPlan: "pickAndRoll",
        dominantIntent: "protect-paint",
      },
    ] as const;

    for (const { profile, dominantPlan, dominantIntent } of profiles) {
      const first = profileDistribution(profile, 1000);
      const second = profileDistribution(profile, 1000);
      expect(second).toEqual(first);
      for (const plan of Object.keys(profile.plans)) {
        expect(first.plans[plan] ?? 0).toBeGreaterThan(100);
      }
      for (const intent of profile.defenseIntents) {
        expect(first.intents[intent.id] ?? 0).toBeGreaterThan(100);
      }
      if (dominantPlan !== undefined) {
        expect((first.plans[dominantPlan] ?? 0) / 1000).toBeGreaterThan(0.5);
        expect((first.plans[dominantPlan] ?? 0) / 1000).toBeLessThan(0.7);
      }
      if (dominantIntent !== undefined) {
        expect((first.intents[dominantIntent] ?? 0) / 1000).toBeGreaterThan(0.5);
        expect((first.intents[dominantIntent] ?? 0) / 1000).toBeLessThan(0.7);
      }
    }
  });

  it("run przekazuje profil kolejnego przeciwnika do MatchState, a nagroda pozostaje w pierwszym cyklu talii", () => {
    const initial = createRunWithProfiles();
    expect(initial.activeMatch?.setup.opponentProfile?.id).toBe("fundamentals");

    const rewardMatch = createMatch(
      {
        ...PROTOTYPE_RUN_SETUP,
        offenseDeck: [...PROTOTYPE_RUN_SETUP.offenseDeck, "backdoorCut"],
      },
      123,
    );
    expect([
      ...rewardMatch.offenseDeck.hand,
      ...rewardMatch.offenseDeck.drawPile,
    ]).toContain("backdoorCut");
    expect(rewardMatch.offenseDeck.discardPile).not.toContain("backdoorCut");
  });

  it("przechodzi pełny trzy-meczowy run przez obie oferty i starty kolejnych profili", () => {
    let run = createRun(PROTOTYPE_RUN_SETUP, 20260815);
    run = winRunMatch(run);
    expect(run.phase).toBe("rewardSelection");
    run = chooseReward(run, 0);
    run = startNextRunMatch(run);
    expect(run.activeMatch?.setup.opponentProfile?.id).toBe("perimeterCrew");

    run = winRunMatch(run);
    expect(run.phase).toBe("rewardSelection");
    run = chooseReward(run, 1);
    run = startNextRunMatch(run);
    expect(run.activeMatch?.setup.opponentProfile?.id).toBe("paintKings");

    run = winRunMatch(run);
    expect(run.phase).toBe("completedSuccess");
    expect(run.selectedRewards).toHaveLength(2);
    expect(run.matchResults.map((result) => result.opponentId)).toEqual([
      "fundamentals",
      "perimeterCrew",
      "paintKings",
    ]);
  });

  it("zapisuje numer pierwszego posiadania nagrody dla obu ról przed pierwszym przetasowaniem", () => {
    for (const role of ["offense", "defense"] as const) {
      let runsWithoutPinnedCard = 0;
      for (let seed = 2201; seed < 2221; seed += 1) {
        let run = createRun(PROTOTYPE_RUN_SETUP, seed);
        run = winRunMatch(run);
        const offerIndex = run.rewardOffer?.findIndex((entry) => entry.role === role);
        if (offerIndex === undefined || offerIndex < 0) {
          throw new Error(`Oferta nie zawiera nagrody ${role}.`);
        }
        const reward = run.rewardOffer?.[offerIndex];
        if (reward === undefined) throw new Error("Brak wybranej nagrody.");
        run = chooseReward(run, offerIndex);
        run = startNextRunMatch(run);
        const activeMatch = run.activeMatch;
        if (activeMatch === undefined) throw new Error("Brak drugiego meczu.");

        const firstDraw = firstRewardDraw(activeMatch, reward.cardId, role);
        expect(firstDraw.possessionNumber).toBeGreaterThanOrEqual(1);
        expect(firstDraw.cardInDiscard).toBe(false);
        expect(firstDraw.beforeFirstReshuffle).toBe(true);
        if (!firstDraw.initialHandIncludesCard) runsWithoutPinnedCard += 1;
      }
      expect(runsWithoutPinnedCard).toBeGreaterThan(0);
    }
  });
});

function possessionSetup(
  overrides: Partial<PossessionSetup> & {
    readonly defenseIntent?: PossessionSetup["defense"]["intent"];
  } = {},
): PossessionSetup {
  const { defenseIntent, ...rest } = overrides;
  return {
    ...PROTOTYPE_SETUP,
    ...rest,
    defense: {
      ...PROTOTYPE_SETUP.defense,
      ...(defenseIntent === undefined ? {} : { intent: defenseIntent }),
    },
  };
}

function createRunWithProfiles() {
  return createRun(PROTOTYPE_RUN_SETUP, 42);
}

function winRunMatch(state: RunState): RunState {
  const match = state.activeMatch;
  if (match === undefined) throw new Error("Brak aktywnego meczu.");
  const preparedMatch: MatchState = {
    ...match,
    score: { player: 10, opponent: 0 },
    attackingTeam: "player",
    playerRole: "offense",
    activePossession: { kind: "playerOffense" },
  };
  const preparedState: RunState = { ...state, activeMatch: preparedMatch };
  const summary = acceptedRun(
    reduceRun(preparedState, {
      type: "completeMatchPossession",
      resolution: {
        outcome: "made",
        shotZone: "paint",
        usedCardIds: [],
        rngState: match.rngState,
      },
    }),
  );
  return acceptedRun(reduceRun(summary, { type: "advanceMatch" }));
}

function chooseReward(state: RunState, offerIndex: number): RunState {
  return acceptedRun(reduceRun(state, { type: "chooseReward", offerIndex }));
}

function startNextRunMatch(state: RunState): RunState {
  return acceptedRun(reduceRun(state, { type: "startNextMatch" }));
}

interface RewardVisibilityAudit {
  readonly possessionNumber: number;
  readonly cardInDiscard: boolean;
  readonly initialHandIncludesCard: boolean;
  readonly beforeFirstReshuffle: boolean;
}

function firstRewardDraw(
  initial: MatchState,
  cardId: CardId,
  role: "offense" | "defense",
): RewardVisibilityAudit {
  let state = initial;
  const initialDeck = role === "offense" ? state.offenseDeck : state.defenseDeck;
  const initialHandIncludesCard = initialDeck.hand.includes(cardId);
  let drawnBeforeFirstReshuffle = initialHandIncludesCard;

  for (let step = 0; step < 12; step += 1) {
    const targetDeck = role === "offense" ? state.offenseDeck : state.defenseDeck;
    if (targetDeck.hand.includes(cardId)) {
      return {
        possessionNumber: state.possessionNumber,
        cardInDiscard: targetDeck.discardPile.includes(cardId),
        initialHandIncludesCard,
        beforeFirstReshuffle: drawnBeforeFirstReshuffle,
      };
    }
    if (state.phase !== "activePossession" || state.activePossession === undefined) {
      throw new Error("Nagroda nie pojawiła się podczas aktywnych posiadań.");
    }

    const summary = completeMatchPossession(state, {
      outcome: "missed",
      usedCardIds: [],
      rngState: state.rngState,
    });
    if (!summary.accepted) throw new Error(summary.rejection.message);
    const summaryDeck = role === "offense" ? summary.state.offenseDeck : summary.state.defenseDeck;
    const nextRole = state.playerRole === "offense" ? "defense" : "offense";
    if (nextRole === role) {
      const rewardIndex = summaryDeck.drawPile.indexOf(cardId);
      const drawCount = Math.min(state.rules.handSize, summaryDeck.drawPile.length);
      drawnBeforeFirstReshuffle ||= rewardIndex >= 0 && rewardIndex < drawCount;
    }
    const advanced = advanceMatch(summary.state);
    if (!advanced.accepted) throw new Error(advanced.rejection.message);
    state = advanced.state;
  }

  throw new Error(`Nie znaleziono ${cardId} przed końcem audytu widoczności.`);
}

function closeOutState(
  opponentAdvantage: number,
  shooterZone: "leftPerimeter" | "topPerimeter" | "rightPerimeter" | "paint",
): DefensePossessionState {
  const state = createDefensePossession(
    {
      ...PROTOTYPE_DEFENSE_SETUP,
      hand: ["closeOut"],
    },
    PROTOTYPE_OPPONENT_PLANS,
    42,
    sequenceRandom(0.8),
  );
  const currentAction: OpponentActionDefinition = {
    id: "manual-shoot",
    name: "Corner Shot",
    kind: "shoot",
    actorId: "opponent-wing",
    baseAdvantageDelta: 0,
  };
  return {
    ...state,
    currentAction,
    currentStepIndex: 2,
    opponentAdvantage,
    players: state.players.map((player) =>
      player.id === "opponent-wing" ? { ...player, zone: shooterZone } : player,
    ),
  };
}

function playAccepted(
  state: PossessionState,
  command: Parameters<typeof playCard>[1],
): PossessionState {
  const result = playCard(state, command, PROTOTYPE_CARDS);
  expect(result.accepted).toBe(true);
  if (!result.accepted) throw new Error(result.rejection.message);
  return result.state;
}

function playDefenseAccepted(
  state: DefensePossessionState,
  command: Parameters<typeof playDefenseCard>[1],
): DefensePossessionState {
  const result = playDefenseCard(
    state,
    command,
    PROTOTYPE_DEFENSE_CARDS,
    PROTOTYPE_OPPONENT_PLANS,
    sequenceRandom(0.99),
  );
  expect(result.accepted).toBe(true);
  if (!result.accepted) throw new Error(result.rejection.message);
  return result.state;
}

function playerZone(state: PossessionState, playerId: string): string {
  return state.players.find((player) => player.id === playerId)?.zone ?? "";
}

function sequenceRandom(value: number): RandomSource {
  return {
    next: (state) => ({ state: state + 1, value }),
  };
}

function profileDistribution(
  profile: OpponentProfile,
  count: number,
): {
  readonly plans: Readonly<Record<string, number>>;
  readonly intents: Readonly<Record<string, number>>;
} {
  const plans: Record<string, number> = {};
  const intents: Record<string, number> = {};
  for (let seed = 1; seed <= count; seed += 1) {
    const sampleSeed = Math.imul(seed, 0x9e3779b1);
    const planId = selectOpponentPlan(profile, sampleSeed).plan.id;
    plans[planId] = (plans[planId] ?? 0) + 1;
    const intentId = selectOpponentDefenseIntent(profile, sampleSeed).intent.id;
    intents[intentId] = (intents[intentId] ?? 0) + 1;
  }
  return { plans, intents };
}

function acceptedRun(result: RunRuleResult): RunState {
  expect(result.accepted).toBe(true);
  if (!result.accepted) throw new Error(result.rejection.message);
  return result.state;
}

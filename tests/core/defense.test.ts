import { describe, expect, it } from "vitest";

import {
  createDefensePossession,
  playDefenseCard,
  previewDefenseCardImpact,
  resolveOpponentShot,
} from "../../src/core/index.ts";
import type {
  DefenseCardCatalog,
  DefensePossessionState,
  DefenseRuleResult,
  PlayDefenseCardCommand,
  RandomSource,
} from "../../src/core/index.ts";
import {
  PROTOTYPE_DEFENSE_CARDS,
  PROTOTYPE_DEFENSE_SETUP,
  PROTOTYPE_OPPONENT_DEFENSE_INTENTS,
  PROTOTYPE_OPPONENT_PLANS,
} from "../../src/content/prototypeDefense.ts";

describe("aktywne posiadanie defensywne", () => {
  it.each([
    [0, "pickAndRoll", "pnr-screen"],
    [0.4, "driveAndKick", "dak-drive"],
    [0.8, "quickThree", "q3-pass"],
  ] as const)(
    "wybiera deterministycznie plan %s i ujawnia tylko bieżącą akcję",
    (roll, planId, actionId) => {
      const state = createForRoll(roll);
      const serialized = JSON.stringify(state);

      expect(state.plan.id).toBe(planId);
      expect(state.currentAction.id).toBe(actionId);
      expect(state.phase).toBe("playerResponse");
      expect(state.hand).toHaveLength(5);
      expect(serialized).not.toContain("pnr-drive");
      expect(serialized).not.toContain("dak-pass");
      expect(serialized).not.toContain("q3-screen");
    },
  );

  it("Pressure zużywa dodatkowy czas, ale może oddać przewagę po Drive", () => {
    const state = createForRoll(0.4);
    const result = playAccepted(
      state,
      { cardId: "pressure", targetId: "opponent-pg" },
      sequenceRandom(0.99),
    );

    expect(result.shotClock).toBe(11);
    expect(result.opponentAdvantage).toBe(2);
    expect(result.turnoverPressure).toBe(1);
    expect(result.currentAction.id).toBe("dak-pass");
    expect(playerZone(result, "opponent-pg")).toBe("paint");
  });

  it("Switch zmienia krycie i neutralizuje przewagę zasłony", () => {
    const state = createForRoll(0);
    const result = playAccepted(state, {
      cardId: "switch",
      targetId: "opponent-pg",
    });

    expect(result.opponentAdvantage).toBe(0);
    expect(result.shotContest).toBe(5);
    expect(result.assignments).toEqual(
      expect.arrayContaining([
        { defenderId: "player-c", offenderId: "opponent-pg" },
        { defenderId: "player-pg", offenderId: "opponent-c" },
      ]),
    );
    expect(result.events).toContainEqual({ type: "coverageSwitched" });
  });

  it("Go Under zatrzymuje przewagę z zasłony kosztem przyszłego contestu", () => {
    const result = playAccepted(createForRoll(0), {
      cardId: "goUnder",
      targetId: "opponent-pg",
    });

    expect(result.opponentAdvantage).toBe(0);
    expect(result.shotContest).toBe(-8);
    expect(result.currentAction.id).toBe("pnr-drive");
  });

  it("publikuje porównywalny liczbowy wpływ odpowiedzi na Screen", () => {
    const state = createForRoll(0);

    expect(
      previewDefenseCardImpact(state, "switch", PROTOTYPE_DEFENSE_CARDS),
    ).toMatchObject({
      timeCost: 1,
      nextOpponentAdvantage: 0,
      shotQualityDelta: -5,
      turnoverChance: 0,
    });
    expect(
      previewDefenseCardImpact(state, "goUnder", PROTOTYPE_DEFENSE_CARDS),
    ).toMatchObject({
      nextOpponentAdvantage: 0,
      shotQualityDelta: 8,
    });
    expect(
      previewDefenseCardImpact(state, "pressure", PROTOTYPE_DEFENSE_CARDS),
    ).toMatchObject({
      timeCost: 3,
      nextOpponentAdvantage: 1,
      shotQualityDelta: 5,
      turnoverChance: 0,
    });
    expect(
      previewDefenseCardImpact(state, "doubleTeam", PROTOTYPE_DEFENSE_CARDS),
    ).toMatchObject({
      nextOpponentAdvantage: 0,
      shotQualityDelta: -1,
      turnoverChance: 0.3,
      exposureId: "opponent-c",
    });
  });

  it("Help Defense ogranicza Drive i jawnie odsłania partnera", () => {
    const result = playAccepted(createForRoll(0.4), {
      cardId: "helpDefense",
      targetId: "opponent-pg",
    });

    expect(result.opponentAdvantage).toBe(0);
    expect(result.shotContest).toBe(10);
    expect(result.exposedOpponentIds).toContain("opponent-wing");
    expect(result.events).toContainEqual({
      type: "opponentExposed",
      playerId: "opponent-wing",
    });
  });

  it("udostępnia trzy rozróżnialne intencje obrony dla ataku gracza", () => {
    expect(PROTOTYPE_OPPONENT_DEFENSE_INTENTS).toHaveLength(3);
    expect(
      new Set(PROTOTYPE_OPPONENT_DEFENSE_INTENTS.map((intent) => intent.id)).size,
    ).toBe(3);
    expect(
      new Set(
        PROTOTYPE_OPPONENT_DEFENSE_INTENTS.map(
          (intent) =>
            `${intent.onBallPressure}/${intent.matchupContest}/${intent.helpOnDrive}`,
        ),
      ).size,
    ).toBe(3);
  });

  it("Double Team może wymusić stratę seedowanym rzutem", () => {
    const state = createDefensePossession(
      PROTOTYPE_DEFENSE_SETUP,
      PROTOTYPE_OPPONENT_PLANS,
      42,
      sequenceRandom(0, 0),
    );
    const result = playAccepted(
      state,
      { cardId: "doubleTeam", targetId: "opponent-pg" },
      sequenceRandom(0),
    );

    expect(result.phase).toBe("completed");
    expect(result.result?.outcome).toBe("turnover");
    expect(result.events.at(-1)).toMatchObject({ type: "turnoverForced" });
  });

  it("presja z wcześniejszych kroków nie kumuluje automatycznej straty", () => {
    let state = createDefensePossession(
      {
        ...PROTOTYPE_DEFENSE_SETUP,
        hand: ["pressure", "pressure", "doubleTeam"],
      },
      PROTOTYPE_OPPONENT_PLANS,
      42,
      sequenceRandom(0.8),
    );
    state = playAccepted(state, {
      cardId: "pressure",
      targetId: "opponent-pg",
    });
    state = playAccepted(state, {
      cardId: "pressure",
      targetId: "opponent-wing",
    });

    expect(state.turnoverPressure).toBe(1);
    expect(state.phase).toBe("playerResponse");
  });

  it("koszt odpowiedzi może doprowadzić do końca czasu przed testem straty", () => {
    const state = createDefensePossession(
      { ...PROTOTYPE_DEFENSE_SETUP, shotClock: 3 },
      PROTOTYPE_OPPONENT_PLANS,
      42,
      sequenceRandom(0),
    );
    let randomCalls = 0;
    const result = playAccepted(
      state,
      { cardId: "doubleTeam", targetId: "opponent-pg" },
      {
        next: (rngState) => {
          randomCalls += 1;
          return { state: rngState + 1, value: 0 };
        },
      },
    );

    expect(result.phase).toBe("completed");
    expect(result.result).toEqual({ outcome: "clockExpired" });
    expect(randomCalls).toBe(0);
  });

  it("różne odpowiedzi na zasłonę prowadzą do innej jakości rzutu", () => {
    const switched = prepareQuickThree("switch");
    const under = prepareQuickThree("goUnder");

    expect(switched.pendingShot?.quality.totalScore).toBeLessThan(
      under.pendingShot?.quality.totalScore ?? 0,
    );
    expect(switched.pendingShot?.quality.modifiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "defensiveResponse" }),
      ]),
    );
  });

  it("rozstrzyga rzut tym samym seedowanym modelem jakości", () => {
    const pending = prepareQuickThree("switch");
    const made = resolveAccepted(pending, sequenceRandom(0));
    const missed = resolveAccepted(pending, sequenceRandom(0.99));

    expect(made.result?.outcome).toBe("made");
    expect(missed.result?.outcome).toBe("missed");
    expect(made.result?.quality).toEqual(missed.result?.quality);
    expect(made.result?.shotZone).toBe("leftPerimeter");
  });

  it("odrzuca złą kartę i cel bez zmiany stanu ani RNG", () => {
    const state = deepFreeze(createForRoll(0.4));
    const snapshot = JSON.stringify(state);
    let randomCalls = 0;
    const randomSource: RandomSource = {
      next: (rngState) => {
        randomCalls += 1;
        return { state: rngState + 1, value: 0 };
      },
    };
    const wrongCard = playDefenseCard(
      state,
      { cardId: "switch", targetId: "opponent-wing" },
      PROTOTYPE_DEFENSE_CARDS,
      PROTOTYPE_OPPONENT_PLANS,
      randomSource,
    );
    const wrongTarget = playDefenseCard(
      state,
      { cardId: "pressure", targetId: "opponent-wing" },
      PROTOTYPE_DEFENSE_CARDS,
      PROTOTYPE_OPPONENT_PLANS,
      randomSource,
    );

    expectRejected(wrongCard, "cardNotLegalAgainstAction");
    expectRejected(wrongTarget, "invalidTarget");
    expect(wrongCard.state).toBe(state);
    expect(wrongTarget.state).toBe(state);
    expect(randomCalls).toBe(0);
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it("odtwarza plan, decyzje, RNG i rezultat dla tego samego seeda", () => {
    expect(runDeterministicDefense(9123)).toEqual(runDeterministicDefense(9123));
  });
});

function prepareQuickThree(
  screenResponse: "switch" | "goUnder",
): DefensePossessionState {
  let state = createDefensePossession(
    PROTOTYPE_DEFENSE_SETUP,
    PROTOTYPE_OPPONENT_PLANS,
    42,
    sequenceRandom(0.8),
  );
  state = playAccepted(
    state,
    { cardId: "pressure", targetId: "opponent-pg" },
    sequenceRandom(0.99),
  );
  state = playAccepted(state, {
    cardId: screenResponse,
    targetId: "opponent-wing",
  });
  return playAccepted(
    state,
    { cardId: "doubleTeam", targetId: "opponent-wing" },
    sequenceRandom(0.99),
  );
}

function runDeterministicDefense(seed: number): DefensePossessionState {
  let state = createDefensePossession(
    PROTOTYPE_DEFENSE_SETUP,
    PROTOTYPE_OPPONENT_PLANS,
    seed,
  );
  while (state.phase === "playerResponse") {
    const command = firstLegalCommand(state);
    state = playAccepted(state, command);
  }
  return state.phase === "resolvingShot" ? resolveAccepted(state) : state;
}

function firstLegalCommand(state: DefensePossessionState): PlayDefenseCardCommand {
  const cards: DefenseCardCatalog = PROTOTYPE_DEFENSE_CARDS;
  const candidates: readonly PlayDefenseCardCommand[] = [
    { cardId: "switch", targetId: state.currentAction.targetId ?? "" },
    { cardId: "helpDefense", targetId: state.currentAction.actorId },
    { cardId: "goUnder", targetId: state.currentAction.targetId ?? "" },
    { cardId: "pressure", targetId: state.ballHandlerId },
    { cardId: "doubleTeam", targetId: state.ballHandlerId },
  ];
  const command = candidates.find((candidate) => {
    const card = cards[candidate.cardId];
    return card !== undefined &&
      state.hand.includes(candidate.cardId) &&
      card.effects[state.currentAction.kind] !== undefined;
  });
  if (command === undefined) throw new Error("Brak legalnej odpowiedzi testowej.");
  return command;
}

function createForRoll(roll: number): DefensePossessionState {
  return createDefensePossession(
    PROTOTYPE_DEFENSE_SETUP,
    PROTOTYPE_OPPONENT_PLANS,
    42,
    sequenceRandom(roll),
  );
}

function playAccepted(
  state: DefensePossessionState,
  command: PlayDefenseCardCommand,
  randomSource: RandomSource = sequenceRandom(0.99),
): DefensePossessionState {
  const result = playDefenseCard(
    state,
    command,
    PROTOTYPE_DEFENSE_CARDS,
    PROTOTYPE_OPPONENT_PLANS,
    randomSource,
  );
  expectAccepted(result);
  return result.state;
}

function resolveAccepted(
  state: DefensePossessionState,
  randomSource: RandomSource = sequenceRandom(0.99),
): DefensePossessionState {
  const result = resolveOpponentShot(state, randomSource);
  expectAccepted(result);
  return result.state;
}

function expectAccepted(
  result: DefenseRuleResult,
): asserts result is Extract<DefenseRuleResult, { accepted: true }> {
  expect(result.accepted).toBe(true);
  if (!result.accepted) throw new Error(result.rejection.message);
}

function expectRejected(result: DefenseRuleResult, code: string): void {
  expect(result.accepted).toBe(false);
  if (result.accepted) throw new Error("Oczekiwano odrzucenia.");
  expect(result.rejection.code).toBe(code);
}

function sequenceRandom(...values: readonly number[]): RandomSource {
  let index = 0;
  return {
    next: (rngState) => {
      const value = values[Math.min(index, values.length - 1)] ?? 0;
      index += 1;
      return { state: (rngState + index) >>> 0, value };
    },
  };
}

function playerZone(state: DefensePossessionState, playerId: string): string {
  return state.players.find((player) => player.id === playerId)?.zone ?? "missing";
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}

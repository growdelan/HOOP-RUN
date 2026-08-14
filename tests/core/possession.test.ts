import { describe, expect, it } from "vitest";

import {
  createPossession,
  playCard,
  resetPossession,
  resolveShot,
  startPossession,
} from "../../src/core/index.ts";
import type {
  PlayCardCommand,
  PossessionSetup,
  PossessionState,
  RuleResult,
} from "../../src/core/index.ts";
import {
  createPrototypePossession,
  PROTOTYPE_CARDS,
  PROTOTYPE_SETUP,
} from "../../src/content/prototypePossession.ts";

describe("silnik posiadania", () => {
  it("tworzy serializowalny setup z pełnym stanem prototypu", () => {
    const setupState = createPossession(PROTOTYPE_SETUP, 42);

    expect(setupState.phase).toBe("setup");
    expect(setupState.players).toHaveLength(6);
    expect(new Set(setupState.players.map((player) => player.zone))).toEqual(
      new Set([
        "leftPerimeter",
        "topPerimeter",
        "rightPerimeter",
        "paint",
      ]),
    );
    expect(setupState.ballHandlerId).toBe("offense-pg");
    expect(setupState.defense.assignments).toHaveLength(3);
    expect(setupState.defense.intent.id).toBe("pressure-and-help");
    expect(setupState.hand).toEqual([
      "pass",
      "screen",
      "drive",
      "kickOut",
      "shot",
    ]);
    expect(setupState.deck).toEqual(setupState.hand);
    expect(setupState.events).toEqual([]);
    expect(() => JSON.parse(JSON.stringify(setupState))).not.toThrow();

    const started = startPossession(setupState);
    expectAccepted(started);
    expect(started.state.phase).toBe("playerTurn");
  });

  it("obsługuje Pass jako legalną, niemutującą zmianę posiadacza", () => {
    const state = createPrototypePossession(42);
    const snapshot = JSON.stringify(state);

    const result = playAccepted(state, {
      cardId: "pass",
      actorId: "offense-pg",
      targetId: "offense-sg",
    });

    expect(result.ballHandlerId).toBe("offense-sg");
    expect(result.shotClock).toBe(12);
    expect(result.hand).not.toContain("pass");
    expect(result.history.at(-1)).toMatchObject({ kind: "pass", timeCost: 2 });
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it("zagranie usuwa tylko jedną kopię tej samej karty z ręki", () => {
    const state = resetPossession(
      { ...PROTOTYPE_SETUP, hand: ["pass", "pass", "shot"] },
      42,
    );
    const result = playAccepted(state, {
      cardId: "pass",
      actorId: "offense-pg",
      targetId: "offense-sg",
    });

    expect(result.hand).toEqual(["pass", "shot"]);
  });

  it("pozwala skontrować presję sekwencją Screen → Drive → Kick Out → Shot", () => {
    let state = createPrototypePossession(42);
    state = playAccepted(state, {
      cardId: "screen",
      actorId: "offense-c",
      targetId: "offense-pg",
    });

    const driveResult = playCard(
      state,
      { cardId: "drive", actorId: "offense-pg" },
      PROTOTYPE_CARDS,
    );
    expectAccepted(driveResult);
    expect(driveResult.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "defenseReacted",
          reaction: "pressureBeaten",
        }),
        expect.objectContaining({
          type: "defenseReacted",
          reaction: "helpCommitted",
        }),
      ]),
    );
    expect(driveResult.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "advantageChanged",
          source: "screenedDrive",
          delta: 2,
        }),
      ]),
    );
    state = driveResult.state;
    expect(playerZone(state, "offense-pg")).toBe("paint");
    expect(state.advantage).toBe(2);
    expect(state.openPlayerIds).not.toContain("offense-pg");

    state = playAccepted(state, {
      cardId: "kickOut",
      actorId: "offense-pg",
      targetId: "offense-sg",
    });
    expect(state.ballHandlerId).toBe("offense-sg");
    expect(state.openPlayerIds).toContain("offense-sg");
    expect(state.advantage).toBe(3);

    state = playAccepted(state, {
      cardId: "shot",
      actorId: "offense-sg",
    });
    expect(state.phase).toBe("resolvingShot");
    expect(state.pendingShot?.quality).toEqual({
      baseScore: 76,
      modifiers: [
        { source: "baseSkill", value: 76 },
        { source: "zone", value: 0 },
        { source: "createdOpenLook", value: 16 },
        { source: "advantage", value: 18 },
      ],
      totalScore: 95,
      category: "Perfect",
    });
    expect(state.shotClock).toBe(4);
  });

  it("wylicza gorszą i wyjaśnialnie inną jakość rzutu natychmiastowego", () => {
    const immediate = playAccepted(createPrototypePossession(42), {
      cardId: "shot",
      actorId: "offense-pg",
    });
    const prepared = prepareShot(42);

    expect(immediate.pendingShot?.quality).toEqual({
      baseScore: 60,
      modifiers: [
        { source: "baseSkill", value: 60 },
        { source: "zone", value: 0 },
        { source: "matchupContest", value: -12 },
        { source: "onBallPressure", value: -6 },
      ],
      totalScore: 42,
      category: "Contested",
    });
    expect(prepared.pendingShot?.quality.category).toBe("Perfect");
    expect(prepared.pendingShot?.quality.totalScore).toBeGreaterThan(
      immediate.pendingShot?.quality.totalScore ?? 0,
    );
  });

  it("nagradza otwarte wykończenie po zasłonie, gdy obrona nie wysyła pomocy", () => {
    const setup: PossessionSetup = {
      ...PROTOTYPE_SETUP,
      defense: {
        ...PROTOTYPE_SETUP.defense,
        intent: {
          id: "deny-perimeter",
          name: "Deny Perimeter",
          description: "Presja na obwodzie bez pomocy w paint.",
          onBallPressure: 8,
          matchupContest: 16,
          helpOnDrive: false,
        },
      },
    };
    const immediate = playAccepted(resetPossession(setup, 42), {
      cardId: "shot",
      actorId: "offense-pg",
    });
    let state = resetPossession(setup, 42);
    state = playAccepted(state, {
      cardId: "screen",
      actorId: "offense-c",
      targetId: "offense-pg",
    });
    const drive = playAccepted(state, {
      cardId: "drive",
      actorId: "offense-pg",
    });
    const shot = playAccepted(drive, {
      cardId: "shot",
      actorId: "offense-pg",
    });

    expect(drive.openPlayerIds).toContain("offense-pg");
    expect(drive.events).toContainEqual({
      type: "defenseReacted",
      reaction: "uncontestedFinish",
    });
    expect(shot.pendingShot?.quality).toMatchObject({
      totalScore: 80,
      category: "Perfect",
    });
    expect((shot.pendingShot?.quality.totalScore ?? 0) * 1).toBeGreaterThan(
      (immediate.pendingShot?.quality.totalScore ?? 0) * 2,
    );
  });

  it("odrzuca nielegalną akcję ze stabilnym powodem bez zmiany stanu ani RNG", () => {
    const state = deepFreeze(createPrototypePossession(42));
    const snapshot = JSON.stringify(state);

    const result = playCard(
      state,
      {
        cardId: "kickOut",
        actorId: "offense-pg",
        targetId: "offense-sg",
      },
      PROTOTYPE_CARDS,
    );

    expect(result.accepted).toBe(false);
    if (result.accepted) throw new Error("Oczekiwano odrzucenia akcji.");
    expect(result.rejection).toEqual({
      code: "kickOutRequiresPaint",
      message: "Kick Out wymaga wejścia w paint.",
    });
    expect(result.state).toBe(state);
    expect(result.events).toEqual([]);
    expect(result.state.rngState).toBe(42);
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it("egzekwuje typowany sposób wskazywania celu z definicji karty", () => {
    const state = createPrototypePossession(42);
    const missingTarget = playCard(
      state,
      { cardId: "pass", actorId: "offense-pg" },
      PROTOTYPE_CARDS,
    );
    const unexpectedTarget = playCard(
      state,
      {
        cardId: "shot",
        actorId: "offense-pg",
        targetId: "offense-sg",
      },
      PROTOTYPE_CARDS,
    );

    expect(missingTarget.accepted).toBe(false);
    expect(unexpectedTarget.accepted).toBe(false);
    if (missingTarget.accepted || unexpectedTarget.accepted) {
      throw new Error("Oczekiwano odrzucenia błędnego celu.");
    }
    expect(missingTarget.rejection.code).toBe("invalidTarget");
    expect(unexpectedTarget.rejection.code).toBe("invalidTarget");
    expect(missingTarget.state).toBe(state);
    expect(unexpectedTarget.state).toBe(state);
  });

  it("odrzuca koszt większy od zegara, a legalne zużycie ostatniego czasu kończy posiadanie", () => {
    const shortSetup: PossessionSetup = {
      ...PROTOTYPE_SETUP,
      shotClock: 2,
      hand: ["pass", "drive"],
    };
    const state = resetPossession(shortSetup, 42);

    const rejectedDrive = playCard(
      state,
      { cardId: "drive", actorId: "offense-pg" },
      PROTOTYPE_CARDS,
    );
    expect(rejectedDrive.accepted).toBe(false);
    if (rejectedDrive.accepted) throw new Error("Oczekiwano odrzucenia akcji.");
    expect(rejectedDrive.rejection.code).toBe("notEnoughTime");
    expect(rejectedDrive.state).toBe(state);

    const expired = playAccepted(state, {
      cardId: "pass",
      actorId: "offense-pg",
      targetId: "offense-sg",
    });
    expect(expired.phase).toBe("completed");
    expect(expired.shotClock).toBe(0);
    expect(expired.result).toEqual({ outcome: "clockExpired" });
    expect(expired.events.at(-1)).toEqual({ type: "clockExpired" });
  });

  it("pozwala oddać rzut dokładnie w ostatniej dostępnej jednostce czasu", () => {
    const lastSecondSetup: PossessionSetup = {
      ...PROTOTYPE_SETUP,
      shotClock: 3,
      hand: ["shot"],
    };

    const shot = playAccepted(resetPossession(lastSecondSetup, 42), {
      cardId: "shot",
      actorId: "offense-pg",
    });

    expect(shot.shotClock).toBe(0);
    expect(shot.phase).toBe("resolvingShot");
    expect(shot.result).toBeUndefined();
  });

  it("odtwarza identyczny finał dla tego samego seeda i sekwencji", () => {
    const first = runImmediateShot(42);
    const second = runImmediateShot(42);
    const reset = runImmediateShot(42);

    expect(first).toEqual(second);
    expect(reset).toEqual(first);
    expect(first.phase).toBe("completed");
  });

  it("pozwala seedowi zmienić wynik bez zmiany wyliczonej jakości", () => {
    const made = runImmediateShot(42);
    const missed = runImmediateShot(123_456);

    expect(made.result?.outcome).toBe("made");
    expect(missed.result?.outcome).toBe("missed");
    expect(made.result?.quality).toEqual(missed.result?.quality);
    expect(made.result?.roll).not.toBe(missed.result?.roll);
    expect(made.events.at(-1)?.type).toBe("shotResolved");
  });

  it("odrzuca definicję karty z niepoprawnym kosztem czasu", () => {
    const state = createPrototypePossession(42);
    const invalidCatalog = {
      ...PROTOTYPE_CARDS,
      pass: { ...PROTOTYPE_CARDS.pass, timeCost: 0 },
    };

    const result = playCard(
      state,
      {
        cardId: "pass",
        actorId: "offense-pg",
        targetId: "offense-sg",
      },
      invalidCatalog,
    );

    expect(result.accepted).toBe(false);
    if (result.accepted) throw new Error("Oczekiwano odrzucenia definicji.");
    expect(result.rejection.code).toBe("invalidCardDefinition");
    expect(result.state).toBe(state);
  });

  it("nie rozstrzyga rzutu drugi raz ani nie konsumuje RNG poza właściwą fazą", () => {
    const completed = resolveAccepted(prepareShot(42));
    let calls = 0;
    const result = resolveShot(completed, {
      next: (state) => {
        calls += 1;
        return { state: state + 1, value: 0 };
      },
    });

    expect(result.accepted).toBe(false);
    expect(result.state).toBe(completed);
    expect(calls).toBe(0);
  });
});

function prepareShot(seed: number): PossessionState {
  let state = createPrototypePossession(seed);
  state = playAccepted(state, {
    cardId: "screen",
    actorId: "offense-c",
    targetId: "offense-pg",
  });
  state = playAccepted(state, {
    cardId: "drive",
    actorId: "offense-pg",
  });
  state = playAccepted(state, {
    cardId: "kickOut",
    actorId: "offense-pg",
    targetId: "offense-sg",
  });
  return playAccepted(state, { cardId: "shot", actorId: "offense-sg" });
}

function runImmediateShot(seed: number): PossessionState {
  const shot = playAccepted(createPrototypePossession(seed), {
    cardId: "shot",
    actorId: "offense-pg",
  });
  return resolveAccepted(shot);
}

function playAccepted(
  state: PossessionState,
  command: PlayCardCommand,
): PossessionState {
  const result = playCard(state, command, PROTOTYPE_CARDS);
  expectAccepted(result);
  return result.state;
}

function resolveAccepted(state: PossessionState): PossessionState {
  const result = resolveShot(state);
  expectAccepted(result);
  return result.state;
}

function expectAccepted(
  result: RuleResult,
): asserts result is Extract<RuleResult, { accepted: true }> {
  expect(result.accepted).toBe(true);
  if (!result.accepted) {
    throw new Error(`Akcja odrzucona: ${result.rejection.code}`);
  }
}

function playerZone(state: PossessionState, playerId: string): string | undefined {
  return state.players.find((player) => player.id === playerId)?.zone;
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return value;
}

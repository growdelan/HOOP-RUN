import { describe, expect, it } from "vitest";

import {
  advanceMatch,
  completeMatchPossession,
  createMatch,
  isWinningScore,
  resetMatch,
} from "../../src/core/index.ts";
import type {
  MatchPossessionOutcome,
  MatchRuleResult,
  MatchState,
  Zone,
} from "../../src/core/index.ts";
import { PROTOTYPE_MATCH_SETUP } from "../../src/content/prototypeMatch.ts";

describe("agregat pełnego meczu", () => {
  it("tworzy serializowalny mecz z jednym RNG i niezależnymi taliami", () => {
    const state = createMatch(PROTOTYPE_MATCH_SETUP, 42);

    expect(state.phase).toBe("activePossession");
    expect(state.score).toEqual({ player: 0, opponent: 0 });
    expect(state.attackingTeam).toBe("player");
    expect(state.playerRole).toBe("offense");
    expect(state.activePossession).toEqual({ kind: "playerOffense" });
    expect(state.offenseDeck.hand).toHaveLength(5);
    expect(state.offenseDeck.hand).toContain("shot");
    expect(state.defenseDeck.hand).toEqual([]);
    expect(state.rngState).not.toBe(state.initialSeed);
    expect(() => JSON.parse(JSON.stringify(state))).not.toThrow();
  });

  it.each([
    [{ player: 11, opponent: 9 }, "player"],
    [{ player: 11, opponent: 10 }, undefined],
    [{ player: 12, opponent: 10 }, "player"],
    [{ player: 14, opponent: 14 }, undefined],
    [{ player: 15, opponent: 14 }, "player"],
    [{ player: 8, opponent: 11 }, "opponent"],
  ] as const)("rozstrzyga wynik %o jako %s", (score, winner) => {
    expect(isWinningScore(score)).toBe(winner);
  });

  it("przyznaje 1 lub 2 punkty i przełącza rolę dopiero po Dalej", () => {
    const initial = deepFreeze(createMatch(PROTOTYPE_MATCH_SETUP, 42));
    const initialSnapshot = JSON.stringify(initial);
    const paint = completeAccepted(initial, "made", "paint");

    expect(paint.phase).toBe("possessionSummary");
    expect(paint.score).toEqual({ player: 1, opponent: 0 });
    expect(paint.attackingTeam).toBe("player");
    expect(paint.playerRole).toBe("offense");
    expect(paint.offenseDeck.hand).toEqual([]);
    expect(paint.offenseDeck.discardPile).toHaveLength(5);
    expect(JSON.stringify(initial)).toBe(initialSnapshot);

    const defense = advanceAccepted(paint);
    expect(defense.attackingTeam).toBe("opponent");
    expect(defense.playerRole).toBe("defense");
    expect(defense.possessionNumber).toBe(2);
    expect(defense.activePossession).toEqual({ kind: "playerDefense" });
    expect(defense.defenseDeck.hand).toHaveLength(5);
    expect(defense.defenseDeck.hand.filter((card) => card === "pressure")).toHaveLength(2);
    expect(defense.defenseDeck.hand).toContain("doubleTeam");

    const perimeter = completeAccepted(defense, "made", "topPerimeter");
    expect(perimeter.score).toEqual({ player: 1, opponent: 2 });
    expect(perimeter.stats.player.points).toBe(1);
    expect(perimeter.stats.opponent.points).toBe(2);
  });

  it.each(["missed", "turnover", "clockExpired"] as const)(
    "%s kończy posiadanie bez zmiany wyniku",
    (outcome) => {
      const state = completeAccepted(
        createMatch(PROTOTYPE_MATCH_SETUP, 42),
        outcome,
      );

      expect(state.score).toEqual({ player: 0, opponent: 0 });
      expect(state.stats.player.possessions).toBe(1);
      expect(state.stats.player[outcomeStat(outcome)]).toBe(1);
    },
  );

  it("utrzymuje niezależne cykle talii i deterministycznie przetasowuje odrzucone", () => {
    const setup = {
      offenseDeck: ["o1", "o2", "o3", "o4"],
      defenseDeck: ["d1", "d2", "d3", "d4"],
      handSize: 2,
    };
    let state = createMatch(setup, 7);
    const firstOffenseHand = [...state.offenseDeck.hand];
    const untouchedDefense = JSON.stringify(state.defenseDeck);

    state = completeAccepted(state, "missed");
    expect(JSON.stringify(state.defenseDeck)).toBe(untouchedDefense);
    state = advanceAccepted(state);
    const firstDefenseHand = [...state.defenseDeck.hand];
    state = completeAccepted(state, "turnover");
    state = advanceAccepted(state);
    const secondOffenseHand = [...state.offenseDeck.hand];
    expect(secondOffenseHand).not.toEqual(firstOffenseHand);
    state = completeAccepted(state, "clockExpired");
    state = advanceAccepted(state);
    const secondDefenseHand = [...state.defenseDeck.hand];
    expect(secondDefenseHand).not.toEqual(firstDefenseHand);

    state = completeAccepted(state, "missed");
    state = advanceAccepted(state);
    expect(state.offenseDeck.hand).toHaveLength(2);
    expect(state.offenseDeck.discardPile).toEqual([]);
  });

  it("odtwarza również przebieg obejmujący przetasowanie odrzuconych", () => {
    expect(runDeckCycle(7)).toEqual(runDeckCycle(7));
  });

  it("gwarantuje minimalnie grywalną rękę po kolejnych przetasowaniach", () => {
    let state = createMatch(PROTOTYPE_MATCH_SETUP, 43);

    for (let possession = 0; possession < 12; possession += 1) {
      if (state.playerRole === "offense") {
        expect(state.offenseDeck.hand).toContain("shot");
      } else {
        expect(state.defenseDeck.hand.filter((card) => card === "pressure")).toHaveLength(2);
        expect(state.defenseDeck.hand).toContain("doubleTeam");
      }

      state = completeAccepted(state, "missed");
      state = advanceAccepted(state);
    }
  });

  it("kończy mecz po potwierdzeniu zwycięskiego podsumowania", () => {
    const state = createMatch(PROTOTYPE_MATCH_SETUP, 42);
    const nearWin: MatchState = {
      ...state,
      score: { player: 10, opponent: 9 },
    };
    const summary = completeAccepted(nearWin, "made", "paint");

    expect(summary.score).toEqual({ player: 11, opponent: 9 });
    expect(summary.winner).toBe("player");
    expect(summary.phase).toBe("possessionSummary");

    const completed = advanceAccepted(summary);
    expect(completed.phase).toBe("completed");
    expect(completed.winner).toBe("player");
    expect(completed.possessionNumber).toBe(1);

    const rejected = advanceMatch(completed);
    expectRejected(rejected, "invalidPhase");
  });

  it("odtwarza ręce, historię, statystyki i wynik dla tego samego seeda", () => {
    const first = runControlledMatch(1234);
    const second = runControlledMatch(1234);

    expect(first).toEqual(second);
    expect(resetMatch(first)).toEqual(createMatch(PROTOTYPE_MATCH_SETUP, 1234));
  });

  it("odrzuca błędne rozstrzygnięcie bez zmiany stanu", () => {
    const state = createMatch(PROTOTYPE_MATCH_SETUP, 42);
    const missingZone = completeMatchPossession(state, {
      outcome: "made",
      usedCardIds: [],
      rngState: state.rngState,
    });
    const unknownCard = completeMatchPossession(state, {
      outcome: "missed",
      usedCardIds: ["not-in-hand"],
      rngState: state.rngState,
    });

    expectRejected(missingZone, "missingShotZone");
    expectRejected(unknownCard, "invalidUsedCards");
    expect(missingZone.state).toBe(state);
    expect(unknownCard.state).toBe(state);
  });
});

function runControlledMatch(seed: number): MatchState {
  let state = createMatch(PROTOTYPE_MATCH_SETUP, seed);
  state = completeAccepted(state, "made", "paint");
  state = advanceAccepted(state);
  state = completeAccepted(state, "missed");
  state = advanceAccepted(state);
  state = completeAccepted(state, "made", "rightPerimeter");
  return state;
}

function runDeckCycle(seed: number): MatchState {
  const setup = {
    offenseDeck: ["o1", "o2", "o3", "o4"],
    defenseDeck: ["d1", "d2", "d3", "d4"],
    handSize: 2,
  };
  let state = createMatch(setup, seed);
  for (let possession = 0; possession < 5; possession += 1) {
    state = completeAccepted(state, "missed");
    state = advanceAccepted(state);
  }
  return state;
}

function completeAccepted(
  state: MatchState,
  outcome: MatchPossessionOutcome,
  shotZone?: Zone,
): MatchState {
  const hand =
    state.playerRole === "offense"
      ? state.offenseDeck.hand
      : state.defenseDeck.hand;
  const result = completeMatchPossession(state, {
    outcome,
    ...(shotZone === undefined ? {} : { shotZone }),
    usedCardIds: hand.slice(0, 1),
    rngState: state.rngState,
  });
  expectAccepted(result);
  return result.state;
}

function advanceAccepted(state: MatchState): MatchState {
  const result = advanceMatch(state);
  expectAccepted(result);
  return result.state;
}

function expectAccepted(
  result: MatchRuleResult,
): asserts result is Extract<MatchRuleResult, { accepted: true }> {
  expect(result.accepted).toBe(true);
  if (!result.accepted) throw new Error(result.rejection.message);
}

function expectRejected(
  result: MatchRuleResult,
  code: string,
): asserts result is Extract<MatchRuleResult, { accepted: false }> {
  expect(result.accepted).toBe(false);
  if (result.accepted) throw new Error("Oczekiwano odrzucenia.");
  expect(result.rejection.code).toBe(code);
}

function outcomeStat(
  outcome: Exclude<MatchPossessionOutcome, "made">,
): "missed" | "turnovers" | "clockExpired" {
  if (outcome === "turnover") return "turnovers";
  return outcome;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}

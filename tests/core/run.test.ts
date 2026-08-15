import { describe, expect, it } from "vitest";

import {
  createRun,
  getRunRngState,
  reduceRun,
  resetRun,
} from "../../src/core/index.ts";
import type {
  RunRuleResult,
  RunState,
} from "../../src/core/index.ts";
import { PROTOTYPE_RUN_SETUP } from "../../src/content/prototypeRun.ts";

describe("agregat trzy-meczowego runu", () => {
  it("tworzy serializowalny stan pierwszego etapu z jednym zsynchronizowanym RNG", () => {
    const state = createRun(PROTOTYPE_RUN_SETUP, 42);

    expect(state.phase).toBe("activeMatch");
    expect(state.opponentIndex).toBe(0);
    expect(state.opponentIds).toEqual([
      "fundamentals",
      "perimeterCrew",
      "paintKings",
    ]);
    expect(state.rngState).toBeUndefined();
    expect(state.activeMatch?.rngState).toBe(getRunRngState(state));
    expect(state.offenseDeck).toEqual(PROTOTYPE_RUN_SETUP.offenseDeck);
    expect(state.defenseDeck).toEqual(PROTOTYPE_RUN_SETUP.defenseDeck);
    expect(state.matchResults).toEqual([]);
    expect(state.selectedRewards).toEqual([]);
    expect(() => JSON.parse(JSON.stringify(state))).not.toThrow();
  });

  it("odrzuca inną kolejność niż trzy zatwierdzone etapy", () => {
    expect(() =>
      createRun(
        {
          ...PROTOTYPE_RUN_SETUP,
          opponentIds: ["paintKings", "perimeterCrew", "fundamentals"],
        },
        42,
      ),
    ).toThrow("zatwierdzoną kolejność");
  });

  it("po dwóch zwycięstwach tworzy ofertę dokładnie raz i dopisuje tylko wybraną kartę", () => {
    const initial = deepFreeze(createRun(PROTOTYPE_RUN_SETUP, 77));
    const initialSnapshot = JSON.stringify(initial);
    const firstOffer = winCurrentMatch(initial);
    const offerSnapshot = JSON.stringify(firstOffer);

    expect(firstOffer.phase).toBe("rewardSelection");
    expect(firstOffer.rewardOffer).toHaveLength(3);
    expect(new Set(firstOffer.rewardOffer?.map((entry) => entry.cardId)).size).toBe(3);
    expect(firstOffer.rewardOffer?.map((entry) => entry.role)).toContain("offense");
    expect(firstOffer.rewardOffer?.map((entry) => entry.role)).toContain("defense");
    expect(firstOffer.activeMatch).toBeUndefined();
    expect(JSON.stringify(initial)).toBe(initialSnapshot);

    const offenseIndex = firstOffer.rewardOffer?.findIndex(
      (entry) => entry.role === "offense",
    );
    const defenseIndex = firstOffer.rewardOffer?.findIndex(
      (entry) => entry.role === "defense",
    );
    if (offenseIndex === undefined || defenseIndex === undefined) {
      throw new Error("Oferta nie zawiera obu ról.");
    }
    const offenseChoice = accepted(
      dispatch(firstOffer, { type: "chooseReward", offerIndex: offenseIndex }),
    );
    const defenseChoice = accepted(
      dispatch(firstOffer, { type: "chooseReward", offerIndex: defenseIndex }),
    );
    expect(offenseChoice.offenseDeck).toHaveLength(initial.offenseDeck.length + 1);
    expect(offenseChoice.defenseDeck).toEqual(initial.defenseDeck);
    expect(defenseChoice.defenseDeck).toHaveLength(initial.defenseDeck.length + 1);
    expect(defenseChoice.offenseDeck).toEqual(initial.offenseDeck);

    const rejected = dispatch(firstOffer, { type: "advanceMatch" });
    expectRejected(rejected, "invalidPhase");
    expect(rejected.state).toBe(firstOffer);
    expect(JSON.stringify(rejected.state)).toBe(offerSnapshot);

    const chosenEntry = firstOffer.rewardOffer?.[1];
    if (chosenEntry === undefined) throw new Error("Brak pozycji oferty.");
    const chosen = accepted(
      dispatch(firstOffer, { type: "chooseReward", offerIndex: 1 }),
    );
    const expectedOffense =
      chosenEntry.role === "offense"
        ? [...initial.offenseDeck, chosenEntry.cardId]
        : initial.offenseDeck;
    const expectedDefense =
      chosenEntry.role === "defense"
        ? [...initial.defenseDeck, chosenEntry.cardId]
        : initial.defenseDeck;

    expect(chosen.phase).toBe("intermission");
    expect(chosen.opponentIndex).toBe(1);
    expect(chosen.offenseDeck).toEqual(expectedOffense);
    expect(chosen.defenseDeck).toEqual(expectedDefense);
    expect(chosen.selectedRewards).toEqual([
      { ...chosenEntry, afterOpponentIndex: 0 },
    ]);
    expect(chosen.rewardOffer).toBeUndefined();

    const secondMatch = accepted(dispatch(chosen, { type: "startNextMatch" }));
    expect(secondMatch.activeMatch?.setup.offenseDeck).toEqual(expectedOffense);
    expect(secondMatch.activeMatch?.setup.defenseDeck).toEqual(expectedDefense);
    expect(secondMatch.rngState).toBeUndefined();
    expect(secondMatch.activeMatch?.rngState).toBe(getRunRngState(secondMatch));

    const secondOffer = winCurrentMatch(secondMatch);
    expect(secondOffer.phase).toBe("rewardSelection");
    expect(secondOffer.matchResults).toHaveLength(2);
  });

  it.each([0, 1, 2])(
    "porażka na etapie %i kończy run bez oferty",
    (failureStage) => {
      let state = createRun(PROTOTYPE_RUN_SETUP, 100 + failureStage);
      for (let stage = 0; stage < failureStage; stage += 1) {
        state = winCurrentMatch(state);
        state = accepted(
          dispatch(state, { type: "chooseReward", offerIndex: stage % 3 }),
        );
        state = accepted(dispatch(state, { type: "startNextMatch" }));
      }

      state = loseCurrentMatch(state);

      expect(state.phase).toBe("completedFailure");
      expect(state.outcome).toBe("failure");
      expect(state.opponentIndex).toBe(failureStage);
      expect(state.matchResults).toHaveLength(failureStage + 1);
      expect(state.matchResults.at(-1)?.winner).toBe("opponent");
      expect(state.rewardOffer).toBeUndefined();
      expect(state.activeMatch).toBeUndefined();
    },
  );

  it("trzecie zwycięstwo kończy run sukcesem bez trzeciej nagrody", () => {
    const state = runControlledSuccess(4321);

    expect(state.phase).toBe("completedSuccess");
    expect(state.outcome).toBe("success");
    expect(state.opponentIndex).toBe(2);
    expect(state.matchResults.map((result) => result.opponentId)).toEqual([
      "fundamentals",
      "perimeterCrew",
      "paintKings",
    ]);
    expect(state.selectedRewards).toHaveLength(2);
    expect(state.rewardOffer).toBeUndefined();
    expect(state.activeMatch).toBeUndefined();
  });

  it("odtwarza cały stan dla tego samego seeda, wyników i wyborów", () => {
    expect(runControlledSuccess(987654)).toEqual(runControlledSuccess(987654));
  });

  it("odrzuca nielegalne wybory bez zmiany stanu ani RNG", () => {
    const active = createRun(PROTOTYPE_RUN_SETUP, 42);
    const activeRng = getRunRngState(active);
    const invalidMatchCommand = dispatch(active, {
      type: "completeMatchPossession",
      resolution: {
        outcome: "made",
        usedCardIds: [],
        rngState: 999,
      },
    });
    expectRejected(invalidMatchCommand, "invalidMatchCommand");
    expect(invalidMatchCommand.state).toBe(active);
    expect(getRunRngState(invalidMatchCommand.state)).toBe(activeRng);

    const invalidPhase = dispatch(active, {
      type: "chooseReward",
      offerIndex: 0,
    });
    expectRejected(invalidPhase, "invalidPhase");
    expect(invalidPhase.state).toBe(active);

    const offer = winCurrentMatch(active);
    const rngBefore = getRunRngState(offer);
    const invalidIndex = dispatch(offer, {
      type: "chooseReward",
      offerIndex: 3,
    });
    expectRejected(invalidIndex, "invalidRewardIndex");
    expect(invalidIndex.state).toBe(offer);
    expect(getRunRngState(invalidIndex.state)).toBe(rngBefore);
  });

  it("nowy run przywraca startowe talie, wyniki, nagrody i pierwszy etap", () => {
    const completed = runControlledSuccess(2026);
    const reset = resetRun(completed, 2027);

    expect(reset).toEqual(createRun(PROTOTYPE_RUN_SETUP, 2027));
    expect(reset.offenseDeck).toEqual(PROTOTYPE_RUN_SETUP.offenseDeck);
    expect(reset.defenseDeck).toEqual(PROTOTYPE_RUN_SETUP.defenseDeck);
    expect(reset.matchResults).toEqual([]);
    expect(reset.selectedRewards).toEqual([]);
    expect(reset.opponentIndex).toBe(0);
  });
});

function runControlledSuccess(seed: number): RunState {
  let state = createRun(PROTOTYPE_RUN_SETUP, seed);
  state = winCurrentMatch(state);
  state = accepted(dispatch(state, { type: "chooseReward", offerIndex: 0 }));
  state = accepted(dispatch(state, { type: "startNextMatch" }));
  state = winCurrentMatch(state);
  state = accepted(dispatch(state, { type: "chooseReward", offerIndex: 2 }));
  state = accepted(dispatch(state, { type: "startNextMatch" }));
  return winCurrentMatch(state);
}

function winCurrentMatch(state: RunState): RunState {
  return finishCurrentMatch(state, "player");
}

function loseCurrentMatch(state: RunState): RunState {
  return finishCurrentMatch(state, "opponent");
}

function finishCurrentMatch(
  state: RunState,
  winner: "player" | "opponent",
): RunState {
  const match = state.activeMatch;
  if (match === undefined) throw new Error("Brak aktywnego meczu.");
  const preparedMatch = {
    ...match,
    score: winner === "player" ? { player: 10, opponent: 0 } : { player: 0, opponent: 10 },
    attackingTeam: winner,
    playerRole: winner === "player" ? "offense" as const : "defense" as const,
    activePossession:
      winner === "player"
        ? { kind: "playerOffense" as const }
        : { kind: "playerDefense" as const },
  };
  const preparedState = { ...state, activeMatch: preparedMatch };
  const summary = accepted(
    dispatch(preparedState, {
      type: "completeMatchPossession",
      resolution: {
        outcome: "made",
        shotZone: "paint",
        usedCardIds: [],
        rngState: match.rngState,
      },
    }),
  );
  return accepted(dispatch(summary, { type: "advanceMatch" }));
}

function dispatch(
  state: RunState,
  command: Parameters<typeof reduceRun>[1],
): RunRuleResult {
  return reduceRun(state, command);
}

function accepted(result: RunRuleResult): RunState {
  expect(result.accepted).toBe(true);
  if (!result.accepted) throw new Error(result.rejection.message);
  return result.state;
}

function expectRejected(
  result: RunRuleResult,
  code: string,
): asserts result is Extract<RunRuleResult, { accepted: false }> {
  expect(result.accepted).toBe(false);
  if (result.accepted) throw new Error("Oczekiwano odrzucenia.");
  expect(result.rejection.code).toBe(code);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}

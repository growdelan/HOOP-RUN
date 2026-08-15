import { describe, expect, it } from "vitest";

import { PROTOTYPE_RUN_SETUP } from "../../src/content/prototypeRun.ts";
import {
  createRun,
  createRunCheckpoint,
  decodeRunCheckpoint,
  encodeRunCheckpoint,
  getRunRngState,
  reduceRun,
  restoreRunFromCheckpoint,
} from "../../src/core/index.ts";
import type { RunRuleResult, RunState } from "../../src/core/index.ts";

describe("RunCheckpointV1", () => {
  it("koduje wyłącznie kanoniczny stan intermission i odtwarza go bez utraty danych", () => {
    const state = firstIntermission(42);
    const created = createRunCheckpoint(state, 12_345, PROTOTYPE_RUN_SETUP, 14);
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error(created.error.message);

    const serialized = encodeRunCheckpoint(created.value);
    expect(serialized).not.toContain("activeMatch");
    expect(serialized).not.toContain("rewardOffer");
    expect(serialized).not.toContain("outcome");
    expect(serialized).not.toContain("savedAt");
    expect(created.value).toMatchObject({
      kind: "hoop-run.run-checkpoint",
      version: 1,
      contentVersion: 1,
      elapsedActiveMs: 12_345,
      shotClock: 14,
      run: { phase: "intermission", opponentIndex: 1, rngState: getRunRngState(state) },
    });

    const decoded = decodeRunCheckpoint(serialized, PROTOTYPE_RUN_SETUP);
    expect(decoded).toEqual(created);
    if (!decoded.ok) throw new Error(decoded.error.message);
    expect(restoreRunFromCheckpoint(decoded.value)).toEqual(state);
  });

  it("odrzuca zapis w aktywnym meczu i przy nierozstrzygniętej ofercie bez zmiany stanu", () => {
    const active = createRun(PROTOTYPE_RUN_SETUP, 7);
    expect(createRunCheckpoint(active, 0, PROTOTYPE_RUN_SETUP, 14)).toMatchObject({
      ok: false,
      error: { code: "invalidPhase" },
    });
    const offer = winCurrentMatch(active);
    expect(offer.phase).toBe("rewardSelection");
    expect(createRunCheckpoint(offer, 0, PROTOTYPE_RUN_SETUP, 14)).toMatchObject({
      ok: false,
      error: { code: "invalidPhase" },
    });
  });

  it.each([
    ["niepoprawny JSON", "{", "invalidJson"],
    ["brak pola", JSON.stringify({ kind: "hoop-run.run-checkpoint" }), "invalidStructure"],
    ["wersja formatu", undefined, "unsupportedVersion"],
    ["wersja zawartości", undefined, "incompatibleContent"],
    ["drugi właściciel RNG", undefined, "invalidStructure"],
    ["nieznana karta", undefined, "invalidIntegrity"],
    ["nieznany przeciwnik", undefined, "incompatibleContent"],
    ["niepoprawny zegar akcji", undefined, "invalidStructure"],
  ])("odrzuca %s", (_label, direct, expectedCode) => {
    if (direct !== undefined) {
      expect(decodeRunCheckpoint(direct, PROTOTYPE_RUN_SETUP)).toMatchObject({ ok: false, error: { code: expectedCode } });
      return;
    }
    const valid = validObject();
    if (_label === "wersja formatu") valid.version = 2;
    if (_label === "wersja zawartości") valid.contentVersion = 2;
    if (_label === "drugi właściciel RNG") valid.run.activeMatch = {};
    if (_label === "nieznana karta") valid.run.offenseDeck = [...valid.run.offenseDeck as unknown[], "unknown"];
    if (_label === "nieznany przeciwnik") (valid.run.opponentIds as unknown[])[1] = "unknown";
    if (_label === "niepoprawny zegar akcji") valid.shotClock = 0;
    expect(decodeRunCheckpoint(JSON.stringify(valid), PROTOTYPE_RUN_SETUP)).toMatchObject({ ok: false, error: { code: expectedCode } });
  });

  it("odrzuca głęboko zagnieżdżony poprawny JSON bez rzucania wyjątku", () => {
    const serialized = deeplyNestedCheckpoint(20_000);

    expect(() => decodeRunCheckpoint(serialized, PROTOTYPE_RUN_SETUP)).not.toThrow();
    expect(decodeRunCheckpoint(serialized, PROTOTYPE_RUN_SETUP)).toMatchObject({
      ok: false,
      error: { code: "invalidStructure" },
    });
  });

  it("odrzuca punkty niemożliwe do uzyskania z liczby trafień", () => {
    const checkpoint = validObject();
    const result = mutableFirstResult(checkpoint);
    const player = mutableTeamStats(result, "player");
    player.made = 0;
    player.missed = 11;

    expect(decodeRunCheckpoint(JSON.stringify(checkpoint), PROTOTYPE_RUN_SETUP)).toMatchObject({
      ok: false,
      error: { code: "invalidIntegrity" },
    });
  });

  it("odrzuca bilans posiadań sprzeczny ze startem gracza i ścisłą naprzemiennością", () => {
    const checkpoint = validObject();
    const result = mutableFirstResult(checkpoint);
    const player = mutableTeamStats(result, "player");
    const opponent = mutableTeamStats(result, "opponent");
    player.possessions = 12;
    player.missed = 1;
    opponent.possessions = 9;
    opponent.missed = 9;

    expect(decodeRunCheckpoint(JSON.stringify(checkpoint), PROTOTYPE_RUN_SETUP)).toMatchObject({
      ok: false,
      error: { code: "invalidIntegrity" },
    });
  });

  it("odrzuca zwycięstwo gracza przypisane do parzystego posiadania przeciwnika", () => {
    const checkpoint = validObject();
    const result = mutableFirstResult(checkpoint);
    const player = mutableTeamStats(result, "player");
    result.possessionCount = 20;
    player.possessions = 10;
    player.made = 10;

    expect(decodeRunCheckpoint(JSON.stringify(checkpoint), PROTOTYPE_RUN_SETUP)).toMatchObject({
      ok: false,
      error: { code: "invalidIntegrity" },
    });
  });

  it("akceptuje zwycięstwo 15:0 przy hard capie i odrzuca 11:10 bez przewagi dwóch", () => {
    const hardCap = validObject();
    const hardCapResult = mutableFirstResult(hardCap);
    const hardCapScore = mutableRecord(hardCapResult.score);
    const hardCapPlayer = mutableTeamStats(hardCapResult, "player");
    hardCapScore.player = 15;
    hardCapPlayer.points = 15;
    expect(decodeRunCheckpoint(JSON.stringify(hardCap), PROTOTYPE_RUN_SETUP).ok).toBe(true);

    const invalidMargin = validObject();
    const invalidResult = mutableFirstResult(invalidMargin);
    const invalidScore = mutableRecord(invalidResult.score);
    const invalidOpponent = mutableTeamStats(invalidResult, "opponent");
    invalidScore.opponent = 10;
    invalidOpponent.made = 5;
    invalidOpponent.missed = 5;
    invalidOpponent.points = 10;
    expect(decodeRunCheckpoint(JSON.stringify(invalidMargin), PROTOTYPE_RUN_SETUP)).toMatchObject({
      ok: false,
      error: { code: "invalidIntegrity" },
    });
  });

  it("wznowiony i nieprzerwany run tworzą identyczny następny mecz oraz dalszą ofertę", () => {
    const uninterrupted = firstIntermission(9876);
    const created = createRunCheckpoint(uninterrupted, 500, PROTOTYPE_RUN_SETUP, 9);
    if (!created.ok) throw new Error(created.error.message);
    const resumed = restoreRunFromCheckpoint(created.value);

    const uninterruptedMatch = accepted(reduceRun(uninterrupted, { type: "startNextMatch" }));
    const resumedMatch = accepted(reduceRun(resumed, { type: "startNextMatch" }));
    expect(resumedMatch).toEqual(uninterruptedMatch);
    expect(winCurrentMatch(resumedMatch)).toEqual(winCurrentMatch(uninterruptedMatch));
  });
});

function validObject(): {
  version: unknown;
  contentVersion: unknown;
  run: Record<string, unknown>;
  [key: string]: unknown;
} {
  const created = createRunCheckpoint(firstIntermission(42), 100, PROTOTYPE_RUN_SETUP, 14);
  if (!created.ok) throw new Error(created.error.message);
  return JSON.parse(encodeRunCheckpoint(created.value)) as {
    version: unknown;
    contentVersion: unknown;
    run: Record<string, unknown>;
    [key: string]: unknown;
  };
}

function deeplyNestedCheckpoint(depth: number): string {
  const placeholder = "__DEEPLY_NESTED_VALUE__";
  const shallow = {
    kind: "hoop-run.run-checkpoint",
    version: 1,
    contentVersion: 1,
    elapsedActiveMs: 0,
    shotClock: 14,
    run: {
      initialSeed: 1,
      rngState: 1,
      phase: "intermission",
      opponentIndex: 1,
      opponentIds: placeholder,
      initialDecks: {},
      offenseDeck: [],
      defenseDeck: [],
      rewardCatalog: [],
      opponentProfiles: [],
      matchSetup: {},
      matchResults: [],
      selectedRewards: [],
    },
  };
  return JSON.stringify(shallow).replace(`"${placeholder}"`, `${"[".repeat(depth)}0${"]".repeat(depth)}`);
}

function mutableFirstResult(checkpoint: { run: Record<string, unknown> }): Record<string, unknown> {
  const results = checkpoint.run.matchResults;
  if (!Array.isArray(results) || results.length === 0) throw new Error("Brak wyniku w checkpointcie testowym.");
  return mutableRecord(results[0]);
}

function mutableTeamStats(result: Record<string, unknown>, team: "player" | "opponent"): Record<string, unknown> {
  const stats = mutableRecord(result.stats);
  return mutableRecord(stats[team]);
}

function mutableRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Oczekiwano obiektu testowego.");
  return value as Record<string, unknown>;
}

function firstIntermission(seed: number): RunState {
  const offer = winCurrentMatch(createRun(PROTOTYPE_RUN_SETUP, seed));
  return accepted(reduceRun(offer, { type: "chooseReward", offerIndex: 0 }));
}

function winCurrentMatch(state: RunState): RunState {
  const match = state.activeMatch;
  if (match === undefined) throw new Error("Brak aktywnego meczu.");
  const preparedState: RunState = {
    ...state,
    activeMatch: {
      ...match,
      score: { player: 10, opponent: 0 },
      stats: {
        player: { possessions: 10, made: 10, missed: 0, turnovers: 0, clockExpired: 0, points: 10 },
        opponent: { possessions: 10, made: 0, missed: 10, turnovers: 0, clockExpired: 0, points: 0 },
      },
      history: Array.from({ length: 20 }, (_, index) => ({
        possessionNumber: index + 1,
        attackingTeam: index % 2 === 0 ? "player" as const : "opponent" as const,
        playerRole: index % 2 === 0 ? "offense" as const : "defense" as const,
        outcome: index % 2 === 0 ? "made" as const : "missed" as const,
        ...(index % 2 === 0 ? { shotZone: "paint" as const } : {}),
        usedCardIds: [],
        rngState: match.rngState,
        points: index % 2 === 0 ? 1 : 0,
      })),
      attackingTeam: "player",
      playerRole: "offense",
      activePossession: { kind: "playerOffense" },
    },
  };
  const summary = accepted(reduceRun(preparedState, {
    type: "completeMatchPossession",
    resolution: { outcome: "made", shotZone: "paint", usedCardIds: [], rngState: match.rngState },
  }));
  return accepted(reduceRun(summary, { type: "advanceMatch" }));
}

function accepted(result: RunRuleResult): RunState {
  if (!result.accepted) throw new Error(result.rejection.message);
  return result.state;
}

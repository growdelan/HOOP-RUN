import type { OpponentProfile } from "./defense.ts";
import type { CardId } from "./model.ts";
import type {
  RewardCardDefinition,
  RunMatchResult,
  RunSetup,
  RunState,
  SelectedRunReward,
} from "./run.ts";

export const RUN_CHECKPOINT_KIND = "hoop-run.run-checkpoint" as const;
export const RUN_CHECKPOINT_VERSION = 1 as const;
export const RUN_CHECKPOINT_CONTENT_VERSION = 1 as const;

export interface RunCheckpointStateV1 {
  readonly initialSeed: number;
  readonly rngState: number;
  readonly phase: "intermission";
  readonly opponentIndex: number;
  readonly opponentIds: RunState["opponentIds"];
  readonly initialDecks: RunState["initialDecks"];
  readonly offenseDeck: readonly CardId[];
  readonly defenseDeck: readonly CardId[];
  readonly rewardCatalog: readonly RewardCardDefinition[];
  readonly opponentProfiles: readonly OpponentProfile[];
  readonly matchSetup: RunState["matchSetup"];
  readonly matchResults: readonly RunMatchResult[];
  readonly selectedRewards: readonly SelectedRunReward[];
}

export interface RunCheckpointV1 {
  readonly kind: typeof RUN_CHECKPOINT_KIND;
  readonly version: typeof RUN_CHECKPOINT_VERSION;
  readonly contentVersion: typeof RUN_CHECKPOINT_CONTENT_VERSION;
  readonly elapsedActiveMs: number;
  readonly shotClock: number;
  readonly run: RunCheckpointStateV1;
}

export type RunCheckpointErrorCode =
  | "invalidJson"
  | "invalidStructure"
  | "unsupportedVersion"
  | "incompatibleContent"
  | "invalidIntegrity"
  | "invalidPhase";

export interface RunCheckpointError {
  readonly code: RunCheckpointErrorCode;
  readonly message: string;
}

export type RunCheckpointResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: RunCheckpointError };

const ROOT_FIELDS = ["kind", "version", "contentVersion", "elapsedActiveMs", "shotClock", "run"] as const;
const RUN_FIELDS = [
  "initialSeed",
  "rngState",
  "phase",
  "opponentIndex",
  "opponentIds",
  "initialDecks",
  "offenseDeck",
  "defenseDeck",
  "rewardCatalog",
  "opponentProfiles",
  "matchSetup",
  "matchResults",
  "selectedRewards",
] as const;

export function createRunCheckpoint(
  state: RunState,
  elapsedActiveMs: number,
  expectedSetup: RunSetup,
  shotClock: number,
): RunCheckpointResult<RunCheckpointV1> {
  if (state.phase !== "intermission") {
    return failure("invalidPhase", "Checkpoint można utworzyć wyłącznie w fazie intermission.");
  }
  if (!isNonNegativeInteger(elapsedActiveMs)) {
    return failure("invalidIntegrity", "Aktywny czas checkpointu musi być nieujemną liczbą całkowitą.");
  }
  if (!isValidShotClock(shotClock)) {
    return failure("invalidIntegrity", "Zegar akcji checkpointu musi być liczbą całkowitą od 1 do 99.");
  }
  const checkpoint: RunCheckpointV1 = {
    kind: RUN_CHECKPOINT_KIND,
    version: RUN_CHECKPOINT_VERSION,
    contentVersion: RUN_CHECKPOINT_CONTENT_VERSION,
    elapsedActiveMs,
    shotClock,
    run: {
      initialSeed: state.initialSeed,
      rngState: state.rngState ?? 0,
      phase: "intermission",
      opponentIndex: state.opponentIndex,
      opponentIds: clone(state.opponentIds),
      initialDecks: clone(state.initialDecks),
      offenseDeck: clone(state.offenseDeck),
      defenseDeck: clone(state.defenseDeck),
      rewardCatalog: clone(state.rewardCatalog),
      opponentProfiles: clone(state.opponentProfiles ?? []),
      matchSetup: clone(state.matchSetup),
      matchResults: clone(state.matchResults),
      selectedRewards: clone(state.selectedRewards),
    },
  };
  return validateCheckpoint(checkpoint, expectedSetup);
}

export function encodeRunCheckpoint(checkpoint: RunCheckpointV1): string {
  return JSON.stringify(checkpoint);
}

export function decodeRunCheckpoint(
  serialized: string,
  expectedSetup: RunSetup,
): RunCheckpointResult<RunCheckpointV1> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    return failure("invalidJson", "Slot checkpointu nie zawiera poprawnego JSON.");
  }
  try {
    if (!isRecord(parsed) || !hasExactFields(parsed, ROOT_FIELDS)) {
      return failure("invalidStructure", "Checkpoint ma niepoprawną strukturę główną.");
    }
    if (parsed.kind !== RUN_CHECKPOINT_KIND || parsed.version !== RUN_CHECKPOINT_VERSION) {
      return failure("unsupportedVersion", "Wersja formatu checkpointu nie jest obsługiwana.");
    }
    if (parsed.contentVersion !== RUN_CHECKPOINT_CONTENT_VERSION) {
      return failure("incompatibleContent", "Wersja zawartości checkpointu nie jest obsługiwana.");
    }
    return validateCheckpoint(parsed, expectedSetup);
  } catch {
    return failure("invalidStructure", "Checkpoint ma strukturę, której nie można bezpiecznie zweryfikować.");
  }
}

export function restoreRunFromCheckpoint(checkpoint: RunCheckpointV1): RunState {
  return clone(checkpoint.run);
}

function validateCheckpoint(
  value: unknown,
  expectedSetup: RunSetup,
): RunCheckpointResult<RunCheckpointV1> {
  if (!isRecord(value) || !hasExactFields(value, ROOT_FIELDS)) {
    return failure("invalidStructure", "Checkpoint ma niepoprawną strukturę główną.");
  }
  if (
    value.kind !== RUN_CHECKPOINT_KIND ||
    value.version !== RUN_CHECKPOINT_VERSION ||
    value.contentVersion !== RUN_CHECKPOINT_CONTENT_VERSION ||
    !isNonNegativeInteger(value.elapsedActiveMs) ||
    !isValidShotClock(value.shotClock) ||
    !isRecord(value.run) ||
    !hasExactFields(value.run, RUN_FIELDS)
  ) {
    return failure("invalidStructure", "Checkpoint nie zawiera wszystkich wymaganych pól V1.");
  }
  const run = value.run;
  if (
    run.phase !== "intermission" ||
    !isPositiveUint32(run.initialSeed) ||
    !isPositiveUint32(run.rngState) ||
    !Number.isInteger(run.opponentIndex) ||
    (run.opponentIndex !== 1 && run.opponentIndex !== 2)
  ) {
    return failure("invalidIntegrity", "Faza, etap, seed lub kursor RNG checkpointu są niespójne.");
  }
  const staticState = {
    opponentIds: run.opponentIds,
    initialDecks: run.initialDecks,
    rewardCatalog: run.rewardCatalog,
    opponentProfiles: run.opponentProfiles,
    matchSetup: run.matchSetup,
  };
  const expectedStaticState = {
    opponentIds: expectedSetup.opponentIds,
    initialDecks: { offense: expectedSetup.offenseDeck, defense: expectedSetup.defenseDeck },
    rewardCatalog: expectedSetup.rewardCatalog,
    opponentProfiles: expectedSetup.opponentProfiles ?? [],
    matchSetup: expectedSetup.match,
  };
  if (!hasSameJsonShape(staticState, expectedStaticState)) {
    return failure("invalidStructure", "Katalogi lub konfiguracja checkpointu mają niepoprawną strukturę.");
  }
  if (!jsonEqualIterative(staticState, expectedStaticState)) {
    return failure("incompatibleContent", "Katalogi, identyfikatory lub konfiguracja checkpointu nie odpowiadają zawartości V1.");
  }
  if (
    !Array.isArray(run.offenseDeck) ||
    !run.offenseDeck.every(isString) ||
    !Array.isArray(run.defenseDeck) ||
    !run.defenseDeck.every(isString) ||
    !Array.isArray(run.matchResults) ||
    !Array.isArray(run.selectedRewards)
  ) {
    return failure("invalidStructure", "Dynamiczne listy checkpointu mają niepoprawny typ.");
  }
  const opponentIndex = run.opponentIndex as number;
  if (
    run.matchResults.length !== opponentIndex ||
    run.selectedRewards.length !== opponentIndex ||
    !run.matchResults.every((result, index) => validMatchResult(result, index, expectedSetup)) ||
    !run.selectedRewards.every((reward, index) => validReward(reward, index, expectedSetup))
  ) {
    return failure("invalidIntegrity", "Historia wyników lub nagród nie odpowiada etapowi runu.");
  }
  const selectedRewards = run.selectedRewards as unknown as readonly SelectedRunReward[];
  const expectedOffense = [
    ...expectedSetup.offenseDeck,
    ...selectedRewards.filter((reward) => reward.role === "offense").map((reward) => reward.cardId),
  ];
  const expectedDefense = [
    ...expectedSetup.defenseDeck,
    ...selectedRewards.filter((reward) => reward.role === "defense").map((reward) => reward.cardId),
  ];
  if (!jsonEqualIterative(run.offenseDeck, expectedOffense) || !jsonEqualIterative(run.defenseDeck, expectedDefense)) {
    return failure("invalidIntegrity", "Talie checkpointu nie wynikają z wybranych nagród.");
  }
  return { ok: true, value: clone(value) as unknown as RunCheckpointV1 };
}

function validMatchResult(value: unknown, index: number, setup: RunSetup): boolean {
  if (!isRecord(value) || !hasExactFields(value, ["opponentIndex", "opponentId", "winner", "score", "stats", "possessionCount"])) return false;
  if (value.opponentIndex !== index || value.opponentId !== setup.opponentIds[index] || value.winner !== "player") return false;
  if (!isRecord(value.score) || !hasExactFields(value.score, ["player", "opponent"])) return false;
  const playerScore = value.score.player;
  const opponentScore = value.score.opponent;
  if (!isNonNegativeInteger(playerScore) || !isNonNegativeInteger(opponentScore) || playerScore > 15 || opponentScore > 15) return false;
  if (playerScore <= opponentScore || !((playerScore >= 11 && playerScore - opponentScore >= 2) || playerScore === 15)) return false;
  if (
    !isPositiveInteger(value.possessionCount) ||
    value.possessionCount % 2 !== 1 ||
    !validStats(value.stats, value.score, value.possessionCount)
  ) return false;
  return true;
}

function validStats(value: unknown, score: Record<string, unknown>, possessionCount: number): boolean {
  if (!isRecord(value) || !hasExactFields(value, ["player", "opponent"])) return false;
  if (!validTeamStats(value.player) || !validTeamStats(value.opponent)) return false;
  const playerPossessions = Math.ceil(possessionCount / 2);
  const opponentPossessions = Math.floor(possessionCount / 2);
  return (
    value.player.points === score.player &&
    value.opponent.points === score.opponent &&
    value.player.possessions === playerPossessions &&
    value.opponent.possessions === opponentPossessions
  );
}

function validTeamStats(value: unknown): value is Record<"possessions" | "made" | "missed" | "turnovers" | "clockExpired" | "points", number> {
  if (!isRecord(value)) return false;
  const fields = ["possessions", "made", "missed", "turnovers", "clockExpired", "points"] as const;
  if (!hasExactFields(value, fields) || !fields.every((field) => isNonNegativeInteger(value[field]))) return false;
  const stats = value as Record<(typeof fields)[number], number>;
  return (
    stats.made + stats.missed + stats.turnovers + stats.clockExpired === stats.possessions &&
    stats.made <= stats.points &&
    stats.points <= stats.made * 2
  );
}

function validReward(value: unknown, index: number, setup: RunSetup): boolean {
  if (!isRecord(value) || !hasExactFields(value, ["index", "cardId", "role", "afterOpponentIndex"])) return false;
  if (value.afterOpponentIndex !== index || !Number.isInteger(value.index) || (value.index as number) < 0 || (value.index as number) > 2) return false;
  return setup.rewardCatalog.some((entry) => entry.cardId === value.cardId && entry.role === value.role);
}

function hasExactFields(value: Record<string, unknown>, fields: readonly string[]): boolean {
  const keys = Object.keys(value).sort();
  return keys.length === fields.length && keys.every((key, index) => key === [...fields].sort()[index]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

function isPositiveUint32(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0 && (value as number) <= 0xffff_ffff;
}

function isValidShotClock(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 99;
}

function hasSameJsonShape(left: unknown, right: unknown): boolean {
  const pending: Array<readonly [unknown, unknown]> = [[left, right]];
  while (pending.length > 0) {
    const pair = pending.pop();
    if (pair === undefined) continue;
    const [currentLeft, currentRight] = pair;
    if (Array.isArray(currentLeft) || Array.isArray(currentRight)) {
      if (!Array.isArray(currentLeft) || !Array.isArray(currentRight) || currentLeft.length !== currentRight.length) return false;
      for (let index = 0; index < currentLeft.length; index += 1) {
        pending.push([currentLeft[index], currentRight[index]]);
      }
      continue;
    }
    if (isRecord(currentLeft) || isRecord(currentRight)) {
      if (!isRecord(currentLeft) || !isRecord(currentRight)) return false;
      const leftKeys = Object.keys(currentLeft).sort();
      const rightKeys = Object.keys(currentRight).sort();
      if (leftKeys.length !== rightKeys.length || leftKeys.some((key, index) => key !== rightKeys[index])) return false;
      for (const key of leftKeys) pending.push([currentLeft[key], currentRight[key]]);
      continue;
    }
    if (currentLeft === null || currentRight === null) {
      if (currentLeft !== currentRight) return false;
      continue;
    }
    if (typeof currentLeft !== typeof currentRight) return false;
  }
  return true;
}

function jsonEqualIterative(left: unknown, right: unknown): boolean {
  const pending: Array<readonly [unknown, unknown]> = [[left, right]];
  while (pending.length > 0) {
    const pair = pending.pop();
    if (pair === undefined) continue;
    const [currentLeft, currentRight] = pair;
    if (Object.is(currentLeft, currentRight)) continue;
    if (Array.isArray(currentLeft) || Array.isArray(currentRight)) {
      if (!Array.isArray(currentLeft) || !Array.isArray(currentRight) || currentLeft.length !== currentRight.length) return false;
      for (let index = 0; index < currentLeft.length; index += 1) {
        pending.push([currentLeft[index], currentRight[index]]);
      }
      continue;
    }
    if (!isRecord(currentLeft) || !isRecord(currentRight)) return false;
    const leftKeys = Object.keys(currentLeft).sort();
    const rightKeys = Object.keys(currentRight).sort();
    if (leftKeys.length !== rightKeys.length || leftKeys.some((key, index) => key !== rightKeys[index])) return false;
    for (const key of leftKeys) pending.push([currentLeft[key], currentRight[key]]);
  }
  return true;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function failure<T>(code: RunCheckpointErrorCode, message: string): RunCheckpointResult<T> {
  return { ok: false, error: { code, message } };
}

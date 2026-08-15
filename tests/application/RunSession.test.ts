import { describe, expect, it } from "vitest";

import { RunSession } from "../../src/application/RunSession.ts";
import type { MatchViewModel } from "../../src/application/MatchSession.ts";
import type {
  CheckpointStorageResult,
  RunCheckpointRepository,
} from "../../src/application/RunCheckpointRepository.ts";

describe("RunSession", () => {
  it("prowadzi start i onboarding bez tworzenia runu przed kliknięciem", () => {
    const session = new RunSession(42);

    expect(session.getViewModel()).toMatchObject({ screen: "start", stage: 1 });
    expect(session.state).toBeUndefined();
    session.dispatch({ type: "openHowTo" });
    expect(session.getViewModel().screen).toBe("howTo");
    session.dispatch({ type: "closeHowTo" });
    session.dispatch({ type: "startRun" });

    expect(session.getViewModel()).toMatchObject({
      screen: "match",
      progressLabel: "MECZ 1/3",
      opponent: { id: "fundamentals", name: "Fundamentals" },
      match: { phase: "activePossession", roleLabel: "ATAK" },
    });
    expect(session.state?.phase).toBe("activeMatch");
  });

  it("blokuje przejście po wygranej do wyboru i przenosi nagrodę do następnego meczu", () => {
    const session = new RunSession(2);
    session.dispatch({ type: "startRun" });
    playUntilScreenChanges(session, "prepared", "contextual");

    const offer = session.getViewModel();
    expect(offer.screen).toBe("reward");
    expect(offer.rewardOffer).toHaveLength(3);
    const reward = offer.rewardOffer?.find((entry) => entry.role === "offense");
    if (reward === undefined) throw new Error("Brak ofensywnej nagrody.");
    session.dispatch({ type: "startNextMatch" });
    expect(session.getViewModel().screen).toBe("reward");

    session.dispatch({ type: "chooseReward", offerIndex: reward.index });
    expect(session.getViewModel()).toMatchObject({
      screen: "intermission",
      stage: 2,
      selectedReward: { cardId: reward.cardId, roleLabel: "ATAK" },
    });
    expect(session.state?.offenseDeck).toContain(reward.cardId);

    session.dispatch({ type: "startNextMatch" });
    expect(session.getViewModel()).toMatchObject({
      screen: "match",
      progressLabel: "MECZ 2/3",
      opponent: { id: "perimeterCrew", name: "Perimeter Crew" },
    });
    expect(session.state?.activeMatch?.setup.offenseDeck).toContain(reward.cardId);

    const usage = playUntilRewardUsed(session, reward.cardId);
    expect(usage.sawInHand).toBe(true);
    expect(usage.usedLegally).toBe(true);
    expect(usage.forecast).toContain("+12 PP");
    expect(usage.history).toContain(reward.cardId);
    expect(usage.shotQualityDelta).toBe(12);
    expect(usage.summaryDetails).toContain("Step Back +12");
  });

  it("publikuje działanie i jawny kompromis każdej karty nagrody", () => {
    const offers = new Map<string, NonNullable<ReturnType<RunSession["getViewModel"]>["rewardOffer"]>[number]>();
    for (let seed = 1; seed <= 20 && offers.size < 4; seed += 1) {
      const session = new RunSession(seed);
      session.dispatch({ type: "startRun" });
      playUntilScreenChanges(session, "prepared", "contextual");
      session.getViewModel().rewardOffer?.forEach((reward) => offers.set(reward.cardId, reward));
    }

    expect(offers.get("backdoorCut")).toMatchObject({
      roleLabel: "ATAK",
      effect: expect.stringContaining("bez piłki"),
      tradeoff: expect.stringContaining("presji ≥8 bez pomocy"),
    });
    expect(offers.get("stepBack")).toMatchObject({
      roleLabel: "ATAK",
      effect: expect.stringContaining("+12 pp"),
      tradeoff: expect.stringContaining("inna karta przed rzutem kasuje premię"),
    });
    expect(offers.get("hedge")).toMatchObject({
      roleLabel: "OBRONA",
      effect: expect.stringContaining("-2 Advantage i +6 contest"),
      tradeoff: expect.stringContaining("+1 Advantage"),
    });
    expect(offers.get("closeOut")).toMatchObject({
      roleLabel: "OBRONA",
      effect: expect.stringContaining("Advantage 0: +12 contest"),
      tradeoff: expect.stringContaining("Advantage ≥1"),
    });
  });

  it("mierzy czas sesji przez wstrzyknięty zegar i czyści stan po porażce", () => {
    let now = 1_000;
    const session = new RunSession(42, 14, () => now);
    session.dispatch({ type: "startRun" });
    now = 66_000;
    expect(session.getViewModel().elapsedSeconds).toBe(65);

    playUntilSummary(session, "immediate", "pressure");
    expect(session.getViewModel().summary?.outcome).toBe("failure");
    expect(session.getViewModel().summary?.elapsedSeconds).toBe(65);
    now = 166_000;
    expect(session.getViewModel().elapsedSeconds).toBe(65);
    expect(session.getViewModel().summary?.elapsedSeconds).toBe(65);
    session.dispatch({ type: "resetRun" });
    expect(session.getViewModel()).toMatchObject({
      screen: "match",
      stage: 1,
      rewards: [],
      results: [],
    });
    expect(session.state?.offenseDeck).toHaveLength(10);
    expect(session.state?.defenseDeck).toHaveLength(10);
    expect(session.getViewModel().elapsedSeconds).toBe(0);
  });

  it("odtwarza pełny zwycięski run dla kontrolowanego seeda 2", () => {
    const session = new RunSession(2);
    session.dispatch({ type: "startRun" });

    expect(playStrategicRun(session)).toBe("success");
    expect(session.getViewModel().summary?.results).toHaveLength(3);
    expect(session.getViewModel().summary?.rewards).toHaveLength(2);
    expect(session.getViewModel().summary?.rewards[0]?.name).toBe("Step Back");
    expect(session.getViewModel().summary?.offenseDeck).toContainEqual({
      cardId: "stepBack",
      name: "Step Back",
      count: 1,
    });
    expect(session.getViewModel().summary?.defenseDeck).toContainEqual({
      cardId: "doubleTeam",
      name: "Double Team",
      count: 2,
    });
  });

  it("zapisuje intermission, wznawia identyczny stan i nie dolicza przerwy poza sesją", () => {
    let now = 1_000;
    const repository = new MemoryCheckpointRepository();
    const uninterrupted = new RunSession(2, 9, () => now, repository);
    uninterrupted.dispatch({ type: "startRun" });
    playUntilScreenChanges(uninterrupted, "prepared", "contextual");
    const reward = uninterrupted.getViewModel().rewardOffer?.[0];
    if (reward === undefined) throw new Error("Brak nagrody.");
    uninterrupted.dispatch({ type: "chooseReward", offerIndex: reward.index });
    const stateAtCheckpoint = uninterrupted.state;
    now = 11_000;
    uninterrupted.dispatch({ type: "saveAndExit" });

    expect(uninterrupted.getViewModel()).toMatchObject({
      screen: "start",
      canContinue: true,
      persistenceUnavailable: false,
      elapsedSeconds: 0,
    });
    expect(repository.serialized).toContain('"elapsedActiveMs":10000');
    expect(repository.serialized).toContain('"shotClock":9');

    now = 100_000;
    const resumed = new RunSession(999, 14, () => now, repository);
    expect(resumed.getViewModel()).toMatchObject({ screen: "start", canContinue: true });
    resumed.dispatch({ type: "continueRun" });
    expect(resumed.state).toEqual(stateAtCheckpoint);
    expect(resumed.getViewModel()).toMatchObject({ screen: "intermission", elapsedSeconds: 10 });
    now = 105_000;
    expect(resumed.getViewModel().elapsedSeconds).toBe(15);

    const direct = new RunSession(2, 9, () => now);
    direct.dispatch({ type: "startRun" });
    playUntilScreenChanges(direct, "prepared", "contextual");
    direct.dispatch({ type: "chooseReward", offerIndex: reward.index });
    direct.dispatch({ type: "startNextMatch" });
    resumed.dispatch({ type: "startNextMatch" });
    expect(resumed.state).toEqual(direct.state);
    expect(resumed.getViewModel().match?.shotClock).toBe(9);
  });

  it("wymaga potwierdzenia przed zastąpieniem istniejącego slotu", () => {
    const repository = savedCheckpointRepository();
    const session = new RunSession(99, 14, () => 5_000, repository);

    session.dispatch({ type: "startRun" });
    expect(session.getViewModel()).toMatchObject({ screen: "confirmNewRun", needsNewRunConfirmation: true });
    expect(repository.serialized).toBeDefined();
    session.dispatch({ type: "cancelStartRun" });
    expect(session.getViewModel().screen).toBe("start");
    session.dispatch({ type: "startRun" });
    session.dispatch({ type: "confirmStartRun" });
    expect(session.getViewModel()).toMatchObject({ screen: "match", stage: 1, canContinue: false });
    expect(repository.serialized).toBeUndefined();
  });

  it("pokazuje uszkodzony slot, blokuje częściowe wznowienie i pozwala go odrzucić", () => {
    const repository = new MemoryCheckpointRepository("{broken");
    const session = new RunSession(42, 14, () => 0, repository);

    expect(session.getViewModel()).toMatchObject({ screen: "start", canContinue: false });
    expect(session.getViewModel().checkpointError).toContain("JSON");
    session.dispatch({ type: "continueRun" });
    session.dispatch({ type: "startRun" });
    expect(session.state).toBeUndefined();
    session.dispatch({ type: "discardCheckpoint" });
    expect(session.getViewModel().checkpointError).toBeUndefined();
    session.dispatch({ type: "startRun" });
    expect(session.getViewModel().screen).toBe("match");
  });

  it("uruchamia sesję z głęboko zagnieżdżonym slotem i pozwala go odrzucić", () => {
    const repository = new MemoryCheckpointRepository(deeplyNestedCheckpoint(20_000));

    expect(() => new RunSession(42, 14, () => 0, repository)).not.toThrow();
    const session = new RunSession(42, 14, () => 0, repository);
    expect(session.getViewModel()).toMatchObject({
      screen: "start",
      canContinue: false,
      checkpointError: expect.stringContaining("struktur"),
    });
    session.dispatch({ type: "discardCheckpoint" });
    session.dispatch({ type: "startRun" });
    expect(session.getViewModel()).toMatchObject({ screen: "match", stage: 1 });
  });

  it("usuwa slot po utworzeniu terminalnego podsumowania", () => {
    const repository = new MemoryCheckpointRepository();
    const session = new RunSession(42, 14, () => 0, repository);
    session.dispatch({ type: "startRun" });
    playUntilSummary(session, "immediate", "pressure");

    expect(session.getViewModel().screen).toBe("summary");
    expect(repository.removeCalls).toBe(1);
    expect(repository.serialized).toBeUndefined();
  });

  it("po błędzie odczytu zatrzaskuje tryb bez trwałości bez późniejszych write/remove", () => {
    const unreadable = new ReadFailWriteOkRepository();
    const startWithoutPersistence = new RunSession(2, 14, () => 0, unreadable);
    expect(startWithoutPersistence.getViewModel()).toMatchObject({
      screen: "start",
      persistenceUnavailable: true,
      persistenceError: expect.stringContaining("TRYB BEZ ZAPISU"),
    });
    startWithoutPersistence.dispatch({ type: "startRun" });
    expect(startWithoutPersistence.getViewModel()).toMatchObject({
      screen: "match",
      persistenceUnavailable: true,
      persistenceError: expect.stringContaining("TRYB BEZ ZAPISU"),
    });
    expect(startWithoutPersistence.state?.phase).toBe("activeMatch");
    playUntilScreenChanges(startWithoutPersistence, "prepared", "contextual");
    const offer = startWithoutPersistence.getViewModel().rewardOffer?.[0];
    if (offer === undefined) throw new Error("Brak nagrody w teście trybu bez trwałości.");
    startWithoutPersistence.dispatch({ type: "chooseReward", offerIndex: offer.index });
    expect(startWithoutPersistence.getViewModel()).toMatchObject({
      screen: "intermission",
      persistenceUnavailable: true,
      persistenceError: expect.stringContaining("TRYB BEZ ZAPISU"),
    });
    startWithoutPersistence.dispatch({ type: "saveAndExit" });
    expect(startWithoutPersistence.getViewModel().screen).toBe("intermission");
    playUntilSummary(startWithoutPersistence, "prepared", "contextual");
    expect(unreadable.writeCalls).toBe(0);
    expect(unreadable.removeCalls).toBe(0);
  });

  it("po błędzie zapisu lub usunięcia zachowuje stan i przechodzi do trybu bez trwałości", () => {

    const unwritable = new FailingCheckpointRepository("write");
    const active = new RunSession(2, 14, () => 0, unwritable);
    active.dispatch({ type: "startRun" });
    playUntilScreenChanges(active, "prepared", "contextual");
    active.dispatch({ type: "chooseReward", offerIndex: 0 });
    const beforeSave = active.state;
    active.dispatch({ type: "saveAndExit" });
    expect(active.getViewModel().screen).toBe("intermission");
    expect(active.getViewModel()).toMatchObject({
      persistenceUnavailable: true,
      persistenceError: expect.stringContaining("TRYB BEZ ZAPISU"),
    });
    expect(active.state).toBe(beforeSave);

    const unremovable = new RunSession(42, 14, () => 0, new FailingCheckpointRepository("remove"));
    unremovable.dispatch({ type: "startRun" });
    playUntilSummary(unremovable, "immediate", "pressure");
    expect(unremovable.getViewModel().persistenceError).toContain("storage");
    unremovable.dispatch({ type: "resetRun" });
    expect(unremovable.getViewModel().screen).toBe("match");
  });

  it("po invalid JSON i błędzie discard porzuca slot w pamięci oraz pozwala grać bez storage", () => {
    const repository = new InvalidCheckpointRemoveFailRepository();
    const session = new RunSession(2, 14, () => 0, repository);
    expect(session.getViewModel().checkpointError).toContain("JSON");

    session.dispatch({ type: "discardCheckpoint" });
    expect(session.getViewModel()).toMatchObject({
      screen: "start",
      persistenceUnavailable: true,
      persistenceError: expect.stringContaining("TRYB BEZ ZAPISU"),
    });
    expect(session.getViewModel().checkpointError).toBeUndefined();
    session.dispatch({ type: "startRun" });
    expect(session.getViewModel()).toMatchObject({
      screen: "match",
      persistenceUnavailable: true,
      persistenceError: expect.stringContaining("TRYB BEZ ZAPISU"),
    });
    playUntilScreenChanges(session, "prepared", "contextual");
    session.dispatch({ type: "chooseReward", offerIndex: 0 });
    session.dispatch({ type: "saveAndExit" });
    expect(session.getViewModel().screen).toBe("intermission");
    expect(repository.removeCalls).toBe(1);
    expect(repository.writeCalls).toBe(0);
  });
});

class MemoryCheckpointRepository implements RunCheckpointRepository {
  public removeCalls = 0;

  public constructor(public serialized?: string) {}

  public read(): CheckpointStorageResult<string | null> {
    return { ok: true, value: this.serialized ?? null };
  }

  public write(serialized: string): CheckpointStorageResult<void> {
    this.serialized = serialized;
    return { ok: true, value: undefined };
  }

  public remove(): CheckpointStorageResult<void> {
    this.removeCalls += 1;
    this.serialized = undefined;
    return { ok: true, value: undefined };
  }
}

function savedCheckpointRepository(): MemoryCheckpointRepository {
  const repository = new MemoryCheckpointRepository();
  const session = new RunSession(2, 14, () => 0, repository);
  session.dispatch({ type: "startRun" });
  playUntilScreenChanges(session, "prepared", "contextual");
  session.dispatch({ type: "chooseReward", offerIndex: 0 });
  session.dispatch({ type: "saveAndExit" });
  return repository;
}

class FailingCheckpointRepository implements RunCheckpointRepository {
  public constructor(private readonly failingOperation: "read" | "write" | "remove") {}

  public read(): CheckpointStorageResult<string | null> {
    return this.failingOperation === "read" ? this.failure("read") : { ok: true, value: null };
  }

  public write(): CheckpointStorageResult<void> {
    return this.failingOperation === "write" ? this.failure("write") : { ok: true, value: undefined };
  }

  public remove(): CheckpointStorageResult<void> {
    return this.failingOperation === "remove" ? this.failure("remove") : { ok: true, value: undefined };
  }

  private failure<T>(operation: "read" | "write" | "remove"): CheckpointStorageResult<T> {
    return {
      ok: false,
      error: { operation, code: "storageUnavailable", message: "Błąd storage." },
    };
  }
}

class ReadFailWriteOkRepository implements RunCheckpointRepository {
  public writeCalls = 0;
  public removeCalls = 0;

  public read(): CheckpointStorageResult<string | null> {
    return this.failure("read");
  }

  public write(): CheckpointStorageResult<void> {
    this.writeCalls += 1;
    return { ok: true, value: undefined };
  }

  public remove(): CheckpointStorageResult<void> {
    this.removeCalls += 1;
    return { ok: true, value: undefined };
  }

  private failure<T>(operation: "read"): CheckpointStorageResult<T> {
    return { ok: false, error: { operation, code: "storageUnavailable", message: "Błąd storage." } };
  }
}

class InvalidCheckpointRemoveFailRepository implements RunCheckpointRepository {
  public writeCalls = 0;
  public removeCalls = 0;

  public read(): CheckpointStorageResult<string | null> {
    return { ok: true, value: "{broken" };
  }

  public write(): CheckpointStorageResult<void> {
    this.writeCalls += 1;
    return { ok: true, value: undefined };
  }

  public remove(): CheckpointStorageResult<void> {
    this.removeCalls += 1;
    return {
      ok: false,
      error: { operation: "remove", code: "storageUnavailable", message: "Błąd storage." },
    };
  }
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

function playStrategicRun(session: RunSession): "success" | "failure" {
  let offenseRewardId: string | undefined;
  const usedPossessions = new Set<string>();
  for (let step = 0; step < 500; step += 1) {
    const run = session.getViewModel();
    if (run.screen === "summary") {
      if (run.summary === undefined) throw new Error("Brak podsumowania runu.");
      return run.summary.outcome;
    }
    if (run.screen === "reward") {
      const role = run.rewards.length === 0 ? "offense" : "defense";
      const reward = run.rewardOffer?.find((entry) => entry.role === role) ?? run.rewardOffer?.[0];
      if (reward === undefined) throw new Error("Brak nagrody w audycie.");
      if (reward.role === "offense") offenseRewardId = reward.cardId;
      session.dispatch({ type: "chooseReward", offerIndex: reward.index });
      continue;
    }
    if (run.screen === "intermission") {
      session.dispatch({ type: "startNextMatch" });
      continue;
    }
    const view = run.match;
    if (view === undefined) throw new Error("Brak meczu w audycie.");
    if (view.phase === "possessionSummary") {
      session.continueMatch();
    } else if (view.role === "defense") {
      playDefensePossession(session, "contextual");
    } else {
      const key = `${run.stage}:${view.possessionNumber}`;
      const reward = view.cards.find((card) => card.id === offenseRewardId);
      if (
        reward?.status === "available" &&
        view.shotClock >= reward.timeCost + 3 &&
        !usedPossessions.has(key)
      ) {
        playCardThroughInteractions(session, reward.id);
        usedPossessions.add(key);
        const shot = session.getViewModel().match?.cards.find((card) => card.id === "shot");
        if (shot?.status === "available") playCardThroughInteractions(session, "shot");
      } else {
        playPreparedOffenseStep(session, view);
      }
    }
  }
  throw new Error("Audytowany run nie zakończył się w limicie.");
}

function playUntilSummary(
  session: RunSession,
  offensePolicy: "immediate" | "prepared",
  defensePolicy: "pressure" | "contextual",
): void {
  for (let step = 0; step < 300; step += 1) {
    const run = session.getViewModel();
    if (run.screen === "summary") return;
    if (run.screen === "reward") {
      session.dispatch({ type: "chooseReward", offerIndex: 0 });
    } else if (run.screen === "intermission") {
      session.dispatch({ type: "startNextMatch" });
    } else {
      playMatchStep(session, offensePolicy, defensePolicy);
    }
  }
  throw new Error("Run nie zakończył się w limicie.");
}

function playUntilScreenChanges(
  session: RunSession,
  offensePolicy: "immediate" | "prepared",
  defensePolicy: "pressure" | "contextual",
): void {
  for (let step = 0; step < 120; step += 1) {
    if (session.getViewModel().screen !== "match") return;
    playMatchStep(session, offensePolicy, defensePolicy);
  }
  throw new Error("Mecz nie zakończył się w limicie.");
}

function playUntilRewardUsed(
  session: RunSession,
  rewardId: string,
): {
  sawInHand: boolean;
  usedLegally: boolean;
  forecast?: string;
  history?: readonly string[];
  shotQualityDelta?: number;
  summaryDetails?: readonly string[];
} {
  let sawInHand = false;
  for (let step = 0; step < 80; step += 1) {
    const run = session.getViewModel();
    if (run.screen !== "match" || run.match === undefined) break;
    const view = run.match;
    if (view.phase === "possessionSummary") {
      session.continueMatch();
      continue;
    }
    if (view.role === "defense") {
      playDefensePossession(session, "contextual");
      continue;
    }
    const reward = view.cards.find((card) => card.id === rewardId);
    if (reward !== undefined) sawInHand = true;
    if (reward?.status === "available" && view.shotClock >= reward.timeCost + 3) {
      const beforeChance = shotChance(view);
      playCardThroughInteractions(session, reward.id);
      const afterReward = session.getViewModel().match;
      if (afterReward === undefined) throw new Error("Brak widoku po nagrodzie.");
      const afterChance = shotChance(afterReward);
      const history = afterReward.playedCardIds;
      playCardThroughInteractions(session, "shot");
      return {
        sawInHand,
        usedLegally: true,
        forecast: reward.insights.find((insight) => insight.includes("+12 PP")),
        history,
        shotQualityDelta: afterChance - beforeChance,
        summaryDetails: session.getViewModel().match?.possessionSummary?.details,
      };
    }
    playPreparedOffenseStep(session, view);
  }
  return { sawInHand, usedLegally: false };
}

function shotChance(view: MatchViewModel): number {
  const insight = view.cards.find((card) => card.id === "shot")?.insights
    .find((value) => value.startsWith("SZANSA TRAFIENIA:"));
  const match = insight?.match(/(\d+)%/);
  if (match?.[1] === undefined) throw new Error("Brak procentowej prognozy rzutu.");
  return Number(match[1]);
}

function playMatchStep(
  session: RunSession,
  offensePolicy: "immediate" | "prepared",
  defensePolicy: "pressure" | "contextual",
): void {
  const view = session.getViewModel().match;
  if (view === undefined) return;
  if (view.phase === "possessionSummary") session.continueMatch();
  else if (view.role === "defense") playDefensePossession(session, defensePolicy);
  else if (offensePolicy === "prepared") playPreparedOffenseStep(session, view);
  else playCardThroughInteractions(session, "shot");
}

function playPreparedOffenseStep(session: RunSession, view: MatchViewModel): void {
  const cardId = ["screen", "drive", "kickOut"].find((id) => {
    const card = view.cards.find((candidate) => candidate.id === id);
    return card?.status === "available" && view.shotClock >= card.timeCost + 3;
  }) ?? "shot";
  playCardThroughInteractions(session, cardId);
}

function playDefensePossession(
  session: RunSession,
  policy: "pressure" | "contextual",
): void {
  for (let step = 0; step < 6; step += 1) {
    const view = session.getViewModel().match;
    if (view === undefined || view.phase !== "activePossession") return;
    const priorities = policy === "pressure"
      ? ["pressure", "doubleTeam", "switch", "helpDefense", "goUnder", "hedge", "closeOut"]
      : defensePriorities(view.currentAction ?? "");
    const card = priorities
      .map((id) => view.cards.find((candidate) => candidate.id === id))
      .find((candidate) => candidate?.status === "available");
    if (card === undefined) throw new Error("Brak legalnej odpowiedzi obronnej.");
    playCardThroughInteractions(session, card.id);
  }
  throw new Error("Posiadanie obronne nie zakończyło się w limicie.");
}

function defensePriorities(action: string): readonly string[] {
  if (action.includes("Screen")) return ["hedge", "switch", "doubleTeam", "pressure"];
  if (action.includes("Drive")) return ["helpDefense", "doubleTeam", "pressure"];
  if (action.includes("Shot") || action.includes("Finish") || action.includes("Three")) {
    return ["closeOut", "doubleTeam", "pressure"];
  }
  return ["pressure", "doubleTeam"];
}

function playCardThroughInteractions(session: RunSession, cardId: string): void {
  session.selectCard(cardId);
  for (let step = 0; step < 3; step += 1) {
    const player = session.getViewModel().match?.players.find(
      (candidate) => candidate.interaction === "legalActor" || candidate.interaction === "legalTarget",
    );
    if (player === undefined) return;
    session.selectPlayer(player.id);
  }
  throw new Error(`Karta ${cardId} nie zakończyła interakcji.`);
}

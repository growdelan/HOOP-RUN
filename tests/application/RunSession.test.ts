import { describe, expect, it } from "vitest";

import { RunSession } from "../../src/application/RunSession.ts";
import type { MatchViewModel } from "../../src/application/MatchSession.ts";

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
});

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

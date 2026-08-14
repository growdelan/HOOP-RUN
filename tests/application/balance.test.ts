import { describe, expect, it } from "vitest";

import { MatchSession } from "../../src/application/MatchSession.ts";
import type { MatchViewModel } from "../../src/application/MatchSession.ts";

describe("balans pełnego meczu", () => {
  it("nagradza strategię opartą na intencjach bez gwarantowania zwycięstwa", () => {
    const contextual = summarizePolicy("contextual", "contextual");
    const weakDefense = summarizePolicy("contextual", "pressure");
    const weakOffense = summarizePolicy("immediate", "contextual");

    expect(contextual.wins).toBeGreaterThanOrEqual(60);
    expect(contextual.wins).toBeLessThanOrEqual(90);
    expect(contextual.wins).toBeGreaterThanOrEqual(weakDefense.wins + 5);
    expect(contextual.wins).toBeGreaterThanOrEqual(weakOffense.wins + 20);
    expect(contextual.seed42).toMatchObject({ outcome: "player" });
    expect(contextual.seed42.playerScore - contextual.seed42.opponentScore)
      .toBeGreaterThanOrEqual(2);
  });
});

interface BalanceResult {
  readonly outcome: "player" | "opponent";
  readonly playerScore: number;
  readonly opponentScore: number;
}

type OffensePolicy = "contextual" | "immediate";
type DefensePolicy = "contextual" | "pressure";

function summarizePolicy(
  offensePolicy: OffensePolicy,
  defensePolicy: DefensePolicy,
): { readonly wins: number; readonly seed42: BalanceResult } {
  const results = Array.from({ length: 100 }, (_, index) =>
    runMatch(index + 1, offensePolicy, defensePolicy),
  );
  const seed42 = results[41];
  if (seed42 === undefined) throw new Error("Brak wyniku kontrolnego seeda 42.");
  return {
    wins: results.filter((result) => result.outcome === "player").length,
    seed42,
  };
}

function runMatch(
  seed: number,
  offensePolicy: OffensePolicy,
  defensePolicy: DefensePolicy,
): BalanceResult {
  const session = new MatchSession(seed);
  for (let step = 0; step < 120; step += 1) {
    if (session.state.phase === "completed") {
      if (session.state.winner === undefined) throw new Error("Brak zwycięzcy meczu.");
      return {
        outcome: session.state.winner,
        playerScore: session.state.score.player,
        opponentScore: session.state.score.opponent,
      };
    }
    if (session.state.phase === "possessionSummary") {
      session.continue();
    } else if (session.state.playerRole === "offense") {
      if (offensePolicy === "contextual") playContextualOffense(session);
      else playCardThroughInteractions(session, "shot");
    } else {
      playDefense(session, defensePolicy);
    }
  }
  throw new Error("Mecz balansowy nie zakończył się w limicie.");
}

function playContextualOffense(session: MatchSession): void {
  const used = new Set<string>();
  for (let step = 0; step < 6; step += 1) {
    const view = session.getViewModel();
    if (view.phase !== "activePossession" || view.role !== "offense") return;

    const cardId = chooseOffenseCard(view, used);
    used.add(cardId);
    playCardThroughInteractions(session, cardId);
  }
  throw new Error("Atak nie zakończył posiadania w limicie.");
}

function chooseOffenseCard(view: MatchViewModel, used: ReadonlySet<string>): string {
  const available = (id: string): boolean =>
    !used.has(id) &&
    view.cards.some(
      (card) =>
        card.id === id &&
        card.status === "available" &&
        view.shotClock >= card.timeCost + (id === "shot" ? 0 : 3),
    );

  if (used.has("drive")) {
    if (view.contextName !== "Deny Perimeter" && available("kickOut")) {
      return "kickOut";
    }
    return "shot";
  }
  if (used.has("screen") && available("drive")) return "drive";
  if (available("screen") && available("drive")) return "screen";
  if (available("pass")) return "pass";
  return "shot";
}

function playDefense(session: MatchSession, policy: DefensePolicy): void {
  for (let step = 0; step < 6; step += 1) {
    const view = session.getViewModel();
    if (view.phase !== "activePossession" || view.role !== "defense") return;
    const priorities =
      policy === "contextual"
        ? defensePriorities(view.currentAction ?? "")
        : ["pressure", "doubleTeam", "switch", "helpDefense", "goUnder"];
    const card = priorities
      .map((id) => view.cards.find((candidate) => candidate.id === id))
      .find((candidate) => candidate?.status === "available");
    if (card === undefined) throw new Error("Brak legalnej odpowiedzi obronnej.");
    playCardThroughInteractions(session, card.id);
  }
  throw new Error("Obrona nie zakończyła posiadania w limicie.");
}

function defensePriorities(currentAction: string): readonly string[] {
  if (currentAction.includes("Screen")) {
    return ["switch", "doubleTeam", "pressure", "goUnder"];
  }
  if (currentAction.includes("Drive")) {
    return ["helpDefense", "doubleTeam", "pressure"];
  }
  if (
    currentAction.includes("Shot") ||
    currentAction.includes("Finish") ||
    currentAction.includes("Three")
  ) {
    return ["doubleTeam", "pressure"];
  }
  return ["pressure", "doubleTeam"];
}

function playCardThroughInteractions(session: MatchSession, cardId: string): void {
  session.selectCard(cardId);
  for (let step = 0; step < 3; step += 1) {
    const target = session
      .getViewModel()
      .players.find(
        (player) =>
          player.interaction === "legalActor" ||
          player.interaction === "legalTarget",
      );
    if (target === undefined) return;
    session.selectPlayer(target.id);
  }
  throw new Error(`Karta ${cardId} nie zakończyła wyboru celu.`);
}

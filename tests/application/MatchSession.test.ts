import { describe, expect, it } from "vitest";

import { MatchSession } from "../../src/application/MatchSession.ts";

describe("MatchSession", () => {
  it("publikuje początek meczu z wynikiem, rolą, intencją i użyteczną ręką", () => {
    const session = new MatchSession(42);
    const view = session.getViewModel();

    expect(view.phase).toBe("activePossession");
    expect(view.score).toEqual({ player: 0, opponent: 0 });
    expect(view.roleLabel).toBe("ATAK");
    expect(view.targetLabel).toBe("DO 11 · +2 · LIMIT 15");
    expect(view.contextTitle).toBe("DEFENSE INTENT");
    expect(view.cards.find((card) => card.id === "shot")?.count).toBeGreaterThan(0);
    expect(view.players.find((player) => player.hasBall)?.side).toBe("player");
  });

  it("prowadzi ofensywne posiadanie do zatrzymanego podsumowania i zmiany roli", () => {
    const session = new MatchSession(42);
    playImmediateShot(session);
    const summary = session.getViewModel();

    expect(summary.phase).toBe("possessionSummary");
    expect(summary.possessionSummary?.role).toBe("offense");
    expect(summary.possessionSummary?.nextRole).toBe("defense");
    expect(summary.canContinue).toBe(true);

    session.continue();
    const defense = session.getViewModel();
    expect(defense.phase).toBe("activePossession");
    expect(defense.roleLabel).toBe("OBRONA");
    expect(defense.contextTitle).toBe("OPPONENT PLAN");
    expect(defense.currentAction).toBeDefined();
    expect(defense.cards.filter((card) => card.status === "available").length).toBeGreaterThan(0);
  });

  it("pozwala rozegrać pełne defensywne posiadanie bez ujawniania przyszłych kroków", () => {
    const session = new MatchSession(42);
    playImmediateShot(session);
    session.continue();
    const firstDefenseView = session.getViewModel();

    expect(JSON.stringify(firstDefenseView)).not.toContain("steps");
    playDefensePossession(session);
    const summary = session.getViewModel();
    expect(summary.phase).toBe("possessionSummary");
    expect(summary.possessionSummary?.role).toBe("defense");
    expect(["made", "missed", "turnover", "clockExpired"]).toContain(
      summary.possessionSummary?.outcome,
    );
    expect(summary.possessionSummary?.details.length).toBeGreaterThan(0);
  });

  it("kończy deterministyczny pełny mecz i odtwarza go w rewanżu", () => {
    const session = new MatchSession(42);
    runMatch(session);
    const first = session.state;
    const firstView = session.getViewModel();

    expect(first.phase).toBe("completed");
    expect(first.winner).toBeDefined();
    expect(firstView.matchSummary).toBeDefined();
    expect(firstView.canRematch).toBe(true);

    session.rematch();
    runMatch(session);
    expect(session.state).toEqual(first);
  });

  it("rozpoczyna nowy mecz z nowym seedem bez przeładowania", () => {
    const session = new MatchSession(42);
    runMatch(session);
    session.startNewMatch();

    expect(session.state.initialSeed).toBe(43);
    expect(session.state.score).toEqual({ player: 0, opponent: 0 });
    expect(session.state.phase).toBe("activePossession");
  });
});

function runMatch(session: MatchSession): void {
  let safety = 0;
  while (session.state.phase !== "completed") {
    safety += 1;
    if (safety > 100) throw new Error("Mecz testowy nie zakończył się w limicie.");

    if (session.state.phase === "possessionSummary") {
      session.continue();
    } else if (session.state.playerRole === "offense") {
      playImmediateShot(session);
    } else {
      playDefensePossession(session);
    }
  }
}

function playImmediateShot(session: MatchSession): void {
  session.selectCard("shot");
  const ballHandler = session
    .getViewModel()
    .players.find((player) => player.hasBall && player.side === "player");
  if (ballHandler === undefined) throw new Error("Brak posiadacza piłki gracza.");
  session.selectPlayer(ballHandler.id);
}

function playDefensePossession(session: MatchSession): void {
  let safety = 0;
  while (session.state.phase === "activePossession") {
    safety += 1;
    if (safety > 6) throw new Error("Obrona nie zakończyła posiadania w limicie.");
    const view = session.getViewModel();
    const card =
      view.cards.find(
        (candidate) =>
          candidate.id === "pressure" && candidate.status === "available",
      ) ?? view.cards.find((candidate) => candidate.status === "available");
    if (card === undefined) throw new Error("Brak legalnej karty defensywnej.");
    session.selectCard(card.id);
    const target = session
      .getViewModel()
      .players.find((player) => player.interaction === "legalTarget");
    if (target === undefined) throw new Error("Brak legalnego celu defensywnego.");
    session.selectPlayer(target.id);
  }
}

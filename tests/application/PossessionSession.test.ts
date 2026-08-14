import { describe, expect, it } from "vitest";

import { PossessionSession } from "../../src/application/PossessionSession.ts";
import {
  PROTOTYPE_CARDS,
  PROTOTYPE_SETUP,
} from "../../src/content/prototypePossession.ts";

describe("PossessionSession", () => {
  it("publikuje czytelny stan początkowy i legalne role interakcji", () => {
    const session = createSession();
    session.selectCard("screen");
    const view = session.getViewModel();

    expect(view.shotClock).toBe(14);
    expect(view.advantage).toBe(0);
    expect(view.intentName).toBe("Pressure & Help");
    expect(view.assignments).toHaveLength(3);
    expect(view.cards).toHaveLength(5);
    expect(
      view.players
        .filter((player) => player.interaction === "legalActor")
        .map((player) => player.id),
    ).toEqual(["offense-sg", "offense-c"]);
    expect(view.players.find((player) => player.hasBall)?.id).toBe("offense-pg");
  });

  it("wyjaśnia, jak Screen przygotowuje kontrę na intencję obrony", () => {
    const session = createSession();

    session.selectCard("screen");
    session.selectPlayer("offense-c");
    session.selectPlayer("offense-pg");

    expect(session.getViewModel().feedback).toContain(
      "Drive może teraz pokonać presję",
    );
  });

  it("pokazuje konkretny powód niedostępnej karty bez zmiany stanu", () => {
    const session = createSession();
    const state = session.state;
    const snapshot = JSON.stringify(state);

    session.selectCard("kickOut");

    expect(session.state).toBe(state);
    expect(JSON.stringify(session.state)).toBe(snapshot);
    expect(session.getViewModel().feedback).toBe(
      "NIELEGALNE: Kick Out wymaga wejścia w paint.",
    );
  });

  it("prowadzi przygotowaną sekwencję przez wykonawców i cele do podsumowania", () => {
    const session = createSession();
    playPreparedShot(session);
    const view = session.getViewModel();

    expect(view.phase).toBe("completed");
    expect(view.shotClock).toBe(4);
    expect(view.advantage).toBe(3);
    expect(view.summary).toMatchObject({
      outcome: "made",
      category: "Perfect",
      score: 95,
    });
    expect(view.summary?.modifiers).toEqual([
      "Umiejętność +76",
      "Strefa +0",
      "Otwarta pozycja +16",
      "Advantage +18",
    ]);
  });

  it("obsługuje alternatywną ścieżkę Pass → Shot", () => {
    const session = createSession();

    session.selectCard("pass");
    session.selectPlayer("offense-pg");
    expect(
      session
        .getViewModel()
        .players.find((player) => player.id === "offense-sg")?.interaction,
    ).toBe("legalTarget");
    session.selectPlayer("offense-sg");
    session.selectCard("shot");
    session.selectPlayer("offense-sg");

    expect(session.state.phase).toBe("completed");
    expect(session.state.result?.quality?.category).toBe("Decent");
    expect(session.state.result?.quality?.totalScore).toBe(58);
  });

  it("resetuje bez przeładowania i odtwarza wynik dla tego samego seeda", () => {
    const session = createSession();
    playPreparedShot(session);
    const firstResult = session.state.result;

    session.reset();
    expect(session.state.phase).toBe("playerTurn");
    expect(session.state.history).toEqual([]);
    playPreparedShot(session);

    expect(session.state.result).toEqual(firstResult);
  });

  it("udostępnia scenariusz wyczerpania zegara bez dodawania nowej mechaniki", () => {
    const session = new PossessionSession(
      { ...PROTOTYPE_SETUP, shotClock: 9 },
      PROTOTYPE_CARDS,
      42,
    );

    session.selectCard("screen");
    session.selectPlayer("offense-c");
    session.selectPlayer("offense-pg");
    session.selectCard("drive");
    session.selectPlayer("offense-pg");
    session.selectCard("kickOut");
    session.selectPlayer("offense-pg");
    session.selectPlayer("offense-sg");
    session.selectCard("pass");
    session.selectPlayer("offense-sg");
    session.selectPlayer("offense-pg");

    expect(session.state.phase).toBe("completed");
    expect(session.state.result).toEqual({ outcome: "clockExpired" });
    expect(session.getViewModel().feedback).toContain("KONIEC CZASU");
  });
});

function createSession(): PossessionSession {
  return new PossessionSession(PROTOTYPE_SETUP, PROTOTYPE_CARDS, 42);
}

function playPreparedShot(session: PossessionSession): void {
  session.selectCard("screen");
  session.selectPlayer("offense-c");
  session.selectPlayer("offense-pg");
  session.selectCard("drive");
  session.selectPlayer("offense-pg");
  session.selectCard("kickOut");
  session.selectPlayer("offense-pg");
  session.selectPlayer("offense-sg");
  session.selectCard("shot");
  session.selectPlayer("offense-sg");
}

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import type { MatchViewModel } from "../../src/application/MatchSession.ts";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const ZONE_POINTS = {
  leftPerimeter: { x: 190, y: 390 },
  topPerimeter: { x: 430, y: 440 },
  rightPerimeter: { x: 670, y: 390 },
  paint: { x: 430, y: 220 },
} as const;

test("produkcyjny przepływ przełącza atak, podsumowanie i aktywną obronę", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const badResponses: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.method()} ${request.url()}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
  });

  await page.goto("/HOOP-RUN/?seed=42&e2e=1");
  await expect(page).toHaveTitle("HOOP-RUN");
  await expect(page.locator("canvas")).toBeVisible();
  await expect.poll(() => snapshot(page)).toMatchObject({
    seed: 42,
    phase: "activePossession",
    score: { player: 0, opponent: 0 },
    roleLabel: "ATAK",
    shotClock: 14,
  });

  const initial = await snapshot(page);
  expect(initial.cards.find((card) => card.id === "shot")?.count).toBeGreaterThan(0);
  await clickCard(page, "shot");
  const selected = await snapshot(page);
  const ballHandler = selected.players.find(
    (player) => player.side === "player" && player.hasBall,
  );
  if (ballHandler === undefined) throw new Error("Brak posiadacza piłki.");
  await clickPlayer(page, ballHandler.id);

  await expect.poll(() => snapshot(page)).toMatchObject({
    phase: "possessionSummary",
    possessionSummary: { role: "offense", nextRole: "defense" },
  });
  await clickGame(page, 1163, 42);
  await expect.poll(() => snapshot(page)).toMatchObject({
    phase: "activePossession",
    roleLabel: "OBRONA",
    possessionNumber: 2,
    contextTitle: "OPPONENT PLAN",
  });

  await playDefensePossession(page);
  await expect.poll(() => snapshot(page)).toMatchObject({
    phase: "possessionSummary",
    possessionSummary: { role: "defense", nextRole: "offense" },
  });

  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
  expect(badResponses).toEqual([]);
});

test("kontrolowany seed kończy się zwycięstwem i obsługuje rewanż", async ({
  page,
}) => {
  await page.goto("/HOOP-RUN/?seed=2&e2e=1");
  await expect(page.locator("canvas")).toBeVisible();

  const completed = await playFullMatch(page, "prepared", "contextual");
  expect(completed.phase).toBe("completed");
  expect(completed.matchSummary?.outcomeLabel).toBe("ZWYCIĘSTWO");
  expect(completed.score.player).toBeGreaterThanOrEqual(11);
  expect(completed.score.player - completed.score.opponent).toBeGreaterThanOrEqual(2);

  await clickGame(page, 1064, 42);
  await expect.poll(() => snapshot(page)).toMatchObject({
    phase: "activePossession",
    seed: 2,
    score: { player: 0, opponent: 0 },
    roleLabel: "ATAK",
    possessionNumber: 1,
  });
});

test("kontrolowany seed kończy się porażką po pełnej zmianie ról", async ({
  page,
}) => {
  const diagnostics = collectDiagnostics(page);
  await page.goto("/HOOP-RUN/?seed=42&e2e=1");
  await expect(page.locator("canvas")).toBeVisible();

  const completed = await playFullMatch(page, "immediate", "pressure");
  expect(completed.phase).toBe("completed");
  expect(completed.matchSummary?.outcomeLabel).toBe("PORAŻKA");
  expect(completed.score.opponent).toBeGreaterThanOrEqual(11);
  expect(completed.matchSummary?.playerStats.possessions).toBeGreaterThan(1);
  expect(completed.matchSummary?.opponentStats.possessions).toBeGreaterThan(1);
  expect(diagnostics.consoleErrors).toEqual([]);
  expect(diagnostics.failedRequests).toEqual([]);
  expect(diagnostics.badResponses).toEqual([]);
});

test("pełne zwycięstwo pozostaje grywalne w widoku 1024×768", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/HOOP-RUN/?seed=2&e2e=1");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCSS("display", "block");

  const completed = await playFullMatch(page, "prepared", "contextual");
  expect(completed.matchSummary?.outcomeLabel).toBe("ZWYCIĘSTWO");
  const bounds = await page.locator("canvas").boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds?.x).toBeGreaterThanOrEqual(0);
  expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(1024);
});

async function playFullMatch(
  page: Page,
  offensePolicy: "immediate" | "prepared",
  defensePolicy: "pressure" | "contextual",
): Promise<MatchViewModel> {
  for (let step = 0; step < 100; step += 1) {
    const view = await snapshot(page);
    if (view.phase === "completed") return view;
    if (view.phase === "possessionSummary") {
      await clickGame(page, 1163, 42);
    } else if (view.role === "offense") {
      if (offensePolicy === "prepared") await playPreparedOffense(page);
      else await playImmediateOffense(page);
    } else {
      await playDefensePossession(page, defensePolicy);
    }
  }
  throw new Error("Pełny mecz nie zakończył się w limicie kroków.");
}

async function playImmediateOffense(page: Page): Promise<void> {
  await playCardThroughInteractions(page, "shot");
}

async function playPreparedOffense(page: Page): Promise<void> {
  const used = new Set<string>();
  while (true) {
    const view = await snapshot(page);
    if (view.phase !== "activePossession" || view.role !== "offense") return;
    const preparation = ["screen", "drive", "kickOut"].find((id) => {
      const card = view.cards.find((candidate) => candidate.id === id);
      return (
        card?.status === "available" &&
        !used.has(id) &&
        view.shotClock >= card.timeCost + 3
      );
    });
    const cardId = preparation ?? "shot";
    used.add(cardId);
    await playCardThroughInteractions(page, cardId);
  }
}

async function playDefensePossession(
  page: Page,
  policy: "pressure" | "contextual" = "pressure",
): Promise<void> {
  for (let step = 0; step < 6; step += 1) {
    const view = await snapshot(page);
    if (view.phase !== "activePossession") return;
    const priorities =
      policy === "pressure"
        ? ["pressure", "doubleTeam", "switch", "helpDefense", "goUnder"]
        : defensePriorities(view.currentAction ?? "");
    const card = priorities
      .map((id) => view.cards.find((candidate) => candidate.id === id))
      .find((candidate) => candidate?.status === "available");
    if (card === undefined) throw new Error("Brak legalnej odpowiedzi obronnej.");
    await playCardThroughInteractions(page, card.id);
  }
  throw new Error("Posiadanie defensywne nie zakończyło się w limicie.");
}

function defensePriorities(currentAction: string): readonly string[] {
  if (currentAction.includes("Screen")) return ["switch", "doubleTeam", "pressure"];
  if (currentAction.includes("Drive")) return ["helpDefense", "doubleTeam", "pressure"];
  if (
    currentAction.includes("Shot") ||
    currentAction.includes("Finish") ||
    currentAction.includes("Three")
  ) {
    return ["doubleTeam", "pressure"];
  }
  return ["pressure", "doubleTeam"];
}

async function playCardThroughInteractions(page: Page, cardId: string): Promise<void> {
  await clickCard(page, cardId);
  for (let step = 0; step < 3; step += 1) {
    const target = (await snapshot(page)).players.find(
      (player) =>
        player.interaction === "legalActor" || player.interaction === "legalTarget",
    );
    if (target === undefined) return;
    await clickPlayer(page, target.id);
  }
  throw new Error(`Karta ${cardId} nie zakończyła wyboru celu.`);
}

function collectDiagnostics(page: Page): {
  consoleErrors: string[];
  failedRequests: string[];
  badResponses: string[];
} {
  const diagnostics = {
    consoleErrors: [] as string[],
    failedRequests: [] as string[],
    badResponses: [] as string[],
  };
  page.on("console", (message) => {
    if (message.type() === "error") diagnostics.consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    diagnostics.failedRequests.push(`${request.method()} ${request.url()}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      diagnostics.badResponses.push(`${response.status()} ${response.url()}`);
    }
  });
  return diagnostics;
}

async function clickCard(page: Page, cardId: string): Promise<void> {
  const view = await snapshot(page);
  const index = view.cards.findIndex((card) => card.id === cardId);
  if (index < 0) throw new Error(`Nie znaleziono karty ${cardId}.`);
  const spacing = GAME_WIDTH / Math.max(5, view.cards.length);
  const width = Math.min(232, spacing - 12);
  await clickGame(page, 30 + index * spacing + width / 2, 606);
}

async function clickPlayer(page: Page, playerId: string): Promise<void> {
  const view = await snapshot(page);
  const player = view.players.find((candidate) => candidate.id === playerId);
  if (player === undefined) throw new Error(`Nie znaleziono zawodnika ${playerId}.`);
  const occupants = view.players.filter((candidate) => candidate.zone === player.zone);
  const index = occupants.findIndex((candidate) => candidate.id === playerId);
  const anchor = ZONE_POINTS[player.zone];
  const spacing = occupants.length > 1 ? 74 : 0;
  const offset = (index - (occupants.length - 1) / 2) * spacing;
  await clickGame(
    page,
    anchor.x + offset,
    anchor.y + (player.side === "player" ? 14 : -14),
  );
}

async function clickGame(page: Page, x: number, y: number): Promise<void> {
  const canvas = page.locator("canvas");
  const bounds = await canvas.boundingBox();
  if (bounds === null) throw new Error("Canvas gry nie jest widoczny.");
  await page.mouse.click(
    bounds.x + (x / GAME_WIDTH) * bounds.width,
    bounds.y + (y / GAME_HEIGHT) * bounds.height,
  );
}

async function snapshot(page: Page): Promise<MatchViewModel> {
  return page.evaluate(() => {
    const bridge = window.__HOOP_RUN_TEST__;
    if (bridge === undefined) throw new Error("Most testowy nie jest aktywny.");
    return bridge.snapshot();
  });
}

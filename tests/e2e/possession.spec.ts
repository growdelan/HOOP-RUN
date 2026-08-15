import { expect, test } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";

import type { MatchViewModel } from "../../src/application/MatchSession.ts";
import type { RunDeckCardView, RunViewModel } from "../../src/application/RunSession.ts";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const ZONE_POINTS = {
  leftPerimeter: { x: 190, y: 390 },
  topPerimeter: { x: 430, y: 440 },
  rightPerimeter: { x: 670, y: 390 },
  paint: { x: 430, y: 220 },
} as const;

test("start, Jak grać i pierwszy mecz działają przez rzeczywiste kliknięcia", { tag: "@smoke" }, async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const diagnostics = collectDiagnostics(page);
  await page.goto("/HOOP-RUN/?seed=42&e2e=1");
  await expect(page).toHaveTitle("HOOP-RUN");
  await expect(page.locator("canvas")).toBeVisible();
  await expect.poll(() => snapshot(page)).toMatchObject({ screen: "start", stage: 1 });

  await clickGame(page, 640, 518);
  await expect.poll(() => snapshot(page)).toMatchObject({
    screen: "howTo",
    howTo: expect.arrayContaining([
      expect.objectContaining({
        lines: expect.arrayContaining([
          "Trafienie z paint daje 1 punkt, a z obwodu 2 punkty.",
        ]),
      }),
      expect.objectContaining({
        lines: expect.arrayContaining([
          "Jakość rzutu 54 oznacza dokładnie 54% szansy trafienia.",
        ]),
      }),
    ]),
  });
  await attachCanvasEvidence(page, testInfo, "onboarding-1024x768");
  await clickGame(page, 640, 620);
  await expect.poll(() => snapshot(page)).toMatchObject({ screen: "start" });
  await startRun(page);

  await expect.poll(() => snapshot(page)).toMatchObject({
    screen: "match",
    progressLabel: "MECZ 1/3",
    opponent: { id: "fundamentals", name: "Fundamentals" },
    match: {
      phase: "activePossession",
      score: { player: 0, opponent: 0 },
      roleLabel: "ATAK",
    },
  });
  await playCardThroughInteractions(page, "shot");
  await expect.poll(() => matchSnapshot(page)).toMatchObject({
    phase: "possessionSummary",
    possessionSummary: { role: "offense", nextRole: "defense" },
  });
  await clickGame(page, 1163, 42);
  await expect.poll(() => matchSnapshot(page)).toMatchObject({
    phase: "activePossession",
    roleLabel: "OBRONA",
    possessionNumber: 2,
  });

  expect(diagnostics.consoleErrors).toEqual([]);
  expect(diagnostics.failedRequests).toEqual([]);
  expect(diagnostics.badResponses).toEqual([]);
});

test("kontrolowany seed przechodzi przez nagrody, zmienione talie i kończy zwycięski run", async ({ page }, testInfo) => {
  test.setTimeout(360_000);
  await page.setViewportSize({ width: 1024, height: 768 });
  const diagnostics = collectDiagnostics(page);
  await page.goto("/HOOP-RUN/?seed=2&e2e=1");
  await startRun(page);

  const result = await playRun(page, "prepared", "contextual", testInfo);
  expect(result.view.screen).toBe("summary");
  expect(result.view.summary?.outcome).toBe("success");
  expect(result.view.summary?.results).toHaveLength(3);
  expect(result.view.summary?.rewards).toHaveLength(2);
  expect(result.sawRewardInHand).toBe(true);
  expect(result.usedReward).toBe(true);
  expect(result.rewardEffectObserved).toBe(true);
  expect(deckSize(result.view.offenseDeck) + deckSize(result.view.defenseDeck)).toBe(22);
  expect(result.view.summary?.rewards.every((reward) => reward.name.length > 0)).toBe(true);
  expect(result.view.summary?.offenseDeck).toContainEqual({
    cardId: "stepBack",
    name: "Step Back",
    count: 1,
  });

  await clickGame(page, 640, 624);
  await expect.poll(() => snapshot(page)).toMatchObject({
    screen: "match",
    stage: 1,
    progressLabel: "MECZ 1/3",
    offenseDeck: { length: 5 },
    defenseDeck: { length: 5 },
    rewards: [],
    results: [],
  });
  expect(diagnostics.consoleErrors).toEqual([]);
  expect(diagnostics.failedRequests).toEqual([]);
  expect(diagnostics.badResponses).toEqual([]);
});

test("oferta nagrody pozostaje czytelna w obu viewportach", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/HOOP-RUN/?seed=2&e2e=1");
  await startRun(page);
  await playUntilRunScreenChanges(page);

  const offer = await snapshot(page);
  expect(offer.screen).toBe("reward");
  expect(offer.rewardOffer).toHaveLength(3);
  for (const reward of offer.rewardOffer ?? []) {
    expect(reward.roleLabel).toMatch(/ATAK|OBRONA/);
    expect(reward.effect.length).toBeGreaterThan(20);
    expect(reward.tradeoff.length).toBeGreaterThan(20);
  }
  await attachCanvasEvidence(page, testInfo, "reward-1280x720", 1280, 720);

  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/HOOP-RUN/?seed=2&e2e=1");
  await startRun(page);
  await playUntilRunScreenChanges(page);
  const compactOffer = await snapshot(page);
  expect(compactOffer.screen).toBe("reward");
  expect(compactOffer.rewardOffer).toEqual(offer.rewardOffer);
  await attachCanvasEvidence(page, testInfo, "reward-1024x768");
});

test("kontrolowana porażka kończy run bez oferty nagrody", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const diagnostics = collectDiagnostics(page);
  await page.goto("/HOOP-RUN/?seed=42&e2e=1");
  await startRun(page);

  const result = await playRun(page, "immediate", "pressure");
  expect(result.view.screen).toBe("summary");
  expect(result.view.summary?.outcome).toBe("failure");
  expect(result.view.summary?.results.at(-1)?.winner).toBe("opponent");
  expect(result.view.rewardOffer).toBeUndefined();
  expect(result.view.summary?.reachedStage).toBeGreaterThanOrEqual(1);
  expect(diagnostics.consoleErrors).toEqual([]);
  expect(diagnostics.failedRequests).toEqual([]);
  expect(diagnostics.badResponses).toEqual([]);
});

test("przepływ startu i meczu mieści się w widoku 1024×768", { tag: "@smoke" }, async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/HOOP-RUN/?seed=2&e2e=1");
  await expect(page.locator("canvas")).toBeVisible();
  await startRun(page);
  await expect.poll(() => snapshot(page)).toMatchObject({ screen: "match" });
  const bounds = await page.locator("canvas").boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds?.x).toBeGreaterThanOrEqual(0);
  expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(1024);
  expect(bounds?.y).toBeGreaterThanOrEqual(0);
  expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(768);
});

test("niedostępny getter localStorage nie blokuje uruchomienia gry", { tag: "@smoke" }, async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get: () => { throw new DOMException("blocked", "SecurityError"); },
    });
  });
  const diagnostics = collectDiagnostics(page);
  await page.goto("/HOOP-RUN/?seed=42&e2e=1");
  await expect(page.locator("canvas")).toBeVisible();
  await expect.poll(() => snapshot(page)).toMatchObject({
    screen: "start",
    canContinue: false,
    persistenceUnavailable: true,
    persistenceError: expect.stringContaining("bez zapisu"),
  });
  await clickGame(page, 640, 411);
  await expect.poll(() => snapshot(page)).toMatchObject({
    screen: "match",
    stage: 1,
    persistenceUnavailable: true,
    persistenceError: expect.stringContaining("bez zapisu"),
  });
  expect(diagnostics.consoleErrors).toEqual([]);
  expect(diagnostics.failedRequests).toEqual([]);
  expect(diagnostics.badResponses).toEqual([]);
});

test("invalid JSON i błąd usunięcia pozwalają rozpocząć run w trybie bez zapisu", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem("hoop-run:run-checkpoint", "{broken");
    const removeItem = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function (key: string): void {
      if (key === "hoop-run:run-checkpoint") throw new DOMException("blocked", "SecurityError");
      removeItem.call(this, key);
    };
  });
  await page.setViewportSize({ width: 1024, height: 768 });
  const diagnostics = collectDiagnostics(page);
  await page.goto("/HOOP-RUN/?seed=2&e2e=1");
  await expect.poll(() => snapshot(page)).toMatchObject({
    screen: "start",
    checkpointError: expect.stringContaining("JSON"),
    persistenceUnavailable: false,
  });
  await clickGame(page, 640, 524);
  await expect.poll(() => snapshot(page)).toMatchObject({
    screen: "start",
    persistenceUnavailable: true,
    persistenceError: expect.stringContaining("TRYB BEZ ZAPISU"),
  });
  expect((await snapshot(page)).checkpointError).toBeUndefined();
  await clickGame(page, 640, 411);
  await expect.poll(() => snapshot(page)).toMatchObject({
    screen: "match",
    persistenceUnavailable: true,
    persistenceError: expect.stringContaining("TRYB BEZ ZAPISU"),
  });
  await playUntilRunScreenChanges(page);
  const offer = (await snapshot(page)).rewardOffer?.[0];
  if (offer === undefined) throw new Error("Brak nagrody w teście trybu bez zapisu.");
  await clickGame(page, 265 + offer.index * 390, 385);
  await expect.poll(() => snapshot(page)).toMatchObject({
    screen: "intermission",
    persistenceUnavailable: true,
    persistenceError: expect.stringContaining("TRYB BEZ ZAPISU"),
  });
  await attachCanvasEvidence(page, testInfo, "discard-failure-no-persistence-1024x768");
  await clickGame(page, 850, 577);
  await expect.poll(() => snapshot(page)).toMatchObject({ screen: "intermission" });
  expect(diagnostics.consoleErrors).toEqual([]);
  expect(diagnostics.failedRequests).toEqual([]);
  expect(diagnostics.badResponses).toEqual([]);
});

test("głęboko zagnieżdżony slot nie blokuje uruchomienia strony ani nowego runu", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
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
    const deeplyNested = `${"[".repeat(20_000)}0${"]".repeat(20_000)}`;
    const serialized = JSON.stringify(shallow).replace(`"${placeholder}"`, deeplyNested);
    localStorage.setItem("hoop-run:run-checkpoint", serialized);
  });
  await page.setViewportSize({ width: 1024, height: 768 });
  const diagnostics = collectDiagnostics(page);
  await page.goto("/HOOP-RUN/?seed=42&e2e=1");
  await expect(page.locator("canvas")).toBeVisible();
  await expect.poll(() => snapshot(page)).toMatchObject({
    screen: "start",
    canContinue: false,
    checkpointError: expect.stringContaining("struktur"),
  });
  await attachCanvasEvidence(page, testInfo, "deep-checkpoint-error-1024x768");
  await clickGame(page, 640, 524);
  await expect.poll(() => snapshot(page)).toMatchObject({ screen: "start", canContinue: false });
  expect((await snapshot(page)).checkpointError).toBeUndefined();
  await clickGame(page, 640, 411);
  await expect.poll(() => snapshot(page)).toMatchObject({ screen: "match", stage: 1 });
  expect(diagnostics.consoleErrors).toEqual([]);
  expect(diagnostics.failedRequests).toEqual([]);
  expect(diagnostics.badResponses).toEqual([]);
});

test("checkpoint przeżywa reload, wznawia intermission i wymaga potwierdzenia zastąpienia", async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  const diagnostics = collectDiagnostics(page);
  await page.goto("/HOOP-RUN/?seed=2&e2e=1");
  await startRun(page);
  await playUntilRunScreenChanges(page);
  const offer = await snapshot(page);
  const reward = offer.rewardOffer?.[0];
  if (reward === undefined) throw new Error("Brak nagrody do checkpointu.");
  await clickGame(page, 265 + reward.index * 390, 385);
  const beforeSave = await snapshot(page);
  expect(beforeSave.screen).toBe("intermission");
  await clickGame(page, 850, 577);
  await expect.poll(() => snapshot(page)).toMatchObject({ screen: "start", canContinue: true });
  expect(await page.evaluate(() => localStorage.getItem("hoop-run:run-checkpoint"))).toContain('"version":1');
  expect(await page.evaluate(() => localStorage.getItem("hoop-run:run-checkpoint"))).toContain('"shotClock":14');
  await attachCanvasEvidence(page, testInfo, "checkpoint-start-1280x720", 1280, 720);

  await page.goto("/HOOP-RUN/?seed=2&clock=9&e2e=1");
  await expect.poll(() => snapshot(page)).toMatchObject({ screen: "start", canContinue: true });
  await clickGame(page, 640, 485);
  const resumed = await snapshot(page);
  expect(resumed).toMatchObject({
    screen: "intermission",
    stage: beforeSave.stage,
    rewards: beforeSave.rewards,
    results: beforeSave.results,
    offenseDeck: beforeSave.offenseDeck,
    defenseDeck: beforeSave.defenseDeck,
  });
  await clickGame(page, 640, 577);
  await expect.poll(() => snapshot(page)).toMatchObject({ screen: "match", stage: 2, match: { shotClock: 14 } });

  await page.reload();
  await clickGame(page, 640, 411);
  await expect.poll(() => snapshot(page)).toMatchObject({ screen: "confirmNewRun", needsNewRunConfirmation: true });
  await clickGame(page, 480, 499);
  await expect.poll(() => snapshot(page)).toMatchObject({ screen: "start", canContinue: true });
  await clickGame(page, 640, 411);
  await clickGame(page, 800, 499);
  await expect.poll(() => snapshot(page)).toMatchObject({ screen: "match", stage: 1, canContinue: false });
  expect(await page.evaluate(() => localStorage.getItem("hoop-run:run-checkpoint"))).toBeNull();
  expect(diagnostics.consoleErrors).toEqual([]);
  expect(diagnostics.failedRequests).toEqual([]);
  expect(diagnostics.badResponses).toEqual([]);
});

test("uszkodzony checkpoint można odrzucić bez częściowego wznowienia", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const diagnostics = collectDiagnostics(page);
  await page.goto("/HOOP-RUN/?seed=42&e2e=1");
  await page.evaluate(() => localStorage.setItem("hoop-run:run-checkpoint", "{broken"));
  await page.reload();
  const corrupt = await snapshot(page);
  expect(corrupt).toMatchObject({ screen: "start", canContinue: false });
  expect(corrupt.checkpointError).toContain("JSON");
  await attachCanvasEvidence(page, testInfo, "corrupt-checkpoint-1024x768");
  await clickGame(page, 640, 524);
  await expect.poll(() => snapshot(page)).toMatchObject({ screen: "start", canContinue: false });
  expect((await snapshot(page)).checkpointError).toBeUndefined();
  expect(await page.evaluate(() => localStorage.getItem("hoop-run:run-checkpoint"))).toBeNull();
  await startRun(page);
  expect(diagnostics.consoleErrors).toEqual([]);
  expect(diagnostics.failedRequests).toEqual([]);
  expect(diagnostics.badResponses).toEqual([]);
});

async function startRun(page: Page): Promise<void> {
  await clickGame(page, 640, 445);
  await expect.poll(() => snapshot(page)).toMatchObject({ screen: "match" });
}

async function playUntilRunScreenChanges(page: Page): Promise<void> {
  for (let step = 0; step < 120; step += 1) {
    const run = await snapshot(page);
    if (run.screen !== "match") return;
    const match = run.match;
    if (match === undefined) throw new Error("Brak aktywnego meczu.");
    if (match.phase === "possessionSummary") await clickGame(page, 1163, 42);
    else if (match.role === "offense") await playPreparedOffenseStep(page, match);
    else await playDefensePossession(page, "contextual");
  }
  throw new Error("Mecz nie zakończył się w limicie kroków.");
}

async function playRun(
  page: Page,
  offensePolicy: "immediate" | "prepared",
  defensePolicy: "pressure" | "contextual",
  evidence?: TestInfo,
): Promise<{
  view: RunViewModel;
  sawRewardInHand: boolean;
  usedReward: boolean;
  rewardEffectObserved: boolean;
}> {
  let selectedRewardId: string | undefined;
  const rewardUsedInPossessions = new Set<string>();
  let sawRewardInHand = false;
  let usedReward = false;
  let rewardEffectObserved = false;
  let rewardEvidenceAttached = false;
  let intermissionEvidenceAttached = false;
  for (let step = 0; step < 400; step += 1) {
    const run = await snapshot(page);
    if (run.screen === "summary") {
      return { view: run, sawRewardInHand, usedReward, rewardEffectObserved };
    }
    if (run.screen === "reward") {
      const preferredRole = run.rewards.length === 0 ? "offense" : "defense";
      const preferred = run.rewardOffer?.find((reward) => reward.role === preferredRole) ?? run.rewardOffer?.[0];
      if (preferred === undefined) throw new Error("Brak oferty nagrody.");
      expect(preferred.name.length).toBeGreaterThan(0);
      for (const reward of run.rewardOffer ?? []) {
        expect(reward.roleLabel).toMatch(/ATAK|OBRONA/);
        expect(reward.effect.length).toBeGreaterThan(20);
        expect(reward.tradeoff.length).toBeGreaterThan(20);
      }
      if (evidence !== undefined && !rewardEvidenceAttached) {
        await attachCanvasEvidence(page, evidence, "reward-1024x768");
        rewardEvidenceAttached = true;
      }
      if (preferred.role === "offense") selectedRewardId = preferred.cardId;
      await clickGame(page, 265 + preferred.index * 390, 385);
      continue;
    }
    if (run.screen === "intermission") {
      expect(run.selectedReward?.name.length).toBeGreaterThan(0);
      if (evidence !== undefined && !intermissionEvidenceAttached) {
        await attachCanvasEvidence(page, evidence, "intermission-1024x768");
        intermissionEvidenceAttached = true;
      }
      await clickGame(page, 640, 577);
      continue;
    }
    const match = run.match;
    if (match === undefined) throw new Error(`Brak meczu na ekranie ${run.screen}.`);
    if (match.phase === "possessionSummary") {
      await clickGame(page, 1163, 42);
    } else if (match.role === "offense") {
      const rewardCard = selectedRewardId === undefined
        ? undefined
        : match.cards.find((card) => card.id === selectedRewardId);
      if (rewardCard !== undefined) sawRewardInHand = true;
      const possessionKey = `${run.stage}:${match.possessionNumber}`;
      if (
        rewardCard?.status === "available" &&
        match.shotClock >= rewardCard.timeCost + 3 &&
        !rewardUsedInPossessions.has(possessionKey)
      ) {
        const beforeChance = shotChance(match);
        const forecastVisible = rewardCard.insights.some((insight) => insight.includes("+12 PP"));
        await playCardThroughInteractions(page, rewardCard.id);
        rewardUsedInPossessions.add(possessionKey);
        usedReward = true;
        const afterReward = await matchSnapshot(page);
        const historyRecorded = afterReward.playedCardIds.includes(rewardCard.id);
        const shotAvailable = afterReward.cards.some(
          (card) => card.id === "shot" && card.status === "available",
        );
        if (
          afterReward.phase === "activePossession" &&
          shotAvailable
        ) {
          const qualityDelta = shotChance(afterReward) - beforeChance;
          await playCardThroughInteractions(page, "shot");
          const afterShot = await matchSnapshot(page);
          rewardEffectObserved ||=
            forecastVisible &&
            historyRecorded &&
            qualityDelta === 12 &&
            (afterShot.possessionSummary?.details.includes("Step Back +12") ?? false);
        }
      } else if (offensePolicy === "prepared") {
        await playPreparedOffenseStep(page, match);
      } else {
        await playCardThroughInteractions(page, "shot");
      }
    } else {
      await playDefensePossession(page, defensePolicy);
    }
  }
  throw new Error("Run nie zakończył się w limicie kroków.");
}

async function playPreparedOffenseStep(page: Page, view: MatchViewModel): Promise<void> {
  const preparation = ["screen", "drive", "kickOut"].find((id) => {
    const card = view.cards.find((candidate) => candidate.id === id);
    return card?.status === "available" && view.shotClock >= card.timeCost + 3;
  });
  await playCardThroughInteractions(page, preparation ?? "shot");
}

async function playDefensePossession(
  page: Page,
  policy: "pressure" | "contextual" = "pressure",
): Promise<void> {
  for (let step = 0; step < 6; step += 1) {
    const view = await matchSnapshot(page);
    if (view.phase !== "activePossession") return;
    const priorities = policy === "pressure"
      ? ["pressure", "doubleTeam", "switch", "helpDefense", "goUnder", "hedge", "closeOut"]
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
  if (currentAction.includes("Screen")) return ["hedge", "switch", "doubleTeam", "pressure"];
  if (currentAction.includes("Drive")) return ["helpDefense", "doubleTeam", "pressure"];
  if (currentAction.includes("Shot") || currentAction.includes("Finish") || currentAction.includes("Three")) {
    return ["closeOut", "doubleTeam", "pressure"];
  }
  return ["pressure", "doubleTeam"];
}

async function playCardThroughInteractions(page: Page, cardId: string): Promise<void> {
  await clickCard(page, cardId);
  for (let step = 0; step < 5; step += 1) {
    const target = (await matchSnapshot(page)).players.find(
      (player) => player.interaction === "legalActor" || player.interaction === "legalTarget",
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
    if (response.status() >= 400) diagnostics.badResponses.push(`${response.status()} ${response.url()}`);
  });
  return diagnostics;
}

async function clickCard(page: Page, cardId: string): Promise<void> {
  const view = await matchSnapshot(page);
  const index = view.cards.findIndex((card) => card.id === cardId);
  if (index < 0) throw new Error(`Nie znaleziono karty ${cardId}.`);
  const width = 232;
  const spacing = view.cards.length <= 1 ? 0 : (GAME_WIDTH - 60 - width) / (view.cards.length - 1);
  await clickGame(page, 30 + index * spacing + width / 2, 606);
}

async function clickPlayer(page: Page, playerId: string): Promise<void> {
  const view = await matchSnapshot(page);
  const player = view.players.find((candidate) => candidate.id === playerId);
  if (player === undefined) throw new Error(`Nie znaleziono zawodnika ${playerId}.`);
  const occupants = view.players.filter((candidate) => candidate.zone === player.zone);
  const index = occupants.findIndex((candidate) => candidate.id === playerId);
  const anchor = ZONE_POINTS[player.zone];
  const spacing = occupants.length > 1 ? 74 : 0;
  const offset = (index - (occupants.length - 1) / 2) * spacing;
  await clickGame(page, anchor.x + offset, anchor.y + (player.side === "player" ? 14 : -14));
}

async function clickGame(page: Page, x: number, y: number): Promise<void> {
  const bounds = await page.locator("canvas").boundingBox();
  if (bounds === null) throw new Error("Canvas gry nie jest widoczny.");
  await page.mouse.click(bounds.x + (x / GAME_WIDTH) * bounds.width, bounds.y + (y / GAME_HEIGHT) * bounds.height);
  await page.waitForTimeout(25);
}

async function matchSnapshot(page: Page): Promise<MatchViewModel> {
  const match = (await snapshot(page)).match;
  if (match === undefined) throw new Error("Snapshot nie zawiera aktywnego meczu.");
  return match;
}

async function snapshot(page: Page): Promise<RunViewModel> {
  return page.evaluate(() => {
    const bridge = window.__HOOP_RUN_TEST__;
    if (bridge === undefined) throw new Error("Most testowy nie jest aktywny.");
    return bridge.snapshot();
  });
}

function shotChance(view: MatchViewModel): number {
  const insight = view.cards.find((card) => card.id === "shot")?.insights
    .find((value) => value.startsWith("SZANSA TRAFIENIA:"));
  const match = insight?.match(/(\d+)%/);
  if (match?.[1] === undefined) throw new Error("Brak procentowej prognozy rzutu.");
  return Number(match[1]);
}

function deckSize(deck: readonly RunDeckCardView[]): number {
  return deck.reduce((total, card) => total + card.count, 0);
}

async function attachCanvasEvidence(
  page: Page,
  testInfo: TestInfo,
  name: string,
  viewportWidth = 1024,
  viewportHeight = 768,
): Promise<void> {
  const canvas = page.locator("canvas");
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds?.x).toBeGreaterThanOrEqual(0);
  expect(bounds?.y).toBeGreaterThanOrEqual(0);
  expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(viewportWidth);
  expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(viewportHeight);
  await testInfo.attach(name, {
    body: await canvas.screenshot(),
    contentType: "image/png",
  });
}

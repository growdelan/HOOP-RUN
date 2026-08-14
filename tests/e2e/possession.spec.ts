import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import type { PossessionViewModel } from "../../src/application/PossessionSession.ts";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

test("produkcyjny przepływ przygotowanego rzutu i resetu jest odtwarzalny", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const badResponses: string[] = [];
  const loadedResources: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.method()} ${request.url()}`);
  });
  page.on("response", (response) => {
    loadedResources.push(response.url());
    if (response.status() >= 400) {
      badResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto("/HOOP-RUN/?seed=42&e2e=1");
  await expect(page).toHaveTitle("HOOP-RUN");
  await expect(page.locator("canvas")).toBeVisible();
  await expect.poll(() => snapshot(page)).toMatchObject({
    seed: 42,
    phase: "playerTurn",
    shotClock: 14,
    advantage: 0,
    intentName: "Pressure & Help",
  });

  const initial = await snapshot(page);
  expect(initial.cards.filter((card) => card.status === "available")).toHaveLength(4);
  expect(initial.cards.find((card) => card.id === "kickOut")?.status).toBe(
    "blocked",
  );

  await clickGame(page, 878, 606);
  await expect.poll(() => snapshot(page)).toMatchObject({
    shotClock: 14,
    feedback: "NIELEGALNE: Kick Out wymaga wejścia w paint.",
  });

  await playPreparedShot(page);
  const firstSummary = await snapshot(page);
  expect(firstSummary).toMatchObject({
    phase: "completed",
    shotClock: 4,
    advantage: 3,
    summary: {
      outcome: "made",
      outcomeLabel: "TRAFIONY",
      category: "Perfect",
      score: 95,
      modifiers: [
        "Umiejętność +76",
        "Strefa +0",
        "Otwarta pozycja +16",
        "Advantage +18",
      ],
    },
  });

  const urlBeforeReset = page.url();
  await clickGame(page, 1181, 41);
  await expect.poll(() => snapshot(page)).toMatchObject({
    phase: "playerTurn",
    shotClock: 14,
    advantage: 0,
    seed: 42,
  });
  expect(page.url()).toBe(urlBeforeReset);

  await playPreparedShot(page);
  expect((await snapshot(page)).summary).toEqual(firstSummary.summary);

  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
  expect(badResponses).toEqual([]);
  expect(
    loadedResources.some((url) => url.includes("/HOOP-RUN/assets/")),
  ).toBe(true);
});

async function playPreparedShot(page: Page): Promise<void> {
  await clickGame(page, 390, 606);
  await clickGame(page, 670, 404);
  await clickGame(page, 393, 454);
  await expect.poll(() => snapshot(page)).toMatchObject({
    shotClock: 12,
    feedback: expect.stringContaining("Drive może teraz pokonać presję"),
  });

  await clickGame(page, 634, 606);
  await clickGame(page, 393, 454);
  await expect.poll(() => snapshot(page)).toMatchObject({
    shotClock: 9,
    advantage: 2,
  });

  await clickGame(page, 878, 606);
  await clickGame(page, 393, 234);
  await clickGame(page, 153, 404);
  await expect.poll(() => snapshot(page)).toMatchObject({
    shotClock: 7,
    advantage: 3,
  });

  await clickGame(page, 1122, 606);
  await clickGame(page, 153, 404);
  await expect.poll(() => snapshot(page)).toMatchObject({ phase: "completed" });
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

async function snapshot(page: Page): Promise<PossessionViewModel> {
  return page.evaluate(() => {
    const bridge = window.__HOOP_RUN_TEST__;
    if (bridge === undefined) throw new Error("Most testowy nie jest aktywny.");
    return bridge.snapshot();
  });
}

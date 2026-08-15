import "./styles.css";

import { createGame } from "./application/createGame";
import { attachGameTestBridge } from "./platform/gameTestBridge";
import { parseRuntimeOptions } from "./platform/runtimeOptions";
import { createLocalStorageRunCheckpointRepository } from "./platform/LocalStorageRunCheckpointRepository.ts";

const gameContainer = document.querySelector<HTMLElement>("#game");

if (gameContainer === null) {
  throw new Error("Nie znaleziono kontenera #game.");
}

const runtimeOptions = parseRuntimeOptions(window.location.search);
const checkpointRepository = createLocalStorageRunCheckpointRepository(
  () => window.localStorage,
);
const game = createGame(gameContainer, runtimeOptions, checkpointRepository);

if (runtimeOptions.testMode) {
  attachGameTestBridge(game);
}

import Phaser from "phaser";

import { createGameConfig } from "../presentation/createGameConfig";
import type { RuntimeOptions } from "../platform/runtimeOptions";
import type { RunCheckpointRepository } from "./RunCheckpointRepository.ts";

export function createGame(
  parent: HTMLElement,
  options: RuntimeOptions,
  checkpointRepository: RunCheckpointRepository,
): Phaser.Game {
  return new Phaser.Game(createGameConfig(parent, options, checkpointRepository));
}

import Phaser from "phaser";

import { createGameConfig } from "../presentation/createGameConfig";
import type { RuntimeOptions } from "../platform/runtimeOptions";

export function createGame(
  parent: HTMLElement,
  options: RuntimeOptions,
): Phaser.Game {
  return new Phaser.Game(createGameConfig(parent, options));
}

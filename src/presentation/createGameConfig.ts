import Phaser from "phaser";

import type { RuntimeOptions } from "../platform/runtimeOptions";
import type { RunCheckpointRepository } from "../application/RunCheckpointRepository.ts";
import { PossessionScene } from "./scenes/PossessionScene";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

export function createGameConfig(
  parent: HTMLElement,
  options: RuntimeOptions,
  checkpointRepository: RunCheckpointRepository,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#08111f",
    scene: new PossessionScene(options, checkpointRepository),
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    render: {
      antialias: true,
      pixelArt: false,
    },
  };
}

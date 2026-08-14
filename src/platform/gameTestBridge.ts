import type Phaser from "phaser";

import type { MatchViewModel } from "../application/MatchSession";
import type { PossessionScene } from "../presentation/scenes/PossessionScene";

export interface GameTestBridge {
  snapshot(): MatchViewModel;
}

declare global {
  interface Window {
    __HOOP_RUN_TEST__?: GameTestBridge;
  }
}

export function attachGameTestBridge(game: Phaser.Game): void {
  Object.defineProperty(window, "__HOOP_RUN_TEST__", {
    configurable: true,
    value: Object.freeze({
      snapshot: () => {
        const scene = game.scene.getScene("possession") as PossessionScene;
        return JSON.parse(JSON.stringify(scene.getViewModel())) as MatchViewModel;
      },
    } satisfies GameTestBridge),
  });
}

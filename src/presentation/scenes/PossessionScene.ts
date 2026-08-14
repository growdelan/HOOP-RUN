import Phaser from "phaser";

import {
  PossessionSession,
} from "../../application/PossessionSession";
import type {
  CardView,
  PlayerView,
  PossessionViewModel,
} from "../../application/PossessionSession";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "../../content/brand";
import {
  PROTOTYPE_CARDS,
  PROTOTYPE_SETUP,
} from "../../content/prototypePossession";
import type { PlayerId, Zone } from "../../core/index";
import type { RuntimeOptions } from "../../platform/runtimeOptions";

const WIDTH = 1280;
const HEIGHT = 720;

interface Point {
  readonly x: number;
  readonly y: number;
}

const ZONE_POINTS: Readonly<Record<Zone, Point>> = {
  leftPerimeter: { x: 190, y: 390 },
  topPerimeter: { x: 430, y: 440 },
  rightPerimeter: { x: 670, y: 390 },
  paint: { x: 430, y: 220 },
};

const TOKEN_LABELS: Readonly<Record<PlayerId, string>> = {
  "offense-pg": "A1",
  "offense-sg": "A2",
  "offense-c": "A3",
  "defense-g": "D1",
  "defense-w": "D2",
  "defense-c": "D3",
};

export class PossessionScene extends Phaser.Scene {
  private readonly session: PossessionSession;

  public constructor(options: RuntimeOptions) {
    super("possession");
    this.session = new PossessionSession(
      { ...PROTOTYPE_SETUP, shotClock: options.shotClock },
      PROTOTYPE_CARDS,
      options.seed,
    );
  }

  public create(): void {
    this.renderView();
  }

  public getViewModel(): PossessionViewModel {
    return this.session.getViewModel();
  }

  private renderView(): void {
    this.children.removeAll(true);
    const view = this.session.getViewModel();
    this.drawBackground();
    this.drawHeader(view);
    this.drawCourt(view);
    this.drawInformationPanel(view);
    this.drawCards(view);
  }

  private drawBackground(): void {
    const background = this.add.graphics();
    background.fillStyle(0x050a13, 1);
    background.fillRect(0, 0, WIDTH, HEIGHT);
    background.fillStyle(0x0b1422, 1);
    background.fillRoundedRect(18, 14, 1244, 692, 22);
  }

  private drawHeader(view: PossessionViewModel): void {
    this.add.text(34, 25, PRODUCT_NAME, {
      color: "#f8fafc",
      fontFamily: "Arial, sans-serif",
      fontSize: "29px",
      fontStyle: "bold",
    }).setLetterSpacing(2);
    this.add.text(218, 35, PRODUCT_TAGLINE, {
      color: "#71829a",
      fontFamily: "Arial, sans-serif",
      fontSize: "11px",
    }).setLetterSpacing(1);

    this.drawStat(650, "ZEGAR", `${view.shotClock}s`, 0xf59e0b);
    this.drawStat(755, "ADVANTAGE", `${view.advantage} / 3`, 0x22c55e);
    this.drawStat(895, "SEED", `${view.seed}`, 0x60a5fa);

    this.drawButton(1032, 24, 38, 34, "−", () => {
      this.session.reset(Math.max(1, view.seed - 1));
      this.queueRender();
    });
    this.drawButton(1076, 24, 38, 34, "+", () => {
      this.session.reset(Math.min(0xffff_ffff, view.seed + 1));
      this.queueRender();
    });
    this.drawButton(1122, 24, 118, 34, "RESET", () => {
      this.session.reset();
      this.queueRender();
    }, 0x1d4ed8);
  }

  private drawStat(
    x: number,
    label: string,
    value: string,
    accent: number,
  ): void {
    this.add.rectangle(x, 39, 94, 45, 0x111d2e).setStrokeStyle(1, accent, 0.55);
    this.add.text(x - 39, 20, label, {
      color: "#8190a5",
      fontFamily: "Arial, sans-serif",
      fontSize: "9px",
      fontStyle: "bold",
    });
    this.add.text(x - 39, 33, value, {
      color: `#${accent.toString(16).padStart(6, "0")}`,
      fontFamily: "Arial, sans-serif",
      fontSize: "17px",
      fontStyle: "bold",
    });
  }

  private drawCourt(view: PossessionViewModel): void {
    const court = this.add.graphics();
    court.fillStyle(0x9e522c, 1);
    court.fillRoundedRect(30, 82, 800, 408, 18);
    court.lineStyle(3, 0xf4d7ad, 0.78);
    court.strokeRoundedRect(30, 82, 800, 408, 18);
    court.strokeRect(310, 82, 240, 168);
    court.strokeCircle(430, 250, 66);
    court.strokeEllipse(430, 142, 510, 255);
    court.lineBetween(380, 109, 480, 109);
    court.strokeCircle(430, 127, 13);

    this.drawZoneLabel(430, 176, "PAINT");
    this.drawZoneLabel(152, 462, "LEFT PERIMETER");
    this.drawZoneLabel(430, 468, "TOP PERIMETER");
    this.drawZoneLabel(708, 462, "RIGHT PERIMETER");

    const positions = this.calculatePlayerPositions(view.players);
    this.drawAssignments(view, positions);
    for (const player of view.players) {
      const position = positions.get(player.id);
      if (position !== undefined) this.drawPlayer(player, position);
    }
  }

  private calculatePlayerPositions(
    players: readonly PlayerView[],
  ): ReadonlyMap<PlayerId, Point> {
    const positions = new Map<PlayerId, Point>();
    for (const zone of Object.keys(ZONE_POINTS) as Zone[]) {
      const occupants = players.filter((player) => player.zone === zone);
      occupants.forEach((player, index) => {
        const anchor = ZONE_POINTS[zone];
        const spacing = occupants.length > 1 ? 74 : 0;
        const offset = (index - (occupants.length - 1) / 2) * spacing;
        positions.set(player.id, {
          x: anchor.x + offset,
          y: anchor.y + (player.side === "offense" ? 14 : -14),
        });
      });
    }
    return positions;
  }

  private drawAssignments(
    view: PossessionViewModel,
    positions: ReadonlyMap<PlayerId, Point>,
  ): void {
    const lines = this.add.graphics();
    lines.lineStyle(2, 0xfef3c7, 0.24);
    for (const assignment of view.assignments) {
      const defender = positions.get(assignment.defenderId);
      const offender = positions.get(assignment.offenderId);
      if (defender !== undefined && offender !== undefined) {
        lines.lineBetween(defender.x, defender.y, offender.x, offender.y);
      }
    }
    this.add.text(46, 96, "LINIE KRYCIA", {
      color: "#fef3c7",
      fontFamily: "Arial, sans-serif",
      fontSize: "10px",
    }).setAlpha(view.phase === "completed" ? 0.45 : 0.72);
  }

  private drawPlayer(player: PlayerView, position: Point): void {
    const palette =
      player.side === "offense"
        ? { fill: 0x1d4ed8, stroke: 0xbfdbfe, side: "ATK" }
        : { fill: 0xb91c1c, stroke: 0xfecaca, side: "DEF" };
    const interactionColor = {
      none: undefined,
      legalActor: 0x4ade80,
      selectedActor: 0xf8fafc,
      legalTarget: 0xfacc15,
    }[player.interaction];

    if (interactionColor !== undefined) {
      this.add.circle(position.x, position.y, 40).setStrokeStyle(5, interactionColor, 1);
    }
    const token = this.add
      .circle(position.x, position.y, 31, palette.fill)
      .setStrokeStyle(3, palette.stroke)
      .setInteractive({ useHandCursor: true });
    token.on("pointerdown", () => {
      this.session.selectPlayer(player.id);
      this.queueRender();
    });
    this.add.text(position.x, position.y - 3, TOKEN_LABELS[player.id] ?? player.id, {
      color: "#ffffff",
      fontFamily: "Arial, sans-serif",
      fontSize: "15px",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.add.text(position.x, position.y + 40, `${palette.side} · ${player.name}`, {
      backgroundColor: "#111827",
      color: "#f8fafc",
      fontFamily: "Arial, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
      padding: { x: 5, y: 3 },
    }).setOrigin(0.5);

    if (player.hasBall) {
      this.add.circle(position.x + 27, position.y - 25, 10, 0xf97316)
        .setStrokeStyle(2, 0xffedd5);
      this.add.text(position.x + 39, position.y - 38, "PIŁKA", {
        color: "#fff7ed",
        fontFamily: "Arial, sans-serif",
        fontSize: "8px",
        fontStyle: "bold",
      });
    }
  }

  private drawInformationPanel(view: PossessionViewModel): void {
    this.add.rectangle(1045, 286, 390, 408, 0x101b2b)
      .setStrokeStyle(1, 0x334155);
    this.add.text(868, 101, "DEFENSE INTENT", {
      color: "#f59e0b",
      fontFamily: "Arial, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
    }).setLetterSpacing(1);
    this.add.text(868, 122, view.intentName.toUpperCase(), {
      color: "#f8fafc",
      fontFamily: "Arial, sans-serif",
      fontSize: "19px",
      fontStyle: "bold",
    });
    this.add.text(868, 150, view.intentDescription, {
      color: "#a9b7ca",
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      lineSpacing: 4,
      wordWrap: { width: 344 },
    });

    this.add.line(1045, 201, 0, 0, 348, 0, 0x334155, 1);
    if (view.summary !== undefined) {
      this.drawShotSummary(view);
    } else {
      this.drawDecisionPanel(view);
    }

    this.drawLegend();
  }

  private drawDecisionPanel(view: PossessionViewModel): void {
    this.add.text(868, 220, "NASTĘPNA DECYZJA", {
      color: "#60a5fa",
      fontFamily: "Arial, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
    });
    this.add.text(868, 239, view.prompt, {
      color: "#f8fafc",
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      wordWrap: { width: 344 },
    });
    this.add.text(868, 292, "CO SIĘ STAŁO", {
      color: "#94a3b8",
      fontFamily: "Arial, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
    });
    this.add.text(868, 312, view.feedback, {
      color: view.feedback.startsWith("NIELEGALNE") ? "#fca5a5" : "#dbeafe",
      fontFamily: "Arial, sans-serif",
      fontSize: "13px",
      lineSpacing: 5,
      wordWrap: { width: 344 },
    });
    if (view.phase === "completed") {
      this.add.text(868, 388, "POSIADANIE ZAKOŃCZONE", {
        color: "#f59e0b",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
      });
    }
  }

  private drawShotSummary(view: PossessionViewModel): void {
    const summary = view.summary;
    if (summary === undefined) return;
    const outcomeColor = summary.outcome === "made" ? "#4ade80" : "#f87171";
    this.add.text(868, 216, summary.outcomeLabel, {
      color: outcomeColor,
      fontFamily: "Arial, sans-serif",
      fontSize: "30px",
      fontStyle: "bold",
    });
    this.add.text(868, 251, `${summary.category} · JAKOŚĆ ${summary.score}`, {
      color: "#f8fafc",
      fontFamily: "Arial, sans-serif",
      fontSize: "15px",
      fontStyle: "bold",
    });
    this.add.text(868, 282, "DLACZEGO", {
      color: "#94a3b8",
      fontFamily: "Arial, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
    });
    summary.modifiers.forEach((modifier, index) => {
      this.add.text(868, 302 + index * 21, `• ${modifier}`, {
        color: "#dbeafe",
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
      });
    });
  }

  private drawLegend(): void {
    this.add.text(868, 450, "PODŚWIETLENIA", {
      color: "#64748b",
      fontFamily: "Arial, sans-serif",
      fontSize: "9px",
      fontStyle: "bold",
    });
    this.add.text(868, 466, "ZIELONY: wykonawca   ŻÓŁTY: cel   BIAŁY: wybrany", {
      color: "#a9b7ca",
      fontFamily: "Arial, sans-serif",
      fontSize: "10px",
    });
  }

  private drawCards(view: PossessionViewModel): void {
    this.add.text(32, 506, "RĘKA — KLIKNIJ KARTĘ, POTEM PODŚWIETLONYCH ZAWODNIKÓW", {
      color: "#94a3b8",
      fontFamily: "Arial, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
    }).setLetterSpacing(1);

    view.cards.forEach((card, index) => {
      this.drawCard(card, 30 + index * 244, 528);
    });
  }

  private drawCard(card: CardView, x: number, y: number): void {
    const palette = {
      available: { fill: 0x17243a, stroke: 0x3b82f6, text: "DOSTĘPNA" },
      blocked: { fill: 0x231923, stroke: 0x7f1d1d, text: "NIELEGALNA" },
      selected: { fill: 0x17332d, stroke: 0x4ade80, text: "WYBRANA" },
      played: { fill: 0x111827, stroke: 0x334155, text: "ZAGRANA" },
    }[card.status];
    const surface = this.add.rectangle(x + 116, y + 78, 232, 146, palette.fill)
      .setStrokeStyle(card.status === "selected" ? 4 : 2, palette.stroke)
      .setInteractive({ useHandCursor: true });
    surface.on("pointerdown", () => {
      this.session.selectCard(card.id);
      this.queueRender();
    });
    this.add.text(x + 14, y + 12, card.name.toUpperCase(), {
      color: "#f8fafc",
      fontFamily: "Arial, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
    });
    this.add.text(x + 218, y + 13, `${card.timeCost}s`, {
      color: "#f59e0b",
      fontFamily: "Arial, sans-serif",
      fontSize: "15px",
      fontStyle: "bold",
    }).setOrigin(1, 0);
    this.add.text(x + 14, y + 46, cardDescription(card.kind), {
      color: "#a9b7ca",
      fontFamily: "Arial, sans-serif",
      fontSize: "11px",
      lineSpacing: 3,
      wordWrap: { width: 202 },
    });
    this.add.text(x + 14, y + 116, palette.text, {
      color: `#${palette.stroke.toString(16).padStart(6, "0")}`,
      fontFamily: "Arial, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
    }).setLetterSpacing(1);
  }

  private drawZoneLabel(x: number, y: number, label: string): void {
    this.add.text(x, y, label, {
      color: "#f7dfbd",
      fontFamily: "Arial, sans-serif",
      fontSize: "9px",
      fontStyle: "bold",
    }).setOrigin(0.5).setAlpha(0.82);
  }

  private drawButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void,
    fill = 0x17243a,
  ): void {
    const surface = this.add.rectangle(x + width / 2, y + height / 2, width, height, fill)
      .setStrokeStyle(1, 0x60a5fa)
      .setInteractive({ useHandCursor: true });
    surface.on("pointerdown", onClick);
    this.add.text(x + width / 2, y + height / 2, label, {
      color: "#f8fafc",
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      fontStyle: "bold",
    }).setOrigin(0.5);
  }

  private queueRender(): void {
    this.time.delayedCall(0, () => this.renderView());
  }
}

function cardDescription(kind: CardView["kind"]): string {
  const descriptions: Record<CardView["kind"], string> = {
    pass: "Przenieś piłkę do partnera.",
    screen: "Postaw zasłonę posiadaczowi.",
    drive: "Wejdź z obwodu do paint.",
    kickOut: "Odegraj z paint na obwód.",
    shot: "Oddaj rzut i zakończ akcję.",
  };
  return descriptions[kind];
}

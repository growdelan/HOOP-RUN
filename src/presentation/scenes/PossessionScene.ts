import Phaser from "phaser";

import { MatchSession } from "../../application/MatchSession";
import type {
  MatchCardView,
  MatchPlayerView,
  MatchViewModel,
} from "../../application/MatchSession";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "../../content/brand";
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

export class PossessionScene extends Phaser.Scene {
  private readonly session: MatchSession;
  private readonly testMode: boolean;

  public constructor(options: RuntimeOptions) {
    super("possession");
    this.session = new MatchSession(options.seed, options.shotClock);
    this.testMode = options.testMode;
  }

  public create(): void {
    this.renderView();
  }

  public getViewModel(): MatchViewModel {
    return this.session.getViewModel();
  }

  private renderView(): void {
    this.children.removeAll(true);
    const view = this.session.getViewModel();
    if (this.testMode) {
      this.game.canvas.dataset.hoopSnapshot = JSON.stringify(view);
    }
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

  private drawHeader(view: MatchViewModel): void {
    this.add.text(34, 23, PRODUCT_NAME, textStyle("#f8fafc", "27px", true))
      .setLetterSpacing(2);
    this.add.text(218, 57, PRODUCT_TAGLINE, textStyle("#71829a", "9px"))
      .setLetterSpacing(1);

    this.add.text(365, 18, "TY", textStyle("#60a5fa", "10px", true));
    this.add.text(365, 32, `${view.score.player}`, textStyle("#f8fafc", "28px", true));
    this.add.text(407, 35, ":", textStyle("#64748b", "21px", true));
    this.add.text(430, 18, "RYWAL", textStyle("#f87171", "10px", true));
    this.add.text(430, 32, `${view.score.opponent}`, textStyle("#f8fafc", "28px", true));
    this.add.text(494, 27, view.targetLabel, textStyle("#8190a5", "9px", true));

    this.drawStat(650, "ROLA", view.roleLabel, view.role === "offense" ? 0x60a5fa : 0x4ade80);
    this.drawStat(760, "POSIADANIE", `${view.possessionNumber}`, 0xa78bfa);
    this.drawStat(870, "ZEGAR", `${view.shotClock}s`, 0xf59e0b);
    this.drawStat(980, "SEED", `${view.seed}`, 0x38bdf8);

    if (view.canContinue) {
      this.drawButton(1088, 23, 150, 38, "DALEJ", () => {
        this.session.continue();
        this.queueRender();
      }, 0x1d4ed8);
    } else if (view.canRematch) {
      this.drawButton(1010, 23, 108, 38, "REWANŻ", () => {
        this.session.rematch();
        this.queueRender();
      }, 0x166534);
      this.drawButton(1126, 23, 112, 38, "NOWY MECZ", () => {
        this.session.startNewMatch();
        this.queueRender();
      }, 0x1d4ed8);
    }
  }

  private drawStat(x: number, label: string, value: string, accent: number): void {
    this.add.rectangle(x, 40, 98, 45, 0x111d2e).setStrokeStyle(1, accent, 0.55);
    this.add.text(x - 40, 20, label, textStyle("#8190a5", "8px", true));
    this.add.text(
      x - 40,
      33,
      value,
      textStyle(`#${accent.toString(16).padStart(6, "0")}`, "15px", true),
    );
  }

  private drawCourt(view: MatchViewModel): void {
    const court = this.add.graphics();
    court.fillStyle(0x9e522c, 1);
    court.fillRoundedRect(30, 82, 800, 408, 18);
    court.lineStyle(3, 0xf4d7ad, 0.78);
    court.strokeRoundedRect(30, 82, 800, 408, 18);
    court.strokeRect(310, 82, 240, 168);
    court.strokeCircle(430, 250, 66);
    court.strokeEllipse(430, 280, 510, 380);
    court.lineBetween(380, 109, 480, 109);
    court.strokeCircle(430, 127, 13);

    this.drawZoneLabel(430, 176, "PAINT · 1 PKT");
    this.drawZoneLabel(152, 462, "LEFT · 2 PKT");
    this.drawZoneLabel(430, 468, "TOP · 2 PKT");
    this.drawZoneLabel(708, 462, "RIGHT · 2 PKT");

    const positions = this.calculatePlayerPositions(view.players);
    this.drawAssignments(view, positions);
    for (const player of view.players) {
      const position = positions.get(player.id);
      if (position !== undefined) this.drawPlayer(player, position);
    }
  }

  private calculatePlayerPositions(
    players: readonly MatchPlayerView[],
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
          y: anchor.y + (player.side === "player" ? 14 : -14),
        });
      });
    }
    return positions;
  }

  private drawAssignments(
    view: MatchViewModel,
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
    this.add.text(46, 96, "LINIE KRYCIA", textStyle("#fef3c7", "9px", true))
      .setAlpha(view.phase === "activePossession" ? 0.72 : 0.38);
  }

  private drawPlayer(player: MatchPlayerView, position: Point): void {
    const palette =
      player.side === "player"
        ? { fill: 0x1d4ed8, stroke: 0xbfdbfe, side: "TY" }
        : { fill: 0xb91c1c, stroke: 0xfecaca, side: "RYWAL" };
    const interactionColor = {
      none: undefined,
      legalActor: 0x4ade80,
      selectedActor: 0xf8fafc,
      legalTarget: 0xfacc15,
    }[player.interaction];

    if (interactionColor !== undefined) {
      this.add.circle(position.x, position.y, 40).setStrokeStyle(5, interactionColor, 1);
    }
    const token = this.add.circle(position.x, position.y, 31, palette.fill)
      .setStrokeStyle(3, palette.stroke)
      .setInteractive({ useHandCursor: true });
    token.on("pointerdown", () => {
      this.session.selectPlayer(player.id);
      this.queueRender();
    });
    this.add.text(position.x, position.y - 2, player.name.slice(0, 2).toUpperCase(), {
      ...textStyle("#ffffff", "15px", true),
      align: "center",
    }).setOrigin(0.5);
    this.add.text(
      position.x,
      position.y + 40,
      `${palette.side} · ${player.name}`,
      {
        ...textStyle("#f8fafc", "9px", true),
        backgroundColor: "#111827",
        padding: { x: 5, y: 3 },
      },
    ).setOrigin(0.5);

    if (player.hasBall) {
      this.add.circle(position.x + 27, position.y - 25, 10, 0xf97316)
        .setStrokeStyle(2, 0xffedd5);
      this.add.text(position.x + 39, position.y - 38, "PIŁKA", textStyle("#fff7ed", "8px", true));
    }
  }

  private drawInformationPanel(view: MatchViewModel): void {
    this.add.rectangle(1045, 286, 390, 408, 0x101b2b).setStrokeStyle(1, 0x334155);
    if (view.possessionSummary !== undefined) {
      this.drawPossessionSummary(view);
    } else if (view.matchSummary !== undefined) {
      this.drawMatchSummary(view);
    } else {
      this.drawDecisionPanel(view);
    }
  }

  private drawDecisionPanel(view: MatchViewModel): void {
    this.add.text(868, 101, view.contextTitle, textStyle("#f59e0b", "10px", true))
      .setLetterSpacing(1);
    this.add.text(868, 122, view.contextName.toUpperCase(), textStyle("#f8fafc", "19px", true));
    this.add.text(868, 150, view.contextDescription, {
      ...textStyle("#a9b7ca", "12px"),
      lineSpacing: 4,
      wordWrap: { width: 344 },
    });
    if (view.currentAction !== undefined) {
      this.add.text(868, 196, "AKTUALNA AKCJA", textStyle("#f87171", "10px", true));
      this.add.text(868, 215, view.currentAction, textStyle("#f8fafc", "15px", true));
    }
    this.add.line(1045, 252, 0, 0, 348, 0, 0x334155, 1);
    this.add.text(868, 270, "NASTĘPNA DECYZJA", textStyle("#60a5fa", "10px", true));
    this.add.text(868, 290, view.prompt, {
      ...textStyle("#f8fafc", "14px", true),
      wordWrap: { width: 344 },
    });
    this.add.text(868, 338, "CO SIĘ STAŁO", textStyle("#94a3b8", "10px", true));
    this.add.text(868, 358, view.feedback, {
      ...textStyle(view.feedback.startsWith("NIELEGALNE") ? "#fca5a5" : "#dbeafe", "12px"),
      lineSpacing: 4,
      wordWrap: { width: 344 },
    });
    this.add.text(868, 452, "PRZEWAGA", textStyle("#94a3b8", "9px", true));
    this.add.text(
      948,
      447,
      `${view.advantage} / 3`,
      textStyle(view.role === "offense" ? "#4ade80" : "#f87171", "16px", true),
    );
    this.add.text(868, 474, view.mechanicsHint, {
      ...textStyle("#fbbf24", "8px", true),
      wordWrap: { width: 344 },
    });
  }

  private drawPossessionSummary(view: MatchViewModel): void {
    const summary = view.possessionSummary;
    if (summary === undefined) return;
    this.add.text(868, 101, "PODSUMOWANIE POSIADANIA", textStyle("#f59e0b", "10px", true));
    this.add.text(868, 127, summary.outcomeLabel, {
      ...textStyle(summary.points > 0 ? "#4ade80" : "#f87171", "26px", true),
      wordWrap: { width: 344 },
    });
    this.add.text(
      868,
      166,
      `PUNKTY: +${summary.points}   WYNIK: ${view.score.player}:${view.score.opponent}`,
      textStyle("#f8fafc", "14px", true),
    );
    this.add.text(
      868,
      194,
      summary.nextRole === "completed"
        ? "NASTĘPNIE: KONIEC MECZU"
        : `NASTĘPNIE: ${summary.nextRole === "offense" ? "ATAK" : "OBRONA"}`,
      textStyle("#60a5fa", "12px", true),
    );
    this.add.line(1045, 230, 0, 0, 348, 0, 0x334155, 1);
    this.add.text(868, 248, "DLACZEGO", textStyle("#94a3b8", "10px", true));
    summary.details.slice(0, 6).forEach((detail, index) => {
      this.add.text(868, 270 + index * 31, `• ${detail}`, {
        ...textStyle("#dbeafe", "11px"),
        wordWrap: { width: 336 },
      });
    });
    this.add.text(868, 454, "Kliknij DALEJ w prawym górnym rogu.", textStyle("#93c5fd", "10px", true));
  }

  private drawMatchSummary(view: MatchViewModel): void {
    const summary = view.matchSummary;
    if (summary === undefined) return;
    const win = summary.outcomeLabel === "ZWYCIĘSTWO";
    this.add.text(868, 102, summary.outcomeLabel, textStyle(win ? "#4ade80" : "#f87171", "30px", true));
    this.add.text(
      868,
      145,
      `WYNIK KOŃCOWY  ${view.score.player}:${view.score.opponent}`,
      textStyle("#f8fafc", "18px", true),
    );
    this.add.line(1045, 184, 0, 0, 348, 0, 0x334155, 1);
    this.add.text(868, 204, "STATYSTYKI", textStyle("#94a3b8", "10px", true));
    this.drawStatRow(868, 230, "Posiadania", summary.playerStats.possessions, summary.opponentStats.possessions);
    this.drawStatRow(868, 258, "Trafienia", summary.playerStats.made, summary.opponentStats.made);
    this.drawStatRow(868, 286, "Pudła", summary.playerStats.missed, summary.opponentStats.missed);
    this.drawStatRow(868, 314, "Straty", summary.playerStats.turnovers, summary.opponentStats.turnovers);
    this.drawStatRow(868, 342, "Końce czasu", summary.playerStats.clockExpired, summary.opponentStats.clockExpired);
    this.add.text(868, 400, "TY", textStyle("#60a5fa", "10px", true));
    this.add.text(1132, 400, "RYWAL", textStyle("#f87171", "10px", true));
    this.add.text(868, 444, "Wybierz REWANŻ albo NOWY MECZ.", textStyle("#dbeafe", "11px", true));
  }

  private drawStatRow(x: number, y: number, label: string, player: number, opponent: number): void {
    this.add.text(x, y, `${player}`, textStyle("#60a5fa", "14px", true));
    this.add.text(x + 42, y + 2, label, textStyle("#cbd5e1", "11px"));
    this.add.text(x + 300, y, `${opponent}`, textStyle("#f87171", "14px", true));
  }

  private drawCards(view: MatchViewModel): void {
    if (view.phase !== "activePossession") return;
    this.add.text(
      32,
      506,
      `${view.roleLabel} — RĘKA (KLIKNIJ KARTĘ${view.role === "offense" ? ", WYKONAWCĘ I CEL" : " I CEL"})`,
      textStyle("#94a3b8", "10px", true),
    ).setLetterSpacing(1);
    const cardWidth = 232;
    const spacing =
      view.cards.length <= 1
        ? 0
        : (WIDTH - 60 - cardWidth) / (view.cards.length - 1);
    view.cards.forEach((card, index) => {
      this.drawCard(card, 30 + index * spacing, 528, cardWidth);
    });
  }

  private drawCard(card: MatchCardView, x: number, y: number, width: number): void {
    const palette = {
      available: { fill: 0x17243a, stroke: 0x3b82f6, text: "DOSTĘPNA" },
      blocked: { fill: 0x231923, stroke: 0x7f1d1d, text: "NIELEGALNA" },
      selected: { fill: 0x17332d, stroke: 0x4ade80, text: "WYBRANA" },
      played: { fill: 0x111827, stroke: 0x334155, text: "ZAGRANA" },
    }[card.status];
    const surface = this.add.rectangle(x + width / 2, y + 78, width, 146, palette.fill)
      .setStrokeStyle(card.status === "selected" ? 4 : 2, palette.stroke)
      .setInteractive({ useHandCursor: true });
    surface.on("pointerdown", () => {
      this.session.selectCard(card.id);
      this.queueRender();
    });
    this.add.text(x + 12, y + 10, card.name.toUpperCase(), {
      ...textStyle("#f8fafc", "16px", true),
      wordWrap: { width: width - 58 },
    });
    this.add.text(x + width - 10, y + 11, `${card.timeCost}s`, textStyle("#f59e0b", "13px", true))
      .setOrigin(1, 0);
    card.insights.slice(0, 4).forEach((insight, index) => {
      this.add.text(x + 12, y + 42 + index * 18, insight, {
        ...textStyle(index === 0 ? "#f8fafc" : "#cbd5e1", "9px", index === 0),
        wordWrap: { width: width - 24 },
      });
    });
    this.add.text(x + 12, y + 116, `${palette.text} · ×${card.count}`, {
      ...textStyle(`#${palette.stroke.toString(16).padStart(6, "0")}`, "9px", true),
    }).setLetterSpacing(1);
  }

  private drawZoneLabel(x: number, y: number, label: string): void {
    this.add.text(x, y, label, textStyle("#f7dfbd", "9px", true))
      .setOrigin(0.5)
      .setAlpha(0.82);
  }

  private drawButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void,
    fill: number,
  ): void {
    const surface = this.add.rectangle(x + width / 2, y + height / 2, width, height, fill)
      .setStrokeStyle(1, 0x60a5fa)
      .setInteractive({ useHandCursor: true });
    surface.on("pointerdown", onClick);
    this.add.text(x + width / 2, y + height / 2, label, textStyle("#f8fafc", "11px", true))
      .setOrigin(0.5);
  }

  private queueRender(): void {
    this.time.delayedCall(0, () => this.renderView());
  }
}

function textStyle(
  color: string,
  fontSize: string,
  bold = false,
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color,
    fontFamily: "Arial, sans-serif",
    fontSize,
    ...(bold ? { fontStyle: "bold" } : {}),
  };
}

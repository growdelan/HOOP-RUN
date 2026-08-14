import {
  playCard,
  resetPossession,
  resolveShot,
} from "../core/index.ts";
import type {
  CardCatalog,
  CardDefinition,
  CardId,
  DefenseAssignment,
  DomainEvent,
  PlayCardCommand,
  PlayerId,
  PossessionSetup,
  PossessionState,
  ShotModifier,
} from "../core/index.ts";

export type PlayerInteraction =
  | "none"
  | "legalActor"
  | "selectedActor"
  | "legalTarget";

export interface PlayerView {
  readonly id: PlayerId;
  readonly name: string;
  readonly side: "offense" | "defense";
  readonly zone: PossessionState["players"][number]["zone"];
  readonly hasBall: boolean;
  readonly interaction: PlayerInteraction;
}

export interface CardView {
  readonly id: CardId;
  readonly name: string;
  readonly kind: CardDefinition["kind"];
  readonly timeCost: number;
  readonly status: "available" | "blocked" | "selected" | "played";
  readonly reason?: string;
}

export interface ShotSummaryView {
  readonly outcome: "made" | "missed";
  readonly outcomeLabel: string;
  readonly category: string;
  readonly score: number;
  readonly modifiers: readonly string[];
}

export interface PossessionViewModel {
  readonly seed: number;
  readonly phase: PossessionState["phase"];
  readonly shotClock: number;
  readonly advantage: number;
  readonly intentName: string;
  readonly intentDescription: string;
  readonly assignments: readonly DefenseAssignment[];
  readonly prompt: string;
  readonly feedback: string;
  readonly players: readonly PlayerView[];
  readonly cards: readonly CardView[];
  readonly summary?: ShotSummaryView;
}

interface Selection {
  readonly cardId: CardId;
  readonly actorId?: PlayerId;
}

export class PossessionSession {
  private stateValue: PossessionState;
  private selection?: Selection;
  private feedbackValue =
    "Wybierz kartę. Odczytaj intencję obrony przed pierwszym ruchem.";

  public constructor(
    private readonly setup: PossessionSetup,
    private readonly cards: CardCatalog,
    seed: number,
  ) {
    this.stateValue = resetPossession(setup, seed);
  }

  public get state(): PossessionState {
    return this.stateValue;
  }

  public getViewModel(): PossessionViewModel {
    const legalCommands =
      this.selection === undefined
        ? []
        : this.findLegalCommands(this.selection.cardId);
    const legalActorIds = new Set(legalCommands.map((command) => command.actorId));
    const legalTargetIds = new Set(
      legalCommands
        .filter((command) => command.actorId === this.selection?.actorId)
        .flatMap((command) =>
          command.targetId === undefined ? [] : [command.targetId],
        ),
    );

    return {
      seed: this.stateValue.seed,
      phase: this.stateValue.phase,
      shotClock: this.stateValue.shotClock,
      advantage: this.stateValue.advantage,
      intentName: this.stateValue.defense.intent.name,
      intentDescription: this.stateValue.defense.intent.description,
      assignments: this.stateValue.defense.assignments,
      prompt: this.getPrompt(legalActorIds.size, legalTargetIds.size),
      feedback: this.feedbackValue,
      players: this.stateValue.players.map((player) => ({
        id: player.id,
        name: player.name,
        side: player.side,
        zone: player.zone,
        hasBall: player.id === this.stateValue.ballHandlerId,
        interaction: this.getPlayerInteraction(
          player.id,
          legalActorIds,
          legalTargetIds,
        ),
      })),
      cards: this.stateValue.deck.map((cardId) => this.getCardView(cardId)),
      ...(this.stateValue.result?.quality === undefined
        ? {}
        : { summary: this.getShotSummary() }),
    };
  }

  public selectCard(cardId: CardId): void {
    if (this.stateValue.phase !== "playerTurn") {
      this.feedbackValue = "Posiadanie jest zakończone. Użyj RESET, aby zagrać ponownie.";
      return;
    }
    if (!this.stateValue.hand.includes(cardId)) {
      this.feedbackValue = "Ta karta została już zagrana.";
      return;
    }

    const commands = this.findLegalCommands(cardId);
    if (commands.length === 0) {
      this.selection = undefined;
      this.feedbackValue = `NIELEGALNE: ${this.findBlockedReason(cardId)}`;
      return;
    }

    this.selection = { cardId };
    this.feedbackValue = `Wybrano ${this.cards[cardId]?.name ?? cardId}. Wskaż wykonawcę.`;
  }

  public selectPlayer(playerId: PlayerId): void {
    if (this.selection === undefined || this.stateValue.phase !== "playerTurn") {
      this.feedbackValue = "Najpierw wybierz dostępną kartę.";
      return;
    }

    const legalCommands = this.findLegalCommands(this.selection.cardId);
    if (this.selection.actorId === undefined) {
      const actorCommands = legalCommands.filter(
        (command) => command.actorId === playerId,
      );
      if (actorCommands.length === 0) {
        this.feedbackValue = "Ten zawodnik nie może wykonać wybranej akcji.";
        return;
      }

      const card = this.cards[this.selection.cardId];
      if (card?.targetMode === "none") {
        this.dispatch(actorCommands[0]);
        return;
      }

      this.selection = { ...this.selection, actorId: playerId };
      this.feedbackValue = `Wykonawca: ${this.playerName(playerId)}. Wskaż podświetlony cel.`;
      return;
    }

    const command = legalCommands.find(
      (candidate) =>
        candidate.actorId === this.selection?.actorId &&
        candidate.targetId === playerId,
    );
    if (command === undefined) {
      this.feedbackValue = "Ten zawodnik nie jest legalnym celem wybranej akcji.";
      return;
    }
    this.dispatch(command);
  }

  public reset(seed: number = this.stateValue.seed): void {
    this.stateValue = resetPossession(this.setup, seed);
    this.selection = undefined;
    this.feedbackValue = `Nowe posiadanie. Seed ${this.stateValue.seed}.`;
  }

  private dispatch(command: PlayCardCommand | undefined): void {
    if (command === undefined) return;
    const cardResult = playCard(this.stateValue, command, this.cards);
    if (!cardResult.accepted) {
      this.feedbackValue = `NIELEGALNE: ${cardResult.rejection.message}`;
      return;
    }

    this.stateValue = cardResult.state;
    this.selection = undefined;
    this.feedbackValue = formatEvents(cardResult.events, this.stateValue);

    if (this.stateValue.phase === "resolvingShot") {
      const shotResult = resolveShot(this.stateValue);
      if (!shotResult.accepted) {
        this.feedbackValue = `NIELEGALNE: ${shotResult.rejection.message}`;
        return;
      }
      this.stateValue = shotResult.state;
      this.feedbackValue = formatShotResult(this.stateValue);
    } else if (this.stateValue.result?.outcome === "clockExpired") {
      this.feedbackValue = "KONIEC CZASU: posiadanie zakończone bez rzutu.";
    }
  }

  private findLegalCommands(cardId: CardId): readonly PlayCardCommand[] {
    const card = this.cards[cardId];
    if (card === undefined || !this.stateValue.hand.includes(cardId)) return [];

    const offense = this.stateValue.players.filter(
      (player) => player.side === "offense",
    );
    const commands: PlayCardCommand[] = [];
    for (const actor of offense) {
      const targets = card.targetMode === "none" ? [undefined] : offense.map((p) => p.id);
      for (const targetId of targets) {
        const command: PlayCardCommand = {
          cardId,
          actorId: actor.id,
          ...(targetId === undefined ? {} : { targetId }),
        };
        if (playCard(this.stateValue, command, this.cards).accepted) {
          commands.push(command);
        }
      }
    }
    return commands;
  }

  private findBlockedReason(cardId: CardId): string {
    const card = this.cards[cardId];
    if (card === undefined) return "Nie znaleziono definicji karty.";
    const offense = this.stateValue.players.filter(
      (player) => player.side === "offense",
    );
    const ballHandlerId = this.stateValue.ballHandlerId;
    const offBallId = offense.find((player) => player.id !== ballHandlerId)?.id;
    const command: PlayCardCommand = {
      cardId,
      actorId: card.kind === "screen" ? (offBallId ?? ballHandlerId) : ballHandlerId,
      ...(card.targetMode === "none"
        ? {}
        : {
            targetId:
              card.targetMode === "ballHandler"
                ? ballHandlerId
                : (offBallId ?? ballHandlerId),
          }),
    };
    const result = playCard(this.stateValue, command, this.cards);
    return result.accepted ? "Akcja jest teraz niedostępna." : result.rejection.message;
  }

  private getCardView(cardId: CardId): CardView {
    const card = this.cards[cardId];
    if (card === undefined) {
      return {
        id: cardId,
        name: cardId,
        kind: "pass",
        timeCost: 0,
        status: "blocked",
        reason: "Brak definicji karty.",
      };
    }
    if (!this.stateValue.hand.includes(cardId)) {
      return { ...card, status: "played" };
    }
    if (this.selection?.cardId === cardId) {
      return { ...card, status: "selected" };
    }
    if (this.findLegalCommands(cardId).length === 0) {
      return {
        ...card,
        status: "blocked",
        reason: this.findBlockedReason(cardId),
      };
    }
    return { ...card, status: "available" };
  }

  private getPlayerInteraction(
    playerId: PlayerId,
    legalActorIds: ReadonlySet<PlayerId>,
    legalTargetIds: ReadonlySet<PlayerId>,
  ): PlayerInteraction {
    if (this.selection?.actorId === playerId) return "selectedActor";
    if (this.selection?.actorId !== undefined && legalTargetIds.has(playerId)) {
      return "legalTarget";
    }
    if (this.selection?.actorId === undefined && legalActorIds.has(playerId)) {
      return "legalActor";
    }
    return "none";
  }

  private getPrompt(actorCount: number, targetCount: number): string {
    if (this.stateValue.phase === "completed") return "Posiadanie zakończone — zresetuj, aby powtórzyć.";
    if (this.selection === undefined) return "1. Wybierz dostępną kartę.";
    if (this.selection.actorId === undefined) {
      return `2. Wybierz wykonawcę (${actorCount} legalnych).`;
    }
    return `3. Wybierz cel (${targetCount} legalnych).`;
  }

  private getShotSummary(): ShotSummaryView | undefined {
    const result = this.stateValue.result;
    if (
      result?.quality === undefined ||
      (result.outcome !== "made" && result.outcome !== "missed")
    ) {
      return undefined;
    }
    return {
      outcome: result.outcome,
      outcomeLabel: result.outcome === "made" ? "TRAFIONY" : "PUDŁO",
      category: result.quality.category,
      score: result.quality.totalScore,
      modifiers: result.quality.modifiers.map(formatModifier),
    };
  }

  private playerName(playerId: PlayerId): string {
    return this.stateValue.players.find((player) => player.id === playerId)?.name ?? playerId;
  }
}

function formatEvents(
  events: readonly DomainEvent[],
  state: PossessionState,
): string {
  const messages: string[] = [];
  for (const event of events) {
    if (event.type === "cardPlayed") {
      if (event.cardId === "screen") {
        messages.push(
          `${playerName(state, event.actorId)} stawia zasłonę. Drive może teraz pokonać presję.`,
        );
      } else {
        const cardName = event.cardId === "kickOut" ? "Kick Out" : event.cardId;
        messages.push(`${playerName(state, event.actorId)} zagrywa ${cardName}.`);
      }
    } else if (event.type === "defenseReacted") {
      const reactions = {
        pressureBeaten: "Zasłona pokonuje presję.",
        ballHandlerContained: "Presja zatrzymuje przewagę.",
        helpCommitted: "Obrona wysyła pomoc do paint.",
      } as const;
      messages.push(reactions[event.reaction]);
    } else if (event.type === "advantageChanged") {
      messages.push(`Advantage ${event.delta > 0 ? "+" : ""}${event.delta}.`);
    } else if (event.type === "ballMoved") {
      messages.push(`Piłka trafia do ${playerName(state, event.toPlayerId)}.`);
    }
  }
  return messages.join(" ") || "Stan posiadania został zaktualizowany.";
}

function formatShotResult(state: PossessionState): string {
  const result = state.result;
  if (result?.quality === undefined) return "Rzut rozstrzygnięty.";
  const outcome = result.outcome === "made" ? "TRAFIONY" : "PUDŁO";
  return `${outcome}: ${result.quality.category} (${result.quality.totalScore}). Sprawdź rozkład modyfikatorów.`;
}

function formatModifier(modifier: ShotModifier): string {
  const labels: Record<ShotModifier["source"], string> = {
    baseSkill: "Umiejętność",
    zone: "Strefa",
    matchupContest: "Krycie",
    onBallPressure: "Presja na piłce",
    createdOpenLook: "Otwarta pozycja",
    advantage: "Advantage",
    defensiveResponse: "Odpowiedź obrony",
    opponentAdvantage: "Przewaga przeciwnika",
    exposedShooter: "Odsłonięty strzelec",
  };
  return `${labels[modifier.source]} ${modifier.value >= 0 ? "+" : ""}${modifier.value}`;
}

function playerName(state: PossessionState, playerId: PlayerId): string {
  return state.players.find((player) => player.id === playerId)?.name ?? playerId;
}

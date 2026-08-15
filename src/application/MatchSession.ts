import { PossessionSession } from "./PossessionSession.ts";
import type {
  CardView,
  PlayerInteraction,
} from "./PossessionSession.ts";
import {
  PROTOTYPE_DEFENSE_CARDS,
  PROTOTYPE_DEFENSE_SETUP,
  PROTOTYPE_OPPONENT_DEFENSE_INTENTS,
  PROTOTYPE_OPPONENT_PLANS,
} from "../content/prototypeDefense.ts";
import { PROTOTYPE_MATCH_SETUP } from "../content/prototypeMatch.ts";
import {
  PROTOTYPE_CARDS,
  PROTOTYPE_SETUP,
} from "../content/prototypePossession.ts";
import {
  advanceMatch,
  calculateShotQuality,
  completeMatchPossession,
  createDefensePossession,
  createMatch,
  getLegalDefenseTargets,
  playDefenseCard,
  previewDefenseCardImpact,
  previewOffenseCardImpact,
  resetMatch,
  resolveOpponentShot,
  selectWeightedOpponentIntent,
  xorshift32RandomSource,
} from "../core/index.ts";
import type {
  CardId,
  DefenseCardCatalog,
  DefenseAssignment,
  DefenseDomainEvent,
  DefensePossessionState,
  MatchPossessionOutcome,
  MatchState,
  PlayerId,
  PlayerMatchRole,
  PossessionState,
  ShotModifier,
  TeamMatchStats,
  MatchPossessionResolution,
  Zone,
} from "../core/index.ts";

const defenseCards: DefenseCardCatalog = PROTOTYPE_DEFENSE_CARDS;

export interface MatchPlayerView {
  readonly id: PlayerId;
  readonly name: string;
  readonly side: "player" | "opponent";
  readonly zone: Zone;
  readonly hasBall: boolean;
  readonly interaction: PlayerInteraction;
  readonly screenTargetId?: PlayerId;
}

export interface MatchCardView {
  readonly id: CardId;
  readonly name: string;
  readonly kind: string;
  readonly timeCost: number;
  readonly count: number;
  readonly status: "available" | "blocked" | "selected" | "played";
  readonly description: string;
  readonly insights: readonly string[];
  readonly risk?: string;
  readonly reason?: string;
}

export interface PossessionSummaryView {
  readonly outcome: MatchPossessionOutcome;
  readonly outcomeLabel: string;
  readonly points: number;
  readonly role: PlayerMatchRole;
  readonly nextRole: PlayerMatchRole | "completed";
  readonly details: readonly string[];
}

export interface MatchSummaryView {
  readonly outcomeLabel: "ZWYCIĘSTWO" | "PORAŻKA";
  readonly playerStats: TeamMatchStats;
  readonly opponentStats: TeamMatchStats;
}

export interface MatchViewModel {
  readonly seed: number;
  readonly phase: MatchState["phase"];
  readonly score: MatchState["score"];
  readonly targetLabel: string;
  readonly possessionNumber: number;
  readonly role: PlayerMatchRole;
  readonly roleLabel: "ATAK" | "OBRONA";
  readonly shotClock: number;
  readonly advantage: number;
  readonly contextTitle: string;
  readonly contextName: string;
  readonly contextDescription: string;
  readonly currentAction?: string;
  readonly prompt: string;
  readonly feedback: string;
  readonly mechanicsHint: string;
  readonly assignments: readonly DefenseAssignment[];
  readonly players: readonly MatchPlayerView[];
  readonly cards: readonly MatchCardView[];
  readonly playedCardIds: readonly CardId[];
  readonly possessionSummary?: PossessionSummaryView;
  readonly matchSummary?: MatchSummaryView;
  readonly canContinue: boolean;
  readonly canRematch: boolean;
  readonly canStartNewMatch: boolean;
}

export interface MatchSessionController {
  completePossession(resolution: MatchPossessionResolution): MatchState | undefined;
  advance(): MatchState | undefined;
}

export class MatchSession {
  private matchState: MatchState;
  private offenseSession?: PossessionSession;
  private defenseState?: DefensePossessionState;
  private selectedDefenseCardId?: CardId;
  private feedbackValue = "Rozpoczynasz w ataku. Odczytaj intencję obrony.";
  private lastDetails: readonly string[] = [];

  public constructor(
    seedOrState: number | MatchState,
    private readonly shotClock: number = 14,
    private readonly controller?: MatchSessionController,
  ) {
    this.matchState =
      typeof seedOrState === "number"
        ? createMatch(PROTOTYPE_MATCH_SETUP, seedOrState)
        : seedOrState;
    this.prepareActivePossession();
  }

  public get state(): MatchState {
    return this.matchState;
  }

  public getViewModel(): MatchViewModel {
    const activeView =
      this.matchState.phase === "activePossession"
        ? this.getActiveView()
        : this.getInactiveView();
    const record = this.matchState.lastPossession;

    return {
      seed: this.matchState.initialSeed,
      phase: this.matchState.phase,
      score: this.matchState.score,
      targetLabel: "DO 11 · +2 · LIMIT 15",
      possessionNumber: this.matchState.possessionNumber,
      role: this.matchState.playerRole,
      roleLabel: this.matchState.playerRole === "offense" ? "ATAK" : "OBRONA",
      shotClock: activeView.shotClock,
      advantage: activeView.advantage,
      contextTitle: activeView.contextTitle,
      contextName: activeView.contextName,
      contextDescription: activeView.contextDescription,
      ...(activeView.currentAction === undefined
        ? {}
        : { currentAction: activeView.currentAction }),
      prompt: activeView.prompt,
      feedback: activeView.feedback,
      mechanicsHint: `JAKOŚĆ 54 = 54% TRAFIENIA · ADV +1 = +${PROTOTYPE_SETUP.rules.shotQuality.advantageBonusPerPoint} PP`,
      assignments: activeView.assignments,
      players: activeView.players,
      cards: activeView.cards,
      playedCardIds: activeView.playedCardIds,
      ...(this.matchState.phase !== "possessionSummary" || record === undefined
        ? {}
        : {
            possessionSummary: {
              outcome: record.outcome,
              outcomeLabel: outcomeLabel(record.outcome),
              points: record.points,
              role: record.playerRole,
              nextRole:
                this.matchState.winner === undefined
                  ? oppositeRole(record.playerRole)
                  : "completed",
              details: this.lastDetails,
            },
          }),
      ...(this.matchState.phase !== "completed" || this.matchState.winner === undefined
        ? {}
        : {
            matchSummary: {
              outcomeLabel:
                this.matchState.winner === "player" ? "ZWYCIĘSTWO" : "PORAŻKA",
              playerStats: this.matchState.stats.player,
              opponentStats: this.matchState.stats.opponent,
            },
          }),
      canContinue: this.matchState.phase === "possessionSummary",
      canRematch: this.matchState.phase === "completed",
      canStartNewMatch: this.matchState.phase === "completed",
    };
  }

  public selectCard(cardId: CardId): void {
    if (this.matchState.phase !== "activePossession") {
      this.feedbackValue = "Najpierw przejdź dalej z podsumowania.";
      return;
    }
    if (this.matchState.playerRole === "offense") {
      this.offenseSession?.selectCard(cardId);
      this.feedbackValue = this.offenseSession?.getViewModel().feedback ?? "Brak sesji ataku.";
      this.syncOffenseCompletion();
      return;
    }

    const state = this.defenseState;
    const card = defenseCards[cardId];
    if (state === undefined || card === undefined) {
      this.feedbackValue = "Nie znaleziono aktywnej karty obrony.";
      return;
    }
    const targets = getLegalDefenseTargets(state, cardId, defenseCards);
    if (targets.length === 0) {
      this.selectedDefenseCardId = undefined;
      this.feedbackValue = "NIELEGALNE: ta odpowiedź nie pasuje do aktualnej akcji.";
      return;
    }
    this.selectedDefenseCardId = cardId;
    const effect = card.effects[state.currentAction.kind];
    const impact = previewDefenseCardImpact(state, cardId, defenseCards);
    this.feedbackValue = `${impact?.explanation ?? effect?.explanation ?? card.risk} Wskaż podświetlony cel.`;
  }

  public selectPlayer(playerId: PlayerId): void {
    if (this.matchState.phase !== "activePossession") return;
    if (this.matchState.playerRole === "offense") {
      this.offenseSession?.selectPlayer(playerId);
      this.feedbackValue = this.offenseSession?.getViewModel().feedback ?? "Brak sesji ataku.";
      this.syncOffenseCompletion();
      return;
    }

    const state = this.defenseState;
    const cardId = this.selectedDefenseCardId;
    if (state === undefined || cardId === undefined) {
      this.feedbackValue = "Najpierw wybierz dostępną kartę obrony.";
      return;
    }
    const result = playDefenseCard(
      state,
      { cardId, targetId: playerId },
      defenseCards,
      this.matchState.setup.opponentProfile ?? PROTOTYPE_OPPONENT_PLANS,
    );
    if (!result.accepted) {
      this.feedbackValue = `NIELEGALNE: ${result.rejection.message}`;
      return;
    }

    this.defenseState = result.state;
    this.selectedDefenseCardId = undefined;
    this.feedbackValue = formatDefenseEvents(result.events);
    if (this.defenseState.phase === "resolvingShot") {
      const shot = resolveOpponentShot(this.defenseState);
      if (!shot.accepted) throw new Error(shot.rejection.message);
      this.defenseState = shot.state;
      this.feedbackValue = formatDefenseResult(shot.state);
    }
    this.syncDefenseCompletion();
  }

  public continue(): void {
    if (this.controller !== undefined) {
      const state = this.controller.advance();
      if (state === undefined) return;
      this.matchState = state;
    } else {
      const result = advanceMatch(this.matchState);
      if (!result.accepted) {
        this.feedbackValue = `NIELEGALNE: ${result.rejection.message}`;
        return;
      }
      this.matchState = result.state;
    }
    if (this.matchState.phase === "activePossession") {
      this.prepareActivePossession();
    }
  }

  public rematch(): void {
    this.matchState = resetMatch(this.matchState);
    this.lastDetails = [];
    this.feedbackValue = `Rewanż z seedem ${this.matchState.initialSeed}.`;
    this.prepareActivePossession();
  }

  public startNewMatch(seed: number = nextSeed(this.matchState.initialSeed)): void {
    this.matchState = createMatch(PROTOTYPE_MATCH_SETUP, seed);
    this.lastDetails = [];
    this.feedbackValue = `Nowy mecz z seedem ${this.matchState.initialSeed}.`;
    this.prepareActivePossession();
  }

  private prepareActivePossession(): void {
    this.selectedDefenseCardId = undefined;
    if (this.matchState.playerRole === "offense") {
      const profile = this.matchState.setup.opponentProfile;
      const selected = profile === undefined
        ? selectFallbackIntent(this.matchState.rngState)
        : selectWeightedOpponentIntent(profile, this.matchState.rngState);
      const intent = selected.intent;
      const hand = this.matchState.offenseDeck.hand;
      this.offenseSession = new PossessionSession(
        {
          ...PROTOTYPE_SETUP,
          shotClock: this.shotClock,
          hand,
          deck: hand,
          defense: { ...PROTOTYPE_SETUP.defense, intent },
        },
        PROTOTYPE_CARDS,
        selected.rngState,
      );
      this.defenseState = undefined;
      this.feedbackValue = `ATAK: przeciwnik pokazuje ${intent.name}.`;
      return;
    }

    this.offenseSession = undefined;
    const opponent = this.matchState.setup.opponentProfile ?? PROTOTYPE_OPPONENT_PLANS;
    this.defenseState = createDefensePossession(
      {
        ...PROTOTYPE_DEFENSE_SETUP,
        shotClock: this.shotClock,
        hand: this.matchState.defenseDeck.hand,
      },
      opponent,
      this.matchState.rngState,
    );
    this.feedbackValue = `OBRONA: plan ${this.defenseState.plan.name}, akcja ${this.defenseState.currentAction.name}.`;
  }

  private syncOffenseCompletion(): void {
    const session = this.offenseSession;
    if (session?.state.phase !== "completed" || session.state.result === undefined) return;
    const result = session.state.result;
    const shooter =
      result.shooterId === undefined
        ? undefined
        : session.state.players.find((player) => player.id === result.shooterId);
    const view = session.getViewModel();
    this.lastDetails = view.summary?.modifiers ?? [view.feedback];
    this.completeActiveMatchPossession(
      result.outcome,
      session.state.history.map((action) => action.cardId),
      session.state.rngState,
      shooter?.zone,
    );
  }

  private syncDefenseCompletion(): void {
    const state = this.defenseState;
    if (state?.phase !== "completed" || state.result === undefined) return;
    this.lastDetails = [
      ...state.history.slice(-2).map((action) => action.explanation),
      ...(state.result.quality?.modifiers.map(formatModifier) ?? []),
    ];
    this.completeActiveMatchPossession(
      state.result.outcome,
      state.history.map((action) => action.cardId),
      state.rngState,
      state.result.shotZone,
    );
  }

  private completeActiveMatchPossession(
    outcome: MatchPossessionOutcome,
    usedCardIds: readonly CardId[],
    rngState: number,
    shotZone?: Zone,
  ): void {
    const resolution = {
      outcome,
      usedCardIds,
      rngState,
      ...(shotZone === undefined ? {} : { shotZone }),
    } satisfies MatchPossessionResolution;
    if (this.controller !== undefined) {
      const state = this.controller.completePossession(resolution);
      if (state !== undefined) this.matchState = state;
      return;
    }
    const result = completeMatchPossession(this.matchState, resolution);
    if (!result.accepted) throw new Error(result.rejection.message);
    this.matchState = result.state;
  }

  private getActiveView(): ActiveView {
    return this.matchState.playerRole === "offense"
      ? this.getOffenseView()
      : this.getDefenseView();
  }

  private getOffenseView(): ActiveView {
    const session = this.offenseSession;
    if (session === undefined) throw new Error("Brak aktywnej sesji ataku.");
    const view = session.getViewModel();
    return {
      shotClock: view.shotClock,
      advantage: view.advantage,
      contextTitle: "DEFENSE INTENT",
      contextName: view.intentName,
      contextDescription: view.intentDescription,
      prompt: view.prompt,
      feedback: view.feedback,
      assignments: view.assignments,
      players: view.players.map((player) => ({
        ...player,
        side: player.side === "offense" ? "player" : "opponent",
      })),
      cards: groupOffenseCards(view.cards, session.state),
      playedCardIds: session.state.history.map((action) => action.cardId),
    };
  }

  private getDefenseView(): ActiveView {
    const state = this.defenseState;
    if (state === undefined) throw new Error("Brak aktywnej sesji obrony.");
    const selectedTargets =
      this.selectedDefenseCardId === undefined
        ? []
        : getLegalDefenseTargets(
            state,
            this.selectedDefenseCardId,
            defenseCards,
          );
    return {
      shotClock: state.shotClock,
      advantage: state.opponentAdvantage,
      contextTitle: "OPPONENT PLAN",
      contextName: state.plan.name,
      contextDescription: state.plan.description,
      currentAction: `${state.currentAction.name} · ${playerName(state, state.currentAction.actorId)}`,
      prompt:
        this.selectedDefenseCardId === undefined
          ? "1. Wybierz odpowiedź defensywną."
          : "2. Wskaż podświetlony cel.",
      feedback: this.feedbackValue,
      assignments: state.assignments,
      players: state.players.map((player) => ({
        id: player.id,
        name: player.name,
        side: player.side === "offense" ? "opponent" : "player",
        zone: player.zone,
        hasBall: player.id === state.ballHandlerId,
        interaction: selectedTargets.includes(player.id) ? "legalTarget" : "none",
        ...(state.currentAction.kind === "screen" &&
        state.currentAction.actorId === player.id
          ? { screenTargetId: state.currentAction.targetId }
          : {}),
      })),
      cards: groupDefenseCards(
        state,
        this.matchState.defenseDeck.hand,
        this.selectedDefenseCardId,
      ),
      playedCardIds: state.history.map((action) => action.cardId),
    };
  }

  private getInactiveView(): ActiveView {
    const players = this.matchState.playerRole === "offense"
      ? PROTOTYPE_SETUP.players
      : PROTOTYPE_DEFENSE_SETUP.players;
    const assignments = this.matchState.playerRole === "offense"
      ? PROTOTYPE_SETUP.defense.assignments
      : PROTOTYPE_DEFENSE_SETUP.assignments;
    return {
      shotClock: 0,
      advantage: 0,
      contextTitle:
        this.matchState.phase === "completed" ? "MATCH COMPLETE" : "POSSESSION COMPLETE",
      contextName:
        this.matchState.phase === "completed"
          ? this.matchState.winner === "player"
            ? "ZWYCIĘSTWO"
            : "PORAŻKA"
          : outcomeLabel(this.matchState.lastPossession?.outcome ?? "missed"),
      contextDescription:
        this.matchState.phase === "completed"
          ? "Mecz zakończony. Wybierz rewanż albo nowy seed."
          : "Sprawdź zmianę wyniku i następną rolę.",
      prompt:
        this.matchState.phase === "completed"
          ? "Wybierz REWANŻ lub NOWY MECZ."
          : "Wybierz DALEJ, aby zmienić rolę.",
      feedback: this.feedbackValue,
      assignments,
      players: players.map((player) => ({
        id: player.id,
        name: player.name,
        side:
          this.matchState.playerRole === "offense"
            ? player.side === "offense"
              ? "player"
              : "opponent"
            : player.side === "offense"
              ? "opponent"
              : "player",
        zone: player.zone,
        hasBall: false,
        interaction: "none",
      })),
      cards: [],
      playedCardIds: this.matchState.lastPossession?.usedCardIds ?? [],
    };
  }
}

interface ActiveView {
  readonly shotClock: number;
  readonly advantage: number;
  readonly contextTitle: string;
  readonly contextName: string;
  readonly contextDescription: string;
  readonly currentAction?: string;
  readonly prompt: string;
  readonly feedback: string;
  readonly assignments: readonly DefenseAssignment[];
  readonly players: readonly MatchPlayerView[];
  readonly cards: readonly MatchCardView[];
  readonly playedCardIds: readonly CardId[];
}

function groupOffenseCards(
  cards: readonly CardView[],
  state: PossessionState,
): readonly MatchCardView[] {
  const uniqueCards = uniqueById(cards);
  return uniqueCards.map((card) => ({
    id: card.id,
    name: card.name,
    kind: card.kind,
    timeCost: card.timeCost,
    count: countCard(state.hand, card.id),
    status: countCard(state.hand, card.id) === 0 ? "played" : card.status,
    description: offenseCardDescription(card.kind),
    insights:
      card.reason === undefined
        ? offenseCardInsights(card.kind, state)
        : [`BLOKADA: ${card.reason}`],
    ...(card.reason === undefined ? {} : { reason: card.reason }),
  }));
}

function groupDefenseCards(
  state: DefensePossessionState,
  initialHand: readonly CardId[],
  selectedCardId: CardId | undefined,
): readonly MatchCardView[] {
  return uniqueIds(initialHand).map((cardId) => {
    const card = defenseCards[cardId];
    if (card === undefined) throw new Error(`Brak definicji karty ${cardId}.`);
    const count = countCard(state.hand, cardId);
    const effect = card.effects[state.currentAction.kind];
    const impact = previewDefenseCardImpact(state, cardId, defenseCards);
    const legal = getLegalDefenseTargets(
      state,
      cardId,
      defenseCards,
    ).length > 0;
    return {
      id: card.id,
      name: card.name,
      kind: card.kind,
      timeCost: impact?.timeCost ?? card.timeCost + (effect?.extraClockCost ?? 0),
      count,
      status:
        count === 0
          ? "played"
          : selectedCardId === cardId
            ? "selected"
            : legal
              ? "available"
              : "blocked",
      description:
        impact?.explanation ?? effect?.explanation ?? "Brak zastosowania przeciw tej akcji.",
      insights:
        impact === undefined
          ? [`BRAK EFEKTU: nie odpowiada na ${state.currentAction.name}.`]
          : defenseCardInsights(state, impact),
      risk: card.risk,
      ...(legal ? {} : { reason: "Nie odpowiada na aktualną akcję." }),
    };
  });
}

function uniqueById(cards: readonly CardView[]): readonly CardView[] {
  const seen = new Set<CardId>();
  return cards.filter((card) => {
    if (seen.has(card.id)) return false;
    seen.add(card.id);
    return true;
  });
}

function uniqueIds(ids: readonly CardId[]): readonly CardId[] {
  return [...new Set(ids)];
}

function countCard(cards: readonly CardId[], cardId: CardId): number {
  return cards.filter((candidate) => candidate === cardId).length;
}

function offenseCardDescription(kind: CardView["kind"]): string {
  return {
    pass: "Przenieś piłkę do partnera.",
    screen: "Postaw zasłonę posiadaczowi.",
    drive: "Wejdź z obwodu do paint.",
    kickOut: "Odegraj z paint na obwód.",
    shot: "Oddaj rzut i zakończ posiadanie.",
    backdoorCut: "Zejdź bez piłki z obwodu do paint.",
    stepBack: "Stwórz przestrzeń do najbliższego rzutu za 2.",
  }[kind];
}

function offenseCardInsights(
  kind: CardView["kind"],
  state: PossessionState,
): readonly string[] {
  const rules = state.rules.shotQuality;
  const ballHandler = state.players.find(
    (player) => player.id === state.ballHandlerId,
  );
  if (ballHandler === undefined) return ["Brak posiadacza piłki."];

  if (kind === "pass") {
    return ["PIŁKA: wybierz innego zawodnika", "PREMIA: brak — zmieniasz strzelca"];
  }
  if (kind === "screen") {
    const nextAdvantage = Math.min(rules.maxAdvantage, state.advantage + 2);
    return [
      `PRZYGOTUJE DRIVE: ADV ${state.advantage} → ${nextAdvantage}`,
      `POTENCJAŁ RZUTU: +${(nextAdvantage - state.advantage) * rules.advantageBonusPerPoint} PP`,
    ];
  }
  if (kind === "drive") {
    const beatsPressure = state.screenedPlayerIds.includes(ballHandler.id);
    const helpCommitted = state.defense.intent.helpOnDrive;
    const createsOpenFinish = beatsPressure && !helpCommitted;
    const nextAdvantage = beatsPressure
      ? Math.min(rules.maxAdvantage, state.advantage + 2)
      : Math.max(0, state.advantage - 1);
    const nextState: PossessionState = {
      ...state,
      players: state.players.map((player) =>
        player.id === ballHandler.id ? { ...player, zone: "paint" } : player,
      ),
      advantage: nextAdvantage,
      openPlayerIds: createsOpenFinish
        ? [...new Set([...state.openPlayerIds, ballHandler.id])]
        : state.openPlayerIds,
      defense: { ...state.defense, helpCommitted },
    };
    const nextShooter = nextState.players.find(
      (player) => player.id === ballHandler.id,
    );
    const qualityDelta =
      nextShooter === undefined
        ? 0
        : calculateShotQuality(nextState, nextShooter).totalScore -
          calculateShotQuality(state, ballHandler).totalScore;
    return [
      `PRZEWAGA: ${state.advantage} → ${nextAdvantage}`,
      `WPŁYW NA RZUT: ${signed(qualityDelta)} PP`,
      helpCommitted
        ? "OBRONA: pomoc otworzy Kick Out"
        : createsOpenFinish
          ? `OTWARTE WEJŚCIE: +${rules.openLookBonus} PP`
          : "OBRONA: bez automatycznej pomocy",
    ];
  }
  if (kind === "kickOut") {
    const createsOpenLook = state.defense.helpCommitted;
    const nextAdvantage = createsOpenLook
      ? Math.min(rules.maxAdvantage, state.advantage + 1)
      : state.advantage;
    return [
      `PRZEWAGA: ${state.advantage} → ${nextAdvantage}`,
      createsOpenLook
        ? `OTWARTY RZUT: +${rules.openLookBonus} PP`
        : "OTWARTY RZUT: brak — obrona nie pomogła",
      "CEL: partner na obwodzie · rzut za 2",
    ];
  }

  if (kind === "backdoorCut") {
    const cutter = state.players.find(
      (player) =>
        player.side === "offense" &&
        player.id !== ballHandler.id &&
        player.zone !== "paint",
    );
    const impact =
      cutter === undefined
        ? undefined
        : previewOffenseCardImpact(
            state,
            {
              cardId: "backdoorCut",
              actorId: cutter.id,
              targetId: ballHandler.id,
            },
            PROTOTYPE_CARDS,
          );
    if (impact === undefined) return ["BRAK LEGALNEGO CUTTERA."];
    return [
      `KOSZT: ${impact.timeCost}s`,
      impact.explanation,
      `STATUS: ${impact.status}`,
      `WPŁYW NA RZUT CUTTERA: ${signed(impact.shotQualityDelta)} PP`,
    ];
  }
  if (kind === "stepBack") {
    const impact = previewOffenseCardImpact(
      state,
      { cardId: "stepBack", actorId: ballHandler.id },
      PROTOTYPE_CARDS,
    );
    if (impact === undefined) return ["Step Back jest teraz nielegalny."];
    return [
      `KOSZT: ${impact.timeCost}s`,
      impact.explanation,
      `STATUS: ${impact.status}`,
      `WPŁYW NA NAJBLIŻSZY RZUT: ${signed(impact.shotQualityDelta)} PP`,
    ];
  }

  const quality = calculateShotQuality(state, ballHandler);
  return [
    `SZANSA TRAFIENIA: ${quality.totalScore}%`,
    `KATEGORIA: ${quality.category}`,
    `WARTOŚĆ: ${ballHandler.zone === "paint" ? 1 : 2} PKT`,
  ];
}

function defenseCardInsights(
  state: DefensePossessionState,
  impact: NonNullable<ReturnType<typeof previewDefenseCardImpact>>,
): readonly string[] {
  const insights = [
    `PRZEWAGA: ${state.opponentAdvantage} → ${impact.nextOpponentAdvantage}`,
    `WPŁYW NA RZUT: ${signed(impact.shotQualityDelta)} PP`,
  ];
  if (impact.turnoverChance > 0) {
    insights.push(`SZANSA STRATY: ${Math.round(impact.turnoverChance * 100)}%`);
  }
  if (impact.exposureId !== undefined) {
    if (impact.exposureAdvantageDelta > 0) {
      insights.push(
        `RYZYKO: odsłania ${playerName(state, impact.exposureId)}; jego udział w następnej akcji odda +${impact.exposureAdvantageDelta} ADV.`,
      );
    } else {
      insights.push(
        `RYZYKO: odsłania ${playerName(state, impact.exposureId)} (+${state.shotQualityRules.openLookBonus} PP, jeśli rzuca).`,
      );
    }
  }
  if (impact.consumedExposureId !== undefined) {
    insights.push(
      `ZUŻYCIE ODSŁONIĘCIA: ${playerName(state, impact.consumedExposureId)} oddaje +${impact.consumedExposureAdvantageDelta} ADV.`,
    );
  }
  return insights;
}

function signed(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

function selectFallbackIntent(rngState: number): {
  readonly intent: (typeof PROTOTYPE_OPPONENT_DEFENSE_INTENTS)[number];
  readonly rngState: number;
} {
  const step = xorshift32RandomSource.next(rngState);
  const intent = PROTOTYPE_OPPONENT_DEFENSE_INTENTS[Math.min(
    PROTOTYPE_OPPONENT_DEFENSE_INTENTS.length - 1,
    Math.floor(step.value * PROTOTYPE_OPPONENT_DEFENSE_INTENTS.length),
  )];
  if (intent === undefined) throw new Error("Brak intencji obronnej przeciwnika.");
  return { intent, rngState: step.state };
}

function formatDefenseEvents(events: readonly DefenseDomainEvent[]): string {
  return events
    .flatMap((event) => {
      if (event.type === "opponentActionResolved") return [event.explanation];
      if (event.type === "opponentAdvantageChanged") {
        return [`Przewaga przeciwnika: ${event.previous} → ${event.current}.`];
      }
      if (event.type === "exposureConsumed") {
        return [`Odsłonięcie zużyte: +${event.advantageDelta} ADV.`];
      }
      if (event.type === "turnoverForced") return ["WYMUSZONA STRATA przeciwnika."];
      if (event.type === "opponentClockExpired") return ["KONIEC CZASU przeciwnika."];
      return [];
    })
    .join(" ");
}

function formatDefenseResult(state: DefensePossessionState): string {
  const result = state.result;
  if (result?.quality === undefined) return outcomeLabel(result?.outcome ?? "missed");
  return `${outcomeLabel(result.outcome)}: ${result.quality.category} (${result.quality.totalScore}).`;
}

function formatModifier(modifier: ShotModifier): string {
  const labels: Record<ShotModifier["source"], string> = {
    baseSkill: "Umiejętność",
    zone: "Strefa",
    matchupContest: "Krycie",
    onBallPressure: "Presja na piłce",
    createdOpenLook: "Otwarta pozycja",
    advantage: "Advantage",
    createdSeparation: "Step Back",
    defensiveResponse: "Odpowiedzi obrony",
    opponentAdvantage: "Przewaga przeciwnika",
    exposedShooter: "Odsłonięty strzelec",
  };
  return `${labels[modifier.source]} ${modifier.value >= 0 ? "+" : ""}${modifier.value}`;
}

function outcomeLabel(outcome: MatchPossessionOutcome): string {
  return {
    made: "TRAFIONY RZUT",
    missed: "PUDŁO",
    turnover: "STRATA",
    clockExpired: "KONIEC CZASU",
  }[outcome];
}

function oppositeRole(role: PlayerMatchRole): PlayerMatchRole {
  return role === "offense" ? "defense" : "offense";
}

function nextSeed(seed: number): number {
  return seed >= 0xffff_ffff ? 1 : seed + 1;
}

function playerName(state: DefensePossessionState, playerId: PlayerId): string {
  return state.players.find((player) => player.id === playerId)?.name ?? playerId;
}

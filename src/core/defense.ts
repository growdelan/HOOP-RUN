import type {
  CardId,
  DefenseAssignment,
  PlayerId,
  PlayerState,
  ShotModifier,
  ShotQuality,
  ShotQualityRules,
  Zone,
} from "./model.ts";
import type { RandomSource } from "./rng.ts";
import { normalizeSeed, xorshift32RandomSource } from "./rng.ts";
import { categorizeShotScore, clampShotScore } from "./shotQuality.ts";

export type DefenseCardKind =
  | "pressure"
  | "switch"
  | "goUnder"
  | "helpDefense"
  | "doubleTeam";
export type OpponentActionKind = "screen" | "drive" | "pass" | "shoot";
export type DefensePossessionPhase =
  | "playerResponse"
  | "resolvingShot"
  | "completed";
export type DefensePossessionOutcome =
  | "made"
  | "missed"
  | "turnover"
  | "clockExpired";

export interface OpponentActionDefinition {
  readonly id: string;
  readonly name: string;
  readonly kind: OpponentActionKind;
  readonly actorId: PlayerId;
  readonly targetId?: PlayerId;
  readonly baseAdvantageDelta: number;
}

export interface OpponentPlanDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly steps: readonly OpponentActionDefinition[];
}

export type OpponentPlanCatalog = Readonly<
  Record<string, OpponentPlanDefinition>
>;

export interface DefenseInteraction {
  readonly advantageDelta: number;
  readonly contestDelta: number;
  readonly turnoverPressureDelta: number;
  readonly extraClockCost: number;
  readonly exposure: "none" | "actionActor" | "actionTarget";
  readonly assignmentChange: "none" | "switchScreenAssignments";
  readonly explanation: string;
}

export interface DefenseCardDefinition {
  readonly id: CardId;
  readonly name: string;
  readonly kind: DefenseCardKind;
  readonly timeCost: number;
  readonly targetMode: "ballHandler" | "actionActor" | "actionTarget";
  readonly risk: string;
  readonly effects: Partial<
    Readonly<Record<OpponentActionKind, DefenseInteraction>>
  >;
}

export type DefenseCardCatalog = Readonly<
  Record<CardId, DefenseCardDefinition>
>;

export interface DefensePossessionSetup {
  readonly shotClock: number;
  readonly players: readonly PlayerState[];
  readonly ballHandlerId: PlayerId;
  readonly assignments: readonly DefenseAssignment[];
  readonly hand: readonly CardId[];
  readonly shotQuality: ShotQualityRules;
}

export interface DefensePlayedAction {
  readonly cardId: CardId;
  readonly kind: DefenseCardKind;
  readonly targetId: PlayerId;
  readonly opponentActionId: string;
  readonly timeCost: number;
  readonly explanation: string;
}

export type DefenseDomainEvent =
  | {
      readonly type: "defenseCardPlayed";
      readonly cardId: CardId;
      readonly targetId: PlayerId;
    }
  | {
      readonly type: "opponentActionResolved";
      readonly actionId: string;
      readonly explanation: string;
    }
  | {
      readonly type: "opponentAdvantageChanged";
      readonly previous: number;
      readonly current: number;
    }
  | { readonly type: "coverageSwitched" }
  | { readonly type: "opponentExposed"; readonly playerId: PlayerId }
  | { readonly type: "turnoverForced"; readonly roll: number }
  | { readonly type: "opponentClockExpired" }
  | {
      readonly type: "opponentShotPrepared";
      readonly shooterId: PlayerId;
      readonly quality: ShotQuality;
    }
  | {
      readonly type: "opponentShotResolved";
      readonly outcome: "made" | "missed";
      readonly roll: number;
    };

export interface DefensePossessionResult {
  readonly outcome: DefensePossessionOutcome;
  readonly shooterId?: PlayerId;
  readonly shotZone?: Zone;
  readonly quality?: ShotQuality;
  readonly roll?: number;
}

export interface DefensePossessionState {
  readonly rngState: number;
  readonly phase: DefensePossessionPhase;
  readonly shotClock: number;
  readonly players: readonly PlayerState[];
  readonly ballHandlerId: PlayerId;
  readonly assignments: readonly DefenseAssignment[];
  readonly plan: {
    readonly id: string;
    readonly name: string;
    readonly description: string;
  };
  readonly currentStepIndex: number;
  readonly currentAction: OpponentActionDefinition;
  readonly opponentAdvantage: number;
  readonly shotContest: number;
  readonly turnoverPressure: number;
  readonly exposedOpponentIds: readonly PlayerId[];
  readonly hand: readonly CardId[];
  readonly history: readonly DefensePlayedAction[];
  readonly events: readonly DefenseDomainEvent[];
  readonly shotQualityRules: ShotQualityRules;
  readonly pendingShot?: {
    readonly shooterId: PlayerId;
    readonly zone: Zone;
    readonly quality: ShotQuality;
  };
  readonly result?: DefensePossessionResult;
}

export interface PlayDefenseCardCommand {
  readonly cardId: CardId;
  readonly targetId: PlayerId;
}

export interface DefenseCardImpact {
  readonly timeCost: number;
  readonly nextOpponentAdvantage: number;
  readonly shotQualityDelta: number;
  readonly turnoverPressure: number;
  readonly turnoverChance: number;
  readonly exposureId?: PlayerId;
}

export type DefenseRejectionCode =
  | "invalidPhase"
  | "unknownCard"
  | "cardNotInHand"
  | "invalidCardDefinition"
  | "cardNotLegalAgainstAction"
  | "invalidTarget"
  | "unknownPlan";

export interface DefenseRejection {
  readonly code: DefenseRejectionCode;
  readonly message: string;
}

export type DefenseRuleResult =
  | {
      readonly accepted: true;
      readonly state: DefensePossessionState;
      readonly events: readonly DefenseDomainEvent[];
    }
  | {
      readonly accepted: false;
      readonly state: DefensePossessionState;
      readonly events: readonly [];
      readonly rejection: DefenseRejection;
    };

export function createDefensePossession(
  setup: DefensePossessionSetup,
  plans: OpponentPlanCatalog,
  rngState: number,
  randomSource: RandomSource = xorshift32RandomSource,
): DefensePossessionState {
  const availablePlans = Object.values(plans);
  if (availablePlans.length === 0) {
    throw new Error("Przeciwnik wymaga co najmniej jednego planu.");
  }
  const planStep = randomSource.next(normalizeSeed(rngState));
  const planIndex = Math.min(
    availablePlans.length - 1,
    Math.floor(planStep.value * availablePlans.length),
  );
  const selectedPlan = availablePlans[planIndex];
  if (selectedPlan === undefined || selectedPlan.steps[0] === undefined) {
    throw new Error("Plan przeciwnika wymaga co najmniej jednego kroku.");
  }

  return {
    rngState: planStep.state,
    phase: "playerResponse",
    shotClock: setup.shotClock,
    players: setup.players.map((player) => ({ ...player })),
    ballHandlerId: setup.ballHandlerId,
    assignments: setup.assignments.map((assignment) => ({ ...assignment })),
    plan: {
      id: selectedPlan.id,
      name: selectedPlan.name,
      description: selectedPlan.description,
    },
    currentStepIndex: 0,
    currentAction: { ...selectedPlan.steps[0] },
    opponentAdvantage: 0,
    shotContest: 0,
    turnoverPressure: 0,
    exposedOpponentIds: [],
    hand: [...setup.hand],
    history: [],
    events: [],
    shotQualityRules: {
      ...setup.shotQuality,
      zoneModifiers: { ...setup.shotQuality.zoneModifiers },
      categoryMinimums: { ...setup.shotQuality.categoryMinimums },
    },
  };
}

export function playDefenseCard(
  state: DefensePossessionState,
  command: PlayDefenseCardCommand,
  cards: DefenseCardCatalog,
  plans: OpponentPlanCatalog,
  randomSource: RandomSource = xorshift32RandomSource,
): DefenseRuleResult {
  const rejection = validateDefenseCard(state, command, cards);
  if (rejection !== undefined) return rejected(state, rejection);

  const card = cards[command.cardId];
  const interaction = card?.effects[state.currentAction.kind];
  if (card === undefined || interaction === undefined) {
    return reject(
      state,
      "cardNotLegalAgainstAction",
      "Ta karta nie odpowiada na aktualną akcję przeciwnika.",
    );
  }
  const plan = plans[state.plan.id];
  if (plan === undefined) {
    return reject(state, "unknownPlan", "Nie znaleziono aktywnego planu przeciwnika.");
  }

  const impact = previewDefenseCardImpact(state, card.id, cards);
  if (impact === undefined) {
    return reject(
      state,
      "cardNotLegalAgainstAction",
      "Ta karta nie ma policzalnego efektu dla aktualnej akcji.",
    );
  }

  const totalTimeCost = impact.timeCost;
  const shotClock = Math.max(0, state.shotClock - totalTimeCost);
  const opponentAdvantage = impact.nextOpponentAdvantage;
  const targetId = expectedTarget(state, card.targetMode);
  const exposureId = impact.exposureId;
  const assignments =
    interaction.assignmentChange === "switchScreenAssignments"
      ? switchScreenAssignments(state.assignments, state.currentAction)
      : state.assignments.map((assignment) => ({ ...assignment }));
  const exposedOpponentIds =
    exposureId === undefined
      ? [...state.exposedOpponentIds]
      : addUnique(state.exposedOpponentIds, exposureId);
  const turnoverPressure = impact.turnoverPressure;
  const cardEvent: DefenseDomainEvent = {
    type: "defenseCardPlayed",
    cardId: card.id,
    targetId,
  };
  const actionEvent: DefenseDomainEvent = {
    type: "opponentActionResolved",
    actionId: state.currentAction.id,
    explanation: interaction.explanation,
  };
  const events: DefenseDomainEvent[] = [cardEvent, actionEvent];
  if (opponentAdvantage !== state.opponentAdvantage) {
    events.push({
      type: "opponentAdvantageChanged",
      previous: state.opponentAdvantage,
      current: opponentAdvantage,
    });
  }
  if (interaction.assignmentChange === "switchScreenAssignments") {
    events.push({ type: "coverageSwitched" });
  }
  if (exposureId !== undefined) {
    events.push({ type: "opponentExposed", playerId: exposureId });
  }

  const commonState: DefensePossessionState = {
    ...state,
    shotClock,
    assignments,
    opponentAdvantage,
    shotContest: state.shotContest + interaction.contestDelta,
    turnoverPressure,
    exposedOpponentIds,
    hand: removeOne(state.hand, card.id),
    history: [
      ...state.history,
      {
        cardId: card.id,
        kind: card.kind,
        targetId,
        opponentActionId: state.currentAction.id,
        timeCost: totalTimeCost,
        explanation: interaction.explanation,
      },
    ],
    events: [...state.events, ...events],
    players: applyOpponentAction(state.players, state.currentAction),
    ballHandlerId: nextBallHandler(state.ballHandlerId, state.currentAction),
  };

  if (shotClock === 0) {
    const clockEvent: DefenseDomainEvent = { type: "opponentClockExpired" };
    return accepted(
      {
        ...commonState,
        phase: "completed",
        events: [...commonState.events, clockEvent],
        result: { outcome: "clockExpired" },
      },
      [...events, clockEvent],
    );
  }

  let resolvedState = commonState;
  if (turnoverPressure >= 2) {
    const turnoverStep = randomSource.next(resolvedState.rngState);
    if (turnoverStep.value < impact.turnoverChance) {
      const turnoverEvent: DefenseDomainEvent = {
        type: "turnoverForced",
        roll: turnoverStep.value,
      };
      return accepted(
        {
          ...resolvedState,
          rngState: turnoverStep.state,
          phase: "completed",
          events: [...resolvedState.events, turnoverEvent],
          result: { outcome: "turnover", roll: turnoverStep.value },
        },
        [...events, turnoverEvent],
      );
    }
    resolvedState = { ...resolvedState, rngState: turnoverStep.state };
  }

  if (state.currentAction.kind === "shoot") {
    const shooter = findPlayer(resolvedState.players, state.currentAction.actorId);
    if (shooter === undefined) {
      throw new Error("Akcja rzutu wskazuje nieznanego zawodnika.");
    }
    const quality = calculateOpponentShotQuality(resolvedState, shooter);
    const shotEvent: DefenseDomainEvent = {
      type: "opponentShotPrepared",
      shooterId: shooter.id,
      quality,
    };
    return accepted(
      {
        ...resolvedState,
        phase: "resolvingShot",
        pendingShot: { shooterId: shooter.id, zone: shooter.zone, quality },
        events: [...resolvedState.events, shotEvent],
      },
      [...events, shotEvent],
    );
  }

  const nextStepIndex = state.currentStepIndex + 1;
  const nextAction = plan.steps[nextStepIndex];
  if (nextAction === undefined) {
    throw new Error("Plan przeciwnika musi kończyć się akcją rzutu.");
  }

  return accepted(
    {
      ...resolvedState,
      currentStepIndex: nextStepIndex,
      currentAction: { ...nextAction },
    },
    events,
  );
}

export function getLegalDefenseTargets(
  state: DefensePossessionState,
  cardId: CardId,
  cards: DefenseCardCatalog,
): readonly PlayerId[] {
  if (state.phase !== "playerResponse") return [];
  const card = cards[cardId];
  if (
    card === undefined ||
    !state.hand.includes(cardId) ||
    card.effects[state.currentAction.kind] === undefined ||
    !Number.isInteger(card.timeCost) ||
    card.timeCost <= 0
  ) {
    return [];
  }
  return [expectedTarget(state, card.targetMode)];
}

export function previewDefenseCardImpact(
  state: DefensePossessionState,
  cardId: CardId,
  cards: DefenseCardCatalog,
): DefenseCardImpact | undefined {
  const card = cards[cardId];
  const interaction = card?.effects[state.currentAction.kind];
  if (card === undefined || interaction === undefined) return undefined;

  const nextOpponentAdvantage = clampAdvantage(
    state.opponentAdvantage +
      state.currentAction.baseAdvantageDelta +
      interaction.advantageDelta,
  );
  const turnoverPressure = Math.max(0, interaction.turnoverPressureDelta);
  const exposureId = exposureTarget(state.currentAction, interaction.exposure);

  return {
    timeCost: card.timeCost + interaction.extraClockCost,
    nextOpponentAdvantage,
    shotQualityDelta:
      (nextOpponentAdvantage - state.opponentAdvantage) *
        state.shotQualityRules.advantageBonusPerPoint -
      interaction.contestDelta,
    turnoverPressure,
    turnoverChance:
      turnoverPressure >= 2
        ? Math.min(0.6, turnoverPressure * 0.15)
        : 0,
    ...(exposureId === undefined ? {} : { exposureId }),
  };
}

export function resolveOpponentShot(
  state: DefensePossessionState,
  randomSource: RandomSource = xorshift32RandomSource,
): DefenseRuleResult {
  if (state.phase !== "resolvingShot" || state.pendingShot === undefined) {
    return reject(
      state,
      "invalidPhase",
      "Rzut przeciwnika można rozstrzygnąć tylko w fazie resolvingShot.",
    );
  }
  const step = randomSource.next(state.rngState);
  const outcome =
    step.value < state.pendingShot.quality.totalScore / 100 ? "made" : "missed";
  const event: DefenseDomainEvent = {
    type: "opponentShotResolved",
    outcome,
    roll: step.value,
  };

  return accepted(
    {
      ...state,
      rngState: step.state,
      phase: "completed",
      events: [...state.events, event],
      result: {
        outcome,
        shooterId: state.pendingShot.shooterId,
        shotZone: state.pendingShot.zone,
        quality: state.pendingShot.quality,
        roll: step.value,
      },
    },
    [event],
  );
}

function validateDefenseCard(
  state: DefensePossessionState,
  command: PlayDefenseCardCommand,
  cards: DefenseCardCatalog,
): DefenseRejection | undefined {
  if (state.phase !== "playerResponse") {
    return rejection("invalidPhase", "Kartę obrony można zagrać tylko w fazie odpowiedzi.");
  }
  const card = cards[command.cardId];
  if (card === undefined) {
    return rejection("unknownCard", "Nie znaleziono definicji karty obrony.");
  }
  if (!state.hand.includes(card.id)) {
    return rejection("cardNotInHand", "Tej karty obrony nie ma na ręce.");
  }
  if (!Number.isInteger(card.timeCost) || card.timeCost <= 0) {
    return rejection(
      "invalidCardDefinition",
      "Koszt czasu karty obrony musi być dodatnią liczbą całkowitą.",
    );
  }
  if (card.effects[state.currentAction.kind] === undefined) {
    return rejection(
      "cardNotLegalAgainstAction",
      "Ta karta nie odpowiada na aktualną akcję przeciwnika.",
    );
  }
  if (command.targetId !== expectedTarget(state, card.targetMode)) {
    return rejection("invalidTarget", "Karta wskazuje niepoprawny cel dla tej reakcji.");
  }
  return undefined;
}

function calculateOpponentShotQuality(
  state: DefensePossessionState,
  shooter: PlayerState,
): ShotQuality {
  const rules = state.shotQualityRules;
  const modifiers: ShotModifier[] = [
    { source: "baseSkill", value: shooter.shooting },
    { source: "zone", value: rules.zoneModifiers[shooter.zone] },
  ];
  if (state.shotContest !== 0) {
    modifiers.push({ source: "defensiveResponse", value: -state.shotContest });
  }
  if (state.opponentAdvantage > 0) {
    modifiers.push({
      source: "opponentAdvantage",
      value: state.opponentAdvantage * rules.advantageBonusPerPoint,
    });
  }
  if (state.exposedOpponentIds.includes(shooter.id)) {
    modifiers.push({ source: "exposedShooter", value: rules.openLookBonus });
  }
  const totalScore = clampShotScore(
    modifiers.reduce((score, modifier) => score + modifier.value, 0),
  );
  return {
    baseScore: shooter.shooting,
    modifiers,
    totalScore,
    category: categorizeShotScore(totalScore, rules.categoryMinimums),
  };
}

function expectedTarget(
  state: DefensePossessionState,
  targetMode: DefenseCardDefinition["targetMode"],
): PlayerId {
  if (targetMode === "ballHandler") return state.ballHandlerId;
  if (targetMode === "actionActor") return state.currentAction.actorId;
  if (state.currentAction.targetId === undefined) {
    throw new Error("Definicja karty wymaga celu, którego nie ma w akcji przeciwnika.");
  }
  return state.currentAction.targetId;
}

function exposureTarget(
  action: OpponentActionDefinition,
  exposure: DefenseInteraction["exposure"],
): PlayerId | undefined {
  if (exposure === "actionActor") return action.actorId;
  if (exposure === "actionTarget") return action.targetId;
  return undefined;
}

function switchScreenAssignments(
  assignments: readonly DefenseAssignment[],
  action: OpponentActionDefinition,
): readonly DefenseAssignment[] {
  if (action.targetId === undefined) return assignments.map((item) => ({ ...item }));
  const actorAssignment = assignments.find(
    (item) => item.offenderId === action.actorId,
  );
  const targetAssignment = assignments.find(
    (item) => item.offenderId === action.targetId,
  );
  if (actorAssignment === undefined || targetAssignment === undefined) {
    return assignments.map((item) => ({ ...item }));
  }
  return assignments.map((item) => {
    if (item.offenderId === action.actorId) {
      return { ...item, defenderId: targetAssignment.defenderId };
    }
    if (item.offenderId === action.targetId) {
      return { ...item, defenderId: actorAssignment.defenderId };
    }
    return { ...item };
  });
}

function applyOpponentAction(
  players: readonly PlayerState[],
  action: OpponentActionDefinition,
): readonly PlayerState[] {
  if (action.kind !== "drive") return players.map((player) => ({ ...player }));
  return players.map((player) =>
    player.id === action.actorId ? { ...player, zone: "paint" } : { ...player },
  );
}

function nextBallHandler(
  currentBallHandlerId: PlayerId,
  action: OpponentActionDefinition,
): PlayerId {
  if (action.kind === "drive") return action.actorId;
  if (action.kind === "pass" && action.targetId !== undefined) return action.targetId;
  return currentBallHandlerId;
}

function findPlayer(
  players: readonly PlayerState[],
  playerId: PlayerId,
): PlayerState | undefined {
  return players.find((player) => player.id === playerId);
}

function removeOne(values: readonly string[], value: string): readonly string[] {
  const result = [...values];
  const index = result.indexOf(value);
  result.splice(index, 1);
  return result;
}

function addUnique(values: readonly string[], value: string): readonly string[] {
  return values.includes(value) ? [...values] : [...values, value];
}

function clampAdvantage(value: number): number {
  return Math.max(0, Math.min(3, value));
}

function accepted(
  state: DefensePossessionState,
  events: readonly DefenseDomainEvent[],
): DefenseRuleResult {
  return { accepted: true, state, events };
}

function rejection(
  code: DefenseRejectionCode,
  message: string,
): DefenseRejection {
  return { code, message };
}

function reject(
  state: DefensePossessionState,
  code: DefenseRejectionCode,
  message: string,
): DefenseRuleResult {
  return rejected(state, rejection(code, message));
}

function rejected(
  state: DefensePossessionState,
  defenseRejection: DefenseRejection,
): DefenseRuleResult {
  return {
    accepted: false,
    state,
    events: [],
    rejection: defenseRejection,
  };
}

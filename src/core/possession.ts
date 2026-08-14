import type {
  ActionRejection,
  CardCatalog,
  CardDefinition,
  DomainEvent,
  PlayCardCommand,
  PlayedAction,
  PlayerState,
  PossessionSetup,
  PossessionState,
  RuleResult,
  ShotModifier,
  ShotQuality,
  Zone,
} from "./model.ts";
import { normalizeSeed, xorshift32RandomSource } from "./rng.ts";
import type { RandomSource } from "./rng.ts";
import { categorizeShotScore, clampShotScore } from "./shotQuality.ts";

const PERIMETER_ZONES: readonly Zone[] = [
  "leftPerimeter",
  "topPerimeter",
  "rightPerimeter",
];

export function createPossession(
  setup: PossessionSetup,
  seed: number,
): PossessionState {
  const normalizedSeed = normalizeSeed(seed);

  return {
    seed: normalizedSeed,
    rngState: normalizedSeed,
    phase: "setup",
    shotClock: setup.shotClock,
    players: setup.players.map((player) => ({ ...player })),
    ballHandlerId: setup.ballHandlerId,
    defense: {
      assignments: setup.defense.assignments.map((assignment) => ({
        ...assignment,
      })),
      intent: { ...setup.defense.intent },
      helpCommitted: false,
    },
    rules: {
      shotQuality: {
        ...setup.rules.shotQuality,
        zoneModifiers: { ...setup.rules.shotQuality.zoneModifiers },
        categoryMinimums: { ...setup.rules.shotQuality.categoryMinimums },
      },
    },
    advantage: 0,
    screenedPlayerIds: [],
    openPlayerIds: [],
    hand: [...setup.hand],
    deck: [...setup.deck],
    history: [],
    events: [],
  };
}

export function startPossession(state: PossessionState): RuleResult {
  if (state.phase !== "setup") {
    return reject(state, "invalidPhase", "Posiadanie można rozpocząć tylko z fazy setup.");
  }

  return accept({ ...state, phase: "playerTurn" });
}

export function resetPossession(
  setup: PossessionSetup,
  seed: number,
): PossessionState {
  const result = startPossession(createPossession(setup, seed));
  if (!result.accepted) {
    throw new Error("Nie udało się rozpocząć poprawnie utworzonego posiadania.");
  }

  return result.state;
}

export function playCard(
  state: PossessionState,
  command: PlayCardCommand,
  cards: CardCatalog,
): RuleResult {
  const validation = validateCommonAction(state, command, cards);
  if (validation !== undefined) {
    return { accepted: false, state, events: [], rejection: validation };
  }

  const card = cards[command.cardId];
  const actor = findPlayer(state, command.actorId);
  if (card === undefined || actor === undefined) {
    return reject(state, "unknownCard", "Nie znaleziono definicji karty.");
  }

  switch (card.kind) {
    case "pass":
      return playPass(state, command, card, actor);
    case "screen":
      return playScreen(state, command, card, actor);
    case "drive":
      return playDrive(state, command, card, actor);
    case "kickOut":
      return playKickOut(state, command, card, actor);
    case "shot":
      return playShot(state, command, card, actor);
  }
}

export function resolveShot(
  state: PossessionState,
  randomSource: RandomSource = xorshift32RandomSource,
): RuleResult {
  if (state.phase !== "resolvingShot" || state.pendingShot === undefined) {
    return reject(
      state,
      "invalidPhase",
      "Rzut można rozstrzygnąć tylko w fazie resolvingShot.",
    );
  }

  const randomStep = randomSource.next(state.rngState);
  const outcome =
    randomStep.value < state.pendingShot.quality.totalScore / 100
      ? "made"
      : "missed";
  const event: DomainEvent = {
    type: "shotResolved",
    outcome,
    roll: randomStep.value,
  };
  const nextState: PossessionState = {
    ...state,
    rngState: randomStep.state,
    phase: "completed",
    events: [...state.events, event],
    result: {
      outcome,
      shooterId: state.pendingShot.shooterId,
      quality: state.pendingShot.quality,
      roll: randomStep.value,
    },
  };

  return accept(nextState, [event]);
}

function validateCommonAction(
  state: PossessionState,
  command: PlayCardCommand,
  cards: CardCatalog,
): ActionRejection | undefined {
  if (state.phase !== "playerTurn") {
    return rejection("invalidPhase", "Kartę można zagrać tylko w fazie playerTurn.");
  }

  const card = cards[command.cardId];
  if (card === undefined) {
    return rejection("unknownCard", "Nie znaleziono definicji karty.");
  }
  if (!state.hand.includes(command.cardId)) {
    return rejection("cardNotInHand", "Tej karty nie ma na ręce.");
  }
  if (!Number.isInteger(card.timeCost) || card.timeCost <= 0) {
    return rejection(
      "invalidCardDefinition",
      "Koszt czasu karty musi być dodatnią liczbą całkowitą.",
    );
  }
  if (card.timeCost > state.shotClock) {
    return rejection("notEnoughTime", "Na zagranie tej karty brakuje czasu.");
  }
  if (card.targetMode === "none" && command.targetId !== undefined) {
    return rejection("invalidTarget", "Ta karta nie przyjmuje celu.");
  }
  if (card.targetMode !== "none" && command.targetId === undefined) {
    return rejection("invalidTarget", "Ta karta wymaga wskazania celu.");
  }

  const actor = findPlayer(state, command.actorId);
  if (actor === undefined) {
    return rejection("unknownActor", "Nie znaleziono wykonującego.");
  }
  if (actor.side !== "offense") {
    return rejection("actorIsNotOffense", "Kartę musi wykonać gracz ataku.");
  }

  return undefined;
}

function playPass(
  state: PossessionState,
  command: PlayCardCommand,
  card: CardDefinition,
  actor: PlayerState,
): RuleResult {
  const ballRejection = requireBallHandler(state, actor);
  if (ballRejection !== undefined) {
    return rejected(state, ballRejection);
  }
  const target = findOffensiveTarget(state, command.targetId, actor.id);
  if (target === undefined) {
    return reject(state, "invalidTarget", "Podanie wymaga innego gracza ataku.");
  }

  return finishCard(
    state,
    command,
    card,
    { ...state, ballHandlerId: target.id },
    [{ type: "ballMoved", fromPlayerId: actor.id, toPlayerId: target.id }],
  );
}

function playScreen(
  state: PossessionState,
  command: PlayCardCommand,
  card: CardDefinition,
  actor: PlayerState,
): RuleResult {
  if (actor.id === state.ballHandlerId) {
    return reject(
      state,
      "screenRequiresOffBallActor",
      "Zasłonę musi postawić gracz bez piłki.",
    );
  }
  if (command.targetId !== state.ballHandlerId) {
    return reject(state, "invalidTarget", "Zasłona musi wskazywać posiadacza piłki.");
  }

  return finishCard(state, command, card, {
    ...state,
    screenedPlayerIds: addUnique(state.screenedPlayerIds, state.ballHandlerId),
  });
}

function playDrive(
  state: PossessionState,
  command: PlayCardCommand,
  card: CardDefinition,
  actor: PlayerState,
): RuleResult {
  const ballRejection = requireBallHandler(state, actor);
  if (ballRejection !== undefined) {
    return rejected(state, ballRejection);
  }
  if (!PERIMETER_ZONES.includes(actor.zone)) {
    return reject(state, "driveRequiresPerimeter", "Drive wymaga startu z obwodu.");
  }

  const beatPressure = state.screenedPlayerIds.includes(actor.id);
  const nextAdvantage = beatPressure
    ? Math.min(state.rules.shotQuality.maxAdvantage, state.advantage + 2)
    : Math.max(0, state.advantage - 1);
  const helpCommitted = state.defense.intent.helpOnDrive;
  const nextPlayers = movePlayer(state.players, actor.id, "paint");
  const events: DomainEvent[] = [
    {
      type: "defenseReacted",
      reaction: beatPressure ? "pressureBeaten" : "ballHandlerContained",
    },
  ];
  if (helpCommitted) {
    events.push({ type: "defenseReacted", reaction: "helpCommitted" });
  }
  if (nextAdvantage !== state.advantage) {
    events.push({
      type: "advantageChanged",
      source: "screenedDrive",
      delta: nextAdvantage - state.advantage,
      previous: state.advantage,
      current: nextAdvantage,
    });
  }

  return finishCard(
    state,
    command,
    card,
    {
      ...state,
      players: nextPlayers,
      advantage: nextAdvantage,
      screenedPlayerIds: state.screenedPlayerIds.filter(
        (playerId) => playerId !== actor.id,
      ),
      defense: { ...state.defense, helpCommitted },
    },
    events,
  );
}

function playKickOut(
  state: PossessionState,
  command: PlayCardCommand,
  card: CardDefinition,
  actor: PlayerState,
): RuleResult {
  const ballRejection = requireBallHandler(state, actor);
  if (ballRejection !== undefined) {
    return rejected(state, ballRejection);
  }
  if (actor.zone !== "paint") {
    return reject(state, "kickOutRequiresPaint", "Kick Out wymaga wejścia w paint.");
  }
  const target = findOffensiveTarget(state, command.targetId, actor.id);
  if (target === undefined || !PERIMETER_ZONES.includes(target.zone)) {
    return reject(
      state,
      "invalidTarget",
      "Kick Out wymaga partnera ustawionego na obwodzie.",
    );
  }

  const createsOpenLook = state.defense.helpCommitted;
  const nextAdvantage = createsOpenLook
    ? Math.min(state.rules.shotQuality.maxAdvantage, state.advantage + 1)
    : state.advantage;
  const events: DomainEvent[] = [
    { type: "ballMoved", fromPlayerId: actor.id, toPlayerId: target.id },
  ];
  if (nextAdvantage !== state.advantage) {
    events.push({
      type: "advantageChanged",
      source: "kickOutAfterHelp",
      delta: nextAdvantage - state.advantage,
      previous: state.advantage,
      current: nextAdvantage,
    });
  }

  return finishCard(
    state,
    command,
    card,
    {
      ...state,
      ballHandlerId: target.id,
      advantage: nextAdvantage,
      openPlayerIds: createsOpenLook
        ? addUnique(state.openPlayerIds, target.id)
        : state.openPlayerIds,
    },
    events,
  );
}

function playShot(
  state: PossessionState,
  command: PlayCardCommand,
  card: CardDefinition,
  actor: PlayerState,
): RuleResult {
  const ballRejection = requireBallHandler(state, actor);
  if (ballRejection !== undefined) {
    return rejected(state, ballRejection);
  }

  const quality = calculateShotQuality(state, actor);
  return finishCard(
    state,
    command,
    card,
    {
      ...state,
      phase: "resolvingShot",
      pendingShot: { shooterId: actor.id, quality },
    },
    [{ type: "shotPrepared", shooterId: actor.id, quality }],
  );
}

function finishCard(
  previousState: PossessionState,
  command: PlayCardCommand,
  card: CardDefinition,
  changedState: PossessionState,
  extraEvents: readonly DomainEvent[] = [],
): RuleResult {
  const shotClock = previousState.shotClock - card.timeCost;
  const action: PlayedAction = {
    cardId: card.id,
    kind: card.kind,
    actorId: command.actorId,
    ...(command.targetId === undefined ? {} : { targetId: command.targetId }),
    timeCost: card.timeCost,
  };
  const cardPlayed: DomainEvent = {
    type: "cardPlayed",
    cardId: card.id,
    actorId: command.actorId,
    ...(command.targetId === undefined ? {} : { targetId: command.targetId }),
  };
  const actionEvents = [cardPlayed, ...extraEvents] as const;
  const commonState: PossessionState = {
    ...changedState,
    shotClock,
    hand: removeFirst(previousState.hand, card.id),
    history: [...previousState.history, action],
    events: [...previousState.events, ...actionEvents],
  };

  if (shotClock === 0 && commonState.phase === "playerTurn") {
    const clockExpiredEvent: DomainEvent = { type: "clockExpired" };
    return accept(
      {
        ...commonState,
        phase: "completed",
        events: [...commonState.events, clockExpiredEvent],
        result: { outcome: "clockExpired" },
      },
      [...actionEvents, clockExpiredEvent],
    );
  }

  return accept(commonState, actionEvents);
}

function calculateShotQuality(
  state: PossessionState,
  shooter: PlayerState,
): ShotQuality {
  const isOpen = state.openPlayerIds.includes(shooter.id);
  const hasAssignment = state.defense.assignments.some(
    (assignment) => assignment.offenderId === shooter.id,
  );
  const rules = state.rules.shotQuality;
  const modifiers: ShotModifier[] = [
    { source: "baseSkill", value: shooter.shooting },
    { source: "zone", value: rules.zoneModifiers[shooter.zone] },
  ];

  if (isOpen) {
    modifiers.push({ source: "createdOpenLook", value: rules.openLookBonus });
  } else {
    if (hasAssignment) {
      modifiers.push({
        source: "matchupContest",
        value: -state.defense.intent.matchupContest,
      });
    }
    if (state.defense.intent.onBallPressure > 0) {
      modifiers.push({
        source: "onBallPressure",
        value: -state.defense.intent.onBallPressure,
      });
    }
  }

  if (state.advantage > 0) {
    modifiers.push({
      source: "advantage",
      value: state.advantage * rules.advantageBonusPerPoint,
    });
  }

  const rawScore = modifiers.reduce(
    (score, modifier) => score + modifier.value,
    0,
  );
  const totalScore = clampShotScore(rawScore);

  return {
    baseScore: shooter.shooting,
    modifiers,
    totalScore,
    category: categorizeShotScore(totalScore, rules.categoryMinimums),
  };
}

function findPlayer(
  state: PossessionState,
  playerId: string,
): PlayerState | undefined {
  return state.players.find((player) => player.id === playerId);
}

function findOffensiveTarget(
  state: PossessionState,
  targetId: string | undefined,
  actorId: string,
): PlayerState | undefined {
  if (targetId === undefined || targetId === actorId) return undefined;
  const target = findPlayer(state, targetId);
  return target?.side === "offense" ? target : undefined;
}

function requireBallHandler(
  state: PossessionState,
  actor: PlayerState,
): ActionRejection | undefined {
  if (state.ballHandlerId !== actor.id) {
    return rejection(
      "actorDoesNotHaveBall",
      "Tę kartę musi wykonać posiadacz piłki.",
    );
  }
  return undefined;
}

function movePlayer(
  players: readonly PlayerState[],
  playerId: string,
  zone: Zone,
): readonly PlayerState[] {
  return players.map((player) =>
    player.id === playerId ? { ...player, zone } : player,
  );
}

function addUnique(values: readonly string[], value: string): readonly string[] {
  return values.includes(value) ? values : [...values, value];
}

function removeFirst(values: readonly string[], value: string): readonly string[] {
  const result = [...values];
  const index = result.indexOf(value);
  if (index >= 0) result.splice(index, 1);
  return result;
}

function accept(
  state: PossessionState,
  events: readonly DomainEvent[] = [],
): RuleResult {
  return { accepted: true, state, events };
}

function rejection(
  code: ActionRejection["code"],
  message: string,
): ActionRejection {
  return { code, message };
}

function reject(
  state: PossessionState,
  code: ActionRejection["code"],
  message: string,
): RuleResult {
  return rejected(state, rejection(code, message));
}

function rejected(
  state: PossessionState,
  actionRejection: ActionRejection,
): RuleResult {
  return {
    accepted: false,
    state,
    events: [],
    rejection: actionRejection,
  };
}

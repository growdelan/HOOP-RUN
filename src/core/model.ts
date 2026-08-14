export type PlayerId = string;
export type CardId = string;

export type Zone =
  | "leftPerimeter"
  | "topPerimeter"
  | "rightPerimeter"
  | "paint";

export type TeamSide = "offense" | "defense";
export type PossessionPhase =
  | "setup"
  | "playerTurn"
  | "resolvingShot"
  | "completed";
export type PossessionOutcome = "made" | "missed" | "clockExpired";
export type CardKind = "pass" | "screen" | "drive" | "kickOut" | "shot";
export type ShotQualityCategory =
  | "Bad"
  | "Contested"
  | "Decent"
  | "Open"
  | "Perfect";

export interface PlayerState {
  readonly id: PlayerId;
  readonly name: string;
  readonly side: TeamSide;
  readonly zone: Zone;
  readonly shooting: number;
}

export interface DefenseAssignment {
  readonly defenderId: PlayerId;
  readonly offenderId: PlayerId;
}

export interface DefenseIntent {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly onBallPressure: number;
  readonly matchupContest: number;
  readonly helpOnDrive: boolean;
}

export interface DefenseState {
  readonly assignments: readonly DefenseAssignment[];
  readonly intent: DefenseIntent;
  readonly helpCommitted: boolean;
}

export interface CardDefinition {
  readonly id: CardId;
  readonly name: string;
  readonly kind: CardKind;
  readonly timeCost: number;
  readonly targetMode: "none" | "teammate" | "ballHandler";
}

export interface PlayedAction {
  readonly cardId: CardId;
  readonly kind: CardKind;
  readonly actorId: PlayerId;
  readonly targetId?: PlayerId;
  readonly timeCost: number;
}

export interface ShotModifier {
  readonly source:
    | "baseSkill"
    | "zone"
    | "matchupContest"
    | "onBallPressure"
    | "createdOpenLook"
    | "advantage"
    | "defensiveResponse"
    | "opponentAdvantage"
    | "exposedShooter";
  readonly value: number;
}

export interface ShotQualityRules {
  readonly maxAdvantage: number;
  readonly advantageBonusPerPoint: number;
  readonly openLookBonus: number;
  readonly zoneModifiers: Readonly<Record<Zone, number>>;
  readonly categoryMinimums: {
    readonly Contested: number;
    readonly Decent: number;
    readonly Open: number;
    readonly Perfect: number;
  };
}

export interface PossessionRules {
  readonly shotQuality: ShotQualityRules;
}

export interface ShotQuality {
  readonly baseScore: number;
  readonly modifiers: readonly ShotModifier[];
  readonly totalScore: number;
  readonly category: ShotQualityCategory;
}

export interface PendingShot {
  readonly shooterId: PlayerId;
  readonly quality: ShotQuality;
}

export interface PossessionResult {
  readonly outcome: PossessionOutcome;
  readonly shooterId?: PlayerId;
  readonly quality?: ShotQuality;
  readonly roll?: number;
}

export interface PossessionState {
  readonly seed: number;
  readonly rngState: number;
  readonly phase: PossessionPhase;
  readonly shotClock: number;
  readonly players: readonly PlayerState[];
  readonly ballHandlerId: PlayerId;
  readonly defense: DefenseState;
  readonly rules: PossessionRules;
  readonly advantage: number;
  readonly screenedPlayerIds: readonly PlayerId[];
  readonly openPlayerIds: readonly PlayerId[];
  readonly hand: readonly CardId[];
  readonly deck: readonly CardId[];
  readonly history: readonly PlayedAction[];
  readonly events: readonly DomainEvent[];
  readonly pendingShot?: PendingShot;
  readonly result?: PossessionResult;
}

export interface PossessionSetup {
  readonly shotClock: number;
  readonly players: readonly PlayerState[];
  readonly ballHandlerId: PlayerId;
  readonly defense: DefenseState;
  readonly rules: PossessionRules;
  readonly hand: readonly CardId[];
  readonly deck: readonly CardId[];
}

export interface PlayCardCommand {
  readonly cardId: CardId;
  readonly actorId: PlayerId;
  readonly targetId?: PlayerId;
}

export type RejectionCode =
  | "invalidPhase"
  | "unknownCard"
  | "cardNotInHand"
  | "notEnoughTime"
  | "invalidCardDefinition"
  | "unknownActor"
  | "actorIsNotOffense"
  | "actorDoesNotHaveBall"
  | "invalidTarget"
  | "screenRequiresOffBallActor"
  | "driveRequiresPerimeter"
  | "kickOutRequiresPaint";

export interface ActionRejection {
  readonly code: RejectionCode;
  readonly message: string;
}

export type DomainEvent =
  | {
      readonly type: "cardPlayed";
      readonly cardId: CardId;
      readonly actorId: PlayerId;
      readonly targetId?: PlayerId;
    }
  | {
      readonly type: "ballMoved";
      readonly fromPlayerId: PlayerId;
      readonly toPlayerId: PlayerId;
    }
  | {
      readonly type: "defenseReacted";
      readonly reaction: "pressureBeaten" | "ballHandlerContained" | "helpCommitted";
    }
  | {
      readonly type: "advantageChanged";
      readonly source: "screenedDrive" | "kickOutAfterHelp";
      readonly delta: number;
      readonly previous: number;
      readonly current: number;
    }
  | {
      readonly type: "shotPrepared";
      readonly shooterId: PlayerId;
      readonly quality: ShotQuality;
    }
  | {
      readonly type: "shotResolved";
      readonly outcome: "made" | "missed";
      readonly roll: number;
    }
  | { readonly type: "clockExpired" };

export type RuleResult =
  | {
      readonly accepted: true;
      readonly state: PossessionState;
      readonly events: readonly DomainEvent[];
    }
  | {
      readonly accepted: false;
      readonly state: PossessionState;
      readonly events: readonly [];
      readonly rejection: ActionRejection;
    };

export type CardCatalog = Readonly<Record<CardId, CardDefinition>>;

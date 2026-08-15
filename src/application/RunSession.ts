import { MatchSession } from "./MatchSession.ts";
import type {
  MatchSessionController,
  MatchViewModel,
} from "./MatchSession.ts";
import { PROTOTYPE_DEFENSE_CARDS } from "../content/prototypeDefense.ts";
import { PROTOTYPE_CARDS } from "../content/prototypePossession.ts";
import { PROTOTYPE_RUN_SETUP } from "../content/prototypeRun.ts";
import {
  createRunCheckpoint,
  createRun,
  decodeRunCheckpoint,
  encodeRunCheckpoint,
  reduceRun,
  resetRun,
  restoreRunFromCheckpoint,
} from "../core/index.ts";
import type {
  CardId,
  MatchPossessionResolution,
  MatchState,
  RewardCardRole,
  RunMatchResult,
  RunOpponentId,
  RunState,
  RunCheckpointV1,
  SelectedRunReward,
} from "../core/index.ts";
import {
  EMPTY_RUN_CHECKPOINT_REPOSITORY,
} from "./RunCheckpointRepository.ts";
import type { RunCheckpointRepository } from "./RunCheckpointRepository.ts";

export type RunScreen =
  | "start"
  | "howTo"
  | "confirmNewRun"
  | "match"
  | "reward"
  | "intermission"
  | "summary";

export type RunUiCommand =
  | { readonly type: "openHowTo" }
  | { readonly type: "closeHowTo" }
  | { readonly type: "startRun" }
  | { readonly type: "confirmStartRun" }
  | { readonly type: "cancelStartRun" }
  | { readonly type: "continueRun" }
  | { readonly type: "discardCheckpoint" }
  | { readonly type: "saveAndExit" }
  | { readonly type: "chooseReward"; readonly offerIndex: 0 | 1 | 2 }
  | { readonly type: "startNextMatch" }
  | { readonly type: "resetRun" };

export interface RunOpponentView {
  readonly id: RunOpponentId;
  readonly name: string;
  readonly description: string;
}

export interface RunRewardView {
  readonly index: 0 | 1 | 2;
  readonly cardId: CardId;
  readonly role: RewardCardRole;
  readonly roleLabel: "ATAK" | "OBRONA";
  readonly name: string;
  readonly effect: string;
  readonly tradeoff: string;
  readonly timeCost: number;
}

export interface RunDeckCardView {
  readonly cardId: CardId;
  readonly name: string;
  readonly count: number;
}

export interface RunSelectedRewardView {
  readonly cardId: CardId;
  readonly name: string;
  readonly role: RewardCardRole;
  readonly roleLabel: "ATAK" | "OBRONA";
  readonly afterOpponentIndex: number;
}

export interface HowToSectionView {
  readonly title: string;
  readonly lines: readonly string[];
}

export interface RunSummaryView {
  readonly outcome: "success" | "failure";
  readonly title: "RUN UKOŃCZONY" | "RUN PRZERWANY";
  readonly reachedStage: number;
  readonly results: readonly RunMatchResult[];
  readonly rewards: readonly RunSelectedRewardView[];
  readonly offenseDeck: readonly RunDeckCardView[];
  readonly defenseDeck: readonly RunDeckCardView[];
  readonly elapsedSeconds: number;
}

export interface RunViewModel {
  readonly screen: RunScreen;
  readonly seed: number;
  readonly stage: number;
  readonly totalStages: 3;
  readonly progressLabel: string;
  readonly opponent?: RunOpponentView;
  readonly howTo?: readonly HowToSectionView[];
  readonly match?: MatchViewModel;
  readonly rewardOffer?: readonly RunRewardView[];
  readonly selectedReward?: RunRewardView;
  readonly offenseDeck: readonly RunDeckCardView[];
  readonly defenseDeck: readonly RunDeckCardView[];
  readonly rewards: readonly RunSelectedRewardView[];
  readonly results: readonly RunMatchResult[];
  readonly elapsedSeconds: number;
  readonly canContinue: boolean;
  readonly needsNewRunConfirmation: boolean;
  readonly persistenceUnavailable: boolean;
  readonly checkpointError?: string;
  readonly persistenceError?: string;
  readonly summary?: RunSummaryView;
}

type Clock = () => number;

export class RunSession {
  private screenValue: RunScreen = "start";
  private runState?: RunState;
  private matchSession?: MatchSession;
  private selectedRewardView?: RunRewardView;
  private startedAt?: number;
  private elapsedActiveMs = 0;
  private completedElapsedMs?: number;
  private pendingCheckpoint?: RunCheckpointV1;
  private checkpointError?: string;
  private persistenceError?: string;
  private persistenceUnavailableValue = false;
  private activeShotClock: number;

  public constructor(
    private readonly seed: number,
    private readonly configuredShotClock: number = 14,
    private readonly clock: Clock = () => performance.now(),
    private readonly checkpointRepository: RunCheckpointRepository = EMPTY_RUN_CHECKPOINT_REPOSITORY,
  ) {
    this.activeShotClock = configuredShotClock;
    this.loadCheckpointSlot();
  }

  public get state(): RunState | undefined {
    return this.runState;
  }

  public getViewModel(): RunViewModel {
    const state = this.runState;
    const stage = state === undefined ? 1 : state.opponentIndex + 1;
    const opponent = state === undefined ? undefined : opponentView(state);
    const elapsedSeconds = this.elapsedSeconds();
    const base = {
      screen: this.screenValue,
      seed: state?.initialSeed ?? this.seed,
      stage,
      totalStages: 3 as const,
      progressLabel: `MECZ ${stage}/3`,
      ...(opponent === undefined ? {} : { opponent }),
      offenseDeck: deckView(state?.offenseDeck ?? PROTOTYPE_RUN_SETUP.offenseDeck, "offense"),
      defenseDeck: deckView(state?.defenseDeck ?? PROTOTYPE_RUN_SETUP.defenseDeck, "defense"),
      rewards: state?.selectedRewards.map(selectedRewardView) ?? [],
      results: state?.matchResults ?? [],
      elapsedSeconds,
      canContinue: this.pendingCheckpoint !== undefined,
      needsNewRunConfirmation: this.screenValue === "confirmNewRun",
      persistenceUnavailable: this.persistenceUnavailableValue,
      ...(this.checkpointError === undefined ? {} : { checkpointError: this.checkpointError }),
      ...(this.persistenceError === undefined ? {} : { persistenceError: this.persistenceError }),
    };

    if (this.screenValue === "match" && this.matchSession !== undefined) {
      return { ...base, match: this.matchSession.getViewModel() };
    }
    if (this.screenValue === "howTo") {
      return { ...base, howTo: HOW_TO_SECTIONS };
    }
    if (this.screenValue === "reward" && state?.rewardOffer !== undefined) {
      return { ...base, rewardOffer: state.rewardOffer.map(rewardView) };
    }
    if (this.screenValue === "intermission" && this.selectedRewardView !== undefined) {
      return { ...base, selectedReward: this.selectedRewardView };
    }
    if (
      this.screenValue === "summary" &&
      state !== undefined &&
      state.outcome !== undefined
    ) {
      return {
        ...base,
        summary: {
          outcome: state.outcome,
          title: state.outcome === "success" ? "RUN UKOŃCZONY" : "RUN PRZERWANY",
          reachedStage: state.opponentIndex + 1,
          results: state.matchResults,
          rewards: state.selectedRewards.map(selectedRewardView),
          offenseDeck: deckView(state.offenseDeck, "offense"),
          defenseDeck: deckView(state.defenseDeck, "defense"),
          elapsedSeconds,
        },
      };
    }
    return base;
  }

  public dispatch(command: RunUiCommand): void {
    switch (command.type) {
      case "openHowTo":
        if (this.screenValue === "start") this.screenValue = "howTo";
        return;
      case "closeHowTo":
        if (this.screenValue === "howTo") this.screenValue = "start";
        return;
      case "startRun":
        if (this.screenValue === "start") this.requestFreshRun();
        return;
      case "confirmStartRun":
        if (this.screenValue === "confirmNewRun") this.confirmFreshRun();
        return;
      case "cancelStartRun":
        if (this.screenValue === "confirmNewRun") this.screenValue = "start";
        return;
      case "continueRun":
        if (this.screenValue === "start") this.continueRun();
        return;
      case "discardCheckpoint":
        if (this.screenValue === "start") this.discardCheckpoint();
        return;
      case "saveAndExit":
        this.saveAndExit();
        return;
      case "chooseReward":
        this.chooseReward(command.offerIndex);
        return;
      case "startNextMatch":
        this.startNextMatch();
        return;
      case "resetRun":
        if (this.screenValue === "summary") this.resetAfterSummary();
        return;
    }
  }

  public selectCard(cardId: CardId): void {
    if (this.screenValue === "match") this.matchSession?.selectCard(cardId);
  }

  public selectPlayer(playerId: Parameters<MatchSession["selectPlayer"]>[0]): void {
    if (this.screenValue === "match") this.matchSession?.selectPlayer(playerId);
  }

  public continueMatch(): void {
    if (this.screenValue === "match") this.matchSession?.continue();
  }

  private startFreshRun(resetExisting: boolean): void {
    this.runState =
      resetExisting && this.runState !== undefined
        ? resetRun(this.runState, this.seed)
        : createRun(PROTOTYPE_RUN_SETUP, this.seed);
    this.activeShotClock = this.configuredShotClock;
    this.startedAt = this.clock();
    this.elapsedActiveMs = 0;
    this.completedElapsedMs = undefined;
    if (!this.persistenceUnavailableValue) this.persistenceError = undefined;
    this.selectedRewardView = undefined;
    this.screenValue = "match";
    this.createMatchSession();
  }

  private requestFreshRun(): void {
    if (this.checkpointError !== undefined) return;
    if (this.pendingCheckpoint !== undefined) {
      this.screenValue = "confirmNewRun";
      return;
    }
    this.startFreshRun(false);
  }

  private confirmFreshRun(): void {
    if (this.persistenceUnavailableValue) {
      this.pendingCheckpoint = undefined;
      this.checkpointError = undefined;
      this.startFreshRun(false);
      return;
    }
    const removed = this.checkpointRepository.remove();
    if (!removed.ok) {
      this.disablePersistence(removed.error.message);
      this.startFreshRun(false);
      return;
    }
    this.pendingCheckpoint = undefined;
    this.checkpointError = undefined;
    this.persistenceError = undefined;
    this.startFreshRun(false);
  }

  private continueRun(): void {
    const checkpoint = this.pendingCheckpoint;
    if (checkpoint === undefined) return;
    this.runState = restoreRunFromCheckpoint(checkpoint);
    this.activeShotClock = checkpoint.shotClock;
    this.elapsedActiveMs = checkpoint.elapsedActiveMs;
    this.startedAt = this.clock();
    this.completedElapsedMs = undefined;
    this.persistenceError = undefined;
    const reward = this.runState.selectedRewards.at(-1);
    this.selectedRewardView = reward === undefined ? undefined : rewardView(reward);
    this.screenValue = "intermission";
  }

  private saveAndExit(): void {
    const state = this.runState;
    if (this.screenValue !== "intermission" || state === undefined) return;
    if (this.persistenceUnavailableValue) return;
    const elapsedActiveMs = this.liveElapsedMs();
    const created = createRunCheckpoint(
      state,
      elapsedActiveMs,
      PROTOTYPE_RUN_SETUP,
      this.activeShotClock,
    );
    if (!created.ok) {
      this.persistenceError = created.error.message;
      return;
    }
    const written = this.checkpointRepository.write(encodeRunCheckpoint(created.value));
    if (!written.ok) {
      this.disablePersistence(written.error.message);
      return;
    }
    this.pendingCheckpoint = created.value;
    this.runState = undefined;
    this.matchSession = undefined;
    this.selectedRewardView = undefined;
    this.startedAt = undefined;
    this.elapsedActiveMs = 0;
    this.completedElapsedMs = undefined;
    this.persistenceError = undefined;
    this.checkpointError = undefined;
    this.screenValue = "start";
  }

  private discardCheckpoint(): void {
    if (this.persistenceUnavailableValue) {
      this.pendingCheckpoint = undefined;
      this.checkpointError = undefined;
      return;
    }
    const removed = this.checkpointRepository.remove();
    if (!removed.ok) {
      this.disablePersistence(removed.error.message);
      return;
    }
    this.pendingCheckpoint = undefined;
    this.checkpointError = undefined;
    this.persistenceError = undefined;
  }

  private loadCheckpointSlot(): void {
    const loaded = this.checkpointRepository.read();
    if (!loaded.ok) {
      this.disablePersistence(loaded.error.message);
      return;
    }
    if (loaded.value === null) return;
    const decoded = decodeRunCheckpoint(loaded.value, PROTOTYPE_RUN_SETUP);
    if (!decoded.ok) {
      this.checkpointError = decoded.error.message;
      return;
    }
    this.pendingCheckpoint = decoded.value;
  }

  private chooseReward(index: 0 | 1 | 2): void {
    const state = this.runState;
    if (this.screenValue !== "reward" || state?.rewardOffer === undefined) return;
    const chosen = state.rewardOffer[index];
    if (chosen === undefined) return;
    const result = reduceRun(state, { type: "chooseReward", offerIndex: index });
    if (!result.accepted) return;
    this.runState = result.state;
    this.selectedRewardView = rewardView(chosen);
    this.screenValue = "intermission";
  }

  private startNextMatch(): void {
    const state = this.runState;
    if (this.screenValue !== "intermission" || state === undefined) return;
    const result = reduceRun(state, { type: "startNextMatch" });
    if (!result.accepted) return;
    this.runState = result.state;
    this.selectedRewardView = undefined;
    this.screenValue = "match";
    this.createMatchSession();
  }

  private createMatchSession(): void {
    const match = this.runState?.activeMatch;
    if (match === undefined) throw new Error("Ekran meczu wymaga aktywnego MatchState.");
    const controller: MatchSessionController = {
      completePossession: (resolution) => this.updateMatch({
        type: "completeMatchPossession",
        resolution,
      }),
      advance: () => this.updateMatch({ type: "advanceMatch" }),
    };
    this.matchSession = new MatchSession(match, this.activeShotClock, controller);
  }

  private updateMatch(command:
    | { readonly type: "completeMatchPossession"; readonly resolution: MatchPossessionResolution }
    | { readonly type: "advanceMatch" }): MatchState | undefined {
    const state = this.runState;
    if (state === undefined) return undefined;
    const result = reduceRun(state, command);
    if (!result.accepted) return state.activeMatch;
    this.runState = result.state;
    if (result.state.phase === "activeMatch") return result.state.activeMatch;
    this.matchSession = undefined;
    this.screenValue = result.state.phase === "rewardSelection" ? "reward" : "summary";
    if (this.screenValue === "summary") {
      this.completedElapsedMs = this.liveElapsedMs();
      if (this.persistenceUnavailableValue) return undefined;
      const removed = this.checkpointRepository.remove();
      if (!removed.ok) {
        this.disablePersistence(removed.error.message);
      } else {
        this.pendingCheckpoint = undefined;
        this.persistenceError = undefined;
      }
    }
    return undefined;
  }

  private elapsedSeconds(): number {
    return Math.floor((this.completedElapsedMs ?? this.liveElapsedMs()) / 1000);
  }

  private resetAfterSummary(): void {
    if (this.persistenceUnavailableValue) {
      this.startFreshRun(true);
      return;
    }
    const removed = this.checkpointRepository.remove();
    if (!removed.ok) {
      this.disablePersistence(removed.error.message);
      this.startFreshRun(true);
      return;
    }
    this.pendingCheckpoint = undefined;
    this.persistenceError = undefined;
    this.startFreshRun(true);
  }

  private liveElapsedMs(): number {
    if (this.startedAt === undefined) return this.elapsedActiveMs;
    return this.elapsedActiveMs + Math.max(0, Math.floor(this.clock() - this.startedAt));
  }

  private disablePersistence(message: string): void {
    this.persistenceUnavailableValue = true;
    this.pendingCheckpoint = undefined;
    this.checkpointError = undefined;
    this.persistenceError = `TRYB BEZ ZAPISU · ${message}`;
  }
}

export const HOW_TO_SECTIONS = [
  {
    title: "MECZ I ROLE",
    lines: [
      "Role zmieniają się co posiadanie: ATAK i OBRONA.",
      "W ataku wybierz kartę, wykonawcę i wymagany cel.",
      "W obronie odpowiedz kartą na widoczną akcję rywala.",
      "Trafienie z paint daje 1 punkt, a z obwodu 2 punkty.",
      "Wygrywa pierwsza drużyna z 11 pkt i przewagą 2; limit to 15.",
    ],
  },
  {
    title: "CZYTAJ STAN",
    lines: [
      "Intencja obrony i plan rywala są jawne przed decyzją.",
      "Karty pokazują legalność, koszt czasu i prognozę skutku.",
      "Jakość rzutu 54 oznacza dokładnie 54% szansy trafienia.",
      "Przewaga i modyfikatory wyjaśniają zmianę jakości rzutu.",
      "Kolor zawsze wspiera tekst — nie jest jedyną informacją.",
    ],
  },
  {
    title: "TRZY ETAPY",
    lines: [
      "Pokonaj kolejno trzech rywali bez przeładowania strony.",
      "Po meczach 1 i 2 musisz wybrać jedną z trzech kart.",
      "Nagroda trafia do wskazanej talii i zostaje do końca runu.",
      "Każda porażka kończy run; nowy run przywraca czyste talie.",
    ],
  },
] as const satisfies readonly HowToSectionView[];

function opponentView(state: RunState): RunOpponentView | undefined {
  const id = state.opponentIds[state.opponentIndex];
  const profile = state.opponentProfiles?.[state.opponentIndex];
  if (id === undefined || profile === undefined) return undefined;
  return { id, name: profile.name, description: profile.description };
}

function rewardView(entry: {
  readonly index: 0 | 1 | 2;
  readonly cardId: CardId;
  readonly role: RewardCardRole;
}): RunRewardView {
  const card = entry.role === "offense"
    ? PROTOTYPE_CARDS[entry.cardId as keyof typeof PROTOTYPE_CARDS]
    : PROTOTYPE_DEFENSE_CARDS[entry.cardId as keyof typeof PROTOTYPE_DEFENSE_CARDS];
  if (card === undefined) throw new Error(`Brak definicji nagrody ${entry.cardId}.`);
  return {
    ...entry,
    roleLabel: entry.role === "offense" ? "ATAK" : "OBRONA",
    name: card.name,
    ...rewardCopy(entry.cardId),
    timeCost: card.timeCost,
  };
}

function selectedRewardView(reward: SelectedRunReward): RunSelectedRewardView {
  return {
    cardId: reward.cardId,
    name: cardName(reward.cardId, reward.role),
    role: reward.role,
    roleLabel: reward.role === "offense" ? "ATAK" : "OBRONA",
    afterOpponentIndex: reward.afterOpponentIndex,
  };
}

function deckView(
  cardIds: readonly CardId[],
  role: RewardCardRole,
): readonly RunDeckCardView[] {
  const counts = new Map<CardId, number>();
  for (const cardId of cardIds) counts.set(cardId, (counts.get(cardId) ?? 0) + 1);
  return [...counts].map(([cardId, count]) => ({
    cardId,
    name: cardName(cardId, role),
    count,
  }));
}

function cardName(cardId: CardId, role: RewardCardRole): string {
  const card = role === "offense"
    ? PROTOTYPE_CARDS[cardId as keyof typeof PROTOTYPE_CARDS]
    : PROTOTYPE_DEFENSE_CARDS[cardId as keyof typeof PROTOTYPE_DEFENSE_CARDS];
  return card?.name ?? cardId;
}

function rewardCopy(cardId: CardId): {
  readonly effect: string;
  readonly tradeoff: string;
} {
  return {
    backdoorCut: {
      effect: "Przesuń gracza bez piłki z obwodu do paint; piłka zostaje u kozłującego.",
      tradeoff: "Otwiera cuttera tylko przeciw presji ≥8 bez pomocy. Inaczej tracisz 2s bez otwartej pozycji.",
    },
    stepBack: {
      effect: "+12 pp do najbliższego rzutu za 2 tego posiadacza piłki.",
      tradeoff: "Każda inna karta przed rzutem kasuje premię. Nie daje Advantage i kosztuje 3s.",
    },
    hedge: {
      effect: "Na Screen: -2 Advantage i +6 contest; koszt łącznie 3s.",
      tradeoff: "Odsłania screenera; jego udział w następnej akcji oddaje rywalowi +1 Advantage.",
    },
    closeOut: {
      effect: "Na rzut z obwodu przy Advantage 0: +12 contest.",
      tradeoff: "Przy Advantage ≥1 daje tylko +4 contest i dodaje rywalowi +1 Advantage; nie działa w paint.",
    },
  }[cardId] ?? {
    effect: "Dodaj kartę do właściwej talii bieżącego runu.",
    tradeoff: "Sprawdź legalność, koszt i prognozę przed zagraniem.",
  };
}

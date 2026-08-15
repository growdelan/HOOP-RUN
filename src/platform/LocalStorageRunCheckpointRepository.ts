import type {
  CheckpointStorageOperation,
  CheckpointStorageResult,
  RunCheckpointRepository,
} from "../application/RunCheckpointRepository.ts";

export const RUN_CHECKPOINT_STORAGE_KEY = "hoop-run:run-checkpoint";

export function createLocalStorageRunCheckpointRepository(
  getStorage: () => Storage,
): RunCheckpointRepository {
  try {
    return new LocalStorageRunCheckpointRepository(getStorage());
  } catch {
    return new UnavailableRunCheckpointRepository();
  }
}

export class LocalStorageRunCheckpointRepository implements RunCheckpointRepository {
  public constructor(private readonly storage: Storage) {}

  public read(): CheckpointStorageResult<string | null> {
    return this.safely("read", () => this.storage.getItem(RUN_CHECKPOINT_STORAGE_KEY));
  }

  public write(serialized: string): CheckpointStorageResult<void> {
    return this.safely("write", () => {
      this.storage.setItem(RUN_CHECKPOINT_STORAGE_KEY, serialized);
    });
  }

  public remove(): CheckpointStorageResult<void> {
    return this.safely("remove", () => {
      this.storage.removeItem(RUN_CHECKPOINT_STORAGE_KEY);
    });
  }

  private safely<T>(
    operation: CheckpointStorageOperation,
    action: () => T,
  ): CheckpointStorageResult<T> {
    try {
      return { ok: true, value: action() };
    } catch {
      return {
        ok: false,
        error: {
          operation,
          code: "storageUnavailable",
          message: "Przeglądarka odmówiła dostępu do lokalnego checkpointu.",
        },
      };
    }
  }
}

class UnavailableRunCheckpointRepository implements RunCheckpointRepository {
  public read(): CheckpointStorageResult<string | null> {
    return this.failure("read");
  }

  public write(): CheckpointStorageResult<void> {
    return this.failure("write");
  }

  public remove(): CheckpointStorageResult<void> {
    return this.failure("remove");
  }

  private failure<T>(operation: CheckpointStorageOperation): CheckpointStorageResult<T> {
    return {
      ok: false,
      error: {
        operation,
        code: "storageUnavailable",
        message: "Lokalny checkpoint jest niedostępny — możesz grać bez zapisu.",
      },
    };
  }
}

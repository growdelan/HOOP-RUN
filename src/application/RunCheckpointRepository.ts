export type CheckpointStorageOperation = "read" | "write" | "remove";

export interface CheckpointStorageError {
  readonly operation: CheckpointStorageOperation;
  readonly code: "storageUnavailable";
  readonly message: string;
}

export type CheckpointStorageResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: CheckpointStorageError };

export interface RunCheckpointRepository {
  read(): CheckpointStorageResult<string | null>;
  write(serialized: string): CheckpointStorageResult<void>;
  remove(): CheckpointStorageResult<void>;
}

export const EMPTY_RUN_CHECKPOINT_REPOSITORY: RunCheckpointRepository = {
  read: () => ({ ok: true, value: null }),
  write: () => ({
    ok: false,
    error: {
      operation: "write",
      code: "storageUnavailable",
      message: "Zapisywanie checkpointu nie jest dostępne.",
    },
  }),
  remove: () => ({ ok: true, value: undefined }),
};

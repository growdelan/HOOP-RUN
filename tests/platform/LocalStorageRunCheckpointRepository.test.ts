import { describe, expect, it } from "vitest";

import {
  createLocalStorageRunCheckpointRepository,
  LocalStorageRunCheckpointRepository,
  RUN_CHECKPOINT_STORAGE_KEY,
} from "../../src/platform/LocalStorageRunCheckpointRepository.ts";

describe("LocalStorageRunCheckpointRepository", () => {
  it("zamienia wyjątek gettera localStorage na niedostępny, typowany port", () => {
    const repository = createLocalStorageRunCheckpointRepository(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    expect(repository.read()).toMatchObject({ ok: false, error: { operation: "read", code: "storageUnavailable" } });
    expect(repository.write("checkpoint")).toMatchObject({ ok: false, error: { operation: "write", code: "storageUnavailable" } });
    expect(repository.remove()).toMatchObject({ ok: false, error: { operation: "remove", code: "storageUnavailable" } });
  });

  it("czyta, zapisuje i usuwa dokładnie jeden stały slot", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    } as unknown as Storage;
    const repository = new LocalStorageRunCheckpointRepository(storage);

    expect(repository.read()).toEqual({ ok: true, value: null });
    expect(repository.write("checkpoint")).toEqual({ ok: true, value: undefined });
    expect(values.get(RUN_CHECKPOINT_STORAGE_KEY)).toBe("checkpoint");
    expect(repository.read()).toEqual({ ok: true, value: "checkpoint" });
    expect(repository.remove()).toEqual({ ok: true, value: undefined });
    expect(values.size).toBe(0);
  });

  it.each(["read", "write", "remove"] as const)("zamienia wyjątek %s na typowany błąd", (operation) => {
    const storage = {
      getItem: () => { if (operation === "read") throw new Error("blocked"); return null; },
      setItem: () => { if (operation === "write") throw new Error("blocked"); },
      removeItem: () => { if (operation === "remove") throw new Error("blocked"); },
    } as unknown as Storage;
    const repository = new LocalStorageRunCheckpointRepository(storage);
    const result = operation === "read" ? repository.read() : operation === "write" ? repository.write("x") : repository.remove();
    expect(result).toMatchObject({ ok: false, error: { operation, code: "storageUnavailable" } });
  });
});

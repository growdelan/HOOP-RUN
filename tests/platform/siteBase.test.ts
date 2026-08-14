import { describe, expect, it } from "vitest";

import { SITE_BASE_PATH } from "../../src/platform/siteBase";

describe("SITE_BASE_PATH", () => {
  it("wskazuje niekorzeniową ścieżkę repozytorium GitHub Pages", () => {
    expect(SITE_BASE_PATH).toBe("/HOOP-RUN/");
    expect(SITE_BASE_PATH).not.toBe("/");
  });
});

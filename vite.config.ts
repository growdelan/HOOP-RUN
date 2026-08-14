import { defineConfig } from "vitest/config";

import { SITE_BASE_PATH } from "./src/platform/siteBase.ts";

export default defineConfig({
  base: SITE_BASE_PATH,
  build: {
    outDir: "dist",
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});

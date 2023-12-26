import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    // Runs vitest in the browser. Prioritizing browser implementation testing over Node for now.
    // After adding more Node related functionality will split into browser and node packages
    browser: {
      enabled: true,
      headless: true,
      name: "chrome",
    },
  },
})

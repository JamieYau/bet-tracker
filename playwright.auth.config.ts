import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/auth-e2e",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3200", trace: "retain-on-failure" },
  webServer: {
    command: "pnpm start --hostname 127.0.0.1 --port 3200",
    url: "http://127.0.0.1:3200/login",
    reuseExistingServer: false,
    env: { BET_TRACKER_DEMO: "false" },
  },
  projects: [
    {
      name: "auth-chromium",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
    { name: "auth-webkit", use: { ...devices["iPhone 13"] } },
  ],
});

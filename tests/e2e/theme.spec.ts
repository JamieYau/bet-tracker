import { expect, test } from "@playwright/test";

test("appearance follows System, explicit choices persist, and the toggle works by keyboard", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/settings");
  await expect(page.locator("html")).toHaveClass(/dark/);
  const preferences = page.getByRole("group", { name: "Appearance" });
  await expect(
    preferences.getByRole("button", { name: "System", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveClass(/light/);
  await preferences.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(
    preferences.getByRole("button", { name: "Dark", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const toggle = page.getByRole("button", { name: "Switch to light mode" });
  await toggle.focus();
  await toggle.press("Enter");
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveClass(/light/);
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Bets", exact: true })
    .click();
  await expect(page).toHaveURL(/\/bets$/);
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.goto("/login");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.goto("/settings");
  await preferences
    .getByRole("button", { name: "System", exact: true })
    .click();
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveClass(/light/);
  expect(errors).toEqual([]);
});

test("both themes preserve responsive navigation geometry", async ({
  page,
}) => {
  test.setTimeout(120_000);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 850 });
    let previous: unknown;
    for (const theme of ["light", "dark"] as const) {
      await page.goto("/settings");
      await page
        .getByRole("group", { name: "Appearance" })
        .getByRole("button", {
          name: theme === "dark" ? "Dark" : "Light",
          exact: true,
        })
        .click();
      for (const route of ["/", "/bets", "/add", "/settings"]) {
        await page.goto(route);
        await expect(
          page.getByRole("button", {
            name: `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
          }),
        ).toBeEnabled();
        await expect
          .poll(
            () =>
              page.evaluate(() => ({
                width: window.innerWidth,
                overflow:
                  document.documentElement.scrollWidth >
                  document.documentElement.clientWidth,
              })),
            { message: `${theme} ${route} at ${width}px` },
          )
          .toEqual({ width, overflow: false });
        const geometry = await page.evaluate(() => {
          const nav = document.querySelector(
            window.innerWidth < 768
              ? 'nav[aria-label="Mobile navigation"]'
              : 'nav[aria-label="Desktop navigation"]',
          );
          return Array.from(nav?.querySelectorAll("a") ?? []).map((link) => {
            const rect = link.getBoundingClientRect();
            return [rect.x, rect.y, rect.width, rect.height];
          });
        });
        if (previous) expect(geometry).toEqual(previous);
        previous = geometry;
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
        const toggle = page.getByRole("button", {
          name: `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
        });
        const bounds = await toggle.boundingBox();
        expect(bounds?.width).toBeGreaterThanOrEqual(44);
        expect(bounds?.height).toBeGreaterThanOrEqual(44);
        expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(
          width,
        );
      }
    }
  }
});

test("saved dark appearance is applied before hydration", async ({ page }) => {
  await page.goto("/settings");
  await page
    .getByRole("group", { name: "Appearance" })
    .getByRole("button", { name: "Dark", exact: true })
    .click();
  await page.route("**/_next/**/*.js*", (route) => route.abort());
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(
    page.getByRole("button", { name: "Change appearance" }),
  ).toBeDisabled();
});

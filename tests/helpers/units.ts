import { expect, type Page } from "@playwright/test";

async function runUnits(page: Page) {
  const main = page.locator("main:visible");
  const source = `Units ${crypto.randomUUID()}`;
  async function settings(size: string, mode: "gbp" | "units") {
    await page.goto("/settings");
    await expect(main.getByLabel("Unit size (£)")).toBeEnabled();
    await main.getByLabel("Unit size (£)").fill(size);
    await main.getByLabel("Preferred display").selectOption(mode);
    await main
      .getByRole("button", { name: "Save unit settings", exact: true })
      .click();
    await expect(main.getByRole("status")).toContainText("Unit settings saved");
  }
  await settings("", "gbp");
  await main.getByLabel("New source name").fill(source);
  await page
    .locator("main:visible form")
    .filter({ has: page.getByLabel("New source name") })
    .getByRole("button", { name: "Add", exact: true })
    .click();
  await expect(
    main.getByLabel(`Name for ${source}`, { exact: true }),
  ).toBeVisible();
  async function record(label: string, amount?: string) {
    await page.goto("/add");
    await main.getByLabel("Source", { exact: true }).fill(source);
    await page.getByRole("option", { name: source, exact: true }).click();
    const sourceId = await page
      .locator('main:visible input[name="sourceId"]')
      .inputValue();
    await main.getByLabel("Selection", { exact: true }).fill(label);
    await main.getByLabel("Accepted total odds").fill("2");
    if (amount)
      await main.getByLabel("Cash stake (£)", { exact: true }).fill(amount);
    await main
      .getByRole("button", { name: "Confirm bet", exact: true })
      .click();
    await expect(
      main.getByRole("heading", { name: label, exact: true }),
    ).toBeVisible();
    return { path: new URL(page.url()).pathname, sourceId };
  }
  const legacy = await record(`${source} legacy`, "10");
  await expect(
    main.getByText("Not assigned · £ only", { exact: true }),
  ).toBeVisible();
  await main.getByRole("button", { name: "Settle bet", exact: true }).click();
  await expect(
    main.getByText("Revision 1 · Won", { exact: true }),
  ).toBeVisible();
  await page.goto("/settings");
  await main.getByLabel("Unit size (£)").fill("0");
  await main
    .getByRole("button", { name: "Save unit settings", exact: true })
    .click();
  await expect(
    main.getByRole("alert").filter({ hasText: "Unit size must" }),
  ).toContainText("greater than zero");
  await settings("50", "units");
  await page.goto(`/?source=${legacy.sourceId}`);
  await expect(
    main.getByText("No unit results in this period", { exact: true }),
  ).toBeVisible();
  await page.goto("/add");
  await expect(main.getByLabel("Cash stake (£)", { exact: true })).toHaveValue(
    "50",
  );
  await expect(
    main.getByLabel("Free-bet stake (£)", { exact: true }),
  ).toHaveValue("");
  await main.getByLabel("Cash stake (£)", { exact: true }).fill("25");
  await expect(
    main.getByText("0.5u · £50.00 per unit", { exact: true }),
  ).toBeVisible();
  const first = await record(`${source} first`);
  await expect(
    main.getByText("£50.00 per unit", { exact: true }),
  ).toBeVisible();
  await settings("100", "units");
  await page.goto(first.path);
  await main.getByRole("link", { name: "Edit bet", exact: true }).click();
  await expect(main.getByLabel("Cash stake (£)", { exact: true })).toHaveValue(
    "50",
  );
  await expect(
    main.getByText("1u · £50.00 per unit", { exact: true }),
  ).toBeVisible();
  await expect(main.getByLabel("Historical unit size (£)")).toHaveCount(0);
  await main.getByLabel("Notes").fill("Edited after unit size change");
  await main.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    main.getByText("£50.00 per unit", { exact: true }),
  ).toBeVisible();
  await main.getByRole("button", { name: "Settle bet", exact: true }).click();
  await expect(main.getByText("1u", { exact: true })).toBeVisible();
  await record(`${source} second`);
  await expect(main.getByText("£100.00 · 1u", { exact: true })).toBeVisible();
  await main.getByRole("button", { name: "Settle bet", exact: true }).click();
  await expect(main.getByText("1u", { exact: true })).toBeVisible();
  await page.goto(`/?source=${first.sourceId}`);
  await expect(main.getByText("2u", { exact: true }).first()).toBeVisible();
  await expect(
    main.getByText("£160.00 actual cash P/L · all settled bets", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    main.getByText(/1 settled and 0 open bets without a unit/),
  ).toBeVisible();
  await expect(
    main.getByText(/Cumulative settled cash P\/L: 2u across 2 bets/),
  ).toBeVisible();
  const chart = page.locator("main:visible .recharts-wrapper");
  await chart.locator('[tabindex="0"]').first().focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(
    main.getByText("£150.00 for included bets", { exact: true }),
  ).toBeVisible();
  await main
    .getByRole("button", { name: "Display in pounds", exact: true })
    .click();
  await expect(
    main.getByText("£160.00", { exact: true }).first(),
  ).toBeVisible();
  await page.reload();
  await expect(
    main.getByRole("button", { name: "Display in pounds", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto(`/bets?source=${first.sourceId}`);
  await main
    .getByRole("button", { name: "Display in units", exact: true })
    .click();
  await expect(main.getByText("1u", { exact: true })).toHaveCount(2);
  await expect(
    main.getByText("cash P/L · £ only", { exact: true }),
  ).toBeVisible();
  await page.goto(legacy.path);
  await main.getByRole("link", { name: "Edit bet", exact: true }).click();
  await main.getByText("Unit size for this bet", { exact: true }).click();
  await main.getByLabel("Historical unit size (£)").fill("10");
  await main.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    main.getByText("£10.00 per unit", { exact: true }),
  ).toBeVisible();
  await page.goto(first.path);
  await main.getByLabel("Actual credited cash return (£)").fill("75");
  await main.getByLabel("Correction reason").fill("Correct credited return");
  await main
    .getByRole("button", { name: "Save correction", exact: true })
    .click();
  await expect(main.getByText("0.5u", { exact: true })).toBeVisible();
  await main.getByRole("link", { name: "Edit bet", exact: true }).click();
  await main.getByLabel("Cash stake (£)", { exact: true }).fill("25");
  await expect(
    main.getByText("0.5u · £50.00 per unit", { exact: true }),
  ).toBeVisible();
  await main.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(main.getByText("1u", { exact: true })).toBeVisible();
  await expect(
    main.getByText("Revision 2 · Won", { exact: true }),
  ).toBeVisible();
  const csv = await (
    await page.request.get(`/api/export?source=${first.sourceId}`)
  ).text();
  expect(csv).toContain(
    '"unit_size_pence","cash_stake_units","free_stake_units","cash_pl_units"',
  );
  expect(csv).toContain('"5000","0.5","0","1"');
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of [
      "/settings",
      "/add",
      `/?source=${first.sourceId}`,
      `/bets?source=${first.sourceId}`,
    ]) {
      await page.goto(route);
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        )
        .toBe(true);
    }
  }
  await settings("", "gbp");
}

export async function verifyUnits(page: Page) {
  const main = page.locator("main:visible");
  try {
    await runUnits(page);
  } finally {
    // The demo and authenticated suites share one owner across browser projects.
    await page.goto("/settings");
    await expect(main.getByLabel("Unit size (£)")).toBeEnabled();
    await main.getByLabel("Unit size (£)").fill("");
    await main.getByLabel("Preferred display").selectOption("gbp");
    await main
      .getByRole("button", { name: "Save unit settings", exact: true })
      .click();
    await expect(main.getByRole("status")).toContainText("Unit settings saved");
  }
}

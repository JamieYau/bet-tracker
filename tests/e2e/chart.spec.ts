import { expect, test } from "@playwright/test";

test("chart shows losses, zero baseline, equal settlement times and latest corrections", async ({
  page,
}) => {
  const sourceName = `Chart ${crypto.randomUUID()}`;
  await page.goto("/settings");
  await page
    .getByRole("group", { name: "Appearance" })
    .getByRole("button", { name: "Dark", exact: true })
    .click();
  await page.getByLabel("New source name").fill(sourceName);
  await page
    .locator("form")
    .filter({ has: page.getByLabel("New source name") })
    .getByRole("button", { name: "Add", exact: true })
    .click();
  await expect(
    page.getByLabel(`Name for ${sourceName}`, { exact: true }),
  ).toBeVisible();
  let sourceId = "";
  let winnerUrl = "";
  for (const outcome of ["lost", "won"]) {
    await page.goto("/add");
    await page
      .getByLabel("Source", { exact: true })
      .selectOption({ label: sourceName });
    sourceId = await page.getByLabel("Source", { exact: true }).inputValue();
    await page
      .getByLabel("Selection", { exact: true })
      .fill(`${sourceName} ${outcome}`);
    await page.getByLabel("Accepted total odds").fill("3");
    await page
      .getByLabel("Cash stake (£)", { exact: true })
      .fill(outcome === "lost" ? "10" : "5");
    await page
      .getByRole("button", { name: "Confirm bet", exact: true })
      .click();
    await expect(page.getByLabel("Outcome", { exact: true })).toBeVisible();
    await page.getByLabel("Outcome", { exact: true }).selectOption(outcome);
    await page.getByLabel("Settlement time").fill("2026-10-12T12:00");
    await page.getByRole("button", { name: "Settle bet", exact: true }).click();
    await expect(
      page.getByText(`Revision 1 · ${outcome === "won" ? "Won" : "Lost"}`),
    ).toBeVisible();
    if (outcome === "won") winnerUrl = page.url();
    await page.goto(`/?source=${sourceId}`);
    const caption = page.locator("figcaption");
    await expect(caption).toContainText(
      outcome === "lost"
        ? "-£10.00 across 1 settled bet"
        : "£0.00 across 2 settled bets",
    );
    const chart = page.locator('svg[aria-label="Cumulative settled cash P/L"]');
    await expect(chart).toBeVisible();
    expect(
      await chart
        .locator(".recharts-cartesian-axis-tick-value")
        .first()
        .evaluate((element) => getComputedStyle(element).fill),
    ).toBe("rgb(165, 187, 173)");
    await expect(chart.locator(".recharts-line-dot")).toHaveCount(
      outcome === "lost" ? 2 : 3,
    );
    if (outcome === "lost") {
      await chart.focus();
      await chart.press("ArrowRight");
      await chart.press("ArrowRight");
      await expect(page.locator(".recharts-tooltip-wrapper")).toContainText(
        "-£10.00",
      );
      await expect(page.locator(".recharts-tooltip-wrapper")).toContainText(
        "12 Oct 2026, 12:00 · Europe/London",
      );
    }
  }
  await page.goto(winnerUrl);
  await page.getByLabel("Actual credited cash return (£)").fill("25");
  await page
    .getByLabel("Correction reason")
    .fill("Correcting the credited return");
  await page.getByRole("button", { name: "Save correction" }).click();
  await expect(page.getByText("Revision 2 · Won")).toBeVisible();
  await page.goto(`/?source=${sourceId}`);
  await expect(page.locator("figcaption")).toContainText(
    "£10.00 across 2 settled bets",
  );
  await expect(page.locator(".recharts-line-dot")).toHaveCount(3);
  await page.goto(`/?source=${sourceId}&from=2026-10-13`);
  await expect(
    page.getByText("No settlements in this period", { exact: true }),
  ).toBeVisible();
});

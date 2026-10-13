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
    await page.getByLabel("Source", { exact: true }).fill(sourceName);
    await page.getByRole("option", { name: sourceName, exact: true }).click();
    sourceId = await page.locator('input[name="sourceId"]').inputValue();
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
    const caption = page.locator("figcaption:visible");
    await expect(caption).toContainText(
      outcome === "lost"
        ? "-£10.00 across 1 settled bet"
        : "£0.00 across 2 settled bets",
    );
    const chart = page.locator(
      'svg[aria-label="Cumulative settled cash P/L"]:visible',
    );
    await expect(chart).toBeVisible();
    expect(
      await chart
        .locator(".recharts-cartesian-axis-tick-value")
        .first()
        .evaluate((element) => {
          const probe = document.createElement("span");
          probe.style.color = "var(--muted-foreground)";
          element.parentElement?.appendChild(probe);
          const expected = getComputedStyle(probe).color;
          probe.remove();
          return getComputedStyle(element).fill === expected;
        }),
    ).toBe(true);
    await expect(chart.locator(".recharts-area-area")).toHaveAttribute(
      "d",
      /.+/,
    );
    expect(
      await chart
        .locator(".recharts-area-area")
        .evaluate((element) => getComputedStyle(element).fillOpacity),
    ).toBe("0.16");
    const path = await chart.locator(".recharts-area-curve").getAttribute("d");
    expect(path?.match(/[ML]/g)).toHaveLength(outcome === "lost" ? 2 : 3);
    if (outcome === "lost") {
      await chart.focus();
      await chart.press("ArrowRight");
      await chart.press("ArrowRight");
      await expect(
        page.locator(".recharts-tooltip-wrapper:visible"),
      ).toContainText("-£10.00");
      await expect(
        page
          .locator(".recharts-tooltip-wrapper:visible")
          .getByText("Cash P/L", { exact: true }),
      ).toHaveCount(1);
      await expect(
        page.locator(".recharts-tooltip-wrapper:visible"),
      ).toContainText("12 Oct 2026, 12:00");
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
  await expect(page.locator("figcaption:visible")).toContainText(
    "£10.00 across 2 settled bets",
  );
  const correctedPath = await page
    .locator("svg:visible .recharts-area-curve")
    .getAttribute("d");
  expect(correctedPath?.match(/[ML]/g)).toHaveLength(3);
  await page.goto(`/?source=${sourceId}&from=2026-10-13`);
  await expect(
    page
      .locator('[data-slot="empty-title"]:visible')
      .filter({ hasText: "No settlements in this period" }),
  ).toBeVisible();
});

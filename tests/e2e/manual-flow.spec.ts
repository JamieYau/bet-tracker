import { expect, test } from "@playwright/test";

test("in-play choice survives drafts and confirmation and can be cleared without losing other tags", async ({
  page,
}) => {
  const selection = `In-play ${crypto.randomUUID()}`;
  await page.goto("/add");
  await expect(
    page.getByRole("checkbox", { name: "In-play", exact: true }),
  ).not.toBeChecked();
  await page.getByLabel("Selection", { exact: true }).fill(selection);
  await page.getByLabel("Tags", { exact: true }).fill("Boost");
  await page.getByRole("checkbox", { name: "In-play", exact: true }).check();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page
      .locator('[data-slot="badge"]:visible')
      .filter({ hasText: /^In-play$/ }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("link", { name: "Complete draft" }).click();
  await expect(
    page.getByRole("checkbox", { name: "In-play", exact: true }),
  ).toBeChecked();
  await page.getByLabel("Sport", { exact: true }).selectOption("NBA");
  await page
    .getByLabel("Market type (optional)")
    .selectOption("Player rebounds");
  await page.getByLabel("Accepted total odds").fill("1.91");
  await page.getByLabel("Cash stake (£)", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Confirm bet", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: selection, exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator('[data-slot="badge"]:visible')
      .filter({ hasText: /^In-play$/ }),
  ).toBeVisible();
  const exported = await page.request.get("/api/export");
  const row = (await exported.text())
    .split("\n")
    .find((line) => line.includes(selection));
  expect(row).toContain("Boost; In-play");
  await page.getByRole("link", { name: "Edit bet", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "In-play", exact: true }),
  ).toBeChecked();
  await page.getByRole("checkbox", { name: "In-play", exact: true }).uncheck();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: selection, exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator('[data-slot="badge"]:visible')
      .filter({ hasText: /^In-play$/ }),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-slot="badge"]:visible').filter({ hasText: /^Boost$/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Edit bet", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "In-play", exact: true }),
  ).not.toBeChecked();
});

test("record, settle, correct, export and reconcile a manual bet", async ({
  page,
}) => {
  const name = `Manual flow ${crypto.randomUUID()}`;
  const sourceName = `Source ${crypto.randomUUID()}`;
  await page.goto("/settings");
  await page.getByLabel("New source name").fill(sourceName);
  await page
    .locator("form")
    .filter({ has: page.getByLabel("New source name") })
    .getByRole("button", { name: "Add", exact: true })
    .click();
  await expect(page.getByText("List updated.", { exact: true })).toBeVisible();
  await page.goto("/add");
  await expect(
    page.getByRole("heading", { name: "Add a bet", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Source", { exact: true })
    .selectOption({ label: sourceName });
  const sourceId = await page
    .getByLabel("Source", { exact: true })
    .inputValue();
  await page.getByLabel("Selection", { exact: true }).fill(name);
  await page.getByLabel("Accepted total odds").fill("3/2");
  await page.getByLabel("Cash stake (£)", { exact: true }).fill("10.00");
  await page.getByRole("button", { name: "Confirm bet", exact: true }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(page.getByLabel("Actual credited cash return (£)")).toHaveValue(
    "25.00",
  );
  await page.getByRole("button", { name: "Settle bet", exact: true }).click();
  await expect(page.getByText("Revision 1 · Won")).toBeVisible();
  await page.getByLabel("Actual credited cash return (£)").fill("20.00");
  await page
    .getByLabel("Correction reason")
    .fill("Return corrected after bookmaker adjustment");
  await page.getByRole("button", { name: "Save correction" }).click();
  await expect(page.getByText("Revision 2 · Won")).toBeVisible();
  await page.goto(`/?source=${sourceId}`);
  await expect(
    page.getByRole("heading", { name: "Your betting, at a glance" }),
  ).toBeVisible();
  await expect(page.getByText("£10.00", { exact: true }).first()).toBeVisible();
  await page.goto("/bets");
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export bets CSV" }).click();
  expect((await download).suggestedFilename()).toBe("bets.csv");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("incomplete drafts survive navigation and an acca void remains open", async ({
  page,
}) => {
  await page.goto("/add");
  const name = `Draft ${crypto.randomUUID()}`;
  await page.getByLabel("Selection", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Draft", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("link", { name: "Complete draft" }).click();
  await page.getByLabel("Bet type").selectOption("acca");
  await page.getByLabel("Accepted total odds").fill("5.00");
  await page.getByLabel("Cash stake (£)", { exact: true }).fill("5");
  for (const [index, selection] of ["First leg", "Second leg"].entries()) {
    await page.getByRole("button", { name: "Add leg", exact: true }).click();
    const leg = page.getByRole("group", { name: `Leg ${index + 1}` });
    await leg.getByLabel("Selection", { exact: true }).fill(selection);
    if (index === 0) await leg.getByLabel("Leg status").selectOption("void");
  }
  await page.getByRole("button", { name: "Confirm bet", exact: true }).click();
  await expect(page.getByText("Open", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole("list").getByText("Void", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Settle bet" })).toBeVisible();
});

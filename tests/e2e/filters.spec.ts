import { expect, test } from "@playwright/test";

test("filter disclosure supports the keyboard, preserves values and exports the selected history", async ({
  page,
}) => {
  await page.goto("/bets");
  await expect(page.getByLabel("Bookmaker", { exact: true })).toBeEnabled();
  const trigger = page.getByRole("button", { name: /Filter your ledger/ });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.getByLabel("From", { exact: true }).fill("2026-01-01");
  await page.getByLabel("To (inclusive)").fill("2026-12-31");
  await page.getByLabel("Status", { exact: true }).selectOption("draft");
  await trigger.click();
  await expect(
    page.getByRole("button", { name: "Apply filters" }),
  ).not.toBeVisible();
  await trigger.focus();
  await page.keyboard.press("Space");
  await expect(page.getByLabel("From", { exact: true })).toHaveValue(
    "2026-01-01",
  );
  await expect(page.getByLabel("Status", { exact: true })).toHaveValue("draft");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/status=draft/);
  await expect(
    page.getByRole("button", { name: /Filter your ledger/ }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByLabel("From", { exact: true })).toHaveValue(
    "2026-01-01",
  );
  const href = await page
    .getByRole("link", { name: "Export bets CSV" })
    .getAttribute("href");
  const response = await page.request.get(href ?? "");
  expect(response.ok()).toBe(true);
  const csv = await response.text();
  expect(csv).toContain("status");
  expect(csv).not.toContain('","settled","');
  expect(csv).not.toContain('","open","');
  await page.goto("/?status=draft");
  await expect(
    page.getByRole("button", { name: /Filter your ledger/ }),
  ).toContainText("Settlement dates");
  await expect(page.getByLabel("Status", { exact: true })).toHaveValue("draft");
});

test("market choices follow the unsent sport and keyboard selection submits canonical values", async ({
  page,
}) => {
  for (const route of ["/", "/bets"]) {
    await page.goto(route);
    await page.getByRole("button", { name: /Filter your ledger/ }).click();
    const bookmaker = page.getByLabel("Bookmaker", { exact: true });
    await bookmaker.click();
    await bookmaker.pressSequentially("sky");
    await expect(bookmaker).toHaveValue("sky");
    await page.getByRole("option", { name: "Sky Bet", exact: true }).click();
    const bookmakerId = await page
      .locator('input[name="bookmaker"]')
      .inputValue();
    expect(bookmakerId).toMatch(/^[0-9a-f-]{36}$/);
    await page.getByLabel("Sport", { exact: true }).selectOption("NFL");
    const market = page.getByLabel("Market type", { exact: true });
    await market.click();
    await market.pressSequentially("rebounds");
    await expect(market).toHaveValue("rebounds");
    await expect(
      page.getByRole("option", { name: "Player rebounds", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("No matches found.", { exact: true }),
    ).toBeVisible();
    await market.fill("receiving");
    await expect(
      page.getByRole("option", { name: "Player receiving yards", exact: true }),
    ).toBeVisible();
    await market.press("ArrowDown");
    await market.press("Enter");
    await expect(market).toHaveValue("Player receiving yards");
    await expect(page).toHaveURL(
      new RegExp(`${route === "/" ? "/" : "/bets"}$`),
    );
    await page.getByLabel("Sport", { exact: true }).selectOption("NBA");
    await expect(market).toHaveValue("All markets");
    await market.fill("rebounds");
    await page
      .getByRole("option", { name: "Player rebounds", exact: true })
      .click();
    await page.getByRole("button", { name: /Filter your ledger/ }).click();
    await page.getByRole("button", { name: /Filter your ledger/ }).click();
    await expect(market).toHaveValue("Player rebounds");
    await page.getByRole("button", { name: "Apply filters" }).click();
    await expect(page).toHaveURL(/sport=NBA/);
    expect(new URL(page.url()).searchParams.get("bookmaker")).toBe(bookmakerId);
    await expect(page).toHaveURL(/market=Player\+rebounds/);
    const source = page.getByLabel("Source", { exact: true });
    await expect(source).toBeEnabled();
    await source.focus();
    await expect(source).toBeFocused();
    await source.pressSequentially("Me");
    await expect(source).toHaveValue("Me");
    await source.press("Escape");
    await market.click();
    await market.pressSequentially("points");
    await expect(market).toHaveValue("points");
    await market.press("Escape");
    await expect(market).toHaveValue("Player rebounds");
  }
});

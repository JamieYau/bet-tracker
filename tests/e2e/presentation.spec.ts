import { expect, test } from "@playwright/test";

test("saving keeps button dimensions and history rows remain links", async ({
  page,
}) => {
  const name = `Presentation ${crypto.randomUUID()}`;
  await page.goto("/add");
  await page.getByLabel("Selection", { exact: true }).fill(name);
  const save = page.getByRole("button", { name: "Save draft", exact: true });
  const before = await save.boundingBox();
  let resume: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    resume = resolve;
  });
  await page.route("**/add", async (route) => {
    if (route.request().method() === "POST") await gate;
    await route.continue();
  });
  try {
    await save.click();
    const busy = page.locator('button[name="intent"][value="draft"]');
    await expect(busy).toHaveAttribute("aria-busy", "true");
    await expect(busy).toBeDisabled();
    await expect(busy.locator('[data-slot="spinner"]')).toBeVisible();
    const during = await busy.boundingBox();
    expect(during?.width).toBe(before?.width);
    expect(during?.height).toBe(before?.height);
  } finally {
    resume();
  }
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  const detailUrl = page.url();
  await page.goto("/bets");
  const row = page.getByRole("link").filter({ hasText: name });
  await expect(row).toHaveCount(1);
  await expect(row.locator("a")).toHaveCount(0);
  await row.click();
  await expect(page).toHaveURL(detailUrl);
  const sport = `No matches ${crypto.randomUUID()}`;
  await page.goto(`/bets?sport=${encodeURIComponent(sport)}`);
  await expect(
    page.getByText("No matching bets", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No bets recorded yet", { exact: true }),
  ).toHaveCount(0);
  await page.goto(`/?sport=${encodeURIComponent(sport)}`);
  await expect(
    page.getByText("No settlements in this period", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No monthly results", { exact: true }),
  ).toBeVisible();
});

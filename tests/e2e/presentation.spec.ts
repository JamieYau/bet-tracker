import { expect, test } from "@playwright/test";

test("saving keeps button dimensions and history rows remain links", async ({
  page,
}) => {
  const name = `Presentation ${crypto.randomUUID()}`;
  await page.goto("/add");
  await page.getByLabel("Selection", { exact: true }).fill(name);
  await page.getByLabel("Accepted total odds").fill("2");
  await page.getByLabel("Cash stake (£)", { exact: true }).fill("10");
  await expect(
    page.getByRole("button", { name: "Save draft", exact: true }),
  ).toHaveCount(0);
  const save = page.getByRole("button", { name: "Confirm bet", exact: true });
  // Measure the text itself: a blank icon slot can centre the group but offset the label.
  for (const label of ["Confirm bet"]) {
    const offset = await page
      .getByRole("button", { name: label, exact: true })
      .evaluate((button) => {
        const idle = button.querySelector(".inline-grid")?.firstElementChild;
        if (!idle?.lastChild) throw new Error("Missing idle button label");
        const range = document.createRange();
        range.selectNodeContents(idle.lastChild);
        const text = range.getBoundingClientRect();
        const bounds = button.getBoundingClientRect();
        return Math.abs(text.x + text.width / 2 - bounds.x - bounds.width / 2);
      });
    expect(offset).toBeLessThan(1);
  }
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
    const busy = page.locator('button[name="intent"][value="confirm"]');
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

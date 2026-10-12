import { expect, test } from "@playwright/test";

test("filter disclosure supports the keyboard, preserves values and exports the selected history", async ({
  page,
}) => {
  await page.goto("/bets");
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
  expect(csv).not.toContain(",settled,");
  expect(csv).not.toContain(",open,");
  await page.goto("/?status=draft");
  await expect(
    page.getByRole("button", { name: /Filter your ledger/ }),
  ).toContainText("Settlement dates");
  await expect(page.getByLabel("Status", { exact: true })).toHaveValue("draft");
});

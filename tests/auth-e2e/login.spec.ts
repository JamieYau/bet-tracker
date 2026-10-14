import { expect, test } from "@playwright/test";
import { verifyBetEditDelete } from "../helpers/bet-edit-delete";
import { verifyUnits } from "../helpers/units";

test("private password login, recording, settlement, CSV, session persistence and logout", async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(
    (
      await page.request.post("/api/auth/sign-up/email", {
        data: {
          email: "other@example.test",
          password: "fixture-password-123",
          name: "Other",
        },
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await page.request.post("/api/auth/admin/create-user", { data: {} })
    ).status(),
  ).toBe(404);
  await page.getByLabel("Your email").fill("owner@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fixture-browser-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your betting, at a glance" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(
    page.getByRole("heading", { name: "Your betting, at a glance" }),
  ).toBeVisible();
  const fresh = await context.newPage();
  await fresh.goto("/settings");
  await expect(fresh).not.toHaveURL(/login/);
  await expect(fresh.locator("html")).toHaveClass(/dark/);
  await fresh.close();
  await page.goto("/add");
  await page.getByLabel("Selection").fill("Authenticated browser fixture");
  await page.getByLabel("Sport", { exact: true }).selectOption("NBA");
  await page.getByLabel("Market type (optional)").fill("rebounds");
  await page
    .getByRole("option", { name: "Player rebounds", exact: true })
    .click();
  await page
    .getByLabel("Event / fixture (optional)")
    .fill("Fixture Cavaliers @ Heat");
  await page.getByLabel("Over / Under (optional)").selectOption("over");
  await page.getByLabel("Line / handicap (optional)").fill("9.5");

  await page.getByLabel("Accepted total odds").fill("2.5");
  await page.getByLabel("Cash stake (£)").fill("10");
  await page.getByRole("button", { name: "Confirm bet", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Authenticated browser fixture" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Settle bet", exact: true }).click();
  await expect(page.getByText("£15.00", { exact: true }).first()).toBeVisible();
  const exported = await page.request.get("/api/export");
  expect(exported.status()).toBe(200);
  const csv = await exported.text();
  expect(csv).toContain("Authenticated browser fixture");
  expect(csv).toContain('"Fixture Cavaliers @ Heat","over","9.5"');
  await verifyBetEditDelete(page);
  await verifyUnits(page);
  await page.goto("/settings");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.goto("/bets");
  await expect(page).toHaveURL(/\/login$/);
});

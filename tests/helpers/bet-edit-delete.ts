import { expect, type Page } from "@playwright/test";

export async function verifyBetEditDelete(page: Page) {
  const name = `Editable ${crypto.randomUUID()}`;
  const source = `Edit source ${crypto.randomUUID()}`;
  await page.goto("/settings");
  await page.getByLabel("New source name").fill(source);
  await page
    .locator("form")
    .filter({ has: page.getByLabel("New source name") })
    .getByRole("button", { name: "Add", exact: true })
    .click();
  await expect(page.getByText("List updated.", { exact: true })).toBeVisible();
  await page.goto("/add");
  await page.getByLabel("Source", { exact: true }).fill(source);
  await page.getByRole("option", { name: source, exact: true }).click();
  const sourceId = await page.locator('input[name="sourceId"]').inputValue();
  await page.getByLabel("Selection", { exact: true }).fill(name);
  await page.getByLabel("Accepted total odds").fill("2.5");
  await page.getByLabel("Cash stake (£)", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Confirm bet", exact: true }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  const detail = new URL(page.url()).pathname;
  await page.getByRole("button", { name: "Settle bet", exact: true }).click();
  await expect(
    page.getByText("Revision 1 · Won", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Actual credited cash return (£)").fill("20");
  await page
    .getByLabel("Correction reason")
    .fill("Bookmaker return adjustment");
  await page
    .getByRole("button", { name: "Save correction", exact: true })
    .click();
  await expect(
    page.getByText("Revision 2 · Won", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Edit bet", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Save draft", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Selection", { exact: true }).fill(`${name} corrected`);
  await page.getByLabel("Cash stake (£)", { exact: true }).fill("15");
  await page.getByLabel("Accepted total odds").fill("3");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: `${name} corrected`, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Revision 1 · Won", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Revision 2 · Won", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Actual credited cash return (£)")).toHaveValue(
    "20.00",
  );
  await expect(page.getByText("£5.00", { exact: true })).toBeVisible();
  await page.goto(`/?source=${sourceId}`);
  await expect(page.getByText("£5.00", { exact: true }).first()).toBeVisible();
  let csv = await (
    await page.request.get(`/api/export?source=${sourceId}`)
  ).text();
  expect(csv).toContain('"1500","0","false","single","won"');
  expect(csv).toContain('"2000","500"');
  await page.goto(detail);
  await page.getByRole("button", { name: "Delete bet", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Move to Trash", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Delete bet", exact: true }).click();
  await page
    .getByRole("button", { name: "Move to Trash", exact: true })
    .click();
  await expect(page).toHaveURL(/\/bets\/trash$/);
  await expect(
    page.getByRole("link").filter({ hasText: `${name} corrected` }),
  ).toBeVisible();
  await page.goto(`/?source=${sourceId}`);
  await expect(page.getByText("£0.00", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText(`${name} corrected`, { exact: true }),
  ).toHaveCount(0);
  for (const kind of ["bets", "legs"]) {
    csv = await (
      await page.request.get(`/api/export?source=${sourceId}&kind=${kind}`)
    ).text();
    expect(csv).not.toContain(name);
  }
  await page.goto(`/bets?source=${sourceId}`);
  await expect(
    page.getByText(`${name} corrected`, { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Trash", exact: true }).click();
  await page
    .getByRole("link")
    .filter({ hasText: `${name} corrected` })
    .click();
  await expect(
    page.getByRole("link", { name: "Edit bet", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Save correction", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Revision 2 · Won", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Restore bet", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${detail}$`));
  await expect(
    page.getByRole("link", { name: "Edit bet", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Actual credited cash return (£)")).toHaveValue(
    "20.00",
  );
  await page.goto(`/?source=${sourceId}`);
  await expect(page.getByText("£5.00", { exact: true }).first()).toBeVisible();
  await page.goto(detail);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
}

import { expect, type Page } from "@playwright/test";

export async function verifyEditStakes(page: Page) {
  const main = page.locator("main:visible");
  const name = `Stake editor ${crypto.randomUUID()}`;
  await page.goto("/settings");
  await expect(main.getByLabel("Unit size (£)")).toBeEnabled();
  const previousSize = await main.getByLabel("Unit size (£)").inputValue();
  const previousMode = await main.getByLabel("Preferred display").inputValue();
  await main.getByLabel("Unit size (£)").fill("50");
  await main.getByLabel("Preferred display").selectOption("gbp");
  await main
    .getByRole("button", { name: "Save unit settings", exact: true })
    .click();
  await expect(main.getByRole("status")).toContainText("Unit settings saved");
  try {
    const records: {
      label: string;
      path: string;
      cash: string;
      free: string;
    }[] = [];
    for (const [label, cash, free] of [
      [`${name} mixed`, "50", "50"],
      [`${name} cash`, "125", "0"],
    ]) {
      await page.goto("/add");
      await expect(
        main.getByLabel("Cash stake (£)", { exact: true }),
      ).toBeEnabled();
      await main.getByLabel("Selection", { exact: true }).fill(label);
      await main.getByLabel("Accepted total odds").fill("2");
      await main.getByLabel("Cash stake (£)", { exact: true }).fill(cash);
      await main.getByLabel("Free-bet stake (£)", { exact: true }).fill(free);
      await main
        .getByRole("button", { name: "Confirm bet", exact: true })
        .click();
      await expect(
        main.getByRole("heading", { name: label, exact: true }),
      ).toBeVisible();
      records.push({ label, path: new URL(page.url()).pathname, cash, free });
    }
    for (const record of [...records, records[0], records[1]]) {
      await page.getByRole("link", { name: "Bets", exact: true }).click();
      await main.locator(`a[href="${record.path}"]`).click();
      await main.getByRole("link", { name: "Edit bet", exact: true }).click();
      await expect(
        main.getByLabel("Cash stake (£)", { exact: true }),
      ).toHaveValue(record.cash);
      await expect(
        main.getByLabel("Free-bet stake (£)", { exact: true }),
      ).toHaveValue(record.free);
    }
    // Leave unsubmitted values, then explicitly open Edit again.
    await main.getByLabel("Cash stake (£)", { exact: true }).fill("50");
    await main.getByLabel("Free-bet stake (£)", { exact: true }).fill("50");
    await page.getByRole("link", { name: "Bets", exact: true }).click();
    await main.locator(`a[href="${records[1].path}"]`).click();
    await main.getByRole("link", { name: "Edit bet", exact: true }).click();
    await expect(
      main.getByLabel("Cash stake (£)", { exact: true }),
    ).toHaveValue("125");
    await expect(
      main.getByLabel("Free-bet stake (£)", { exact: true }),
    ).toHaveValue("0");
  } finally {
    await page.goto("/settings");
    await expect(main.getByLabel("Unit size (£)")).toBeEnabled();
    await main.getByLabel("Unit size (£)").fill(previousSize);
    await main.getByLabel("Preferred display").selectOption(previousMode);
    await main
      .getByRole("button", { name: "Save unit settings", exact: true })
      .click();
    await expect(main.getByRole("status")).toContainText("Unit settings saved");
  }
}

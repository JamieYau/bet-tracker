import { expect, test } from "@playwright/test";

for (const returned of [false, true]) {
  test(`free-bet stake returned ${returned}, early payout and correction`, async ({
    page,
  }) => {
    const name = `Funding ${crypto.randomUUID()}`;
    await page.goto("/add");
    await page.getByLabel("Selection", { exact: true }).fill(name);
    await page.getByLabel("Accepted total odds").fill("3");
    await page.getByLabel("Cash stake (£)", { exact: true }).fill("5");
    await page.getByLabel("Free-bet stake (£)", { exact: true }).fill("10");
    const returnedCheckbox = page.getByRole("checkbox", {
      name: "Free-bet stake is returned with winnings",
    });
    await expect(returnedCheckbox).not.toBeChecked();
    if (returned) {
      await page
        .getByText("Free-bet stake is returned with winnings", { exact: true })
        .click();
      await expect(returnedCheckbox).toBeChecked();
    }
    await page
      .getByRole("button", { name: "Confirm bet", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Actual credited cash return (£)"),
    ).toHaveValue(returned ? "45.00" : "35.00");
    const early = page.getByRole("checkbox", {
      name: "Early payout",
      exact: true,
    });
    await early.focus();
    await page.keyboard.press("Space");
    await expect(early).toBeChecked();
    await page.getByRole("button", { name: "Settle bet", exact: true }).click();
    await expect(page.getByText("Revision 1 · Won")).toBeVisible();
    await expect(
      page.getByRole("checkbox", { name: "Early payout", exact: true }),
    ).toBeChecked();
    await page.reload();
    await expect(
      page.getByRole("checkbox", { name: "Early payout", exact: true }),
    ).toBeChecked();
    await page.getByLabel("Outcome", { exact: true }).selectOption("lost");
    await expect(
      page.getByRole("checkbox", { name: "Early payout", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("checkbox", { name: "Early payout", exact: true }),
    ).not.toBeChecked();
    await expect(
      page.getByLabel("Actual credited cash return (£)"),
    ).toHaveValue("0.00");
    await page
      .getByLabel("Correction reason")
      .fill("Correcting test settlement");
    await page.getByRole("button", { name: "Save correction" }).click();
    await expect(page.getByText("Revision 2 · Lost")).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("checkbox", { name: "Early payout", exact: true }),
    ).not.toBeChecked();
  });
}

test("field errors are associated and duplicate override submits correctly", async ({
  page,
}) => {
  const name = `Duplicate ${crypto.randomUUID()}`;
  const reference = crypto.randomUUID();
  await page.goto("/add");
  await page.getByRole("button", { name: "Confirm bet", exact: true }).click();
  const selection = page.getByLabel("Selection", { exact: true });
  await expect(selection).toHaveAttribute("aria-invalid", "true");
  await expect(selection).toHaveAttribute(
    "aria-describedby",
    "selection-error",
  );
  await expect(page.locator("#selection-error")).toHaveText(
    "Add a selection or acca name.",
  );
  await expect(page.getByLabel("Accepted total odds")).toHaveAttribute(
    "aria-describedby",
    "acceptedOdds-hint acceptedOdds-error",
  );
  await selection.fill(name);
  await page.getByLabel("Accepted total odds").fill("2");
  await page.getByLabel("Cash stake (£)", { exact: true }).fill("5");
  await page.getByLabel("Bookmaker reference").fill(reference);
  await page.getByRole("button", { name: "Confirm bet", exact: true }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  const firstUrl = page.url();
  await page.goto("/add");
  await page.getByLabel("Selection", { exact: true }).fill(`${name} second`);
  await page.getByLabel("Accepted total odds").fill("2");
  await page.getByLabel("Cash stake (£)", { exact: true }).fill("5");
  await page.getByLabel("Bookmaker reference").fill(reference);
  await page.getByRole("button", { name: "Confirm bet", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Duplicate reference" }),
  ).toBeVisible();
  await expect(page.getByLabel("Selection", { exact: true })).toHaveValue(
    `${name} second`,
  );
  await page
    .getByText("Record despite duplicate warning", { exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", { name: "Record despite duplicate warning" }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Confirm bet", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: `${name} second`, exact: true }),
  ).toBeVisible();
  expect(page.url()).not.toBe(firstUrl);
});

test("settings checkboxes persist active and archived sources", async ({
  page,
}) => {
  const name = `Archived ${crypto.randomUUID()}`;
  await page.goto("/settings");
  const me = page
    .locator("form")
    .filter({ has: page.getByLabel("Name for Me", { exact: true }) });
  await expect(
    me.getByRole("checkbox", { name: "Active", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("New source name").fill(name);
  const add = page
    .locator("form")
    .filter({ has: page.getByLabel("New source name") });
  await add.getByRole("button", { name: "Add", exact: true }).click();
  await expect(
    page.getByLabel(`Name for ${name}`, { exact: true }),
  ).toBeVisible();
  const row = page
    .locator("form")
    .filter({ has: page.getByLabel(`Name for ${name}`, { exact: true }) });
  await expect(
    row.getByRole("checkbox", { name: "Active", exact: true }),
  ).toBeChecked();
  await row.getByRole("checkbox", { name: "Active", exact: true }).uncheck();
  await row.getByRole("button", { name: "Save", exact: true }).click();
  await expect(row.getByRole("status")).toHaveText("List updated.");
  await page.reload();
  await expect(
    row.getByRole("checkbox", { name: "Active", exact: true }),
  ).not.toBeChecked();
  await page.goto("/add");
  await expect(
    page
      .getByLabel("Source", { exact: true })
      .locator("option")
      .filter({ hasText: name }),
  ).toHaveCount(0);
  await page.goto("/settings");
  await row.getByRole("checkbox", { name: "Active", exact: true }).check();
  await row.getByRole("button", { name: "Save", exact: true }).click();
  await expect(row.getByRole("status")).toHaveText("List updated.");
  const viewport = page.viewportSize();
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  if (viewport) await page.setViewportSize(viewport);
  await page.goto("/add");
  await page
    .getByLabel("Source", { exact: true })
    .selectOption({ label: name });
});

test("settings wait for hydration before accepting editable values", async ({
  page,
}) => {
  let resume: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    resume = resolve;
  });
  await page.route(/\/_next\/static\/.*\.js(?:\?|$)/, async (route) => {
    await gate;
    await route.continue();
  });
  const name = `Hydration ${crypto.randomUUID()}`;
  try {
    await page.goto("/settings", { waitUntil: "commit" });
    const input = page.getByLabel("New source name");
    await expect(input).toBeVisible();
    await expect(input).toBeDisabled();
    const form = page.locator("form").filter({ has: input });
    await expect(
      form.getByRole("checkbox", { name: "Active", exact: true }),
    ).toBeDisabled();
    await expect(
      form.getByRole("button", { name: "Add", exact: true }),
    ).toBeDisabled();
  } finally {
    resume();
  }
  await expect(page.getByLabel("New source name")).toBeEnabled();
  await page.getByLabel("New source name").fill(name);
  await page
    .locator("form")
    .filter({ has: page.getByLabel("New source name") })
    .getByRole("button", { name: "Add", exact: true })
    .click();
  await expect(
    page.getByLabel(`Name for ${name}`, { exact: true }),
  ).toBeVisible();
});

import { expect, test } from "@playwright/test";

test("player props retain structured fields through drafts, edits, filters and CSV", async ({
  page,
}) => {
  const event = `Cavaliers @ Heat · fixture ${crypto.randomUUID()}`;
  await page.goto("/add");
  await page.setViewportSize({ width: 320, height: 850 });
  await page.getByLabel("Sport", { exact: true }).selectOption("NBA");
  await page
    .getByLabel("Market type (optional)")
    .selectOption("Player rebounds");
  await page.getByLabel("Selection", { exact: true }).fill("Jarrett Allen");
  await page.getByLabel("Event / fixture (optional)").fill(event);
  await page.getByLabel("Over / Under (optional)").selectOption("over");
  await page.getByLabel("Line / handicap (optional)").fill("+9.500000");
  await page.getByRole("checkbox", { name: "In-play", exact: true }).check();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Jarrett Allen · Over 9.5",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("link", { name: "Complete draft" }).click();
  await expect(page.getByLabel("Sport", { exact: true })).toHaveValue("NBA");
  await expect(page.getByLabel("Event / fixture (optional)")).toHaveValue(
    event,
  );
  await expect(page.getByLabel("Over / Under (optional)")).toHaveValue("over");
  await expect(page.getByLabel("Line / handicap (optional)")).toHaveValue(
    "9.5",
  );
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    ),
  ).toBe(false);
  await page.getByLabel("Accepted total odds").fill("1.91");
  await page.getByLabel("Cash stake (£)", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Confirm bet", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Edit bet", exact: true }),
  ).toBeVisible();
  const url = page.url();
  const csv = await (await page.request.get("/api/export")).text();
  expect(csv.split("\n").find((row) => row.includes(event))).toContain(
    `"${event}","over","9.5"`,
  );
  await page.getByRole("link", { name: "Edit bet", exact: true }).click();
  await page.getByLabel("Line / handicap (optional)").fill("bad line");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByText("Enter a numeric line, e.g. 9.5 or -3.5.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Line / handicap (optional)").fill("10.5");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Jarrett Allen · Over 10.5",
      exact: true,
    }),
  ).toBeVisible();
  const query = new URLSearchParams({
    sport: "nba",
    market: "player rebounds",
    event: event.toLowerCase(),
    direction: "over",
    line: "10.5",
    inPlay: "yes",
  });
  await page.goto(`/bets?${query}`);
  await expect(
    page.getByRole("link").filter({ hasText: "Jarrett Allen · Over 10.5" }),
  ).toBeVisible();
  const filtered = await (
    await page.request.get(`/api/export?${query}`)
  ).text();
  expect(filtered).toContain(event);
  query.set("inPlay", "no");
  await page.goto(`/bets?${query}`);
  await expect(
    page
      .locator('[data-slot="empty-title"]:visible')
      .filter({ hasText: "No matching bets" }),
  ).toBeVisible();
  await page.goto(url);
  await page.getByRole("link", { name: "Edit bet", exact: true }).click();
  await expect(page.getByLabel("Line / handicap (optional)")).toHaveValue(
    "10.5",
  );
});

test("mixed acca legs keep their fixtures and custom markets and filters match the same leg", async ({
  page,
}) => {
  const name = `Structured acca ${crypto.randomUUID()}`;
  const fixture = `Cavaliers @ Heat · ${crypto.randomUUID()}`;
  await page.goto("/add");
  await page.getByLabel("Bet type").selectOption("acca");
  await page.getByLabel("Acca name").fill(name);
  for (let index = 1; index <= 2; index++) {
    await page.getByRole("button", { name: "Add leg", exact: true }).click();
    const leg = page.getByRole("group", { name: `Leg ${index}` });
    await leg
      .getByLabel("Sport", { exact: true })
      .selectOption(index === 1 ? "NBA" : "NFL");
    await leg
      .getByLabel("Selection", { exact: true })
      .fill(index === 1 ? "Jarrett Allen" : "Lions");
    await leg
      .getByLabel("Market type (optional)")
      .selectOption(index === 1 ? "Player rebounds" : "__custom");
    if (index === 2)
      await leg.getByLabel("Custom market").fill("Special team handicap");
    await leg
      .getByLabel("Event / fixture (optional)")
      .fill(index === 1 ? fixture : "Lions @ Bears");
    await leg
      .getByLabel("Over / Under (optional)")
      .selectOption(index === 1 ? "over" : "");
    await leg
      .getByLabel("Line / handicap (optional)")
      .fill(index === 1 ? "9.5" : "-3.5");
    await leg.getByLabel("Leg odds (optional)").fill("1.9");
  }
  await page.getByLabel("Accepted total odds").fill("4");
  await page.getByLabel("Cash stake (£)", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Confirm bet", exact: true }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(page.getByText("Mixed", { exact: true })).toBeVisible();
  const url = page.url();
  await page.getByRole("link", { name: "Edit bet", exact: true }).click();
  const second = page.getByRole("group", { name: "Leg 2" });
  await expect(second.getByLabel("Custom market")).toHaveValue(
    "Special team handicap",
  );
  await expect(second.getByLabel("Line / handicap (optional)")).toHaveValue(
    "-3.5",
  );
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  const query = new URLSearchParams({
    sport: "NFL",
    market: "Player rebounds",
    event: fixture,
  });
  await page.goto(`/bets?${query}`);
  await expect(
    page
      .locator('[data-slot="empty-title"]:visible')
      .filter({ hasText: "No matching bets" }),
  ).toBeVisible();
  query.set("sport", "NBA");
  await page.goto(`/bets?${query}`);
  await expect(page.getByRole("link").filter({ hasText: name })).toBeVisible();
  const csv = await (await page.request.get("/api/export?kind=legs")).text();
  expect(csv).toContain(`"${fixture}","over","9.5"`);
  expect(csv).toContain('"Lions @ Bears","","-3.5"');
  await page.goto(url);
  await page.getByRole("button", { name: "Settle bet", exact: true }).click();
  await expect(page.getByText("Revision 1 · Won")).toBeVisible();
  await page.goto(`/?${query}`);
  await expect(page.locator("figcaption:visible")).toContainText(
    "£30.00 across 1 settled bet",
  );
});

import { test } from "@playwright/test";
import { verifyUnits } from "../helpers/units";

test("unit settings preserve historical stakes, delayed settlements, corrections and cash totals", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await verifyUnits(page);
});

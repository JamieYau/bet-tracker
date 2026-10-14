import { test } from "@playwright/test";
import { verifyEditStakes } from "../helpers/edit-stakes";

test("editing loads saved cash/free stakes when moving between bets and reopening an editor", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await verifyEditStakes(page);
});

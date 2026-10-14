import { test } from "@playwright/test";
import { verifyBetEditDelete } from "../helpers/bet-edit-delete";

test("edit a settled bet, delete it and restore its history and totals", async ({
  page,
}) => {
  await verifyBetEditDelete(page);
});

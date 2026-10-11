import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Ledger } from "@/features/bets/types";
import { BOOKMAKERS } from "@/features/bets/types";
import { isDemo } from "./config";

const file = path.join(
  process.cwd(),
  ".local/ledger-data",
  process.env.BET_TRACKER_DEMO_FILE ?? "demo.json",
);
let queue: Promise<unknown> = Promise.resolve();
async function read(): Promise<Ledger> {
  if (!isDemo()) throw new Error("Demo storage is disabled.");
  try {
    return JSON.parse(await readFile(file, "utf8")) as Ledger;
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      error.code !== "ENOENT"
    )
      throw error;
    return {
      bets: [],
      bookmakers: BOOKMAKERS.map((name, i) => ({
        id: `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
        name,
        active: true,
      })),
      sources: [
        {
          id: "20000000-0000-4000-8000-000000000001",
          name: "Me",
          active: true,
        },
      ],
    };
  }
}
export async function demoRead() {
  await queue;
  return read();
}
export async function demoMutate<T>(
  operation: (ledger: Ledger) => T,
): Promise<T> {
  const task = queue.then(async () => {
    const ledger = await read();
    const result = operation(ledger);
    await mkdir(path.dirname(file), { recursive: true });
    const temporary = `${file}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(ledger), { mode: 0o600 });
    await rename(temporary, file);
    return result;
  });
  queue = task.catch(() => undefined);
  return task;
}

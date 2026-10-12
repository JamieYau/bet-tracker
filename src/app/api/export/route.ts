import type { NextRequest } from "next/server";
import { readFilters } from "@/features/analytics/filter-schema";
import { history } from "@/features/analytics/metrics";
import { exportCsv } from "@/features/bets/export";
import { getLedger } from "@/features/bets/repository";
export async function GET(request: NextRequest) {
  const ledger = await getLedger();
  const filters = readFilters(Object.fromEntries(request.nextUrl.searchParams));
  const kind =
    request.nextUrl.searchParams.get("kind") === "legs" ? "legs" : "bets";
  return new Response(exportCsv(history(ledger.bets, filters), ledger, kind), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${kind}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}

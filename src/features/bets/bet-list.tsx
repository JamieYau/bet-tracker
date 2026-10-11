import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cashProfit, currentSettlement } from "@/features/settlement/finance";
import { dateTime, money, outcomeLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Bet, Ledger } from "./types";
export function BetList({ bets, ledger }: { bets: Bet[]; ledger: Ledger }) {
  if (!bets.length)
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="font-medium">No bets here yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Record your first bet or adjust the filters.
        </p>
        <Link
          href="/add"
          className="mt-4 inline-block text-sm font-medium text-primary underline"
        >
          Add a bet
        </Link>
      </div>
    );
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {bets.map((bet) => {
        const settlement = currentSettlement(bet),
          profit = cashProfit(bet);
        return (
          <Link
            key={bet.id}
            href={`/bets/${bet.id}`}
            className="flex min-h-24 items-center justify-between gap-4 border-b px-4 py-4 last:border-b-0 hover:bg-muted/50 sm:px-6"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold sm:text-base">
                  {bet.selection || "Untitled draft"}
                </p>
                <Badge variant="secondary">
                  {outcomeLabel(settlement?.outcome ?? bet.status)}
                </Badge>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {
                  ledger.bookmakers.find(
                    (option) => option.id === bet.bookmakerId,
                  )?.name
                }{" "}
                ·{" "}
                {
                  ledger.sources.find((option) => option.id === bet.sourceId)
                    ?.name
                }{" "}
                ·{" "}
                {bet.betType === "acca"
                  ? `${bet.legs.length}-leg acca`
                  : bet.sport}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {dateTime(bet.placedAt)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="text-right">
                <p
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    profit !== null &&
                      (profit >= 0 ? "text-primary" : "text-destructive"),
                  )}
                >
                  {profit === null ? money(bet.cashStakePence) : money(profit)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {profit === null ? "cash stake" : "cash P/L"}
                </p>
              </div>
              <ArrowUpRight className="hidden size-4 text-muted-foreground sm:block" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

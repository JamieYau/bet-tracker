import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { cashProfit, currentSettlement } from "@/features/settlement/finance";
import { dateTime, money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { selectionLabel } from "./catalog";
import { StatusBadge } from "./status-badge";
import type { Bet, Ledger } from "./types";
export function BetList({ bets, ledger }: { bets: Bet[]; ledger: Ledger }) {
  if (!bets.length)
    return (
      <Empty className="border bg-card py-10">
        <EmptyHeader>
          <EmptyTitle>
            {ledger.bets.length ? "No matching bets" : "No bets recorded yet"}
          </EmptyTitle>
          <EmptyDescription>
            {ledger.bets.length
              ? "Adjust the filters to see more of your ledger."
              : "Record your first bet to start your ledger."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link
            href="/add"
            className={cn(buttonVariants({ variant: "outline" }), "h-11")}
          >
            Add a bet
          </Link>
        </EmptyContent>
      </Empty>
    );
  return (
    <ItemGroup className="gap-0 divide-y overflow-hidden rounded-xl border bg-card">
      {bets.map((bet) => {
        const settlement = currentSettlement(bet),
          profit = cashProfit(bet);
        return (
          <li key={bet.id}>
            <Item
              render={<Link href={`/bets/${bet.id}`} />}
              className="min-h-24 flex-nowrap rounded-none border-0 px-4 py-4 sm:px-6 focus-visible:ring-inset"
            >
              <ItemContent className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <ItemTitle className="min-w-0 font-semibold sm:text-base">
                    <span className="truncate">
                      {selectionLabel(bet) || "Untitled draft"}
                    </span>
                  </ItemTitle>
                  <StatusBadge status={settlement?.outcome ?? bet.status} />
                </div>
                <ItemDescription className="truncate text-xs">
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
                </ItemDescription>
                {bet.event && (
                  <ItemDescription className="truncate text-xs">
                    {bet.event}
                  </ItemDescription>
                )}
                <ItemDescription className="text-xs">
                  {dateTime(bet.placedAt)}
                </ItemDescription>
              </ItemContent>
              <ItemActions className="shrink-0 gap-3">
                <div className="text-right">
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      profit !== null &&
                        (profit >= 0
                          ? "text-profit-positive"
                          : "text-destructive"),
                    )}
                  >
                    {profit === null
                      ? money(bet.cashStakePence)
                      : money(profit)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {profit === null ? "cash stake" : "cash P/L"}
                  </p>
                </div>
                <ArrowUpRight
                  aria-hidden="true"
                  className="hidden size-4 text-muted-foreground sm:block"
                />
              </ItemActions>
            </Item>
          </li>
        );
      })}
    </ItemGroup>
  );
}

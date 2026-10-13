import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { selectionLabel } from "@/features/bets/catalog";
import { getLedger } from "@/features/bets/repository";
import { cashProfit, currentSettlement } from "@/features/settlement/finance";
import { SettlementForm } from "@/features/settlement/settlement-form";
import { dateTime, formatOdds, money, outcomeLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
export default async function BetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ledger = await getLedger();
  const bet = ledger.bets.find((bet) => bet.id === id);
  if (!bet) notFound();
  const current = currentSettlement(bet);
  const profit = cashProfit(bet);
  const details = [
    [
      "Bookmaker",
      ledger.bookmakers.find((option) => option.id === bet.bookmakerId)?.name,
    ],
    [
      "Source",
      ledger.sources.find((option) => option.id === bet.sourceId)?.name,
    ],
    ["Placed", dateTime(bet.placedAt)],
    ["Sport", bet.sport || "—"],
    ["Event / fixture", bet.event || "—"],
    ["Market type", bet.market || "—"],
    ["Accepted odds", formatOdds(bet.acceptedOdds)],
    ["Cash stake", money(bet.cashStakePence)],
    [
      "Free-bet stake",
      `${money(bet.freeStakePence)}${bet.freeStakeReturned ? " · stake returned" : " · stake not returned"}`,
    ],
    ["Reference", bet.reference || "—"],
  ];
  return (
    <div className="space-y-5">
      <Link
        href="/bets"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← All bets
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeading
          eyebrow={bet.betType}
          title={selectionLabel(bet) || "Untitled draft"}
          description={bet.market || "Recorded terms and financial settlement."}
        />
        <Badge variant="secondary">
          {outcomeLabel(current?.outcome ?? bet.status)}
        </Badge>
      </div>
      <Card>
        <CardContent className="pt-6">
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 break-words text-sm font-medium">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          {bet.notes && (
            <p className="mt-6 whitespace-pre-wrap text-sm text-muted-foreground">
              {bet.notes}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {bet.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
            {current?.earlyPayout && <Badge>Early payout</Badge>}
          </div>
          {bet.status !== "settled" && (
            <Link
              href={`/bets/${id}/edit`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-5 h-11",
              )}
            >
              {bet.status === "draft" ? "Complete draft" : "Edit bet"}
            </Link>
          )}
        </CardContent>
      </Card>
      {bet.betType === "acca" && (
        <Card>
          <CardHeader>
            <CardTitle>Acca legs</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {bet.legs.map((leg, index) => (
                <li key={leg.id}>
                  <Item className="items-start border-0 px-0 py-3">
                    <ItemContent className="min-w-0">
                      <ItemTitle className="line-clamp-none break-words">
                        {index + 1}. {selectionLabel(leg)}
                      </ItemTitle>
                      <ItemDescription className="line-clamp-none break-words text-xs">
                        {leg.sport} · {leg.market || "No market"}
                        {leg.event ? ` · ${leg.event}` : ""}
                        {leg.odds ? ` · ${formatOdds(leg.odds)}` : ""}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Badge variant="outline">
                        {outcomeLabel(leg.status)}
                      </Badge>
                    </ItemActions>
                  </Item>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              A voided leg does not settle the whole acca. Use actual credited
              return if terms change.
            </p>
          </CardContent>
        </Card>
      )}
      {current && (
        <Card>
          <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Credited return</p>
              <p className="mt-1 text-2xl font-semibold">
                {money(current.returnPence)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cash P/L</p>
              <p
                className={cn(
                  "mt-1 text-2xl font-semibold",
                  (profit ?? 0) >= 0 ? "text-primary" : "text-destructive",
                )}
              >
                {money(profit ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Settled</p>
              <p className="mt-1 text-sm">{dateTime(current.settledAt)}</p>
            </div>
          </CardContent>
        </Card>
      )}
      {bet.status !== "draft" && (
        <Card>
          <CardHeader>
            <CardTitle>
              {current ? "Correct settlement" : "Settle this bet"}
            </CardTitle>
            {current && (
              <CardDescription className="text-sm text-muted-foreground">
                Corrections replace the effective settlement and preserve
                history. Recorded stakes are locked.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <SettlementForm
              key={bet.version}
              bet={bet}
              requestKey={randomUUID()}
              now={new Date().toISOString()}
            />
          </CardContent>
        </Card>
      )}
      {bet.settlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Settlement history</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="divide-y">
              {[...bet.settlements].reverse().map((item) => (
                <li key={item.id}>
                  <Item className="items-start border-0 px-0 py-4">
                    <ItemContent className="min-w-0">
                      <ItemTitle className="line-clamp-none">
                        Revision {item.revision} · {outcomeLabel(item.outcome)}
                        {item.earlyPayout ? " · Early payout" : ""}
                      </ItemTitle>
                      <ItemDescription className="line-clamp-none text-xs">
                        Settled {dateTime(item.settledAt)} · Recorded{" "}
                        {dateTime(item.createdAt)}
                      </ItemDescription>
                      {item.reason && (
                        <ItemDescription className="line-clamp-none whitespace-pre-wrap break-words text-foreground">
                          {item.reason}
                        </ItemDescription>
                      )}
                    </ItemContent>
                    <ItemActions className="shrink-0 tabular-nums">
                      {money(item.returnPence)}
                    </ItemActions>
                  </Item>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

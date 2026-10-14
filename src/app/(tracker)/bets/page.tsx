import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { readFilters } from "@/features/analytics/filter-schema";
import { FilterForm } from "@/features/analytics/filters";
import { history } from "@/features/analytics/metrics";
import { BetList } from "@/features/bets/bet-list";
import { getLedger } from "@/features/bets/repository";
import { DisplayToggle } from "@/features/units/controls";
import { defaultPreferences } from "@/features/units/units";
export default async function BetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [ledger, params] = await Promise.all([getLedger(), searchParams]);
  const filters = readFilters(params);
  const bets = history(ledger.bets, filters);
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== undefined) as [
      string,
      string,
    ][],
  ).toString();
  return (
    <>
      <PageHeading
        eyebrow="History"
        title="Your bets"
        description="A record of every bet, from placement to credited return."
      />
      <DisplayToggle preferences={ledger.preferences ?? defaultPreferences} />
      <FilterForm
        ledger={ledger}
        filters={filters}
        dateLabel="Placement dates"
      />
      <div className="mb-4 flex flex-wrap justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          {bets.length} {bets.length === 1 ? "bet" : "bets"}
        </span>
        <div className="flex flex-wrap gap-4">
          <Link href="/bets/trash" className="text-primary underline">
            Trash
          </Link>
          <a
            href={`/api/export?${query}`}
            download="bets.csv"
            className="text-primary underline"
          >
            Export bets CSV
          </a>
          <a
            href={`/api/export?${query}&kind=legs`}
            download="legs.csv"
            className="text-primary underline"
          >
            Export legs CSV
          </a>
        </div>
      </div>
      <BetList bets={bets} ledger={ledger} />
    </>
  );
}

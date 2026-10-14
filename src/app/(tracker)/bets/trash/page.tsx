import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { BetList } from "@/features/bets/bet-list";
import { getLedger } from "@/features/bets/repository";

export default async function TrashPage() {
  const ledger = await getLedger(true);
  const deleted = ledger.bets
    .filter((bet) => bet.deletedAt)
    .sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? ""));
  return (
    <div className="space-y-5">
      <Link
        href="/bets"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← All bets
      </Link>
      <PageHeading
        title="Trash"
        description="Deleted bets are excluded from your totals and exports. Open a bet to restore it."
      />
      {deleted.length ? (
        <BetList bets={deleted} ledger={ledger} />
      ) : (
        <Empty className="border bg-card py-10">
          <EmptyHeader>
            <EmptyTitle>Trash is empty</EmptyTitle>
            <EmptyDescription>
              Deleted bets will appear here so you can restore them.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}

import { randomUUID } from "node:crypto";
import { PageHeading } from "@/components/page-heading";
import { BetForm } from "@/features/bets/bet-form";
import { getLedger } from "@/features/bets/repository";
export default async function AddPage() {
  const ledger = await getLedger();
  return (
    <>
      <PageHeading
        eyebrow="Record"
        title="Add a bet"
        description="Capture the accepted terms, then confirm. You can settle it when the return is credited."
      />
      <BetForm
        id={randomUUID()}
        bookmakers={ledger.bookmakers}
        sources={ledger.sources}
        now={new Date().toISOString()}
      />
    </>
  );
}

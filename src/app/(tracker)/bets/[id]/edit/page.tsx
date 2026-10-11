import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { BetForm } from "@/features/bets/bet-form";
import { getLedger } from "@/features/bets/repository";
export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ledger = await getLedger();
  const bet = ledger.bets.find((bet) => bet.id === id);
  if (!bet || bet.status === "settled") notFound();
  return (
    <>
      <PageHeading
        title={bet.status === "draft" ? "Complete your draft" : "Edit bet"}
        description="Update the recorded terms. Voiding an acca leg keeps the bet financially open."
      />
      <BetForm
        id={bet.id}
        bet={bet}
        bookmakers={ledger.bookmakers}
        sources={ledger.sources}
        now={new Date().toISOString()}
      />
    </>
  );
}

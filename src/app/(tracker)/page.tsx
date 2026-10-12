import { Dashboard } from "@/features/analytics/dashboard";
import { readFilters } from "@/features/analytics/filter-schema";
import { getLedger } from "@/features/bets/repository";
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [ledger, params] = await Promise.all([getLedger(), searchParams]);
  return <Dashboard ledger={ledger} filters={readFilters(params)} />;
}

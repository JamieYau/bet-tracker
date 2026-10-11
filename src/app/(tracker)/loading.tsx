import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div role="status" aria-label="Loading your ledger" className="space-y-5">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((id) => (
          <Skeleton key={id} className="h-36" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-xl border bg-card p-8">
      <h1 className="text-xl font-semibold">Unable to load your ledger</h1>
      <p className="mt-3 mb-5 text-sm text-muted-foreground">
        Please retry. If this persists, check the Supabase configuration and
        migrations.
      </p>
      <Button className="h-11" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}

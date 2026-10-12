"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <Card>
      <CardHeader>
        <h1 className="text-xl font-semibold">Unable to load your ledger</h1>
        <CardDescription>
          Please retry. If this persists, check the Supabase configuration and
          migrations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" className="h-11" onClick={reset}>
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

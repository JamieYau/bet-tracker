"use client";
import { useActionState, useState } from "react";
import { PendingLabel } from "@/components/pending-label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useClientReady } from "@/lib/use-client-ready";
import { trashAction } from "./actions";
import type { Bet } from "./types";

export function TrashForm({ bet }: { bet: Bet }) {
  const [state, action, pending] = useActionState(trashAction, {});
  const [confirming, setConfirming] = useState(false);
  const ready = useClientReady();
  const deleted = Boolean(bet.deletedAt);
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {deleted ? "Restore this bet" : "Delete this bet"}
        </CardTitle>
        <CardDescription>
          {deleted
            ? "Restore the bet with its details and settlement history. It will count towards your totals again."
            : "Move this bet to Trash and remove it from your totals and exports. You can restore it later."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={bet.id} />
          <input type="hidden" name="version" value={bet.version} />
          <input
            type="hidden"
            name="intent"
            value={deleted ? "restore" : "delete"}
          />
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          {!deleted && !confirming ? (
            <Button
              type="button"
              variant="outline"
              className="h-11"
              disabled={!ready || pending}
              onClick={() => setConfirming(true)}
            >
              Delete bet
            </Button>
          ) : (
            <div className="space-y-3">
              {!deleted && <p className="text-sm">Move this bet to Trash?</p>}
              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  variant={deleted ? "default" : "destructive"}
                  className="h-11"
                  disabled={!ready || pending}
                  aria-busy={pending}
                >
                  <PendingLabel pending={pending}>
                    {deleted ? "Restore bet" : "Move to Trash"}
                  </PendingLabel>
                </Button>
                {!deleted && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    disabled={pending}
                    onClick={() => setConfirming(false)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

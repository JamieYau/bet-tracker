"use client";
import { useActionState, useState } from "react";
import { Field, selectClass } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { settlementAction } from "@/features/bets/actions";
import type { Bet, Outcome } from "@/features/bets/types";
import { OUTCOMES } from "@/features/bets/types";
import { londonInput, outcomeLabel } from "@/lib/format";
import { currentSettlement, ordinaryReturn } from "./finance";
export function SettlementForm({
  bet,
  requestKey,
  now,
}: {
  bet: Bet;
  requestKey: string;
  now: string;
}) {
  const previous = currentSettlement(bet);
  const [state, action, pending] = useActionState(settlementAction, {});
  const [outcome, setOutcome] = useState<Outcome>(previous?.outcome ?? "won");
  function prefill(value: Outcome) {
    try {
      const pence = ordinaryReturn(bet, value);
      return pence === null ? "" : (pence / 100).toFixed(2);
    } catch {
      return "";
    }
  }
  const [credited, setCredited] = useState(
    previous ? (previous.returnPence / 100).toFixed(2) : prefill("won"),
  );
  const [date, setDate] = useState(londonInput(previous?.settledAt ?? now));
  const [reason, setReason] = useState("");
  const [early, setEarly] = useState(previous?.earlyPayout ?? false);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="betId" value={bet.id} />
      <input type="hidden" name="version" value={bet.version} />
      <input type="hidden" name="requestKey" value={requestKey} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="outcome" label="Outcome">
          <select
            className={selectClass}
            id="outcome"
            name="outcome"
            value={outcome}
            onChange={(event) => {
              const next = event.target.value as Outcome;
              setOutcome(next);
              setCredited(prefill(next));
              if (next !== "won") setEarly(false);
            }}
          >
            {OUTCOMES.map((value) => (
              <option key={value} value={value}>
                {outcomeLabel(value)}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id="return"
          label="Actual credited cash return (£)"
          hint="Prefilled for ordinary results. Override with the amount the bookmaker credited."
        >
          <Input
            className="h-11 text-base"
            id="return"
            name="return"
            inputMode="decimal"
            required
            value={credited}
            onChange={(event) => setCredited(event.target.value)}
          />
        </Field>
        <Field
          id="settledAt"
          label="Settlement time"
          hint="Europe/London · used for profit charts"
        >
          <Input
            className="h-11 text-base"
            id="settledAt"
            name="settledAt"
            type="datetime-local"
            required
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </Field>
        <label className="flex min-h-11 items-center gap-3 self-end text-sm">
          <input
            className="size-5 accent-primary"
            type="checkbox"
            name="earlyPayout"
            disabled={outcome !== "won"}
            checked={early}
            onChange={(event) => setEarly(event.target.checked)}
          />
          Early payout
        </label>
      </div>
      <Field
        id="reason"
        label={previous ? "Correction reason" : "Settlement note (optional)"}
      >
        <Textarea
          id="reason"
          name="reason"
          required={Boolean(previous)}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </Field>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}{" "}
          {state.errors && Object.values(state.errors).flat().join(" ")}
        </p>
      )}
      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? "Saving…" : previous ? "Save correction" : "Settle bet"}
      </Button>
      <p className="text-xs leading-5 text-muted-foreground">
        {outcome === "void"
          ? "Free-bet credit reinstated by the bookmaker is not a cash return. "
          : ""}
        Early payouts close the bet financially. Later sporting results do not
        reverse them.
      </p>
    </form>
  );
}

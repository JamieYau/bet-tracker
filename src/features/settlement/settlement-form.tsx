"use client";
import { useActionState, useState } from "react";
import { PendingLabel } from "@/components/pending-label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { settlementAction } from "@/features/bets/actions";
import type { Bet, Outcome } from "@/features/bets/types";
import { OUTCOMES } from "@/features/bets/types";
import { londonInput, outcomeLabel } from "@/lib/format";
import { useClientReady } from "@/lib/use-client-ready";
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
  const ready = useClientReady();
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
      <fieldset disabled={!ready || pending} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={Boolean(state.errors?.outcome?.length)}>
            <FieldLabel htmlFor="outcome">Outcome</FieldLabel>
            <NativeSelect
              aria-invalid={Boolean(state.errors?.outcome)}
              aria-describedby={
                state.errors?.outcome ? "outcome-error" : undefined
              }
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
                <NativeSelectOption key={value} value={value}>
                  {outcomeLabel(value)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError id="outcome-error">
              {state.errors?.outcome?.join(" ")}
            </FieldError>
          </Field>
          <Field data-invalid={Boolean(state.errors?.returnPence?.length)}>
            <FieldLabel htmlFor="return">
              Actual credited cash return (£)
            </FieldLabel>
            <Input
              aria-invalid={Boolean(state.errors?.returnPence)}
              aria-describedby={[
                "return-hint",
                state.errors?.returnPence?.length ? "return-error" : undefined,
              ]
                .filter(Boolean)
                .join(" ")}
              className="h-11 text-base"
              id="return"
              name="return"
              inputMode="decimal"
              required
              value={credited}
              onChange={(event) => setCredited(event.target.value)}
            />
            <FieldDescription id="return-hint">
              Prefilled for ordinary results. Override with the amount the
              bookmaker credited.
            </FieldDescription>
            <FieldError id="return-error">
              {state.errors?.returnPence?.join(" ")}
            </FieldError>
          </Field>
          <Field data-invalid={Boolean(state.errors?.settledAt?.length)}>
            <FieldLabel htmlFor="settledAt">Settlement time</FieldLabel>
            <Input
              aria-invalid={Boolean(state.errors?.settledAt)}
              aria-describedby={[
                "settledAt-hint",
                state.errors?.settledAt?.length ? "settledAt-error" : undefined,
              ]
                .filter(Boolean)
                .join(" ")}
              className="h-11 text-base"
              id="settledAt"
              name="settledAt"
              type="datetime-local"
              required
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <FieldDescription id="settledAt-hint">
              Europe/London · used for profit charts
            </FieldDescription>
            <FieldError id="settledAt-error">
              {state.errors?.settledAt?.join(" ")}
            </FieldError>
          </Field>
          <Field
            orientation="horizontal"
            className="min-h-11 self-end"
            data-disabled={outcome !== "won"}
          >
            <Checkbox
              id="earlyPayout"
              aria-labelledby="earlyPayout-label"
              name="earlyPayout"
              value="on"
              disabled={!ready || outcome !== "won" || pending}
              checked={early}
              onCheckedChange={setEarly}
            />
            <FieldLabel
              id="earlyPayout-label"
              htmlFor="earlyPayout"
              className="min-h-11"
            >
              Early payout
            </FieldLabel>
          </Field>
        </div>
        <Field data-invalid={Boolean(state.errors?.reason?.length)}>
          <FieldLabel htmlFor="reason">
            {previous ? "Correction reason" : "Settlement note (optional)"}
          </FieldLabel>
          <Textarea
            aria-invalid={Boolean(state.errors?.reason)}
            aria-describedby={state.errors?.reason ? "reason-error" : undefined}
            id="reason"
            name="reason"
            required={Boolean(previous)}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <FieldError id="reason-error">
            {state.errors?.reason?.join(" ")}
          </FieldError>
        </Field>
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <Button
          type="submit"
          className="h-11"
          disabled={pending}
          aria-busy={pending}
        >
          <PendingLabel pending={pending}>
            {previous ? "Save correction" : "Settle bet"}
          </PendingLabel>
        </Button>
        <p className="text-xs leading-5 text-muted-foreground">
          {outcome === "void"
            ? "Free-bet credit reinstated by the bookmaker is not a cash return. "
            : ""}
          Early payouts close the bet financially. Later sporting results do not
          reverse them.
        </p>
      </fieldset>
    </form>
  );
}

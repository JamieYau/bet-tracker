"use client";
import { Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Field, selectClass } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { londonInput } from "@/lib/format";
import { useClientReady } from "@/lib/use-client-ready";
import { recordAction } from "./actions";
import type { Bet, Leg, NamedOption } from "./types";

export function BetForm({
  id,
  bookmakers,
  sources,
  bet,
  now,
}: {
  id: string;
  bookmakers: NamedOption[];
  sources: NamedOption[];
  bet?: Bet;
  now: string;
}) {
  const [state, action, pending] = useActionState(recordAction, {});
  const ready = useClientReady();
  const [values, setValues] = useState({
    bookmakerId:
      bet?.bookmakerId ?? bookmakers.find((option) => option.active)?.id ?? "",
    sourceId:
      bet?.sourceId ?? sources.find((option) => option.name === "Me")?.id ?? "",
    placedAt: londonInput(bet?.placedAt ?? now),
    sport: bet?.sport ?? "Football",
    selection: bet?.selection ?? "",
    market: bet?.market ?? "",
    acceptedOdds: bet?.acceptedOdds ?? "",
    cashStake: bet ? String(bet.cashStakePence / 100) : "",
    freeStake: bet?.freeStakePence ? String(bet.freeStakePence / 100) : "",
    freeStakeReturned: bet?.freeStakeReturned ?? false,
    betType: bet?.betType ?? "single",
    reference: bet?.reference ?? "",
    notes: bet?.notes ?? "",
    tagsText: bet?.tags.join(", ") ?? "",
  });
  const [legs, setLegs] = useState<Leg[]>(
    bet?.betType === "acca" ? bet.legs : [],
  );
  function text(key: keyof typeof values, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }
  function legChange(id: string, key: keyof Leg, value: string) {
    setLegs((previous) =>
      previous.map((leg) => (leg.id === id ? { ...leg, [key]: value } : leg)),
    );
  }
  const input = (key: keyof typeof values, label: string, hint?: string) => (
    <Field id={key} label={label} hint={hint} error={state.errors?.[key]}>
      <Input
        id={key}
        className="h-11 text-base"
        value={String(values[key])}
        onChange={(event) => text(key, event.target.value)}
        aria-invalid={Boolean(state.errors?.[key])}
        aria-describedby={hint ? `${key}-hint` : undefined}
      />
    </Field>
  );
  const payload = {
    ...values,
    legs:
      values.betType === "single"
        ? [
            {
              id: bet?.legs[0]?.id ?? id,
              selection: values.selection,
              market: values.market,
              sport: values.sport,
              odds: null,
              status: bet?.legs[0]?.status ?? "open",
            },
          ]
        : legs,
  };
  return (
    <form action={action} className="mx-auto max-w-3xl space-y-5">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="version" value={bet?.version ?? 0} />
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />
      <fieldset disabled={!ready || pending} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Bet details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field id="bookmakerId" label="Bookmaker">
              <select
                id="bookmakerId"
                className={selectClass}
                value={values.bookmakerId}
                onChange={(event) => text("bookmakerId", event.target.value)}
              >
                {bookmakers
                  .filter(
                    (option) => option.active || option.id === bet?.bookmakerId,
                  )
                  .map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                      {!option.active ? " (archived)" : ""}
                    </option>
                  ))}
              </select>
            </Field>
            <Field
              id="sourceId"
              label="Source"
              hint="One source for the whole bet. Choose Me for mixed-source accas."
            >
              <select
                id="sourceId"
                className={selectClass}
                value={values.sourceId}
                onChange={(event) => text("sourceId", event.target.value)}
              >
                {sources
                  .filter(
                    (option) => option.active || option.id === bet?.sourceId,
                  )
                  .map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                      {!option.active ? " (archived)" : ""}
                    </option>
                  ))}
              </select>
            </Field>
            <Field
              id="placedAt"
              label="Placement time"
              hint={
                bet
                  ? "Europe/London"
                  : "Defaults to now · Europe/London. Change it if you placed the bet earlier."
              }
            >
              <Input
                id="placedAt"
                type="datetime-local"
                className="h-11 text-base"
                value={values.placedAt}
                onChange={(event) => text("placedAt", event.target.value)}
              />
            </Field>
            <Field id="betType" label="Bet type">
              <select
                id="betType"
                className={selectClass}
                value={values.betType}
                onChange={(event) => text("betType", event.target.value)}
              >
                <option value="single">Single</option>
                <option value="acca">Acca</option>
              </select>
            </Field>
            {input(
              "sport",
              "Sport",
              "Use Mixed if the acca covers multiple sports.",
            )}
            {input(
              "selection",
              values.betType === "acca" ? "Acca name" : "Selection",
            )}
            {input("market", "Market (optional)")}
            {input(
              "acceptedOdds",
              "Accepted total odds",
              "Decimal (2.50) or fractional (3/2). Include any boost.",
            )}
          </CardContent>
        </Card>
        {values.betType === "acca" && (
          <Card>
            <CardHeader>
              <CardTitle>Acca legs</CardTitle>
              <p className="text-sm text-muted-foreground">
                Leg odds are for reference. Financial returns use accepted total
                odds.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {legs.map((leg, index) => (
                <fieldset key={leg.id} className="rounded-lg border p-4">
                  <legend className="px-2 text-sm font-medium">
                    Leg {index + 1}
                  </legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(
                      [
                        ["selection", "Selection"],
                        ["market", "Market"],
                        ["sport", "Sport"],
                        ["odds", "Leg odds (optional)"],
                      ] as const
                    ).map(([key, label]) => (
                      <Field key={key} id={`${leg.id}-${key}`} label={label}>
                        <Input
                          className="h-11 text-base"
                          id={`${leg.id}-${key}`}
                          value={leg[key] ?? ""}
                          onChange={(event) =>
                            legChange(leg.id, key, event.target.value)
                          }
                        />
                      </Field>
                    ))}
                    <Field id={`${leg.id}-status`} label="Leg status">
                      <select
                        className={selectClass}
                        id={`${leg.id}-status`}
                        value={leg.status}
                        onChange={(event) =>
                          legChange(leg.id, "status", event.target.value)
                        }
                      >
                        <option value="open">Open</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                        <option value="void">Void</option>
                      </select>
                    </Field>
                    <Button
                      type="button"
                      className="h-11 self-end"
                      variant="ghost"
                      onClick={() =>
                        setLegs((previous) =>
                          previous.filter((item) => item.id !== leg.id),
                        )
                      }
                    >
                      <Trash2 />
                      Remove leg {index + 1}
                    </Button>
                  </div>
                </fieldset>
              ))}
              <Button
                type="button"
                className="h-11"
                variant="outline"
                disabled={legs.length >= 30}
                onClick={() =>
                  setLegs((previous) => [
                    ...previous,
                    {
                      id: crypto.randomUUID(),
                      selection: "",
                      market: "",
                      sport: values.sport,
                      odds: null,
                      status: "open",
                    },
                  ])
                }
              >
                <Plus />
                Add leg
              </Button>
              {state.errors?.legs && (
                <p role="alert" className="text-sm text-destructive">
                  {state.errors.legs.join(" ")}
                </p>
              )}
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Funding</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {(
              [
                ["cashStake", "Cash stake (£)"],
                ["freeStake", "Free-bet stake (£)"],
              ] as const
            ).map(([key, label]) => (
              <Field
                key={key}
                id={key}
                label={label}
                error={state.errors?.[`${key}Pence`]}
              >
                <Input
                  className="h-11 text-base"
                  id={key}
                  inputMode="decimal"
                  placeholder="0.00"
                  value={values[key]}
                  onChange={(event) => text(key, event.target.value)}
                />
              </Field>
            ))}
            <label className="flex min-h-11 items-center gap-3 text-sm sm:col-span-2">
              <input
                className="size-5 accent-primary"
                type="checkbox"
                checked={values.freeStakeReturned}
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    freeStakeReturned: event.target.checked,
                  }))
                }
              />
              Free-bet stake is returned with winnings
            </label>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Optional extras</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {input("reference", "Bookmaker reference")}
            {input(
              "tagsText",
              "Promotional tags",
              "Separate tags with commas, e.g. Boost, Welcome offer.",
            )}
            <div className="sm:col-span-2">
              <Field id="notes" label="Notes">
                <Textarea
                  id="notes"
                  value={values.notes}
                  onChange={(event) => text("notes", event.target.value)}
                />
              </Field>
            </div>
          </CardContent>
        </Card>
        {state.error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {state.error}
              {state.errors?.bet && <span>{state.errors.bet.join(" ")}</span>}
            </AlertDescription>
          </Alert>
        )}
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="allowDuplicate"
            className="size-5 accent-primary"
          />
          Record despite duplicate warning
        </label>
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            className="h-12 flex-1 sm:flex-none sm:px-8"
            name="intent"
            value="confirm"
            disabled={pending}
          >
            {pending
              ? "Saving…"
              : bet?.status === "open"
                ? "Save changes"
                : "Confirm bet"}
          </Button>
          {bet?.status !== "open" && (
            <Button
              type="submit"
              className="h-12"
              variant="outline"
              name="intent"
              value="draft"
              disabled={pending}
            >
              Save draft
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Drafts are excluded from profit and open exposure. Screenshot import
          will be added in the next stage.
        </p>
      </fieldset>
    </form>
  );
}

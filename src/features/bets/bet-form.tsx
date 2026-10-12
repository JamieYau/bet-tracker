"use client";
import { Plus, Trash2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
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
  const input = (key: keyof typeof values, label: string, hint?: string) => {
    const errors = state.errors?.[key === "tagsText" ? "tags" : key];
    return (
      <Field data-invalid={Boolean(errors?.length)}>
        <FieldLabel htmlFor={key}>{label}</FieldLabel>
        <Input
          aria-invalid={Boolean(errors?.length)}
          aria-describedby={
            [
              hint ? `${key}-hint` : undefined,
              errors?.length ? `${key}-error` : undefined,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
          id={key}
          className="h-11 text-base"
          value={String(values[key])}
          onChange={(event) => text(key, event.target.value)}
        />

        {hint && <FieldDescription id={`${key}-hint`}>{hint}</FieldDescription>}
        <FieldError id={`${key}-error`}>{errors?.join(" ")}</FieldError>
      </Field>
    );
  };
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
            <Field data-invalid={Boolean(state.errors?.bookmakerId?.length)}>
              <FieldLabel htmlFor="bookmakerId">Bookmaker</FieldLabel>
              <NativeSelect
                aria-invalid={Boolean(state.errors?.bookmakerId?.length)}
                aria-describedby={
                  state.errors?.bookmakerId?.length
                    ? "bookmakerId-error"
                    : undefined
                }
                id="bookmakerId"
                value={values.bookmakerId}
                onChange={(event) => text("bookmakerId", event.target.value)}
              >
                {bookmakers
                  .filter(
                    (option) => option.active || option.id === bet?.bookmakerId,
                  )
                  .map((option) => (
                    <NativeSelectOption key={option.id} value={option.id}>
                      {option.name}
                      {!option.active ? " (archived)" : ""}
                    </NativeSelectOption>
                  ))}
              </NativeSelect>
              <FieldError id="bookmakerId-error">
                {state.errors?.bookmakerId?.join(" ")}
              </FieldError>
            </Field>
            <Field data-invalid={Boolean(state.errors?.sourceId?.length)}>
              <FieldLabel htmlFor="sourceId">Source</FieldLabel>
              <NativeSelect
                aria-invalid={Boolean(state.errors?.sourceId?.length)}
                aria-describedby={[
                  "sourceId-hint",
                  state.errors?.sourceId?.length ? "sourceId-error" : undefined,
                ]
                  .filter(Boolean)
                  .join(" ")}
                id="sourceId"
                value={values.sourceId}
                onChange={(event) => text("sourceId", event.target.value)}
              >
                {sources
                  .filter(
                    (option) => option.active || option.id === bet?.sourceId,
                  )
                  .map((option) => (
                    <NativeSelectOption key={option.id} value={option.id}>
                      {option.name}
                      {!option.active ? " (archived)" : ""}
                    </NativeSelectOption>
                  ))}
              </NativeSelect>
              <FieldDescription id="sourceId-hint">
                One source for the whole bet. Choose Me for mixed-source accas.
              </FieldDescription>
              <FieldError id="sourceId-error">
                {state.errors?.sourceId?.join(" ")}
              </FieldError>
            </Field>
            <Field data-invalid={Boolean(state.errors?.placedAt?.length)}>
              <FieldLabel htmlFor="placedAt">Placement time</FieldLabel>
              <Input
                aria-invalid={Boolean(state.errors?.placedAt?.length)}
                aria-describedby={[
                  "placedAt-hint",
                  state.errors?.placedAt?.length ? "placedAt-error" : undefined,
                ]
                  .filter(Boolean)
                  .join(" ")}
                id="placedAt"
                type="datetime-local"
                className="h-11 text-base"
                value={values.placedAt}
                onChange={(event) => text("placedAt", event.target.value)}
              />
              <FieldDescription id="placedAt-hint">
                {bet
                  ? "Europe/London"
                  : "Defaults to now · Europe/London. Change it if you placed the bet earlier."}
              </FieldDescription>
              <FieldError id="placedAt-error">
                {state.errors?.placedAt?.join(" ")}
              </FieldError>
            </Field>
            <Field data-invalid={Boolean(state.errors?.betType?.length)}>
              <FieldLabel htmlFor="betType">Bet type</FieldLabel>
              <NativeSelect
                aria-invalid={Boolean(state.errors?.betType?.length)}
                aria-describedby={
                  state.errors?.betType?.length ? "betType-error" : undefined
                }
                id="betType"
                value={values.betType}
                onChange={(event) => text("betType", event.target.value)}
              >
                <NativeSelectOption value="single">Single</NativeSelectOption>
                <NativeSelectOption value="acca">Acca</NativeSelectOption>
              </NativeSelect>
              <FieldError id="betType-error">
                {state.errors?.betType?.join(" ")}
              </FieldError>
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
              <CardDescription className="text-sm text-muted-foreground">
                Leg odds are for reference. Financial returns use accepted total
                odds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {legs.map((leg, index) => (
                <FieldSet key={leg.id} className="rounded-lg border p-4">
                  <FieldLegend className="px-2 text-sm font-medium">
                    Leg {index + 1}
                  </FieldLegend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(
                      [
                        ["selection", "Selection"],
                        ["market", "Market"],
                        ["sport", "Sport"],
                        ["odds", "Leg odds (optional)"],
                      ] as const
                    ).map(([key, label]) => (
                      <Field key={key}>
                        <FieldLabel htmlFor={`${leg.id}-${key}`}>
                          {label}
                        </FieldLabel>
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
                    <Field>
                      <FieldLabel htmlFor={`${leg.id}-status`}>
                        Leg status
                      </FieldLabel>
                      <NativeSelect
                        id={`${leg.id}-status`}
                        value={leg.status}
                        onChange={(event) =>
                          legChange(leg.id, "status", event.target.value)
                        }
                      >
                        <NativeSelectOption value="open">
                          Open
                        </NativeSelectOption>
                        <NativeSelectOption value="won">Won</NativeSelectOption>
                        <NativeSelectOption value="lost">
                          Lost
                        </NativeSelectOption>
                        <NativeSelectOption value="void">
                          Void
                        </NativeSelectOption>
                      </NativeSelect>
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
                </FieldSet>
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
                <FieldError>{state.errors.legs.join(" ")}</FieldError>
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
                data-invalid={Boolean(state.errors?.[`${key}Pence`]?.length)}
              >
                <FieldLabel htmlFor={key}>{label}</FieldLabel>
                <Input
                  aria-invalid={Boolean(state.errors?.[`${key}Pence`]?.length)}
                  aria-describedby={
                    [
                      state.errors?.[`${key}Pence`]?.length
                        ? `${key}-error`
                        : undefined,
                    ]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                  className="h-11 text-base"
                  id={key}
                  inputMode="decimal"
                  placeholder="0.00"
                  value={values[key]}
                  onChange={(event) => text(key, event.target.value)}
                />
                <FieldError id={`${key}-error`}>
                  {state.errors?.[`${key}Pence`]?.join(" ")}
                </FieldError>
              </Field>
            ))}
            <Field orientation="horizontal" className="min-h-11 sm:col-span-2">
              <Checkbox
                id="freeStakeReturned"
                aria-labelledby="freeStakeReturned-label"
                disabled={!ready || pending}
                checked={values.freeStakeReturned}
                onCheckedChange={(checked) =>
                  setValues((previous) => ({
                    ...previous,
                    freeStakeReturned: checked,
                  }))
                }
              />
              <FieldLabel
                id="freeStakeReturned-label"
                htmlFor="freeStakeReturned"
                className="min-h-11"
              >
                Free-bet stake is returned with winnings
              </FieldLabel>
            </Field>
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
              <Field data-invalid={Boolean(state.errors?.notes?.length)}>
                <FieldLabel htmlFor="notes">Notes</FieldLabel>
                <Textarea
                  aria-invalid={Boolean(state.errors?.notes?.length)}
                  aria-describedby={
                    state.errors?.notes?.length ? "notes-error" : undefined
                  }
                  id="notes"
                  value={values.notes}
                  onChange={(event) => text("notes", event.target.value)}
                />
                <FieldError id="notes-error">
                  {state.errors?.notes?.join(" ")}
                </FieldError>
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
        <Field orientation="horizontal" className="min-h-11">
          <Checkbox
            id="allowDuplicate"
            aria-labelledby="allowDuplicate-label"
            name="allowDuplicate"
            value="on"
            disabled={!ready || pending}
          />
          <FieldLabel
            id="allowDuplicate-label"
            htmlFor="allowDuplicate"
            className="min-h-11"
          >
            Record despite duplicate warning
          </FieldLabel>
        </Field>
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            className="h-12 flex-1 sm:flex-none sm:px-8"
            name="intent"
            value="confirm"
            disabled={pending}
            aria-busy={pending}
          >
            <PendingLabel pending={pending}>
              {bet?.status === "open" ? "Save changes" : "Confirm bet"}
            </PendingLabel>
          </Button>
          {bet?.status !== "open" && (
            <Button
              type="submit"
              className="h-12"
              variant="outline"
              name="intent"
              value="draft"
              disabled={pending}
              aria-busy={pending}
            >
              <PendingLabel pending={pending}>Save draft</PendingLabel>
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

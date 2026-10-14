"use client";
import { Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { PendingLabel } from "@/components/pending-label";
import { SearchableSelect } from "@/components/searchable-select";
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
import { stakeHint } from "@/features/units/units";
import { formatOdds, londonInput } from "@/lib/format";
import { useClientReady } from "@/lib/use-client-ready";
import { recordAction } from "./actions";
import { normalizeSport } from "./catalog";
import { PickFields } from "./pick-fields";
import type { Bet, Leg, NamedOption, UnitPreferences } from "./types";

export function BetForm({
  id,
  bookmakers,
  sources,
  bet,
  now,
  preferences,
}: {
  id: string;
  bookmakers: NamedOption[];
  sources: NamedOption[];
  bet?: Bet;
  now: string;
  preferences?: UnitPreferences;
}) {
  const [state, action, pending] = useActionState(recordAction, {});
  const ready = useClientReady();
  const initialUnitSize = bet
    ? (bet.unitSizePence ?? null)
    : (preferences?.unitSizePence ?? null);
  const [values, setValues] = useState({
    bookmakerId:
      bet?.bookmakerId ?? bookmakers.find((option) => option.active)?.id ?? "",
    sourceId:
      bet?.sourceId ?? sources.find((option) => option.name === "Me")?.id ?? "",
    placedAt: londonInput(bet?.placedAt ?? now),
    sport: normalizeSport(bet?.sport ?? "Football"),
    selection: bet?.selection ?? "",
    market: bet?.market ?? "",
    event: bet?.event ?? "",
    direction: bet?.direction ?? "",
    line: bet?.line ?? "",
    acceptedOdds: bet?.acceptedOdds ? formatOdds(bet.acceptedOdds) : "",
    unitSize: initialUnitSize ? String(initialUnitSize / 100) : "",
    cashStake: bet
      ? String(bet.cashStakePence / 100)
      : initialUnitSize
        ? String(initialUnitSize / 100)
        : "",
    freeStake: bet ? String(bet.freeStakePence / 100) : "",
    freeStakeReturned: bet?.freeStakeReturned ?? false,
    betType: bet?.betType ?? "single",
    reference: bet?.reference ?? "",
    notes: bet?.notes ?? "",
    tagsText: bet?.tags.join(", ") ?? "",
  });
  const [legs, setLegs] = useState<Leg[]>(
    bet?.betType === "acca"
      ? bet.legs.map((leg) => ({ ...leg, sport: normalizeSport(leg.sport) }))
      : [],
  );
  function text(key: keyof typeof values, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }
  const unitSizePence = /^\d+(\.\d{0,2})?$/.test(values.unitSize)
    ? Math.round(Number(values.unitSize) * 100)
    : null;
  const tags = values.tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const inPlay = tags.some((tag) => tag.toLowerCase() === "in-play");
  function setInPlay(checked: boolean) {
    const otherTags = tags.filter((tag) => tag.toLowerCase() !== "in-play");
    text(
      "tagsText",
      [...otherTags, ...(checked ? ["In-play"] : [])].join(", "),
    );
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
  const legSports = [
    ...new Set(legs.map((leg) => normalizeSport(leg.sport)).filter(Boolean)),
  ];
  const payload = {
    ...values,
    sport:
      values.betType === "acca" && legSports.length
        ? legSports.length === 1
          ? legSports[0]
          : "Mixed"
        : values.sport,
    legs:
      values.betType === "single"
        ? [
            {
              id: bet?.legs[0]?.id ?? id,
              selection: values.selection,
              market: values.market,
              sport: values.sport,
              event: values.event,
              direction: values.direction,
              line: values.line,
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
      {bet?.status === "settled" && (
        <Alert>
          <AlertDescription>
            Editing keeps the recorded cash return. Changing the stake updates
            your profit and ROI. Use Correct settlement on the bet page to
            change the outcome or cash return.
          </AlertDescription>
        </Alert>
      )}
      <fieldset disabled={!ready || pending} className="min-w-0 space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Bet details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field data-invalid={Boolean(state.errors?.bookmakerId?.length)}>
              <FieldLabel htmlFor="bookmakerId">Bookmaker</FieldLabel>
              <SearchableSelect
                aria-invalid={Boolean(state.errors?.bookmakerId?.length)}
                aria-describedby={
                  state.errors?.bookmakerId?.length
                    ? "bookmakerId-error"
                    : undefined
                }
                id="bookmakerId"
                value={values.bookmakerId}
                onValueChange={(value) => text("bookmakerId", value)}
                name="bookmakerId"
                disabled={!ready || pending}
                options={bookmakers
                  .filter(
                    (option) => option.active || option.id === bet?.bookmakerId,
                  )
                  .map((option) => ({
                    value: option.id,
                    label: option.name + (!option.active ? " (archived)" : ""),
                  }))}
              />
              <FieldError id="bookmakerId-error">
                {state.errors?.bookmakerId?.join(" ")}
              </FieldError>
            </Field>
            <Field data-invalid={Boolean(state.errors?.sourceId?.length)}>
              <FieldLabel htmlFor="sourceId">Source</FieldLabel>
              <SearchableSelect
                aria-invalid={Boolean(state.errors?.sourceId?.length)}
                aria-describedby={[
                  "sourceId-hint",
                  state.errors?.sourceId?.length ? "sourceId-error" : undefined,
                ]
                  .filter(Boolean)
                  .join(" ")}
                id="sourceId"
                value={values.sourceId}
                onValueChange={(value) => text("sourceId", value)}
                name="sourceId"
                disabled={!ready || pending}
                options={sources
                  .filter(
                    (option) => option.active || option.id === bet?.sourceId,
                  )
                  .map((option) => ({
                    value: option.id,
                    label: option.name + (!option.active ? " (archived)" : ""),
                  }))}
              />
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
                  : "Defaults to now. Change it if you placed the bet earlier."}
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
            <Field orientation="horizontal" className="min-h-11 sm:col-span-2">
              <Checkbox
                id="inPlay"
                aria-labelledby="inPlay-label"
                checked={inPlay}
                onCheckedChange={setInPlay}
                disabled={!ready || pending}
              />
              <div className="min-w-0">
                <FieldLabel
                  id="inPlay-label"
                  htmlFor="inPlay"
                  className="min-h-11"
                >
                  In-play
                </FieldLabel>
              </div>
            </Field>
            <PickFields
              disabled={!ready || pending}
              id="bet"
              pick={values}
              change={text}
              errors={state.errors}
              includeMixed={values.betType === "acca"}
              metadata={values.betType === "single"}
            />
            {input(
              "selection",
              values.betType === "acca" ? "Acca name" : "Selection",
            )}

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
                    <PickFields
                      disabled={!ready || pending}
                      id={leg.id}
                      pick={leg}
                      errors={Object.fromEntries(
                        ["sport", "market", "event", "direction", "line"].map(
                          (key) => [
                            key,
                            state.errors?.[`legs.${index}.${key}`],
                          ],
                        ),
                      )}
                      change={(key, value) => legChange(leg.id, key, value)}
                    />
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
                      sport: values.sport === "Mixed" ? "" : values.sport,
                      event: "",
                      direction: "",
                      line: null,
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
                      unitSizePence &&
                      (key === "cashStake" || Number(values[key]) > 0)
                        ? `${key}-hint`
                        : undefined,
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
                {unitSizePence &&
                  (key === "cashStake" || Number(values[key]) > 0) && (
                    <FieldDescription id={`${key}-hint`}>
                      {stakeHint(values[key], unitSizePence)}
                    </FieldDescription>
                  )}
                <FieldError id={`${key}-error`}>
                  {state.errors?.[`${key}Pence`]?.join(" ")}
                </FieldError>
              </Field>
            ))}
            {bet?.unitSizePence ? (
              <p className="text-xs text-muted-foreground sm:col-span-2">
                This bet keeps its original unit size when edited or settled.
              </p>
            ) : bet ? (
              <details className="sm:col-span-2">
                <summary className="cursor-pointer py-2 text-sm text-muted-foreground">
                  Unit size for this bet
                </summary>
                <Field className="mt-3">
                  <FieldLabel htmlFor="betUnitSize">Unit size (£)</FieldLabel>
                  <Input
                    id="betUnitSize"
                    inputMode="decimal"
                    className="h-11 text-base"
                    value={values.unitSize}
                    onChange={(event) => text("unitSize", event.target.value)}
                    aria-describedby="betUnitSize-hint"
                  />
                  <FieldDescription id="betUnitSize-hint">
                    Set the unit size used for this bet. It is retained when you
                    edit or settle it.
                  </FieldDescription>
                </Field>
              </details>
            ) : null}
            <FieldError>{state.errors?.unitSizePence?.join(" ")}</FieldError>
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
              "Tags",
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
            value={bet && bet.status !== "draft" ? "save" : "confirm"}
            disabled={pending}
            aria-busy={pending}
          >
            <PendingLabel pending={pending}>
              {bet && bet.status !== "draft" ? "Save changes" : "Confirm bet"}
            </PendingLabel>
          </Button>
          {(!bet || bet.status === "draft") && (
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

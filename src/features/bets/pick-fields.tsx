"use client";

import { useState } from "react";
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
import { marketOptions, sportOptions } from "./catalog";

export function PickFields({
  id,
  pick,
  change,
  errors = {},
  includeMixed = false,
  metadata = true,
}: {
  id: string;
  pick: {
    sport: string;
    market: string;
    event?: string;
    direction?: string;
    line?: string | null;
  };
  change: (
    key: "sport" | "market" | "event" | "direction" | "line",
    value: string,
  ) => void;
  errors?: Record<string, string[] | undefined>;
  includeMixed?: boolean;
  metadata?: boolean;
}) {
  const options = marketOptions(pick.sport);
  const [customMode, setCustomMode] = useState(() =>
    Boolean(pick.market && !options.includes(pick.market)),
  );
  const custom =
    customMode || Boolean(pick.market && !options.includes(pick.market));
  return (
    <>
      <Field data-invalid={Boolean(errors.sport?.length)}>
        <FieldLabel htmlFor={`${id}-sport`}>
          {includeMixed && !metadata ? "Default sport for new legs" : "Sport"}
        </FieldLabel>
        <NativeSelect
          id={`${id}-sport`}
          value={pick.sport}
          aria-invalid={Boolean(errors.sport?.length)}
          aria-describedby={
            errors.sport?.length ? `${id}-sport-error` : undefined
          }
          onChange={(event) => change("sport", event.target.value)}
        >
          <NativeSelectOption value="">Choose sport</NativeSelectOption>
          {sportOptions(
            [pick.sport],
            includeMixed || pick.sport === "Mixed",
          ).map((sport) => (
            <NativeSelectOption key={sport} value={sport}>
              {sport}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {includeMixed && !metadata && (
          <FieldDescription>
            The acca's recorded sport follows its legs; different sports become
            Mixed.
          </FieldDescription>
        )}
        <FieldError id={`${id}-sport-error`}>
          {errors.sport?.join(" ")}
        </FieldError>
      </Field>
      {metadata && (
        <>
          <Field data-invalid={Boolean(errors.market?.length)}>
            <FieldLabel htmlFor={`${id}-market`}>
              Market type (optional)
            </FieldLabel>
            <NativeSelect
              id={`${id}-market`}
              value={custom ? "__custom" : pick.market}
              aria-invalid={Boolean(errors.market?.length)}
              aria-describedby={
                errors.market?.length ? `${id}-market-error` : undefined
              }
              onChange={(event) => {
                setCustomMode(event.target.value === "__custom");
                change(
                  "market",
                  event.target.value === "__custom"
                    ? custom
                      ? pick.market
                      : ""
                    : event.target.value,
                );
              }}
            >
              <NativeSelectOption value="">Choose market</NativeSelectOption>
              {options.map((market) => (
                <NativeSelectOption key={market} value={market}>
                  {market}
                </NativeSelectOption>
              ))}
              <NativeSelectOption value="__custom">
                Other / custom
              </NativeSelectOption>
            </NativeSelect>
            {custom && (
              <>
                <FieldLabel htmlFor={`${id}-custom-market`}>
                  Custom market
                </FieldLabel>
                <Input
                  id={`${id}-custom-market`}
                  className="h-11 text-base"
                  value={pick.market}
                  aria-invalid={Boolean(errors.market?.length)}
                  aria-describedby={
                    errors.market?.length ? `${id}-market-error` : undefined
                  }
                  onChange={(event) => {
                    setCustomMode(true);
                    change("market", event.target.value);
                  }}
                />
              </>
            )}
            <FieldError id={`${id}-market-error`}>
              {errors.market?.join(" ")}
            </FieldError>
          </Field>
          <Field data-invalid={Boolean(errors.event?.length)}>
            <FieldLabel htmlFor={`${id}-event`}>
              Event / fixture (optional)
            </FieldLabel>
            <Input
              id={`${id}-event`}
              className="h-11 text-base"
              value={pick.event ?? ""}
              aria-invalid={Boolean(errors.event?.length)}
              aria-describedby={
                errors.event?.length ? `${id}-event-error` : `${id}-event-hint`
              }
              onChange={(event) => change("event", event.target.value)}
            />
            <FieldDescription id={`${id}-event-hint`}>
              Matchup or tournament, e.g. Cavaliers @ Heat.
            </FieldDescription>
            <FieldError id={`${id}-event-error`}>
              {errors.event?.join(" ")}
            </FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-direction`}>
              Over / Under (optional)
            </FieldLabel>
            <NativeSelect
              id={`${id}-direction`}
              value={pick.direction ?? ""}
              onChange={(event) => change("direction", event.target.value)}
            >
              <NativeSelectOption value="">Neither</NativeSelectOption>
              <NativeSelectOption value="over">Over</NativeSelectOption>
              <NativeSelectOption value="under">Under</NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field data-invalid={Boolean(errors.line?.length)}>
            <FieldLabel htmlFor={`${id}-line`}>
              Line / handicap (optional)
            </FieldLabel>
            <Input
              id={`${id}-line`}
              className="h-11 text-base"
              inputMode="decimal"
              value={pick.line ?? ""}
              aria-invalid={Boolean(errors.line?.length)}
              aria-describedby={
                errors.line?.length ? `${id}-line-error` : `${id}-line-hint`
              }
              onChange={(event) => change("line", event.target.value)}
            />
            <FieldDescription id={`${id}-line-hint`}>
              Threshold or signed handicap, e.g. 9.5 or -3.5.
            </FieldDescription>
            <FieldError id={`${id}-line-error`}>
              {errors.line?.join(" ")}
            </FieldError>
          </Field>
        </>
      )}
    </>
  );
}

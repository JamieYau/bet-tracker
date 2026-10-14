"use client";
import { useActionState, useState } from "react";
import { PendingLabel } from "@/components/pending-label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import type { UnitPreferences } from "@/features/bets/types";
import { useClientReady } from "@/lib/use-client-ready";
import { displayAction, preferencesAction } from "./actions";

export function UnitSettings({
  preferences,
}: {
  preferences: UnitPreferences;
}) {
  const [state, action, pending] = useActionState(preferencesAction, {});
  const [size, setSize] = useState(
    preferences.unitSizePence ? String(preferences.unitSizePence / 100) : "",
  );
  const [mode, setMode] = useState(preferences.displayMode);
  const ready = useClientReady();
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="version" value={preferences.version} />
      <fieldset
        disabled={!ready || pending}
        className="grid min-w-0 gap-4 sm:grid-cols-2"
      >
        <Field>
          <FieldLabel htmlFor="unitSize">Unit size (£)</FieldLabel>
          <Input
            id="unitSize"
            name="unitSize"
            className="h-11 text-base"
            inputMode="decimal"
            placeholder="e.g. 50.00"
            value={size}
            onChange={(event) => setSize(event.target.value)}
            aria-describedby="unitSize-hint"
          />
          <FieldDescription id="unitSize-hint">
            New manual bets start with a 1u cash stake. Leave blank to use
            pounds only. Changing this keeps existing bets’ unit sizes.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="displayMode">Preferred display</FieldLabel>
          <NativeSelect
            id="displayMode"
            name="displayMode"
            value={mode}
            onChange={(event) => setMode(event.target.value as "gbp" | "units")}
          >
            <NativeSelectOption value="gbp">Pounds (£)</NativeSelectOption>
            <NativeSelectOption value="units">Units (u)</NativeSelectOption>
          </NativeSelect>
          <FieldDescription>
            Applies to your dashboard and history. Stake entry stays in pounds.
          </FieldDescription>
        </Field>
        <Button
          type="submit"
          className="h-11 w-fit"
          disabled={!ready || pending}
          aria-busy={pending}
        >
          <PendingLabel pending={pending}>Save unit settings</PendingLabel>
        </Button>
      </fieldset>
      {state.error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <p role="status" className="text-sm text-primary">
          {state.success}
        </p>
      )}
    </form>
  );
}
export function DisplayToggle({
  preferences,
}: {
  preferences: UnitPreferences;
}) {
  const [state, action, pending] = useActionState(displayAction, {});
  const ready = useClientReady();
  if (!preferences.unitSizePence && preferences.displayMode === "gbp")
    return null;
  return (
    <form action={action} className="mb-4 space-y-2">
      <fieldset
        disabled={!ready || pending}
        aria-label="Display amounts"
        className="flex gap-1"
      >
        {(
          [
            ["gbp", "£"],
            ["units", "Units"],
          ] as const
        ).map(([mode, label]) => (
          <Button
            key={mode}
            type="submit"
            name="displayMode"
            value={mode}
            aria-pressed={preferences.displayMode === mode}
            variant={preferences.displayMode === mode ? "secondary" : "ghost"}
            className="h-11 min-w-11"
            aria-label={`Display in ${mode === "gbp" ? "pounds" : "units"}`}
          >
            {label}
          </Button>
        ))}
      </fieldset>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}

"use client";
import { useActionState, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { optionAction } from "@/features/bets/actions";
import type { NamedOption } from "@/features/bets/types";
export function OptionForm({
  kind,
  id,
  option,
}: {
  kind: "bookmakers" | "sources";
  id: string;
  option?: NamedOption;
}) {
  const [state, action, pending] = useActionState(optionAction, {});
  const [name, setName] = useState(option?.name ?? "");
  const [active, setActive] = useState(option?.active ?? true);
  const fixed = kind === "sources" && option?.name === "Me";
  return (
    <form action={action} className="space-y-2 border-b py-3 last:border-0">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap items-center gap-2">
        <Field
          className="min-w-32 flex-1"
          data-invalid={Boolean(state.errors?.name?.length)}
        >
          <FieldLabel htmlFor={`${id}-name`} className="sr-only">
            {option
              ? `Name for ${option.name}`
              : `New ${kind === "sources" ? "source" : "bookmaker"} name`}
          </FieldLabel>
          <Input
            aria-invalid={Boolean(state.errors?.name?.length)}
            aria-describedby={
              state.errors?.name?.length ? `${id}-name-error` : undefined
            }
            className="h-11 text-base"
            id={`${id}-name`}
            name="name"
            value={name}
            readOnly={fixed}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={80}
          />
          <FieldError id={`${id}-name-error`}>
            {state.errors?.name?.join(" ")}
          </FieldError>
        </Field>
        <Field
          orientation="horizontal"
          className="min-h-11 w-auto"
          data-disabled={fixed}
        >
          <Checkbox
            id={`${id}-active`}
            aria-labelledby={`${id}-active-label`}
            name="active"
            value="on"
            checked={active}
            disabled={fixed || pending}
            onCheckedChange={setActive}
          />
          <FieldLabel
            id={`${id}-active-label`}
            htmlFor={`${id}-active`}
            className="min-h-11 text-xs"
          >
            Active
          </FieldLabel>
        </Field>
        <Button
          type="submit"
          className="h-11"
          variant="outline"
          disabled={pending || fixed}
        >
          {pending ? "Saving…" : option ? "Save" : "Add"}
        </Button>
      </div>
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <p role="status" className="text-xs text-primary">
          {state.success}
        </p>
      )}
    </form>
  );
}

"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
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
        <Input
          className="h-11 min-w-32 flex-1 text-base"
          name="name"
          aria-label={
            option
              ? `Name for ${option.name}`
              : `New ${kind === "sources" ? "source" : "bookmaker"} name`
          }
          value={name}
          readOnly={fixed}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={80}
        />
        <label className="flex min-h-11 items-center gap-2 text-xs">
          <input
            className="size-4 accent-primary"
            name="active"
            type="checkbox"
            checked={active}
            onChange={(event) => {
              if (!fixed) setActive(event.target.checked);
            }}
          />
          Active
        </label>
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
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-xs text-primary">
          {state.success}
        </p>
      )}
    </form>
  );
}

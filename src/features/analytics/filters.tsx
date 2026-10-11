import { z } from "zod";
import { Field, selectClass } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Ledger } from "@/features/bets/types";
import type { Filters } from "./metrics";

const schema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  bookmaker: z.uuid().optional(),
  source: z.uuid().optional(),
  sport: z.string().max(80).optional(),
  type: z.enum(["single", "acca"]).optional(),
  status: z
    .enum(["draft", "open", "settled", "won", "lost", "void", "cash_out"])
    .optional(),
});
export function readFilters(
  params: Record<string, string | string[] | undefined>,
): Filters {
  const clean = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => typeof value === "string" && value !== "",
    ),
  );
  const parsed = schema.safeParse(clean);
  return parsed.success ? parsed.data : {};
}
export function FilterForm({
  ledger,
  filters,
  dateLabel,
}: {
  ledger: Ledger;
  filters: Filters;
  dateLabel: string;
}) {
  const sports = [
    ...new Set(
      ledger.bets
        .flatMap((bet) => [bet.sport, ...bet.legs.map((leg) => leg.sport)])
        .filter(Boolean),
    ),
  ].sort();
  return (
    <details className="mb-6 rounded-xl border bg-card p-4">
      <summary className="cursor-pointer text-sm font-medium">
        Filter your ledger{" "}
        <span className="ml-2 font-normal text-muted-foreground">
          · {dateLabel}
        </span>
      </summary>
      <form className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field id="from" label="From">
          <Input
            className="h-11"
            id="from"
            name="from"
            type="date"
            defaultValue={filters.from}
          />
        </Field>
        <Field id="to" label="To (inclusive)">
          <Input
            className="h-11"
            id="to"
            name="to"
            type="date"
            defaultValue={filters.to}
          />
        </Field>
        {(
          [
            ["bookmaker", "Bookmaker", ledger.bookmakers],
            ["source", "Source", ledger.sources],
          ] as const
        ).map(([key, label, options]) => (
          <Field key={key} id={key} label={label}>
            <select
              className={selectClass}
              name={key}
              id={key}
              defaultValue={filters[key] ?? ""}
            >
              <option value="">All</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </Field>
        ))}
        <Field id="sport" label="Sport">
          <select
            className={selectClass}
            name="sport"
            id="sport"
            defaultValue={filters.sport ?? ""}
          >
            <option value="">All sports</option>
            {sports.map((sport) => (
              <option key={sport}>{sport}</option>
            ))}
          </select>
        </Field>
        <Field id="type" label="Bet type">
          <select
            className={selectClass}
            id="type"
            name="type"
            defaultValue={filters.type ?? ""}
          >
            <option value="">All types</option>
            <option value="single">Single</option>
            <option value="acca">Acca</option>
          </select>
        </Field>
        <Field id="status" label="Status">
          <select
            className={selectClass}
            id="status"
            name="status"
            defaultValue={filters.status ?? ""}
          >
            <option value="">All statuses</option>
            {[
              ["draft", "Draft"],
              ["open", "Open"],
              ["settled", "Settled"],
              ["won", "Won"],
              ["lost", "Lost"],
              ["void", "Void"],
              ["cash_out", "Full cash-out"],
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Button type="submit" className="h-11 self-end">
          Apply filters
        </Button>
      </form>
    </details>
  );
}

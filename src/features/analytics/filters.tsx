import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  marketOptions,
  normalizeMarket,
  sportOptions,
} from "@/features/bets/catalog";
import type { Ledger } from "@/features/bets/types";
import { FilterDisclosure } from "./filter-disclosure";
import type { Filters } from "./metrics";

export function FilterForm({
  ledger,
  filters,
  dateLabel,
}: {
  ledger: Ledger;
  filters: Filters;
  dateLabel: string;
}) {
  const sports = sportOptions(
    ledger.bets.flatMap((bet) => [
      bet.sport,
      ...bet.legs.map((leg) => leg.sport),
    ]),
    true,
  );
  const markets = [
    ...new Set([
      ...marketOptions(filters.sport ?? ""),
      ...ledger.bets
        .flatMap((bet) => [bet.market, ...bet.legs.map((leg) => leg.market)])
        .map(normalizeMarket)
        .filter(Boolean),
    ]),
  ].sort();
  return (
    <FilterDisclosure
      dateLabel={dateLabel}
      defaultOpen={Object.keys(filters).length > 0}
    >
      <form className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field>
          <FieldLabel htmlFor="from">From</FieldLabel>
          <Input
            className="h-11"
            id="from"
            name="from"
            type="date"
            defaultValue={filters.from}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="to">To (inclusive)</FieldLabel>
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
          <Field key={key}>
            <FieldLabel htmlFor={key}>{label}</FieldLabel>
            <NativeSelect name={key} id={key} defaultValue={filters[key] ?? ""}>
              <NativeSelectOption value="">All</NativeSelectOption>
              {options.map((option) => (
                <NativeSelectOption key={option.id} value={option.id}>
                  {option.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        ))}
        <Field>
          <FieldLabel htmlFor="sport">Sport</FieldLabel>
          <NativeSelect
            name="sport"
            id="sport"
            defaultValue={filters.sport ?? ""}
          >
            <NativeSelectOption value="">All sports</NativeSelectOption>
            {sports.map((sport) => (
              <NativeSelectOption key={sport}>{sport}</NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="market">Market type</FieldLabel>
          <NativeSelect
            id="market"
            name="market"
            defaultValue={filters.market ?? ""}
          >
            <NativeSelectOption value="">All markets</NativeSelectOption>
            {markets.map((market) => (
              <NativeSelectOption key={market} value={market}>
                {market}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="event">Event / fixture</FieldLabel>
          <Input
            id="event"
            name="event"
            className="h-11"
            defaultValue={filters.event}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="direction">Over / Under</FieldLabel>
          <NativeSelect
            id="direction"
            name="direction"
            defaultValue={filters.direction ?? ""}
          >
            <NativeSelectOption value="">All directions</NativeSelectOption>
            <NativeSelectOption value="over">Over</NativeSelectOption>
            <NativeSelectOption value="under">Under</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="line">Line / handicap</FieldLabel>
          <Input
            id="line"
            name="line"
            className="h-11"
            inputMode="decimal"
            pattern="[+-]?[0-9]+([.][0-9]{1,6})?"
            defaultValue={filters.line}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="inPlay">In-play</FieldLabel>
          <NativeSelect
            id="inPlay"
            name="inPlay"
            defaultValue={filters.inPlay ?? ""}
          >
            <NativeSelectOption value="">All bets</NativeSelectOption>
            <NativeSelectOption value="yes">In-play</NativeSelectOption>
            <NativeSelectOption value="no">Pre-match</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="type">Bet type</FieldLabel>
          <NativeSelect id="type" name="type" defaultValue={filters.type ?? ""}>
            <NativeSelectOption value="">All types</NativeSelectOption>
            <NativeSelectOption value="single">Single</NativeSelectOption>
            <NativeSelectOption value="acca">Acca</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="status">Status</FieldLabel>
          <NativeSelect
            id="status"
            name="status"
            defaultValue={filters.status ?? ""}
          >
            <NativeSelectOption value="">All statuses</NativeSelectOption>
            {[
              ["draft", "Draft"],
              ["open", "Open"],
              ["settled", "Settled"],
              ["won", "Won"],
              ["lost", "Lost"],
              ["void", "Void"],
              ["cash_out", "Full cash-out"],
            ].map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-4">
          Acca pick filters match the same leg. Profit and stakes remain for the
          whole bet.
        </p>
        <Button type="submit" className="h-11 self-end">
          Apply filters
        </Button>
      </form>
    </FilterDisclosure>
  );
}

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { sportOptions } from "@/features/bets/catalog";
import type { Ledger } from "@/features/bets/types";
import { FilterDisclosure } from "./filter-disclosure";
import { filterMarketOptions } from "./filter-options";
import { FilterSelectors } from "./filter-selectors";
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
  const marketsBySport = Object.fromEntries(
    ["", ...sports].map((sport) => [
      sport,
      filterMarketOptions(ledger.bets, sport),
    ]),
  );
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
        <FilterSelectors
          key={JSON.stringify(filters)}
          filters={filters}
          sports={sports}
          marketsBySport={marketsBySport}
          bookmakers={ledger.bookmakers.map((option) => ({
            value: option.id,
            label: option.name,
          }))}
          sources={ledger.sources.map((option) => ({
            value: option.id,
            label: option.name,
          }))}
        />
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

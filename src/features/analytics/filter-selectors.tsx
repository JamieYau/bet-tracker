"use client";

import { useEffect, useState } from "react";
import {
  SearchableSelect,
  type SelectOption,
} from "@/components/searchable-select";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import type { Filters } from "./metrics";

export function FilterSelectors({
  filters,
  sports,
  marketsBySport,
  bookmakers,
  sources,
}: {
  filters: Filters;
  sports: string[];
  marketsBySport: Record<string, string[]>;
  bookmakers: SelectOption[];
  sources: SelectOption[];
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [sport, setSport] = useState(filters.sport ?? "");
  const [market, setMarket] = useState(filters.market ?? "");
  const [bookmaker, setBookmaker] = useState(filters.bookmaker ?? "");
  const [source, setSource] = useState(filters.source ?? "");
  const markets = marketsBySport[sport] ?? marketsBySport[""];
  // Keep an applied legacy/direct-URL value visible until the user changes sport.
  const visibleMarkets =
    market && !markets.includes(market) ? [...markets, market].sort() : markets;
  return (
    <>
      {(
        [
          ["bookmaker", "Bookmaker", bookmaker, setBookmaker, bookmakers],
          ["source", "Source", source, setSource, sources],
        ] as const
      ).map(([id, label, value, change, options]) => (
        <Field key={id}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <SearchableSelect
            disabled={!ready}
            id={id}
            name={id}
            value={value}
            onValueChange={change}
            options={[{ value: "", label: "All" }, ...options]}
          />
        </Field>
      ))}
      <Field>
        <FieldLabel htmlFor="sport">Sport</FieldLabel>
        <NativeSelect
          disabled={!ready}
          id="sport"
          name="sport"
          value={sport}
          onChange={(event) => {
            const next = event.target.value;
            setSport(next);
            if (!marketsBySport[next]?.includes(market)) setMarket("");
          }}
        >
          <NativeSelectOption value="">All sports</NativeSelectOption>
          {sports.map((value) => (
            <NativeSelectOption key={value}>{value}</NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <Field>
        <FieldLabel htmlFor="market">Market type</FieldLabel>
        <SearchableSelect
          disabled={!ready}
          key={sport}
          id="market"
          name="market"
          value={market}
          onValueChange={setMarket}
          options={[
            { value: "", label: "All markets" },
            ...visibleMarkets.map((value) => ({ value, label: value })),
          ]}
        />
      </Field>
    </>
  );
}

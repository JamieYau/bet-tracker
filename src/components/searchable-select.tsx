"use client";

import type { AriaAttributes } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

export type SelectOption = { value: string; label: string };

export function SearchableSelect({
  id,
  name,
  value,
  onValueChange,
  options,
  placeholder = "Choose an option",
  disabled = false,
  ...aria
}: {
  id: string;
  name?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
} & Pick<AriaAttributes, "aria-invalid" | "aria-describedby">) {
  const selected = options.find((option) => option.value === value) ?? null;
  return (
    <>
      {name && (
        <input type="hidden" name={name} value={value} disabled={disabled} />
      )}
      <Combobox
        items={options}
        value={selected}
        onValueChange={(option) => onValueChange(option?.value ?? "")}
        itemToStringLabel={(option) => option.label}
        isItemEqualToValue={(a, b) => a.value === b.value}
        disabled={disabled}
      >
        <ComboboxInput
          id={id}
          className="h-11 w-full min-w-0 [&_input]:text-base"
          placeholder={placeholder}
          disabled={disabled}
          onFocus={(event) => event.currentTarget.select()}
          onBeforeInput={(event) => {
            if (event.currentTarget.value === selected?.label)
              event.currentTarget.select();
          }}
          onClick={(event) => {
            if (event.currentTarget.value === selected?.label)
              event.currentTarget.select();
          }}
          {...aria}
        />
        <ComboboxContent>
          <ComboboxEmpty>No matches found.</ComboboxEmpty>
          <ComboboxList>
            {(option: SelectOption) => (
              <ComboboxItem
                key={option.value}
                value={option}
                className="min-h-11 whitespace-normal break-words"
              >
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </>
  );
}

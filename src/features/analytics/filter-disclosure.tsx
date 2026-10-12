"use client";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
export function FilterDisclosure({
  dateLabel,
  defaultOpen,
  children,
}: {
  dateLabel: string;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="mb-6 rounded-xl border bg-card p-4"
    >
      <CollapsibleTrigger
        type="button"
        className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-lg text-left text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span>
          Filter your ledger{" "}
          <span className="font-normal text-muted-foreground">
            · {dateLabel}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform group-data-[panel-open]:rotate-180 motion-reduce:transition-none"
        />
      </CollapsibleTrigger>
      <CollapsibleContent keepMounted>{children}</CollapsibleContent>
    </Collapsible>
  );
}

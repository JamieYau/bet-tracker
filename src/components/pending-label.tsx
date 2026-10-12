import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";

/** Both labels occupy the same grid cell so pending state cannot resize the button. */
export function PendingLabel({
  pending,
  children,
  pendingText = "Saving…",
}: {
  pending: boolean;
  children: ReactNode;
  pendingText?: string;
}) {
  return (
    <span className="inline-grid">
      <span
        className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-2 ${pending ? "invisible" : ""}`}
        aria-hidden={pending || undefined}
      >
        <span className="size-4 shrink-0" aria-hidden="true" />
        {children}
      </span>
      <span
        className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-2 ${pending ? "" : "invisible"}`}
        aria-hidden={!pending || undefined}
      >
        {pending ? (
          <Spinner
            aria-hidden="true"
            role="presentation"
            aria-label={undefined}
            className="motion-reduce:animate-none"
          />
        ) : (
          <span className="size-4 shrink-0" />
        )}
        {pendingText}
      </span>
    </span>
  );
}

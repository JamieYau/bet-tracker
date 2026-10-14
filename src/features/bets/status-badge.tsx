import { Badge } from "@/components/ui/badge";
import { outcomeLabel } from "@/lib/format";
import type { Bet, Outcome } from "./types";

export function StatusBadge({ status }: { status: Bet["status"] | Outcome }) {
  const variant =
    status === "won"
      ? "success"
      : status === "lost"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{outcomeLabel(status)}</Badge>;
}

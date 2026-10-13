import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
export const TIME_ZONE = "Europe/London";
export function money(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}
export function formatOdds(value: string | null) {
  if (!value) return "—";
  return value.includes(".") ? value.replace(/\.?0+$/, "") : value;
}
export function dateTime(value: string) {
  return formatInTimeZone(value, TIME_ZONE, "d MMM yyyy, HH:mm");
}
export function londonInput(value: string = new Date().toISOString()) {
  return formatInTimeZone(value, TIME_ZONE, "yyyy-MM-dd'T'HH:mm");
}
export function londonToUtc(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error("Enter a valid date and time.");
  const date = fromZonedTime(value, TIME_ZONE);
  if (Number.isNaN(date.getTime()) || londonInput(date.toISOString()) !== value)
    throw new Error(
      "That London time does not exist. Check the daylight-saving change.",
    );
  return date.toISOString();
}
export function outcomeLabel(value: string) {
  return (
    (
      {
        won: "Won",
        lost: "Lost",
        void: "Void",
        cash_out: "Full cash-out",
        draft: "Draft",
        open: "Open",
        settled: "Settled",
      } as Record<string, string>
    )[value] ?? value
  );
}

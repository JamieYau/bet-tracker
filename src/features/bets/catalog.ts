export const SPORTS = [
  "NFL",
  "Football",
  "NCAAF",
  "WNBA",
  "Tennis",
  "NBA",
] as const;

const common = [
  "Moneyline",
  "Spread",
  "Game total points",
  "Team total points",
];
const basketball = [
  ...common,
  "Player points",
  "Player rebounds",
  "Player assists",
  "Player points + rebounds + assists",
  "Player three-pointers",
  "Player steals",
  "Player blocks",
];
const americanFootball = [
  ...common,
  "Player passing yards",
  "Player passing touchdowns",
  "Player rushing yards",
  "Player receiving yards",
  "Player receptions",
  "Anytime touchdown scorer",
];
const markets: Record<string, readonly string[]> = {
  NFL: americanFootball,
  NCAAF: americanFootball,
  NBA: basketball,
  WNBA: basketball,
  Football: [
    "Match result",
    "Draw no bet",
    "Double chance",
    "Handicap",
    "Total goals",
    "Team total goals",
    "Both teams to score",
    "Player goals",
    "Player shots",
    "Player shots on target",
    "Cards",
    "Player cards",
    "Corners",
  ],
  Tennis: [
    "Match winner",
    "Set winner",
    "Game handicap",
    "Set handicap",
    "Total games",
    "Total sets",
    "Player aces",
    "Tournament winner",
  ],
};

export function normalizeSport(value: string) {
  const trimmed = value.trim();
  if (trimmed.toLowerCase() === "soccer") return "Football";
  if (trimmed.toLowerCase() === "mixed") return "Mixed";
  return (
    SPORTS.find((sport) => sport.toLowerCase() === trimmed.toLowerCase()) ??
    trimmed
  );
}

export function marketOptions(sport: string): readonly string[] {
  return (
    markets[normalizeSport(sport)] ?? [
      ...new Set(Object.values(markets).flat()),
    ]
  );
}

export function normalizeMarket(value: string) {
  const trimmed = value.trim();
  return (
    marketOptions("").find(
      (market) => market.toLowerCase() === trimmed.toLowerCase(),
    ) ?? trimmed
  );
}

export function sportOptions(values: string[], includeMixed = false) {
  const extras = values
    .map(normalizeSport)
    .filter(
      (value) =>
        value && !SPORTS.some((sport) => sport === value) && value !== "Mixed",
    );
  return [
    ...SPORTS,
    ...(includeMixed ? ["Mixed"] : []),
    ...new Map(extras.map((value) => [value.toLowerCase(), value])).values(),
  ];
}

export function selectionLabel(pick: {
  selection: string;
  direction?: string;
  line?: string | null;
  market: string;
}) {
  const direction =
    pick.direction === "over"
      ? "Over"
      : pick.direction === "under"
        ? "Under"
        : "";
  let line = pick.line?.includes(".")
    ? pick.line.replace(/\.?0+$/, "")
    : (pick.line ?? "");
  if (
    line &&
    Number(line) > 0 &&
    !line.startsWith("+") &&
    ["Spread", "Handicap", "Game handicap", "Set handicap"].includes(
      pick.market,
    )
  )
    line = `+${line}`;
  return [pick.selection, [direction, line].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(" ");
}

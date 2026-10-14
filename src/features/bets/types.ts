export const BOOKMAKERS = [
  "Unibet",
  "Coral",
  "Betfred",
  "Paddy Power",
  "Virgin Bet",
  "Betway",
  "Sky Bet",
  "SBK",
  "888sport",
  "BetMGM",
  "BoyleSports",
  "Ladbrokes",
  "bet365",
] as const;
export const OUTCOMES = ["won", "lost", "void", "cash_out"] as const;
export type Outcome = (typeof OUTCOMES)[number];
export type Leg = {
  id: string;
  selection: string;
  market: string;
  event?: string;
  direction?: "" | "over" | "under";
  line?: string | null;
  sport: string;
  odds: string | null;
  status: "open" | "won" | "lost" | "void";
};
export type BetInput = {
  bookmakerId: string;
  sourceId: string;
  placedAt: string;
  sport: string;
  selection: string;
  market: string;
  event?: string;
  direction?: "" | "over" | "under";
  line?: string | null;
  acceptedOdds: string | null;
  cashStakePence: number;
  freeStakePence: number;
  freeStakeReturned: boolean;
  betType: "single" | "acca";
  reference: string;
  notes: string;
  tags: string[];
  legs: Leg[];
};
export type Settlement = {
  id: string;
  betId: string;
  revision: number;
  outcome: Outcome;
  returnPence: number;
  settledAt: string;
  earlyPayout: boolean;
  reason: string;
  createdAt: string;
  requestKey: string;
};
export type Bet = BetInput & {
  id: string;
  ownerId: string;
  status: "draft" | "open" | "settled";
  version: number;
  createdAt: string;
  settlements: Settlement[];
  deletedAt?: string | null;
};
export type NamedOption = { id: string; name: string; active: boolean };
export type Ledger = {
  bets: Bet[];
  bookmakers: NamedOption[];
  sources: NamedOption[];
};
export type ActionState = {
  error?: string;
  errors?: Record<string, string[]>;
  success?: string;
  id?: string;
};

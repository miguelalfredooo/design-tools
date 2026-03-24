export type DataConfidenceState = "unverified" | "in_review" | "confirmed";

export interface DataConfidenceMeta {
  state: DataConfidenceState;
  label: string;
  source: string;
  owner: string;
  verifiedAt?: string;
  note?: string;
}

export const dataConfidenceCopy: Record<
  DataConfidenceState,
  { badge: string; className: string }
> = {
  unverified: {
    badge: "Unverified",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  in_review: {
    badge: "In Review",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  confirmed: {
    badge: "Confirmed",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
};

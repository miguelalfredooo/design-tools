export type CreatorToolsFeedbackReactionType =
  | "working"
  | "unclear"
  | "not_useful"
  | "promising";

export type CreatorToolsFeedbackTargetType =
  | "finding"
  | "opportunity"
  | "theme"
  | "audience_segment"
  | "thread"
  | "action";

export interface CreatorToolsFeedbackTarget {
  page: "overview" | "themes" | "audience" | "threads" | "actions";
  targetType: CreatorToolsFeedbackTargetType;
  targetId: string;
}

export interface CreatorToolsFeedbackEntry extends CreatorToolsFeedbackTarget {
  id: string;
  voterId: string;
  voterName: string | null;
  reaction: CreatorToolsFeedbackReactionType | null;
  note: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CreatorToolsFeedbackSummary {
  counts: Record<CreatorToolsFeedbackReactionType, number>;
  entries: CreatorToolsFeedbackEntry[];
  currentEntry: CreatorToolsFeedbackEntry | null;
}

export const creatorToolsFeedbackReactionMeta: Record<
  CreatorToolsFeedbackReactionType,
  { label: string; shortLabel: string }
> = {
  working: { label: "Working", shortLabel: "Working" },
  unclear: { label: "Unclear", shortLabel: "Unclear" },
  not_useful: { label: "Not useful", shortLabel: "Not useful" },
  promising: { label: "Promising", shortLabel: "Promising" },
};

export const creatorToolsFeedbackReactionOrder: CreatorToolsFeedbackReactionType[] = [
  "working",
  "unclear",
  "not_useful",
  "promising",
];

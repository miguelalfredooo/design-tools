import type {
  CreatorToolsFeedbackEntry,
  CreatorToolsFeedbackTargetType,
} from "@/lib/creator-tools-feedback-types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function creatorToolsFeedbackId(
  page: "overview" | "themes" | "audience" | "threads" | "actions",
  targetType: CreatorToolsFeedbackTargetType,
  label: string
): string {
  return `${page}:${targetType}:${slugify(label)}`;
}

export const seedCreatorToolsFeedback: CreatorToolsFeedbackEntry[] = [
  {
    id: "feedback-overview-finding-1",
    page: "overview",
    targetType: "finding",
    targetId: creatorToolsFeedbackId(
      "overview",
      "finding",
      "Meal prep is becoming the community's anchor topic"
    ),
    voterId: "seed-1",
    voterName: "Design lead",
    reaction: "working",
    note: "This makes the main signal clear immediately.",
    createdAt: Date.now() - 86_400_000,
    updatedAt: Date.now() - 86_400_000,
  },
  {
    id: "feedback-theme-budget",
    page: "themes",
    targetType: "theme",
    targetId: creatorToolsFeedbackId("themes", "theme", "Budget shortcuts"),
    voterId: "seed-2",
    voterName: "PM",
    reaction: "promising",
    note: "This feels like a useful bridge between insight and next-step programming.",
    createdAt: Date.now() - 43_200_000,
    updatedAt: Date.now() - 43_200_000,
  },
];

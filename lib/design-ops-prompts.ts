import type { Objective } from "@/lib/design-ops-types";

function compact(value: string | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

export function buildRecommendedPrompt(objective: Objective | null) {
  if (!objective) return "";

  const title = compact(objective.title).replace(/[.?!]+$/, "");
  const target = compact(objective.target);
  const metric = compact(objective.metric);

  return [
    `What is the strongest near-term strategy for ${title.toLowerCase()}?`,
    "Compare the most likely product, lifecycle, or messaging levers and recommend what to test first.",
    metric ? `Center the recommendation on improving ${metric.replaceAll("_", " ")}.` : "",
    target ? `Keep the target in mind: ${target}.` : "",
    "Call out what additional signals would most improve confidence.",
  ]
    .filter(Boolean)
    .join(" ");
}


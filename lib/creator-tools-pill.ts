export function getCreatorToolsPillClass(label: string) {
  const normalized = label.trim().toLowerCase();

  if (
    normalized.includes("performance") ||
    normalized.includes("working") ||
    normalized.includes("theme")
  ) {
    return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-200";
  }

  if (
    normalized.includes("participation") ||
    normalized.includes("show up") ||
    normalized.includes("conversation") ||
    normalized.includes("question")
  ) {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200";
  }

  if (
    normalized.includes("action") ||
    normalized.includes("next step") ||
    normalized.includes("respond") ||
    normalized.includes("post today") ||
    normalized.includes("worth a reply")
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200";
  }

  if (
    normalized.includes("control") ||
    normalized.includes("scheduled") ||
    normalized.includes("awaiting review") ||
    normalized.includes("draft")
  ) {
    return "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/70 dark:bg-violet-950/40 dark:text-violet-200";
  }

  if (
    normalized.includes("high momentum") ||
    normalized.includes("rising") ||
    normalized.includes("returning")
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200";
  }

  if (normalized.includes("steady")) {
    return "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200";
  }

  if (
    normalized.includes("cooling") ||
    normalized.includes("needs more depth")
  ) {
    return "border-stone-200 bg-stone-50 text-stone-800 dark:border-stone-800 dark:bg-stone-900/40 dark:text-stone-200";
  }

  if (
    normalized.includes("reactiv") ||
    normalized.includes("lapsed")
  ) {
    return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200";
  }

  return "border-border bg-secondary/40 text-foreground";
}

export function getCreatorToolsToneClass(label: string) {
  const normalized = label.trim().toLowerCase();

  if (
    normalized.includes("performance") ||
    normalized.includes("working") ||
    normalized.includes("theme")
  ) {
    return "border-sky-200/80 bg-sky-50/90 text-sky-950 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-100";
  }

  if (
    normalized.includes("participation") ||
    normalized.includes("show up") ||
    normalized.includes("conversation") ||
    normalized.includes("question")
  ) {
    return "border-amber-200/80 bg-amber-50/90 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100";
  }

  if (
    normalized.includes("action") ||
    normalized.includes("next step") ||
    normalized.includes("respond") ||
    normalized.includes("post today") ||
    normalized.includes("worth a reply")
  ) {
    return "border-emerald-200/80 bg-emerald-50/90 text-emerald-950 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-100";
  }

  if (
    normalized.includes("control") ||
    normalized.includes("scheduled") ||
    normalized.includes("awaiting review") ||
    normalized.includes("draft")
  ) {
    return "border-violet-200/80 bg-violet-50/90 text-violet-950 dark:border-violet-900/70 dark:bg-violet-950/30 dark:text-violet-100";
  }

  if (
    normalized.includes("high momentum") ||
    normalized.includes("rising") ||
    normalized.includes("returning")
  ) {
    return "border-emerald-200/80 bg-emerald-50/90 text-emerald-950 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-100";
  }

  if (normalized.includes("steady")) {
    return "border-slate-200/80 bg-slate-50/90 text-slate-900 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-100";
  }

  if (
    normalized.includes("cooling") ||
    normalized.includes("needs more depth")
  ) {
    return "border-stone-200/80 bg-stone-50/90 text-stone-900 dark:border-stone-800 dark:bg-stone-900/40 dark:text-stone-100";
  }

  if (normalized.includes("reactiv") || normalized.includes("lapsed")) {
    return "border-rose-200/80 bg-rose-50/90 text-rose-950 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-100";
  }

  return "border-border bg-secondary/20 text-foreground";
}

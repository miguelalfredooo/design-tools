export function toPlainText(value: string): string {
  return value
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface PlainTextSection {
  label: string;
  content: string[];
}

const INLINE_SECTION_MARKERS = [
  "SUBJECT",
  "CONFIDENCE",
  "READINESS",
  "OBJECTIVE",
  "ANALYSIS",
  "TOP FINDINGS",
  "TOP NEEDS",
  "WHAT WE HAVE",
  "WHAT WOULD IMPROVE CONFIDENCE",
  "ADDITIONAL SIGNALS WORTH GATHERING",
  "FINDINGS",
  "ASSUMPTIONS",
  "RECOMMENDATIONS",
  "RECOMMENDATION",
  "NEXT STEPS",
  "NEXT STEP",
  "SIGNALS",
  "EVIDENCE",
  "RISKS",
  "IMPLICATIONS",
  "SUMMARY",
  "DETAILS",
  "CONCLUSION",
];

function normalizeSectionLabel(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized === "subject") return "Summary";
  if (normalized === "confidence") return "Confidence";
  if (normalized === "analysis" || normalized === "summary") return "Summary";
  if (normalized === "readiness") return "Readiness";
  if (normalized === "objective") return "Objective";
  if (normalized === "top findings") return "Top findings";
  if (normalized === "top needs") return "Top needs";
  if (normalized === "what we have") return "Available inputs";
  if (normalized === "what would improve confidence") {
    return "Additional signals";
  }
  if (normalized === "additional signals worth gathering") {
    return "Additional signals";
  }
  if (normalized === "assumptions") return "Assumptions";
  if (normalized === "recommendation" || normalized === "recommendations") {
    return "Recommendations";
  }
  if (normalized === "finding" || normalized === "findings") return "Findings";
  if (normalized === "next step" || normalized === "next steps") return "Next steps";
  if (normalized === "signals" || normalized === "evidence") return "Signals";
  if (normalized === "details") return "Details";
  if (normalized === "risks") return "Risks";
  if (normalized === "implications") return "Implications";
  if (normalized === "conclusion") return "Conclusion";
  return "Summary";
}

function splitInlineMarkers(value: string): string {
  const markerPattern = new RegExp(
    `\\s+(${INLINE_SECTION_MARKERS.join("|")})\\s*:?(?=\\s+)`,
    "g"
  );

  return value.replace(markerPattern, "\n\n$1: ");
}

export function formatPlainTextSections(value: string): PlainTextSection[] {
  const normalized = splitInlineMarkers(toPlainText(value));

  if (!normalized) {
    return [];
  }

  const blocks = normalized
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return [];
  }

  const sections: PlainTextSection[] = [];

  for (const block of blocks) {
    const markerMatch = block.match(
      /^([A-Z][A-Z\s]+):\s*([\s\S]*)$/m
    );

    if (markerMatch) {
      const [, rawLabel, rawContent] = markerMatch;
      sections.push({
        label: normalizeSectionLabel(rawLabel.trim()),
        content: rawContent
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      });
      continue;
    }

    sections.push({
      label: sections.length === 0 ? "Summary" : "Details",
      content: block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    });
  }

  return sections.filter((section) => section.content.length > 0);
}

/**
 * Extract a named section from a structured plain-text synthesis body.
 * Sections are delimited by ALL-CAPS labels followed by a colon.
 * Returns the section content as a trimmed string, or "" if not found.
 *
 * Example body:
 *   "TOP FINDINGS:\n- Finding one\n- Finding two\nRECOMMENDATION:\nDo X."
 *
 * extractSection(body, "TOP FINDINGS") → "- Finding one\n- Finding two"
 */
export function extractSection(body: string, sectionName: string): string {
  const escaped = sectionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `${escaped}\\s*:?\\s*\\n([\\s\\S]*?)(?=\\n[A-Z][A-Z\\s]+:\\s*\\n|$)`,
    "i"
  );
  const match = body.match(pattern);
  return match ? match[1].trim() : "";
}

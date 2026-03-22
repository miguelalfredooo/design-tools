// scripts/test-transmitter-quality.ts

import Anthropic from "@anthropic-ai/sdk";
import {
  augmentPromptWithBooks,
  appendCitations,
} from "../lib/augment-prompt";

interface TestDecision {
  id: string;
  decision: string;
  userRationale: string;
  bizRationale: string;
  objection?: string;
  domain: string;
}

const testDecisions: TestDecision[] = [
  {
    id: "test-1",
    domain: "Onboarding",
    decision: "Moved the primary CTA below the fold to reduce immediate pressure",
    userRationale: "Users felt rushed to commit without understanding value",
    bizRationale: "Higher initial skepticism is better than drop-offs after signup",
    objection: "Won't conversion go down if the CTA is less prominent?",
  },
  {
    id: "test-2",
    domain: "Critique",
    decision: "Added a 'Show working' option where designers sketch openly during crit",
    userRationale: "Designers felt judged on finished work; sketches make it clear thinking is iterative",
    bizRationale: "More confident designers take bigger creative risks",
    objection: "Unfinished work might confuse stakeholders or look unprofessional",
  },
  {
    id: "test-3",
    domain: "Communication",
    decision: "Changed design reviews to 45 min max with a hard agenda cutoff",
    userRationale: "Open-ended crits run long and designers stop listening by hour 2",
    bizRationale: "Faster feedback loops ship features quicker",
    objection: "What if we run out of time to cover important feedback?",
  },
  {
    id: "test-4",
    domain: "Research",
    decision: "Reframed research questions to test assumptions, not validate preferences",
    userRationale: "Designers often use research to prove they were right, not to learn",
    bizRationale: "Research is only valuable if it changes decisions",
    objection: "Aren't we just leading the witness if we frame questions that way?",
  },
  {
    id: "test-5",
    domain: "Feedback",
    decision: "Moved feedback collection to async written form instead of live discussion",
    userRationale: "Introverts and non-native speakers don't speak up in live crits",
    bizRationale: "We hear from more perspectives, which surfaces blind spots",
    objection: "Async feedback loses the nuance and spontaneous insights of live discussion",
  },
];

const ORIGINAL_PROMPT = `You are a senior product designer helping articulate a design decision to stakeholders.
Be concise, concrete, and persuasive. Avoid jargon.

Write a 3-part response:
1. ONE sentence that names the decision and its core user benefit
2. ONE sentence connecting it to the business goal
3. A short reframe of the likely objection (2-3 sentences that acknowledge it and redirect)

Format clearly. No bullet points. Use plain, direct language the audience will trust.`;

async function generateWithoutBooks(test: TestDecision): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic({ apiKey });
  const prompt = `${ORIGINAL_PROMPT}

Decision: ${test.decision}
User rationale: ${test.userRationale}
Business rationale: ${test.bizRationale}
${test.objection ? `Likely objection: ${test.objection}` : ""}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}

async function generateWithBooks(test: TestDecision): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const searchQuery = [
    test.decision,
    test.userRationale,
    test.bizRationale,
    test.objection,
  ]
    .filter(Boolean)
    .join(" ");

  const { augmentedPrompt, bookResults } = augmentPromptWithBooks(
    ORIGINAL_PROMPT,
    searchQuery
  );

  const fullPrompt = `${augmentedPrompt}

Decision: ${test.decision}
User rationale: ${test.userRationale}
Business rationale: ${test.bizRationale}
${test.objection ? `Likely objection: ${test.objection}` : ""}`;

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: fullPrompt }],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";
  return appendCitations(responseText, bookResults);
}

async function runTests() {
  console.log("Transmitter Quality Test\n");
  console.log("=".repeat(60));

  for (const test of testDecisions) {
    console.log(`\n[${test.id}] ${test.domain}: ${test.decision}\n`);

    console.log("Generating WITHOUT book context...");
    const withoutBooks = await generateWithoutBooks(test);

    console.log("\nGenerating WITH book context...");
    const withBooks = await generateWithBooks(test);

    console.log("\n--- WITHOUT BOOKS ---");
    console.log(withoutBooks);

    console.log("\n--- WITH BOOKS ---");
    console.log(withBooks);

    console.log("\n" + "-".repeat(60));
  }

  console.log(
    "\nTest complete. Compare outputs manually to assess quality improvements.\n"
  );
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});

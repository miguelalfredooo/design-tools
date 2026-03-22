import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  augmentPromptWithBooks,
  appendCitations,
} from "@/lib/augment-prompt";

const ORIGINAL_ARTICULATE_PROMPT = `You are a senior product designer helping articulate a design decision to stakeholders. Be concise, concrete, and persuasive. Avoid jargon.

Write a 3-part response:
1. ONE sentence that names the decision and its core user benefit
2. ONE sentence connecting it to the business goal
3. A short reframe of the likely objection (2-3 sentences that acknowledge it and redirect)

Format clearly. No bullet points. Use plain, direct language the audience will trust.`;

interface ArticulateRequest {
  decision: string;
  userRationale: string;
  bizRationale: string;
  objection?: string;
  audience?: string;
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  let body: ArticulateRequest;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { decision, userRationale, bizRationale, objection, audience } = body;

  if (!decision || !userRationale) {
    return NextResponse.json(
      { error: "decision and userRationale are required" },
      { status: 400 }
    );
  }

  const searchQuery = [decision, userRationale, bizRationale, objection]
    .filter(Boolean)
    .join(" ");

  const { augmentedPrompt, bookResults } = augmentPromptWithBooks(
    ORIGINAL_ARTICULATE_PROMPT,
    searchQuery
  );

  const fullPrompt = `${augmentedPrompt}

Decision: ${decision}
User rationale: ${userRationale}
Business rationale: ${bizRationale}
${objection ? `Likely objection: ${objection}` : ""}
${audience ? `Audience: ${audience}` : ""}`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: fullPrompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const outputWithCitations = appendCitations(responseText, bookResults);

    return NextResponse.json({
      response: outputWithCitations,
      bookSources: bookResults.map(r => ({
        book: r.book.title,
        chapter: r.chapter.title,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Claude API error: ${message}` },
      { status: 500 }
    );
  }
}

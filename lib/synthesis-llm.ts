import Anthropic from "@anthropic-ai/sdk";

const SYNTHESIS_PROVIDER = process.env.SYNTHESIS_PROVIDER || "openai";
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_SYNTHESIS_MODEL =
  process.env.OPENAI_SYNTHESIS_MODEL || "gpt-5.1-chat-latest";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_SYNTHESIS_MODEL =
  process.env.ANTHROPIC_SYNTHESIS_MODEL || "claude-sonnet-4-5-20250929";

function isAnthropicProvider() {
  return SYNTHESIS_PROVIDER === "anthropic";
}

export function getSynthesisModelName(): string {
  return isAnthropicProvider()
    ? ANTHROPIC_SYNTHESIS_MODEL
    : OPENAI_SYNTHESIS_MODEL;
}

export async function generateSynthesisText(prompt: string): Promise<string> {
  return isAnthropicProvider()
    ? generateWithAnthropic(prompt)
    : generateWithOpenAI(prompt);
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key is missing. Set OPENAI_API_KEY.");
  }

  const res = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_SYNTHESIS_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error (${res.status}): ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;

  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const textContent = content
      .map((item) => (typeof item?.text === "string" ? item.text : ""))
      .join("")
      .trim();
    if (textContent) return textContent;
  }

  throw new Error("OpenAI returned an empty completion");
}

async function generateWithAnthropic(prompt: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("Anthropic API key is missing. Set ANTHROPIC_API_KEY.");
  }

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: ANTHROPIC_SYNTHESIS_MODEL,
    max_tokens: 4096,
    temperature: 0.3,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .map((block) => ("text" in block ? block.text : ""))
    .join("")
    .trim();

  if (!text) {
    throw new Error("Anthropic returned an empty completion");
  }

  return text;
}

export function parseLLMJSON<T>(response: string): T {
  let jsonStr = response.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "");
  }
  return JSON.parse(jsonStr);
}

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { generateRequestSchema, fetchFigmaNodeTree } from "@/lib/figma";

const MAX_NODE_TREE_BYTES = 100_000;

export async function POST(request: Request) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server" },
      { status: 500 }
    );
  }

  const figmaToken = process.env.FIGMA_ACCESS_TOKEN;
  if (!figmaToken) {
    return NextResponse.json(
      { error: "FIGMA_ACCESS_TOKEN is not configured on the server" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request: fileKey, nodeId, and screenshotUrl are required" },
      { status: 400 }
    );
  }

  const { fileKey, nodeId, screenshotUrl } = parsed.data;

  // Fetch Figma node tree
  let nodeTree: unknown;
  try {
    nodeTree = await fetchFigmaNodeTree(fileKey, nodeId, figmaToken);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch Figma node tree";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Truncate node tree JSON at 100KB safety valve
  let nodeTreeJson = JSON.stringify(nodeTree, null, 2);
  if (nodeTreeJson.length > MAX_NODE_TREE_BYTES) {
    nodeTreeJson = nodeTreeJson.slice(0, MAX_NODE_TREE_BYTES) + "\n... (truncated)";
  }

  const client = new Anthropic({ apiKey: anthropicKey });

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system:
      "You are a frontend code generator. Output ONLY valid HTML markup with Tailwind CSS v4 classes. " +
      "Include a <script src=\"https://cdn.tailwindcss.com\"></script> tag in the <head> so the file is self-contained. " +
      "Use arbitrary values like `bg-[#hex]` for exact colors from the design. " +
      "Preserve all text content exactly as shown. " +
      "Use placeholder <img> tags with descriptive alt text for images. " +
      "Do NOT include any explanation, markdown fences, or commentary — only the raw HTML.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "url",
              url: screenshotUrl,
            },
          },
          {
            type: "text",
            text:
              "Here is the Figma node tree for this component:\n\n" +
              nodeTreeJson +
              "\n\nGenerate a self-contained HTML file with Tailwind CSS that recreates this design as closely as possible.",
          },
        ],
      },
    ],
  });

  // Pipe text deltas as chunked text/plain
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            const text = event.delta.text;
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

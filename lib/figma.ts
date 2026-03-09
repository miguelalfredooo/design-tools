import { z } from "zod";

export const figmaRequestSchema = z.object({
  fileKey: z.string().min(1),
  nodeId: z.string().min(1),
});

export const generateRequestSchema = z.object({
  fileKey: z.string().min(1),
  nodeId: z.string().min(1),
  screenshotUrl: z.string().url(),
});

const figmaImagesResponseSchema = z.object({
  err: z.nullable(z.string()),
  images: z.record(z.string(), z.nullable(z.string())),
});

export async function fetchFigmaScreenshot(
  fileKey: string,
  nodeId: string,
  token: string
): Promise<string> {
  const url = `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=png&scale=2`;

  const res = await fetch(url, {
    headers: { "X-Figma-Token": token },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Figma API ${res.status}: ${text}`);
  }

  const data = figmaImagesResponseSchema.parse(await res.json());

  if (data.err) {
    throw new Error(`Figma API error: ${data.err}`);
  }

  const imageUrl = Object.values(data.images)[0];
  if (!imageUrl) {
    throw new Error("Figma returned no image for the requested node");
  }

  return imageUrl;
}

const figmaNodesResponseSchema = z.object({
  nodes: z.record(
    z.string(),
    z.nullable(z.object({ document: z.unknown() }))
  ),
});

export async function fetchFigmaNodeTree(
  fileKey: string,
  nodeId: string,
  token: string
): Promise<unknown> {
  const url = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`;

  const res = await fetch(url, {
    headers: { "X-Figma-Token": token },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Figma API ${res.status}: ${text}`);
  }

  const data = figmaNodesResponseSchema.parse(await res.json());

  const node = Object.values(data.nodes)[0];
  if (!node) {
    throw new Error("Figma returned no node for the requested ID");
  }

  return node.document;
}

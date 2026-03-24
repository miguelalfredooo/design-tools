import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const DIRECTIONS_FILE = path.join(process.cwd(), "data", "design-directions.json");
const OBJECTIVES_FILE = path.join(process.cwd(), "data", "objectives.json");
const MODULES_FILE = path.join(process.cwd(), "data", "design-ops-modules.json");
const CREW_URL = process.env.CREW_URL || "http://localhost:8000";

export async function POST() {
  const db = getSupabaseAdmin();

  // Gather all context in parallel
  const [obsResult, segsResult, itemsResult, objectivesRaw, modulesRaw] = await Promise.all([
    db.from("research_observations").select("id,body,area,contributor").order("created_at", { ascending: false }).limit(60),
    db.from("research_segments").select("id,name"),
    db.from("research_segment_items").select("id,segment_id,bucket,title,body"),
    fs.readFile(OBJECTIVES_FILE, "utf8").catch(() => "[]"),
    fs.readFile(MODULES_FILE, "utf8").catch(() => "[]"),
  ]);

  const observations = obsResult.data ?? [];
  const rawSegments = segsResult.data ?? [];
  const rawItems = itemsResult.data ?? [];
  const objectives = JSON.parse(objectivesRaw);
  const modules = JSON.parse(modulesRaw);

  // Attach items to segments
  const segments = rawSegments.map((seg: { id: string; name: string }) => ({
    ...seg,
    items: rawItems.filter((i: { segment_id: string }) => i.segment_id === seg.id),
  }));

  // Stream from crew /directions endpoint
  const crewRes = await fetch(`${CREW_URL}/directions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ observations, segments, objectives, modules }),
  });

  if (!crewRes.ok || !crewRes.body) {
    return NextResponse.json({ error: "Crew service unavailable" }, { status: 502 });
  }

  // Collect all directions then save + stream to client
  const collected: object[] = [];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = crewRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("event:")) {
            // passthrough — will be combined with the data line
          } else if (line.startsWith("data:")) {
            // passthrough raw SSE to client
          }
          // Forward raw SSE line to client
          controller.enqueue(encoder.encode(line + "\n"));

          // Collect direction objects
          if (line.startsWith("data:")) {
            try {
              const payload = JSON.parse(line.slice(5).trim());
              if (payload.title && payload.problem) {
                collected.push(payload);
              }
            } catch { /* ignore parse errors on non-direction events */ }
          }
        }
      }

      // Save collected directions to file
      if (collected.length > 0) {
        await fs.writeFile(
          DIRECTIONS_FILE,
          JSON.stringify(collected, null, 2),
          "utf8"
        );
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

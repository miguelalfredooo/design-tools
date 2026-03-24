import http from "node:http";
import https from "node:https";
import { NextResponse } from "next/server";

const CREW_API_URL = process.env.CREW_API_URL || "http://127.0.0.1:8000";

async function getCrewHealth() {
  const url = new URL("/health", CREW_API_URL);
  const client = url.protocol === "https:" ? https : http;

  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const req = client.get(url, { timeout: 5000 }, (res) => {
      let body = "";

      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        if ((res.statusCode ?? 500) >= 400) {
          reject(new Error(`Crew health responded with ${res.statusCode ?? 500}`));
          return;
        }

        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error("Crew health request timed out"));
    });
    req.on("error", reject);
  });
}

export async function GET() {
  try {
    const data = await getCrewHealth();
    return NextResponse.json({
      status: "ok",
      provider: data.provider,
      providerStatus: data.provider_status,
      models: data.models,
      configuredModel: data.configured_model,
    });
  } catch {
    return NextResponse.json({
      status: "unavailable",
      provider: "unknown",
      providerStatus: "unknown",
      models: [],
      configuredModel: "unknown",
    });
  }
}

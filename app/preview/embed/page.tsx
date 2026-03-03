"use client";

import { useState, useRef, type ReactNode } from "react";
import NextImage from "next/image";
import { Figma, Image as ImageIcon, Code2, Loader2, Copy, Download, ExternalLink, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Local helper - consistent card wrapper
// ---------------------------------------------------------------------------
function PreviewCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-start gap-3 px-6 pt-6 pb-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </div>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="px-6 pb-6">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Placeholder for empty state
// ---------------------------------------------------------------------------
function EmptyStage({
  icon,
  message,
}: {
  icon: ReactNode;
  message: string;
}) {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted">
          {icon}
        </div>
        <p className="max-w-[260px] text-xs text-muted-foreground">
          {message}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Figma URL helpers
// ---------------------------------------------------------------------------
function parseFigmaUrl(url: string) {
  // Matches: figma.com/design/:fileKey/:fileName?node-id=1-2
  const match = url.match(
    /figma\.com\/design\/([^/]+)\/[^?]*\?.*node-id=(\d+-\d+)/
  );
  if (match) {
    return { fileKey: match[1], nodeId: match[2].replace("-", ":") };
  }
  // URL without node-id - just the file
  const fileMatch = url.match(/figma\.com\/design\/([^/]+)/);
  if (fileMatch) {
    return { fileKey: fileMatch[1], nodeId: undefined };
  }
  return null;
}

const PREVIEW_STORAGE_KEY = "design-tools:latest-html";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function FigmaImportPage() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [error, setError] = useState("");

  const [screenshotSrc, setScreenshotSrc] = useState<string | null>(null);

  // Code generation state
  const [codeGenStatus, setCodeGenStatus] = useState<
    "idle" | "loading" | "streaming" | "done" | "error"
  >("idle");
  const [generatedCode, setGeneratedCode] = useState("");
  const [codeGenError, setCodeGenError] = useState("");
  const codeBlockRef = useRef<HTMLPreElement>(null);

  const parsed = url ? parseFigmaUrl(url) : null;
  const isValid = parsed !== null;

  const canFetch = isValid && !!parsed?.nodeId;

  async function handleFetch() {
    if (!canFetch) return;

    setStatus("loading");
    setError("");
    setScreenshotSrc(null);

    // Reset code gen state on new fetch
    setCodeGenStatus("idle");
    setGeneratedCode("");
    setCodeGenError("");

    try {
      const res = await fetch("/api/figma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileKey: parsed!.fileKey,
          nodeId: parsed!.nodeId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      setScreenshotSrc(data.screenshotUrl);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch screenshot");
      setStatus("error");
    }
  }

  async function handleGenerate() {
    if (!parsed?.fileKey || !parsed?.nodeId || !screenshotSrc) return;

    setCodeGenStatus("loading");
    setGeneratedCode("");
    setCodeGenError("");

    try {
      const res = await fetch("/api/figma/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileKey: parsed.fileKey,
          nodeId: parsed.nodeId,
          screenshotUrl: screenshotSrc,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulated = "";
      let startedStreaming = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setGeneratedCode(accumulated);

        if (!startedStreaming) {
          startedStreaming = true;
          setCodeGenStatus("streaming");
        }

        // Auto-scroll code block to bottom
        if (codeBlockRef.current) {
          codeBlockRef.current.scrollTop = codeBlockRef.current.scrollHeight;
        }
      }

      setCodeGenStatus("done");
    } catch (err) {
      setCodeGenError(
        err instanceof Error ? err.message : "Code generation failed"
      );
      setCodeGenStatus("error");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedCode).then(() => {
      toast.success("Code copied to clipboard");
    });
  }

  function handleOpenPreview() {
    if (!generatedCode) return;
    try {
      localStorage.setItem(PREVIEW_STORAGE_KEY, generatedCode);
      window.open("/preview/render", "_blank", "noopener");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to open preview";
      toast.error(message);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-[720px] px-6 py-6">
          <h1 className="text-lg font-semibold tracking-tight">
            Figma Component Import
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste a Figma URL to pull a 1:1 component render. Use it as the
            base for animation work before adding to a voting session.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[720px] space-y-8 px-6 py-8">
        {/* Figma URL input */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-start gap-3 px-6 pt-6 pb-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Figma className="size-4" />
            </div>
            <div>
              <h2 className="font-semibold">Figma URL</h2>
              <p className="text-sm text-muted-foreground">
                Link to a component or frame - include{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                  ?node-id=
                </code>{" "}
                to target a specific node
              </p>
            </div>
          </div>
          <div className="flex gap-2 px-6 pb-6 pt-3">
            <Input
              type="url"
              placeholder="https://figma.com/design/abc123/MyFile?node-id=1-2"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setStatus("idle");
              }}
            />
            <Button
              disabled={!canFetch || status === "loading"}
              onClick={handleFetch}
            >
              {status === "loading" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Download className="size-4" />
                  Fetch
                </>
              )}
            </Button>
          </div>

          {url && !isValid && (
            <div className="border-t px-6 py-3">
              <p className="text-xs text-destructive">
                Doesn&apos;t look like a Figma design URL. Expected format:{" "}
                <code className="text-[11px]">
                  figma.com/design/FILE_KEY/...
                </code>
              </p>
            </div>
          )}

          {parsed && (
            <div className="border-t px-6 py-3">
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>
                  File:{" "}
                  <code className="rounded bg-muted px-1 py-0.5">
                    {parsed.fileKey}
                  </code>
                </span>
                {parsed.nodeId ? (
                  <span>
                    Node:{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                      {parsed.nodeId}
                    </code>
                  </span>
                ) : (
                  <span className="text-amber-600">
                    No node-id - add <code className="rounded bg-muted px-1 py-0.5">?node-id=X-Y</code> to the URL to enable Fetch
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results - shown during loading or after fetch */}
        {(status === "loading" || status === "done") && (
          <div className="grid gap-8 md:grid-cols-2">
            {/* Screenshot - primary output */}
            <PreviewCard
              title="Screenshot"
              description="Pixel-perfect reference from Figma"
              icon={<ImageIcon className="size-4" />}
            >
              {status === "loading" ? (
                <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                  <div className="space-y-2 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Fetching screenshot from Figma&hellip;
                    </p>
                  </div>
                </div>
              ) : screenshotSrc ? (
                <div className="overflow-hidden rounded-lg border border-border">
                  <NextImage
                    src={screenshotSrc}
                    alt="Figma component screenshot"
                    width={1200}
                    height={900}
                    sizes="100vw"
                    className="h-auto w-full object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <EmptyStage
                  icon={<ImageIcon className="size-4 text-muted-foreground" />}
                  message="No screenshot returned - check the node ID and try again"
                />
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                1:1 render from Figma - use as the base for animation work.
              </p>
            </PreviewCard>

            {/* Code gen */}
            <PreviewCard
              title="Code Gen"
              description="Component code from Figma design"
              icon={<Code2 className="size-4" />}
            >
              {codeGenStatus === "idle" && screenshotSrc ? (
                <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                  <Button onClick={handleGenerate}>
                    <Code2 className="size-4" />
                    Generate Code
                  </Button>
                </div>
              ) : codeGenStatus === "idle" && !screenshotSrc ? (
                <EmptyStage
                  icon={<Code2 className="size-4 text-muted-foreground" />}
                  message="Fetch a screenshot first"
                />
              ) : codeGenStatus === "loading" ? (
                <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                  <div className="space-y-2 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Preparing code generation&hellip;
                    </p>
                  </div>
                </div>
              ) : codeGenStatus === "streaming" || codeGenStatus === "done" ? (
                <div className="space-y-3">
                  <div className="relative">
                  <pre
                    ref={codeBlockRef}
                    className="max-h-[400px] min-h-[200px] overflow-auto rounded-lg bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100 font-mono"
                  >
                    <code>{generatedCode}</code>
                    {codeGenStatus === "streaming" && (
                      <span className="ml-0.5 inline-block size-2 animate-pulse rounded-full bg-emerald-400" />
                    )}
                  </pre>
                  {codeGenStatus === "done" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={handleCopy}
                    >
                      <Copy className="size-3" />
                      Copy
                    </Button>
                  )}
                  </div>
                  {codeGenStatus === "done" && (
                    <Button
                      variant="outline"
                      onClick={handleOpenPreview}
                      disabled={!generatedCode}
                    >
                      <ExternalLink className="size-4" />
                      Open Preview
                    </Button>
                  )}
                </div>
              ) : codeGenStatus === "error" ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
                    <p className="text-sm text-destructive">{codeGenError}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleGenerate}>
                    <RefreshCw className="size-4" />
                    Retry
                  </Button>
                </div>
              ) : null}
              <p className="mt-3 text-xs text-muted-foreground">
                AI will generate the component code you can animate with
                CSS/JS.
              </p>
            </PreviewCard>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

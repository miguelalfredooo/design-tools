"use client";

import Link from "next/link";
import { useState } from "react";
import { Code2, ExternalLink, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PREVIEW_STORAGE_KEY = "design-tools:latest-html";

export default function RenderPreviewPage() {
  const [html, setHtml] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(PREVIEW_STORAGE_KEY);
  });
  const loaded = true;

  function handleCopy() {
    if (!html) return;
    navigator.clipboard.writeText(html).then(() => {
      toast.success("Code copied to clipboard");
    });
  }

  function handleClear() {
    localStorage.removeItem(PREVIEW_STORAGE_KEY);
    setHtml(null);
    toast.info("Preview cleared");
  }

  function handleOpenInNewTab() {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto max-w-[720px] px-6 py-6">
            <h1 className="text-lg font-semibold tracking-tight">
              Render Preview
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Preview generated HTML code
            </p>
          </div>
        </header>
        <div className="mx-auto max-w-[720px] px-6 py-12">
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
              <Code2 className="size-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">No preview available</h3>
              <p className="text-sm text-muted-foreground">
                Generate code from a Figma component first, then click &quot;Open Preview&quot;.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/preview/embed">Go to Figma Import</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-[720px] items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Render Preview
            </h1>
            <p className="text-sm text-muted-foreground">
              Live preview of generated HTML
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="size-3.5" />
              Copy Code
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
              <ExternalLink className="size-3.5" />
              Open in Tab
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="size-3.5" />
              Clear
            </Button>
          </div>
        </div>
      </header>

      {/* Preview iframe */}
      <div className="mx-auto max-w-[720px] px-6 py-8">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <iframe
            srcDoc={html}
            title="Component Preview"
            className="h-[600px] w-full border-0"
            sandbox="allow-scripts"
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground text-center">
          This is a sandboxed preview. Open in a new tab for full functionality.
        </p>
      </div>
    </div>
  );
}

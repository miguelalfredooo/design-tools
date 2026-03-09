"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SynthesizeButtonProps {
  /** API endpoint to POST to */
  endpoint: string;
  /** Button label (default: "Synthesize") */
  label?: string;
  /** Button variant */
  variant?: "default" | "outline" | "secondary" | "ghost";
  /** Icon style: "sparkles" (default) or "flask" */
  icon?: "sparkles" | "flask";
  /** Callback after successful synthesis */
  onComplete?: () => void;
}

export function SynthesizeButton({
  endpoint,
  label = "Synthesize",
  variant = "default",
  icon = "sparkles",
  onComplete,
}: SynthesizeButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSynthesize() {
    setLoading(true);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Synthesis failed");
        return;
      }
      const parts = [`Synthesized ${data.insightCount} insights`];
      if (data.sessionCount) parts[0] += ` from ${data.sessionCount} sessions`;
      toast.success(parts[0]);
      onComplete?.();
      router.refresh();
    } catch {
      toast.error("Could not reach synthesis API");
    } finally {
      setLoading(false);
    }
  }

  const Icon = icon === "flask" ? FlaskConical : Sparkles;

  return (
    <Button onClick={handleSynthesize} disabled={loading} size="sm" variant={variant}>
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Icon className="size-4" />
      )}
      {loading ? "Synthesizing..." : label}
    </Button>
  );
}

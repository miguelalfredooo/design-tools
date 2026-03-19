// components/design/synthesis-cards/SynthesisCardBase.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SynthesisCardBaseProps {
  from: "research_insights" | "product_designer";
  fromName: string;
  subject: string;
  confidence?: "high" | "medium" | "low" | "n/a";
  timestamp: string;
  tier?: "quick" | "balanced" | "in-depth";
  borderColor?: string; // e.g., "border-l-[#ff9800]" for quick
  isLast?: boolean;
}

const AGENT_CONFIG: Record<string, { icon: typeof Brain; color: string; label: string }> = {
  research_insights: { icon: FlaskConical, color: "text-emerald-400", label: "RESEARCH & INSIGHTS" },
  product_designer: { icon: Brain, color: "text-violet-400", label: "PRODUCT DESIGNER" },
};

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-red-500/20 text-red-400 border-red-500/30",
  "n/a": "bg-muted text-muted-foreground",
};

export function SynthesisCardBase({
  from,
  fromName,
  subject,
  confidence = "n/a",
  timestamp,
  tier,
  borderColor,
  isLast,
  children,
}: SynthesisCardBaseProps & { children: React.ReactNode }) {
  const agent = AGENT_CONFIG[from] || AGENT_CONFIG.research_insights;
  const Icon = agent.icon;

  return (
    <div className="relative">
      {/* Timeline connector */}
      {!isLast && <div className="absolute left-5 top-12 bottom-0 w-px bg-border" />}

      <Card className={cn(
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        borderColor
      )}>
        <CardHeader className="py-3 px-4">
          <div className="flex items-start gap-3">
            {/* Agent avatar */}
            <div className={cn(
              "size-10 rounded-lg bg-muted flex items-center justify-center shrink-0",
              agent.color
            )}>
              <Icon className="size-5" />
            </div>

            <div className="flex-1 min-w-0">
              {/* Agent name + badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-xs font-bold uppercase tracking-wider", agent.color)}>
                  {fromName || agent.label}
                </span>
                {confidence !== "n/a" && (
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", CONFIDENCE_STYLES[confidence])}>
                    {confidence}
                  </Badge>
                )}
              </div>

              {/* Subject */}
              <h3 className="text-sm font-medium mt-1">{subject}</h3>
            </div>
          </div>
        </CardHeader>

        <CardContent className="py-3 px-4">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

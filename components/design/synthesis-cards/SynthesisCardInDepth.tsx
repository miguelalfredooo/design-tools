// components/design/synthesis-cards/SynthesisCardInDepth.tsx
import { SynthesisCardBase, type SynthesisCardBaseProps } from "./SynthesisCardBase";
import { cn } from "@/lib/utils";

export interface SynthesisCardInDepthProps extends SynthesisCardBaseProps {
  finding: string;
  evidence: string[];
  competingInterpretations?: string;
  assumptions?: string;
  sources?: string[];
  nextSteps: string;
  missingContext?: string;
}

export function SynthesisCardInDepth({
  finding,
  evidence,
  competingInterpretations,
  assumptions,
  sources,
  nextSteps,
  missingContext,
  ...baseProps
}: SynthesisCardInDepthProps) {
  return (
    <SynthesisCardBase
      {...baseProps}
      tier="in-depth"
      borderColor="border-l-4 border-l-[#9c27b0]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Finding */}
          <div>
            <p className="text-sm font-semibold flex items-center gap-2">
              <span>🔬</span> {finding}
            </p>
          </div>

          {/* Evidence */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Evidence
            </h4>
            <ul className="space-y-1 pl-6">
              {evidence.map((item, i) => (
                <li key={i} className="text-sm text-foreground before:content-['•'] before:mr-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Competing Interpretations */}
          {competingInterpretations && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Competing Interpretations
              </h4>
              <p className="text-sm">{competingInterpretations}</p>
            </div>
          )}

          {/* Next Steps */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Next Steps
            </h4>
            <p className="text-sm">{nextSteps}</p>
          </div>

          {missingContext && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Missing Context
              </h4>
              <p className="text-sm text-muted-foreground">{missingContext}</p>
            </div>
          )}
        </div>

        {/* Sidebars */}
        <div className="space-y-3">
          {/* Confidence + Sources */}
          {sources && sources.length > 0 && (
            <div className="bg-muted rounded-lg p-3 border border-border">
              <h5 className="text-xs font-semibold uppercase tracking-wider mb-2">Sources</h5>
              <ul className="space-y-1">
                {sources.map((source, i) => (
                  <li key={i} className="text-xs text-muted-foreground">{source}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Assumptions */}
          {assumptions && (
            <div className="bg-muted rounded-lg p-3 border border-border">
              <h5 className="text-xs font-semibold uppercase tracking-wider mb-2">Assumptions</h5>
              <p className="text-xs text-muted-foreground">{assumptions}</p>
            </div>
          )}
        </div>
      </div>
    </SynthesisCardBase>
  );
}

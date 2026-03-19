// components/design/synthesis-cards/SynthesisCardBalanced.tsx
import { SynthesisCardBase, type SynthesisCardBaseProps } from "./SynthesisCardBase";
import { cn } from "@/lib/utils";

export interface SynthesisCardBalancedProps extends SynthesisCardBaseProps {
  finding: string;
  evidence: string[];
  nextSteps: string;
}

export function SynthesisCardBalanced({
  finding,
  evidence,
  nextSteps,
  ...baseProps
}: SynthesisCardBalancedProps) {
  return (
    <SynthesisCardBase
      {...baseProps}
      tier="balanced"
      borderColor="border-l-4 border-l-[#2196f3]"
    >
      <div className="space-y-4">
        {/* Finding */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Finding
          </h4>
          <p className="text-sm">{finding}</p>
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

        {/* Next Steps */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Next Steps
          </h4>
          <p className="text-sm">{nextSteps}</p>
        </div>
      </div>
    </SynthesisCardBase>
  );
}

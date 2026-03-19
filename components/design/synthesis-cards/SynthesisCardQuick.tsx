// components/design/synthesis-cards/SynthesisCardQuick.tsx
import { SynthesisCardBase, type SynthesisCardBaseProps } from "./SynthesisCardBase";
import { cn } from "@/lib/utils";

export interface SynthesisCardQuickProps extends SynthesisCardBaseProps {
  headline: string;
  keyPoints: string[]; // 2-3 items
}

export function SynthesisCardQuick({
  headline,
  keyPoints,
  ...baseProps
}: SynthesisCardQuickProps) {
  return (
    <SynthesisCardBase
      {...baseProps}
      tier="quick"
      borderColor="border-l-4 border-l-[#ff9800]"
    >
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-lg">⚡</span>
          <p className="font-semibold text-sm">{headline}</p>
        </div>

        <ul className="space-y-1 pl-6">
          {keyPoints.map((point, i) => (
            <li key={i} className="text-sm text-foreground before:content-['•'] before:mr-2">
              {point}
            </li>
          ))}
        </ul>
      </div>
    </SynthesisCardBase>
  );
}

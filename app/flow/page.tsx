import { TooltipProvider } from "@/components/ui/tooltip";
import { FlowClient } from "@/components/design/flow-client";

export default function FlowPage() {
  return (
    <TooltipProvider>
      <FlowClient />
    </TooltipProvider>
  );
}

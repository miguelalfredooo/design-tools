import { TooltipProvider } from "@/components/ui/tooltip";
import { DesignOpsClient } from "@/components/design/design-ops-client";

export default function DesignOpsPage() {
  return (
    <TooltipProvider>
      <DesignOpsClient />
    </TooltipProvider>
  );
}

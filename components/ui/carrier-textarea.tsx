import * as React from "react"
import { cn } from "@/lib/utils"

interface CarrierTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  bordered?: boolean;
  placeholderOpacity?: "30" | "40";
  designSize?: "sm" | "md" | "lg";
}

const CarrierTextarea = React.forwardRef<
  HTMLTextAreaElement,
  CarrierTextareaProps
>(({ className, bordered = false, placeholderOpacity = "40", designSize = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full bg-transparent outline-none px-0 resize-none",
        bordered ? "border border-border" : "border-none",
        `placeholder:text-muted-foreground/${placeholderOpacity}`,
        sizeClasses[designSize],
        className
      )}
      {...props}
    />
  );
});

CarrierTextarea.displayName = "CarrierTextarea";

export { CarrierTextarea };

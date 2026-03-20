import * as React from "react"
import { cn } from "@/lib/utils"

interface CarrierInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  bordered?: boolean;
  placeholderOpacity?: "30" | "40";
  designSize?: "sm" | "md" | "lg";
}

const CarrierInput = React.forwardRef<HTMLInputElement, CarrierInputProps>(
  ({ className, bordered = false, placeholderOpacity = "40", designSize = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "text-sm",
      md: "text-base",
      lg: "text-2xl",
    };

    return (
      <input
        ref={ref}
        className={cn(
          "w-full bg-transparent outline-none px-0 h-auto",
          bordered ? "border border-border" : "border-none",
          `placeholder:text-muted-foreground/${placeholderOpacity}`,
          sizeClasses[designSize],
          className
        )}
        {...props}
      />
    );
  }
);

CarrierInput.displayName = "CarrierInput";

export { CarrierInput };

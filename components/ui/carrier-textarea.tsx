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

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;

    // Call the original onChange if provided
    props.onChange?.(e as React.ChangeEvent<HTMLTextAreaElement>);
  };

  return (
    <textarea
      ref={ref}
      onInput={handleInput}
      style={{ wordWrap: "break-word", ...((props as any).style || {}) }}
      className={cn(
        "w-full bg-transparent outline-none px-0 resize-none overflow-hidden scrollbar-hide",
        bordered ? "border border-border" : "border-none",
        `placeholder:text-muted-foreground/${placeholderOpacity}`,
        sizeClasses[designSize],
        className
      )}
      wrap="soft"
      {...props}
    />
  );
});

CarrierTextarea.displayName = "CarrierTextarea";

export { CarrierTextarea };

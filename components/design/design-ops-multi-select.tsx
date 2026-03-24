"use client";

import { cn } from "@/lib/utils";

interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface DesignOpsMultiSelectProps {
  id?: string;
  label: string;
  description: string;
  placeholder?: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  placeholderClassName?: string;
}

export function DesignOpsMultiSelect({
  id,
  label,
  description,
  options,
  selectedValues,
  onToggle,
}: DesignOpsMultiSelectProps) {
  return (
    <div id={id} className="space-y-2">
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = selectedValues.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

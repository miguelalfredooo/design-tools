"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface LiveDraftHeaderFieldsProps {
  titleId: string;
  descriptionId: string;
  titleLabel: string;
  descriptionLabel: string;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  titleValue: string;
  descriptionValue: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  titleRows?: number;
  descriptionRows?: number;
  labelMode?: "visible" | "sr-only";
  density?: "inline" | "form";
  emphasis?: "default" | "large" | "hero";
  titleTone?: "headline" | "field";
  autoFocus?: boolean;
}

export function LiveDraftHeaderFields({
  titleId,
  descriptionId,
  titleLabel,
  descriptionLabel,
  titlePlaceholder,
  descriptionPlaceholder,
  titleValue,
  descriptionValue,
  onTitleChange,
  onDescriptionChange,
  titleRows = 2,
  descriptionRows = 2,
  labelMode = "visible",
  density = "inline",
  emphasis = "default",
  titleTone = "headline",
  autoFocus = false,
}: LiveDraftHeaderFieldsProps) {
  const inline = density === "inline";
  const labelClassName =
    labelMode === "sr-only" ? "sr-only" : "text-sm font-semibold";
  const titleSizeClassName =
    emphasis === "hero"
      ? "!text-[2.5rem] !leading-none font-bold tracking-tight sm:!text-5xl"
      : emphasis === "large"
        ? "!text-[1.625rem] !leading-tight font-semibold tracking-tight sm:!text-[1.875rem]"
      : "!text-2xl !leading-tight font-bold tracking-tight";
  const fieldToneClassName =
    titleTone === "field"
      ? "!text-lg !leading-tight !font-semibold !tracking-normal"
      : titleSizeClassName;
  const titleClassName = inline
    ? `w-full resize-none border-none bg-transparent px-0 py-0 min-h-0 ${fieldToneClassName} shadow-none outline-none ring-0 placeholder:text-muted-foreground/35 focus-visible:ring-0 focus-visible:ring-offset-0`
    : undefined;
  const descriptionClassName = inline
    ? "w-full resize-none border-none bg-transparent px-0 py-0 min-h-0 text-base font-semibold shadow-none outline-none ring-0 placeholder:text-muted-foreground/35 focus-visible:ring-0 focus-visible:ring-offset-0"
    : undefined;

  return (
    <div className={inline ? "space-y-8" : "space-y-4"}>
      <div className="space-y-1">
        <Label htmlFor={titleId} className={labelClassName}>
          {titleLabel}
        </Label>
        <Textarea
          id={titleId}
          placeholder={titlePlaceholder}
          value={titleValue}
          onChange={(event) => onTitleChange(event.target.value)}
          autoFocus={autoFocus}
          rows={titleRows}
          className={titleClassName}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor={descriptionId} className={labelClassName}>
          {descriptionLabel}
        </Label>
        <Textarea
          id={descriptionId}
          placeholder={descriptionPlaceholder}
          value={descriptionValue}
          onChange={(event) => onDescriptionChange(event.target.value)}
          rows={descriptionRows}
          className={descriptionClassName}
        />
      </div>
    </div>
  );
}

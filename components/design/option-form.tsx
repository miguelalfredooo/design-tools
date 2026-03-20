"use client";

import { ImagePlus, X, Loader2 } from "lucide-react";
import type { MediaType } from "@/lib/design-types";
import { CarrierInput } from "@/components/ui/carrier-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useOptionMedia } from "@/hooks/use-option-media";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface OptionFormValues {
  title: string;
  description: string;
  mediaType: MediaType;
  mediaUrl: string;
  rationale: string;
}

interface OptionFormProps {
  value: OptionFormValues;
  onChange: (field: keyof OptionFormValues, value: string) => void;
  titlePlaceholder?: string;
}

export function OptionForm({ value, onChange, titlePlaceholder = "Option title" }: OptionFormProps) {
  const { fileRef, uploading, handleFileChange, clearImage } = useOptionMedia(onChange);
  const hasImage = value.mediaType === "image" && value.mediaUrl;

  return (
    <div className="space-y-1.5">
      <CarrierInput
        placeholder={titlePlaceholder}
        value={value.title}
        onChange={(e) => onChange("title", e.target.value)}
        designSize="sm"
      />
      <CarrierInput
        placeholder="Description (optional)"
        value={value.description}
        onChange={(e) => onChange("description", e.target.value)}
        designSize="sm"
      />

      {/* Image attach */}
      {hasImage ? (
        <div className="relative rounded-lg overflow-hidden border">
          <img src={value.mediaUrl} alt="" className="w-full max-h-48 object-cover" />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 right-2 size-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ImagePlus className="size-3.5" />
          )}
          {uploading ? "Uploading..." : "Attach image"}
        </Button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Other media types */}
      <div className="space-y-1.5">
        <Label>Media type</Label>
        <Select
          value={value.mediaType}
          onValueChange={(v) => onChange("mediaType", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="image">Image URL</SelectItem>
            <SelectItem value="figma-embed">Figma embed</SelectItem>
            <SelectItem value="excalidraw">Excalidraw link</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {value.mediaType !== "none" && !hasImage && (
        <div className="space-y-1.5">
          <Label>
            {value.mediaType === "image"
              ? "Image URL"
              : value.mediaType === "figma-embed"
                ? "Figma file URL"
                : "Excalidraw URL"}
          </Label>
          <CarrierInput
            type="url"
            placeholder={
              value.mediaType === "image"
                ? "https://example.com/design.png"
                : value.mediaType === "figma-embed"
                  ? "https://www.figma.com/design/..."
                  : "https://excalidraw.com/#json=..."
            }
            value={value.mediaUrl}
            onChange={(e) => onChange("mediaUrl", e.target.value)}
            designSize="sm"
          />
        </div>
      )}
    </div>
  );
}

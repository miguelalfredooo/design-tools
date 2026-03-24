"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import type { MediaType } from "@/lib/design-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/design/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange("mediaType", "image");
      onChange("mediaUrl", data.url);
    } catch {
      // silently fail — user can retry
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function clearImage() {
    onChange("mediaType", "none");
    onChange("mediaUrl", "");
  }

  const hasImage = value.mediaType === "image" && value.mediaUrl;

  return (
    <div className="space-y-1.5">
      <Input
        placeholder={titlePlaceholder}
        value={value.title}
        onChange={(e) => onChange("title", e.target.value)}
      />
      <Input
        placeholder="Description (optional)"
        value={value.description}
        onChange={(e) => onChange("description", e.target.value)}
      />

      {/* Image attach */}
      {hasImage ? (
        <div className="relative rounded-lg overflow-hidden border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
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
          size="sm"
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
          <Input
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
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import type { MediaType } from "@/lib/design-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DraftOptionValues {
  title: string;
  description: string;
  mediaType: MediaType;
  mediaUrl: string;
  rationale: string;
}

interface DraftOptionCardProps {
  value: DraftOptionValues;
  index: number;
  onChange: (field: keyof DraftOptionValues, value: string) => void;
  onRemove?: () => void;
}

export function DraftOptionCard({
  value,
  index,
  onChange,
  onRemove,
}: DraftOptionCardProps) {
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
      // silently fail
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
    <div className="relative rounded-xl border bg-card p-4 transition-all flex flex-col">
      {/* Remove button */}
      {onRemove && (
        <div className="absolute -top-2 -right-2 z-10">
          <button
            onClick={onRemove}
            className="size-6 rounded-full bg-muted/80 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors ring-3 ring-card"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {/* Media — matches OptionMedia compact layout */}
      {hasImage ? (
        <div className="rounded-lg overflow-hidden mb-3 relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.mediaUrl}
            alt=""
            className="w-full object-cover h-auto max-h-60"
            onError={clearImage}
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 right-2 size-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors ring-3 ring-card"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-dashed bg-muted/20 mb-3 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors py-8"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
          <span className="text-xs font-medium">
            {uploading ? "Uploading..." : "Add image"}
          </span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Title — matches VotingOptionCard title style */}
      <input
        type="text"
        placeholder={`Option ${index + 1} title`}
        value={value.title}
        onChange={(e) => onChange("title", e.target.value)}
        className="text-sm font-semibold leading-tight bg-transparent border-none outline-none placeholder:text-muted-foreground/40 w-full mb-1"
      />

      {/* Description — matches VotingOptionCard body style */}
      <textarea
        placeholder="Description (optional)"
        value={value.description}
        onChange={(e) => onChange("description", e.target.value)}
        rows={2}
        className="text-sm leading-relaxed text-muted-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/30 w-full resize-none mb-2"
      />

      {/* Media type select — for non-image types */}
      {!hasImage && (
        <div className="mt-auto pt-2 border-t border-border/50">
          <Select
            value={value.mediaType}
            onValueChange={(v) => onChange("mediaType", v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No media</SelectItem>
              <SelectItem value="image">Image URL</SelectItem>
              <SelectItem value="figma-embed">Figma embed</SelectItem>
              <SelectItem value="excalidraw">Excalidraw link</SelectItem>
            </SelectContent>
          </Select>
          {value.mediaType !== "none" && value.mediaType !== "image" && (
            <input
              type="url"
              placeholder={
                value.mediaType === "figma-embed"
                  ? "https://www.figma.com/design/..."
                  : "https://excalidraw.com/#json=..."
              }
              value={value.mediaUrl}
              onChange={(e) => onChange("mediaUrl", e.target.value)}
              className="mt-2 text-xs bg-transparent border-none outline-none placeholder:text-muted-foreground/30 w-full"
            />
          )}
          {value.mediaType === "image" && !hasImage && (
            <input
              type="url"
              placeholder="https://example.com/design.png"
              value={value.mediaUrl}
              onChange={(e) => onChange("mediaUrl", e.target.value)}
              className="mt-2 text-xs bg-transparent border-none outline-none placeholder:text-muted-foreground/30 w-full"
            />
          )}
        </div>
      )}
    </div>
  );
}

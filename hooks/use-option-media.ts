import { useRef, useState } from "react";
import type { MediaType } from "@/lib/design-types";

export interface MediaState {
  mediaType: MediaType;
  mediaUrl: string;
}

export function useOptionMedia(onChange: (field: "mediaType" | "mediaUrl", value: string) => void) {
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

  return {
    fileRef,
    uploading,
    handleFileChange,
    clearImage,
  };
}

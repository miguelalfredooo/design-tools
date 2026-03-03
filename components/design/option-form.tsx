import type { MediaType } from "@/lib/design-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
      {value.mediaType !== "none" && (
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
      <Textarea
        placeholder="Why this direction? (optional)"
        rows={2}
        value={value.rationale}
        onChange={(e) => onChange("rationale", e.target.value)}
      />
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Trash2, ChevronDown } from "lucide-react";
import type { SpatialComment } from "@/lib/design-types";
import { getInitials, getVoterColor } from "@/lib/design-utils";
import { cn } from "@/lib/utils";

// --- Types ---

interface SpatialCommentLayerProps {
  comments: SpatialComment[];
  onAdd: (body: string, xPct: number, yPct: number) => void;
  onDelete: (commentId: string) => void;
  isCreator: boolean;
  currentVoterId: string;
  /** Disable creation (e.g. on mobile) */
  disableCreate?: boolean;
  /** Externally controlled highlighted comment (from panel) */
  highlightedId?: string | null;
}

// --- Dot Tooltip ---

function DotTooltip({
  comment,
  canDelete,
  onDelete,
  onClose,
  dotX,
  dotY,
}: {
  comment: SpatialComment;
  canDelete: boolean;
  onDelete: () => void;
  onClose: () => void;
  dotX: number;
  dotY: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const color = getVoterColor(comment.voterId);

  // Edge detection: flip if too close to edges
  const flipX = dotX > 70;
  const flipY = dotY > 80;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const elapsed = new Date().getTime() - comment.createdAt;
  const timeAgo =
    elapsed < 60_000 ? "just now" :
    elapsed < 3_600_000 ? `${Math.floor(elapsed / 60_000)}m ago` :
    elapsed < 86_400_000 ? `${Math.floor(elapsed / 3_600_000)}h ago` :
    `${Math.floor(elapsed / 86_400_000)}d ago`;

  return (
    <div
      ref={ref}
      className="absolute z-30 w-56 rounded-lg border bg-popover shadow-lg p-2.5 text-xs"
      style={{
        left: flipX ? undefined : `${dotX}%`,
        right: flipX ? `${100 - dotX}%` : undefined,
        top: flipY ? undefined : `${dotY}%`,
        bottom: flipY ? `${100 - dotY}%` : undefined,
        transform: `translate(${flipX ? "8px" : "-8px"}, ${flipY ? "8px" : "4px"})`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <div
          className="size-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0"
          style={{ backgroundColor: color }}
        >
          {getInitials(comment.voterName)}
        </div>
        <span className="font-semibold truncate">{comment.voterName}</span>
        <span className="text-muted-foreground ml-auto shrink-0">{timeAgo}</span>
      </div>
      <p className="text-muted-foreground leading-relaxed break-words">{comment.body}</p>
      {canDelete && (
        <button
          className="mt-1.5 flex items-center gap-1 text-destructive/60 hover:text-destructive transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="size-3" />
          Delete
        </button>
      )}
    </div>
  );
}

// --- Comment Popover (create new) ---

function CommentPopover({
  xPct,
  yPct,
  onSubmit,
  onClose,
}: {
  xPct: number;
  yPct: number;
  onSubmit: (body: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const flipX = xPct > 70;
  const flipY = yPct > 80;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="absolute z-30 w-60 rounded-lg border bg-popover shadow-lg p-2"
      style={{
        left: flipX ? undefined : `${xPct}%`,
        right: flipX ? `${100 - xPct}%` : undefined,
        top: flipY ? undefined : `${yPct}%`,
        bottom: flipY ? `${100 - yPct}%` : undefined,
        transform: `translate(${flipX ? "8px" : "-8px"}, ${flipY ? "8px" : "4px"})`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        type="text"
        className="w-full rounded border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        placeholder="Leave a note..."
        maxLength={280}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            onSubmit(value.trim());
          }
        }}
      />
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-muted-foreground">{value.length}/280</span>
        <span className="text-[10px] text-muted-foreground">Enter to save</span>
      </div>
    </div>
  );
}

// --- Spatial Dot ---

function SpatialDot({
  comment,
  isHighlighted,
  canDelete,
  onDelete,
  onSelect,
  selectedId,
}: {
  comment: SpatialComment;
  isHighlighted: boolean;
  canDelete: boolean;
  onDelete: () => void;
  onSelect: (id: string | null) => void;
  selectedId: string | null;
}) {
  const color = getVoterColor(comment.voterId);
  const isSelected = selectedId === comment.id;

  return (
    <div
      className="absolute z-20"
      style={{
        left: `${comment.xPct}%`,
        top: `${comment.yPct}%`,
        transform: "translate(-50%, -50%)",
        pointerEvents: "auto",
      }}
    >
      <button
        className={cn(
          "size-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-3 border-background shadow-sm transition-transform cursor-pointer",
          isHighlighted && "scale-150 ring-2 ring-offset-1",
          isSelected && "scale-125"
        )}
        style={{
          backgroundColor: color,
          ...(isHighlighted ? { ringColor: color } : {}),
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(isSelected ? null : comment.id);
        }}
      >
        {getInitials(comment.voterName)}
      </button>

      {isSelected && (
        <DotTooltip
          comment={comment}
          canDelete={canDelete}
          onDelete={() => {
            onDelete();
            onSelect(null);
          }}
          onClose={() => onSelect(null)}
          dotX={comment.xPct}
          dotY={comment.yPct}
        />
      )}
    </div>
  );
}

// --- Main Layer ---

export function SpatialCommentLayer({
  comments,
  onAdd,
  onDelete,
  isCreator,
  currentVoterId,
  disableCreate,
  highlightedId,
}: SpatialCommentLayerProps) {
  const [popover, setPopover] = useState<{ xPct: number; yPct: number } | null>(null);
  const [selectedDotId, setSelectedDotId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disableCreate) return;
      // Don't create if we clicked on a dot
      const target = e.target as HTMLElement;
      if (target.closest("[data-spatial-dot]")) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const xPct = ((e.clientX - rect.left) / rect.width) * 100;
      const yPct = ((e.clientY - rect.top) / rect.height) * 100;

      setSelectedDotId(null);
      setPopover({ xPct, yPct });
    },
    [disableCreate]
  );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10"
      style={{ pointerEvents: disableCreate && comments.length === 0 ? "none" : "auto" }}
      onClick={handleContainerClick}
    >
      {/* Dots */}
      {comments.map((c) => (
        <div key={c.id} data-spatial-dot>
          <SpatialDot
            comment={c}
            isHighlighted={highlightedId === c.id}
            canDelete={isCreator || c.voterId === currentVoterId}
            onDelete={() => onDelete(c.id)}
            onSelect={setSelectedDotId}
            selectedId={selectedDotId}
          />
        </div>
      ))}

      {/* New comment popover */}
      {popover && (
        <CommentPopover
          xPct={popover.xPct}
          yPct={popover.yPct}
          onSubmit={(body) => {
            onAdd(body, popover.xPct, popover.yPct);
            setPopover(null);
          }}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  );
}

// --- Comment Panel ---

export function CommentPanel({
  comments,
  isCreator,
  currentVoterId,
  onDelete,
  onHighlight,
}: {
  comments: SpatialComment[];
  isCreator: boolean;
  currentVoterId: string;
  onDelete: (commentId: string) => void;
  onHighlight: (commentId: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const count = comments.length;

  if (count === 0) return null;

  const sorted = [...comments].sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div className="mt-4">
      <button
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="flex items-center gap-0.5">
          {Array.from({ length: count }, (_, i) => (
            <span key={i} className="size-2.5 rounded-full bg-muted-foreground" />
          ))}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
          {sorted.map((c) => {
            const color = getVoterColor(c.voterId);
            const canDelete = isCreator || c.voterId === currentVoterId;

            return (
              <div
                key={c.id}
                className="flex items-start gap-2 rounded-md p-2 hover:bg-muted/50 cursor-pointer transition-colors text-xs"
                onClick={() => onHighlight(c.id)}
                onMouseLeave={() => onHighlight(null)}
              >
                <div
                  className="size-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0 mt-0.5"
                  style={{ backgroundColor: color }}
                >
                  {getInitials(c.voterName)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{c.voterName}</span>
                  <p className="text-muted-foreground leading-relaxed break-words">{c.body}</p>
                </div>
                {canDelete && (
                  <button
                    className="shrink-0 p-1 text-muted-foreground/40 hover:text-destructive transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(c.id);
                    }}
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

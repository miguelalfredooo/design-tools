"use client";

import { useRef, useState } from "react";
import { ArrowRight, Smile } from "lucide-react";
import { toast } from "sonner";
import { useSessions } from "@/lib/design-store";
import { useVoterIdentity } from "@/hooks/use-voter-identity";
import { VoterIdentityDialog } from "@/components/design/voter-identity-dialog";

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

interface CommentInputProps {
  sessionId: string;
  optionId: string;
  placeholder?: string;
  className?: string;
}

export function CommentInput({
  sessionId,
  optionId,
  placeholder = "Add a comment...",
  className,
}: CommentInputProps) {
  const { addComment } = useSessions();
  const { name: voterName, setName: setVoterName } = useVoterIdentity();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showIdentity, setShowIdentity] = useState(false);
  const [pendingBody, setPendingBody] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = voterName ? getInitials(voterName) : null;

  async function submit(name: string, text: string) {
    setSubmitting(true);
    try {
      await addComment(sessionId, optionId, name, text);
      setBody("");
      setPendingBody("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add comment"
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed) return;

    if (!voterName) {
      setPendingBody(trimmed);
      setShowIdentity(true);
      return;
    }

    submit(voterName, trimmed);
  }

  function handleIdentitySubmit(name: string) {
    setVoterName(name);
    setShowIdentity(false);
    if (pendingBody) {
      submit(name, pendingBody);
    }
  }

  return (
    <>
      <VoterIdentityDialog
        open={showIdentity}
        onSubmit={handleIdentitySubmit}
        onCancel={() => {
          setShowIdentity(false);
          setPendingBody("");
        }}
        existingNames={[]}
      />

      <div className={`flex items-center gap-3 ${className ?? ""}`}>
        <div className="size-9 rounded-full bg-[#4a4340] flex items-center justify-center text-[11px] font-medium text-white shrink-0">
          {initials ?? <Smile className="size-4" />}
        </div>
        <div className="flex-1 flex items-center gap-2 rounded-full bg-[#e8e5e1] px-4 py-2">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            onClick={(e) => e.preventDefault()}
            disabled={submitting}
            className="text-sm bg-transparent outline-none flex-1 placeholder:text-muted-foreground"
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            disabled={submitting || !body.trim()}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </>
  );
}

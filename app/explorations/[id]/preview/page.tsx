"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSessions } from "@/lib/design-store";
import { Button } from "@/components/ui/button";
import { SessionBrief } from "@/components/design/session-brief";
import { OptionMedia } from "@/components/design/option-media";

export default function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { session, loading, loadSession } = useSessions();

  useEffect(() => {
    loadSession(id);
  }, [id, loadSession]);

  if (loading && !session) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-12 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-12 text-center">
        <h1 className="text-2xl font-bold">Session not found</h1>
      </div>
    );
  }

  return (
    <div>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            {session.title}
          </h1>
          {session.description && (
            <p className="text-muted-foreground">{session.description}</p>
          )}
        </div>

        {/* Brief */}
        <div className="mb-8">
          <SessionBrief session={session} />
        </div>

        {/* Options — read-only */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {session.options.map((opt) => (
            <div
              key={opt.id}
              className="rounded-xl border p-4"
            >
              {/* Title */}
              <p className="text-sm font-semibold mb-2">{opt.title}</p>

              {/* Media */}
              <OptionMedia option={opt} variant="compact" className="mb-3" />

              {/* Description */}
              {opt.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {opt.description}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg">
            <Link href={`/explorations/${id}`}>
              Join & Vote
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

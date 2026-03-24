"use client";

import Link from "next/link";
import { Trash2, Users, Layers } from "lucide-react";
import type { ExplorationSession } from "@/lib/design-types";
import { useSessions } from "@/lib/design-store";
import { SessionCardBanner } from "@/components/design/session-card-banner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const phaseLabel: Record<ExplorationSession["phase"], string> = {
  setup: "Setup",
  voting: "Voting",
  revealed: "Results",
};

const phaseVariant: Record<
  ExplorationSession["phase"],
  "secondary" | "default" | "outline"
> = {
  setup: "secondary",
  voting: "default",
  revealed: "outline",
};

export function SessionCard({
  session,
  scope,
  canManage,
}: {
  session: ExplorationSession;
  scope: "mine" | "all";
  canManage: boolean;
}) {
  const { deleteSession } = useSessions();

  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      <CardHeader>
        <Link href={`/explorations/${session.id}`} className="space-y-1">
          <CardTitle className="line-clamp-1">{session.title}</CardTitle>
          <CardDescription className="line-clamp-2">
            {session.description}
          </CardDescription>
        </Link>
        {canManage ? (
          <CardAction>
            <Button
              variant="ghost"
              size="icon-xs"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => deleteSession(session.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <SessionCardBanner session={session} scope={scope} />
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Badge variant={phaseVariant[session.phase]}>
            {phaseLabel[session.phase]}
          </Badge>
          <span className="flex items-center gap-1">
            <Layers className="size-3.5" />
            {session.options.length} options
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {session.voteCount}/{session.participantCount}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

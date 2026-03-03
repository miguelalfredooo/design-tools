"use client";

import { Palette, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateSessionDialog } from "@/components/design/create-session-dialog";

export function EmptySessionState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <Palette className="size-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">No sessions yet</h3>
        <p className="text-sm text-muted-foreground">
          Create your first exploration session or load a demo.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <a href="/seed">
            <Play className="size-4" />
            Load Demo
          </a>
        </Button>
        <CreateSessionDialog>
          <Button>Create Session</Button>
        </CreateSessionDialog>
      </div>
    </div>
  );
}

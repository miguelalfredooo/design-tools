"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ExplorationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Explorations page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground">Failed to load explorations</p>
      {error.message && (
        <p className="text-sm text-red-500">{error.message}</p>
      )}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
        <Button onClick={() => reset()}>Try Again</Button>
      </div>
    </div>
  );
}

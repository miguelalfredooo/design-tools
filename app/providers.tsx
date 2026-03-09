"use client";

import { Suspense, useState } from "react";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "@/lib/design-store";
import { Toaster } from "@/components/ui/sonner";
import { DesignNav } from "@/components/design/design-nav";
import { DesignSidebar } from "@/components/design/design-sidebar";
import { useVoterIdentity } from "@/hooks/use-voter-identity";

function UserNameGate({ children }: { children: React.ReactNode }) {
  const { name, setName } = useVoterIdentity();
  const [draft, setDraft] = useState("");

  if (!name) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = draft.trim();
            if (trimmed) setName(trimmed);
          }}
          className="flex flex-col items-center gap-6 px-6 max-w-sm w-full"
        >
          <h1 className="text-2xl font-bold tracking-tight">What's your name?</h1>
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Enter your name"
            className="w-full rounded-lg border bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="w-full rounded-lg bg-foreground text-background px-4 py-3 text-sm font-semibold disabled:opacity-40 transition-opacity"
          >
            Continue
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <SessionProvider>
        <UserNameGate>
          <Suspense>
            <DesignNav />
          </Suspense>
          <div className="min-h-svh flex bg-secondary">
            <Suspense>
              <DesignSidebar />
            </Suspense>
            <div className="flex-1 min-w-0 py-3 pr-3 md:py-6 md:pr-6 overflow-hidden">
              <div className="bg-card rounded-2xl border border-border/50 shadow-sm max-w-[800px] w-full p-4 md:p-6 overflow-hidden">
                {children}
              </div>
            </div>
          </div>
          <Toaster />
        </UserNameGate>
      </SessionProvider>
    </ThemeProvider>
  );
}

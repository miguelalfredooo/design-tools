"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { SessionProvider } from "@/lib/design-store";
import { Toaster } from "@/components/ui/sonner";
import { DesignNav } from "@/components/design/design-nav";
import { DesignSidebar } from "@/components/design/design-sidebar";
import { useVoterIdentity } from "@/hooks/use-voter-identity";
import { cn } from "@/lib/utils";

function UserNameGate({ children }: { children: React.ReactNode }) {
  const { name, setName } = useVoterIdentity();
  const [draft, setDraft] = useState("");

  return (
    <>
      {children}
      {!name && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = draft.trim();
              if (trimmed) setName(trimmed);
            }}
            className="flex flex-col gap-4 bg-card border border-border rounded-2xl shadow-xl px-6 py-8 max-w-sm w-full"
          >
            <h1 className="text-xl font-semibold tracking-tight">
              What&apos;s your name?
            </h1>
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
      )}
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProjectDrop = pathname.startsWith("/drops/");
  const isCarrier = pathname.startsWith("/design-ops");
  const isContribute = pathname.startsWith("/research/contribute");
  const isLog = pathname.startsWith("/research/log");

  const appShell = (
    <>
      <Suspense>
        <DesignNav />
      </Suspense>
      <div className="min-h-svh flex bg-secondary">
        <Suspense>
          <DesignSidebar showNotifications={!isProjectDrop} />
        </Suspense>
        <div className="flex-1 min-w-0 py-3 pr-3 md:py-6 md:pr-6 overflow-hidden">
          <div
            className={cn(
              "bg-card rounded-2xl border border-border/50 shadow-sm w-full p-4 md:p-6 overflow-hidden",
              isProjectDrop ? "max-w-[1220px]" : "max-w-[800px]"
            )}
          >
            {children}
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );

  return (
    <SessionProvider>
      {isCarrier || isContribute || isLog ? (
        <>{children}<Toaster /></>
      ) : isProjectDrop ? (
        appShell
      ) : (
        <UserNameGate>{appShell}</UserNameGate>
      )}
    </SessionProvider>
  );
}

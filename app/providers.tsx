"use client";

import { Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "@/lib/design-store";
import { Toaster } from "@/components/ui/sonner";
import { DesignNav } from "@/components/design/design-nav";
import { DesignSidebar } from "@/components/design/design-sidebar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <SessionProvider>
        <Suspense>
          <DesignNav />
        </Suspense>
        <div className="px-6 min-h-svh flex gap-10 bg-[#f5f3f0]">
          <Suspense>
            <DesignSidebar />
          </Suspense>
          <div className="flex-1 min-w-0">{children}</div>
        </div>
        <Toaster />
      </SessionProvider>
    </ThemeProvider>
  );
}

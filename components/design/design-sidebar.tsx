"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Home, User, Globe, Plus, Bird, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CreateSessionDialog } from "@/components/design/create-session-dialog";

type Tab = "home" | "mine" | "all";

export function DesignSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { resolvedTheme, setTheme } = useTheme();
  const isHome = pathname === "/";
  const activeTab = (searchParams.get("tab") as Tab) || "home";

  return (
    <div className="shrink-0 sticky top-0 h-svh flex flex-col items-center pt-6 pb-12">
      {/* Bird — top */}
      <Link href="/">
        <Bird className="size-9 text-[#c2185b]" />
      </Link>

      {/* Nav icons — vertically centered in remaining height */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        {([
          { tab: "home" as Tab, href: "/", icon: Home, label: "Home" },
          { tab: "mine" as Tab, href: "/?tab=mine", icon: User, label: "My Sessions" },
          { tab: "all" as Tab, href: "/?tab=all", icon: Globe, label: "All Sessions" },
        ]).map(({ tab, href, icon: Icon, label }) => {
          const selected = isHome && activeTab === tab;
          return (
            <Link
              key={tab}
              href={href}
              title={label}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg transition-colors",
                selected
                  ? "bg-black/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
            </Link>
          );
        })}

        <CreateSessionDialog>
          <Button variant="outline" size="icon" title="New Session" className="text-muted-foreground">
            <Plus className="size-5" />
          </Button>
        </CreateSessionDialog>
      </div>

      {/* Theme toggle — bottom */}
      <button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors"
      >
        {resolvedTheme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </button>
    </div>
  );
}

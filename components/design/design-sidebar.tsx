"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Layers, Plus, Bird, Sun, Moon, Lock, Unlock, FlaskConical, Brain, PanelLeftClose, PanelLeft } from "lucide-react";
import { NotificationBell } from "@/components/design/notification-bell";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/hooks/use-admin";

export function DesignSidebar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { isAdmin, login, logout } = useAdmin();
  const [expanded, setExpanded] = useState(false);

  const isProjects = pathname === "/" || pathname.startsWith("/explorations");
  const isInsights = pathname.startsWith("/research");
  const isDesignOps = pathname.startsWith("/design-ops");

  const handleAdminToggle = async () => {
    if (isAdmin) {
      logout();
      return;
    }
    const password = window.prompt("Admin password");
    if (!password) return;
    const ok = await login(password);
    if (!ok) alert("Wrong password");
  };

  const navItems = [
    { href: "/", icon: Layers, label: "Projects", active: isProjects },
    { href: "/research", icon: FlaskConical, label: "Insights", active: isInsights },
    { href: "/design-ops", icon: Brain, label: "Design Ops", active: isDesignOps },
  ];

  return (
    <div
      className={cn(
        "shrink-0 sticky top-0 h-svh flex flex-col pt-6 pb-6 px-3 transition-[width] duration-200",
        expanded ? "w-52" : "w-16 md:w-52"
      )}
    >
      {/* Bird — top */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="flex items-center justify-center size-10 shrink-0 rounded-lg bg-black">
          <Bird className="size-5 text-white" />
        </Link>
        <div className={cn("min-w-0", expanded ? "block" : "hidden md:block")}>
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <span>Carrier</span>
            <button
              onClick={handleAdminToggle}
              className={cn(
                "flex items-center gap-1 transition-colors",
                isAdmin
                  ? "text-amber-500 hover:text-amber-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isAdmin ? <Unlock className="size-3" /> : <Lock className="size-3" />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">Explore, vote, ship.</p>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-0.5 w-full">
        {navItems.map(({ href, icon: Icon, label, active }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors w-full",
              active
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-[18px] shrink-0" />
            <span className={cn("text-sm", expanded ? "block" : "hidden md:block")}>{label}</span>
          </Link>
        ))}

        {/* Separator */}
        <div className="border-t border-border my-3" />

        <Link
          href="/new"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors w-full text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-[18px] shrink-0" />
          <span className={cn("text-sm", expanded ? "block" : "hidden md:block")}>New Session</span>
        </Link>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notifications */}
      <NotificationBell expanded={expanded} />

      {/* Expand toggle — mobile only */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors w-full text-muted-foreground hover:text-foreground md:hidden"
      >
        {expanded ? <PanelLeftClose className="size-[18px] shrink-0" /> : <PanelLeft className="size-[18px] shrink-0" />}
        <span className={cn("text-sm", expanded ? "block" : "hidden")}>{expanded ? "Collapse" : ""}</span>
      </button>

      {/* Dark mode toggle — bottom */}
      <button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors w-full text-muted-foreground hover:text-foreground"
      >
        {resolvedTheme === "dark" ? <Sun className="size-[18px] shrink-0" /> : <Moon className="size-[18px] shrink-0" />}
        <span className={cn("text-sm", expanded ? "block" : "hidden md:block")}>{resolvedTheme === "dark" ? "Light mode" : "Dark mode"}</span>
      </button>
    </div>
  );
}

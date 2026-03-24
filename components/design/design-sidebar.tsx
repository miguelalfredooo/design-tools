"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  Layers,
  Plus,
  Bird,
  Sun,
  Moon,
  Lock,
  Unlock,
  FlaskConical,
  Boxes,
  Info,
  Hash,
} from "lucide-react";
import { NotificationBell } from "@/components/design/notification-bell";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/hooks/use-admin";

export function DesignSidebar({
  showNotifications = true,
}: {
  showNotifications?: boolean;
}) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { isAdmin, login, logout } = useAdmin();
  const themeReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const isProjects = pathname === "/" || pathname.startsWith("/explorations");
  const isInsightsActive = pathname.startsWith("/research");
  const isCreatorTools = pathname.startsWith("/drops/creator-tools");
  const isSlackActive = pathname.startsWith("/slack");
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
    { href: "/", icon: Layers, label: "Sessions", active: isProjects },
    { href: "/research", icon: FlaskConical, label: "Projects", active: isInsightsActive },
    { href: "/slack", icon: Hash, label: "Slack", active: isSlackActive },
  ];

  const projectDrops = [
    {
      href: "/drops/creator-tools",
      icon: Boxes,
      label: "Creator Tools",
      active: isCreatorTools,
    },
  ];

  const isDarkTheme = resolvedTheme === "dark";
  const themeToggleTitle = !themeReady
    ? "Toggle theme"
    : isDarkTheme
      ? "Switch to light mode"
      : "Switch to dark mode";
  const themeToggleLabel = !themeReady
    ? "Theme"
    : isDarkTheme
      ? "Light mode"
      : "Dark mode";

  const labelSpanClass = "block whitespace-nowrap";
  const labelLogoClass = "block";
  const labelBlockClass = "block";

  return (
    <div
      className="shrink-0 sticky top-0 h-svh flex flex-col pt-6 pb-6 px-3 overflow-hidden w-52"
    >
      {/* Bird — top */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="flex items-center justify-center size-10 shrink-0 rounded-lg bg-white border border-border">
          <Bird className="size-5 text-black" />
        </Link>
        <div className={cn("min-w-0 overflow-hidden", labelLogoClass)}>
          <div className="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap">
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
          <p className="text-[11px] text-muted-foreground whitespace-nowrap">Explore, vote, ship.</p>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-0.5 w-full">
        {navItems.map(({ href, icon: Icon, label, active }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors w-full overflow-hidden",
              active
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-[18px] shrink-0" />
            <span className={cn("text-sm", labelSpanClass)}>{label}</span>
          </Link>
        ))}

        {/* Divider always present — gives consistent spacing before Project Drops in both states */}
        <div className="border-t border-border mt-3 mb-1" />

        <div className={cn("px-3 pb-2", labelBlockClass)}>
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] font-semibold tracking-[0.24em] text-muted-foreground/80 whitespace-nowrap">
              PROJECT DROPS
            </p>
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="About Project Drops"
                    className="rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-52 text-[11px] leading-4">
                  Larger explorations and stakeholder-ready prototypes.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {projectDrops.map(({ href, icon: Icon, label, active }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors w-full overflow-hidden",
              active
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-[18px] shrink-0" />
            <span className={cn("text-sm", labelSpanClass)}>{label}</span>
          </Link>
        ))}

        {/* Separator */}
        <div className="border-t border-border my-3" />

        <Link
          href="/new"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors w-full overflow-hidden text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-[18px] shrink-0" />
          <span className={cn("text-sm", labelSpanClass)}>New Session</span>
        </Link>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notifications */}
      {showNotifications ? <NotificationBell labelClass={labelSpanClass} /> : null}


      {/* Dark mode toggle — bottom */}
      <button
        onClick={() => setTheme(isDarkTheme ? "light" : "dark")}
        title={themeToggleTitle}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors w-full overflow-hidden text-muted-foreground hover:text-foreground"
      >
        {themeReady ? (
          isDarkTheme ? (
            <Sun className="size-[18px] shrink-0" />
          ) : (
            <Moon className="size-[18px] shrink-0" />
          )
        ) : (
          <Moon className="size-[18px] shrink-0" />
        )}
        <span className={cn("text-sm", labelSpanClass)}>
          {themeToggleLabel}
        </span>
      </button>
    </div>
  );
}

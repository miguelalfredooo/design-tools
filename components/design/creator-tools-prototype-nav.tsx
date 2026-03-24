"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { creatorToolsNav, creatorToolsSubNav } from "@/lib/mock/creator-tools";

export function CreatorToolsPrototypeNav() {
  const pathname = usePathname();
  const activeSubNav = creatorToolsSubNav.find((section) =>
    pathname.startsWith(section.rootHref)
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {creatorToolsNav.map((item) => {
          const active =
            item.href === "/drops/creator-tools"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {activeSubNav ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {activeSubNav.items.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border/70 bg-background/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

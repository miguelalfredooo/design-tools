import { getCreatorToolsToneClass } from "@/lib/creator-tools-pill";
import { cn } from "@/lib/utils";

export function CreatorToolsMetricCard({
  label,
  value,
  tone,
  align = "left",
  className,
}: {
  label: string;
  value: string | number;
  tone: string;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        align === "right" ? "text-left lg:text-right" : "text-left",
        getCreatorToolsToneClass(tone),
        className
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-current/75">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black tracking-tight text-current">{value}</p>
    </div>
  );
}

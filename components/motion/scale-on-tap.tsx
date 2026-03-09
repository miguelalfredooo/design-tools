"use client";

import { m } from "motion/react";
import { springs } from "@/lib/motion";

interface ScaleOnTapProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function ScaleOnTap({
  children,
  scale = 0.97,
  className,
  style,
}: ScaleOnTapProps) {
  return (
    <m.div
      whileTap={{ scale }}
      transition={springs.snappy}
      className={className}
      style={style}
    >
      {children}
    </m.div>
  );
}

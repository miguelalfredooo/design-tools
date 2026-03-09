"use client";

import { m } from "motion/react";
import { springs } from "@/lib/motion";

type SlideFrom = "left" | "right" | "top" | "bottom";

interface SlideInProps {
  children: React.ReactNode;
  from: SlideFrom;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

const offsets: Record<SlideFrom, { x?: number; y?: number }> = {
  left: { x: -60 },
  right: { x: 60 },
  top: { y: -60 },
  bottom: { y: 60 },
};

export function SlideIn({
  children,
  from,
  delay = 0,
  className,
  style,
}: SlideInProps) {
  const offset = offsets[from];

  return (
    <m.div
      initial={{ ...offset, opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ ...springs.smooth, delay }}
      className={className}
      style={style}
    >
      {children}
    </m.div>
  );
}

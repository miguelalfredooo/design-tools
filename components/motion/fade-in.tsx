"use client";

import { m } from "motion/react";
import { springs, type Direction, getDirectionOffset } from "@/lib/motion";

interface FadeInProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function FadeIn({
  children,
  direction,
  delay = 0,
  duration,
  className,
  style,
}: FadeInProps) {
  const offset = direction ? getDirectionOffset(direction) : { x: 0, y: 0 };

  return (
    <m.div
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        ...springs.smooth,
        delay,
        ...(duration != null ? { duration } : {}),
      }}
      className={className}
      style={style}
    >
      {children}
    </m.div>
  );
}

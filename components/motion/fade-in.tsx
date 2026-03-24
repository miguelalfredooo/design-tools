"use client";
import { m } from "motion/react";
import { springs, type Direction } from "@/lib/motion";

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
  delay = 0,
  duration,
  className,
  style,
}: FadeInProps) {
  return (
    <m.div
      initial={false}
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

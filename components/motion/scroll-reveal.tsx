"use client";

import { m } from "motion/react";
import { springs, type Direction, getDirectionOffset } from "@/lib/motion";

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  once?: boolean;
  amount?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  once = true,
  amount = 0.2,
  className,
  style,
}: ScrollRevealProps) {
  const offset = getDirectionOffset(direction);

  return (
    <m.div
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount }}
      transition={{ ...springs.smooth, delay }}
      className={className}
      style={style}
    >
      {children}
    </m.div>
  );
}

"use client";

import React from "react";
import { m } from "motion/react";
import { springs, staggerItem } from "@/lib/motion";

interface StaggerChildrenProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function StaggerChildren({
  children,
  staggerDelay = 0.08,
  className,
  style,
}: StaggerChildrenProps) {
  return (
    <m.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
      style={style}
    >
      {React.Children.map(children, (child) => (
        <m.div
          variants={staggerItem}
          transition={springs.smooth}
        >
          {child}
        </m.div>
      ))}
    </m.div>
  );
}

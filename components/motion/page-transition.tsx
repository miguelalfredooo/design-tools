"use client";

import { AnimatePresence, m } from "motion/react";
import { usePathname } from "next/navigation";
import { durations } from "@/lib/motion";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: durations.fast }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}

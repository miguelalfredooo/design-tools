import type { Transition, Variants } from "motion/react";

// --- Spring presets (migrated from lib/animations.ts) ---

export const springs = {
  snappy: { type: "spring" as const, stiffness: 400, damping: 28 },
  smooth: { type: "spring" as const, stiffness: 200, damping: 20 },
  bouncy: { type: "spring" as const, stiffness: 300, damping: 15 },
  dramatic: {
    type: "spring" as const,
    stiffness: 100,
    damping: 12,
    mass: 1.5,
  },
} satisfies Record<string, Transition>;

// --- Duration presets (seconds) ---

export const durations = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  dramatic: 0.8,
};

// --- Offset distances for directional animations ---

const OFFSET = 24;

const directionOffset = {
  up: { x: 0, y: OFFSET },
  down: { x: 0, y: -OFFSET },
  left: { x: OFFSET, y: 0 },
  right: { x: -OFFSET, y: 0 },
} as const;

export type Direction = keyof typeof directionOffset;

export function getDirectionOffset(direction: Direction) {
  return directionOffset[direction];
}

// --- Variant presets ---

export const variants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  fadeUp: {
    hidden: { opacity: 0, y: OFFSET },
    visible: { opacity: 1, y: 0 },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -OFFSET },
    visible: { opacity: 1, y: 0 },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: OFFSET },
    visible: { opacity: 1, x: 0 },
  },
  fadeRight: {
    hidden: { opacity: 0, x: -OFFSET },
    visible: { opacity: 1, x: 0 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
  slideUp: {
    hidden: { y: OFFSET },
    visible: { y: 0 },
  },
  slideDown: {
    hidden: { y: -OFFSET },
    visible: { y: 0 },
  },
  slideLeft: {
    hidden: { x: OFFSET },
    visible: { x: 0 },
  },
  slideRight: {
    hidden: { x: -OFFSET },
    visible: { x: 0 },
  },
} satisfies Record<string, Variants>;

// --- Stagger helper ---

export function stagger(delayPerChild = 0.08): Transition {
  return {
    ...springs.smooth,
    staggerChildren: delayPerChild,
  };
}

// --- Stagger parent/child variant pair ---

export const staggerContainer: Variants = {
  hidden: {},
  visible: (staggerDelay: number = 0.08) => ({
    transition: { staggerChildren: staggerDelay },
  }),
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: OFFSET },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
};

// --- Viewport config ---

export const viewportOnce = { once: true, margin: "-10%" as `${number}px` } as const;

"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/shared/lib/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  /** Render a small dot to indicate unseen updates. */
  notify?: boolean;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onValueChange: (value: T) => void;
  className?: string;
  /** Shared layout id so the pill animates uniquely per instance. */
  layoutId: string;
}

export function Segmented<T extends string>({
  value,
  options,
  onValueChange,
  className,
  layoutId,
}: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        "glass relative inline-flex w-full items-center gap-1 rounded-2xl p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(opt.value)}
            className={cn(
              "relative z-10 flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              active ? "text-base-950" : "text-base-300 hover:text-base-100",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 z-[-1] rounded-xl bg-accent-400"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            {opt.icon}
            <span>{opt.label}</span>
            {opt.notify && !active && (
              <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-accent-400 shadow-[0_0_0_3px_var(--color-base-900)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

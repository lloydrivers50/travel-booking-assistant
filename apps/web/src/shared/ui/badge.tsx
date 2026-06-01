import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      tone: {
        neutral: "border-base-600 bg-base-800 text-base-200",
        accent:
          "border-accent-600/40 bg-accent-900/40 text-accent-200",
        ok: "border-ok-500/40 bg-ok-500/12 text-ok-400",
        warn: "border-warn-500/40 bg-warn-500/12 text-warn-400",
        danger: "border-danger-500/40 bg-danger-500/12 text-danger-400",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

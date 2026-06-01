import * as React from "react";
import { cn } from "@/shared/lib/cn";

/** Shimmering placeholder block. */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "shimmer relative overflow-hidden rounded-lg bg-base-800/70",
        className,
      )}
      {...props}
    />
  );
}

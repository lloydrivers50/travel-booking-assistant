"use client";

import { motion } from "motion/react";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { StageName, StageState } from "@/features/chat/types";

const dotStyles: Record<StageState["status"], string> = {
  pending: "border-base-600 bg-base-850 text-base-500",
  active: "border-accent-400 bg-accent-500/15 text-accent-300",
  done: "border-ok-500/60 bg-ok-500/15 text-ok-400",
  error: "border-danger-500/60 bg-danger-500/15 text-danger-400",
};

function StageDot({ status }: { status: StageState["status"] }) {
  return (
    <span
      className={cn(
        "relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
        dotStyles[status],
      )}
    >
      {status === "active" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {status === "done" && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      {status === "error" && <X className="h-3.5 w-3.5" strokeWidth={3} />}
      {status === "pending" && (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {status === "active" && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-accent-400"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.7 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </span>
  );
}

export function StagePipeline({
  stages,
  labels,
}: {
  stages: StageState[];
  labels: Record<StageName, string>;
}) {
  return (
    <ol className="relative flex flex-col gap-1">
      {stages.map((stage, i) => {
        const isLast = i === stages.length - 1;
        const active = stage.status === "active";
        return (
          <li key={stage.name} className="relative flex gap-3.5 pb-1">
            <div className="flex flex-col items-center">
              <StageDot status={stage.status} />
              {!isLast && (
                <span
                  className={cn(
                    "w-0.5 flex-1 rounded-full transition-colors",
                    stage.status === "done"
                      ? "bg-ok-500/40"
                      : "bg-base-700",
                  )}
                  style={{ minHeight: 28 }}
                />
              )}
            </div>
            <div className={cn("pb-3 pt-0.5", isLast && "pb-0")}>
              <p
                className={cn(
                  "text-sm font-medium transition-colors",
                  stage.status === "pending"
                    ? "text-base-500"
                    : "text-base-100",
                )}
              >
                {labels[stage.name]}
              </p>
              {stage.detail && (
                <motion.p
                  key={stage.detail}
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mt-0.5 text-xs",
                    stage.status === "error"
                      ? "text-danger-400"
                      : active
                        ? "text-accent-300"
                        : "text-base-400",
                  )}
                >
                  {stage.detail}
                </motion.p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

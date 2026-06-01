"use client";

import { motion } from "motion/react";
import { BedDouble, Car, Train, ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { Leg, LegMode } from "@/features/itinerary/types";

const MODE: Record<
  LegMode,
  { icon: LucideIcon; label: string; tint: string }
> = {
  rail: { icon: Train, label: "Rail", tint: "text-accent-300 bg-accent-500/12" },
  hotel: {
    icon: BedDouble,
    label: "Hotel",
    tint: "text-violet-300 bg-violet-500/12",
  },
  taxi: { icon: Car, label: "Transfer", tint: "text-amber-300 bg-amber-500/12" },
};

function formatTime(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const hasTime = iso.includes("T");
  return hasTime
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount);
}

export function LegCard({
  leg,
  currency,
  index,
  flagged,
}: {
  leg: Leg;
  currency: string;
  index: number;
  flagged?: boolean;
}) {
  const { icon: Icon, label, tint } = MODE[leg.mode];
  const depart = formatTime(leg.depart);
  const arrive = formatTime(leg.arrive);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "glass rounded-xl p-3.5",
        flagged && "ring-1 ring-warn-500/40",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            tint,
          )}
        >
          <Icon className="h-[1.1rem] w-[1.1rem]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-base-400">
              {label}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-base-50">
              {money(leg.cost, currency)}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-sm text-base-100">
            <span className="truncate font-medium">{leg.from}</span>
            {leg.from !== leg.to && (
              <>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-base-500" />
                <span className="truncate font-medium">{leg.to}</span>
              </>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-base-400">
            {depart && (
              <span className="tabular-nums">
                {depart}
                {arrive && <span className="text-base-500"> → {arrive}</span>}
              </span>
            )}
            {leg.class && <span>{leg.class}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

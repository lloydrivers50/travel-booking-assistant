"use client";

import {
  CircleCheck,
  ClipboardCheck,
  ShieldAlert,
  ShieldX,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { ItineraryStatus } from "@/features/itinerary/types";
import type { BadgeProps } from "@/shared/ui/badge";

interface StatusMeta {
  icon: LucideIcon;
  label: string;
  tone: NonNullable<BadgeProps["tone"]>;
  ring: string;
  text: string;
  bg: string;
}

const META: Record<ItineraryStatus, StatusMeta> = {
  approved: {
    icon: CircleCheck,
    label: "Approved",
    tone: "ok",
    ring: "ring-ok-500/40",
    text: "text-ok-400",
    bg: "bg-ok-500/10",
  },
  proposed: {
    icon: ClipboardCheck,
    label: "Proposed",
    tone: "accent",
    ring: "ring-accent-500/40",
    text: "text-accent-300",
    bg: "bg-accent-500/10",
  },
  over_threshold: {
    icon: ShieldAlert,
    label: "Over threshold",
    tone: "warn",
    ring: "ring-warn-500/40",
    text: "text-warn-400",
    bg: "bg-warn-500/10",
  },
  out_of_policy: {
    icon: ShieldX,
    label: "Out of policy",
    tone: "danger",
    ring: "ring-danger-500/40",
    text: "text-danger-400",
    bg: "bg-danger-500/10",
  },
};

export function ComplianceBadge({
  status,
  reason,
}: {
  status: ItineraryStatus;
  reason?: string;
}) {
  const m = META[status];
  const Icon = m.icon;

  return (
    <div
      className={cn(
        "rounded-xl p-4 ring-1",
        m.ring,
        m.bg,
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("h-5 w-5", m.text)} />
        <span className={cn("text-sm font-semibold", m.text)}>{m.label}</span>
      </div>
      {reason && (
        <p className="mt-1.5 text-xs leading-relaxed text-base-300">{reason}</p>
      )}
    </div>
  );
}

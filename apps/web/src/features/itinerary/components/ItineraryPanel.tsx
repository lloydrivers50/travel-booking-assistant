"use client";

import { AnimatePresence, motion } from "motion/react";
import { Wallet } from "lucide-react";
import type { Itinerary } from "@/features/itinerary/types";
import type { StageName, StageState } from "@/features/chat/types";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { StagePipeline } from "./StagePipeline";
import { LegCard } from "./LegCard";
import { CitationChips } from "./CitationChips";
import { ComplianceBadge } from "./ComplianceBadge";
import { ItineraryEmptyState } from "./ItineraryEmptyState";
import { ItinerarySkeleton } from "./ItinerarySkeleton";

interface ItineraryPanelProps {
  stages: StageState[];
  stageLabels: Record<StageName, string>;
  itinerary: Itinerary | null;
  /** A turn is currently in flight. */
  isActive: boolean;
  /** Any turn has started at least once this session. */
  hasStarted: boolean;
}

function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(
    amount,
  );
}

export function ItineraryPanel({
  stages,
  stageLabels,
  itinerary,
  isActive,
  hasStarted,
}: ItineraryPanelProps) {
  if (!hasStarted && !itinerary) {
    return <ItineraryEmptyState />;
  }

  const showPipeline = isActive || !itinerary;
  const flaggedHotel = itinerary?.status === "over_threshold";

  return (
    <div className="h-full overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-xl space-y-4">
        <AnimatePresence mode="wait">
          {showPipeline && (
            <motion.div
              key="pipeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-base-100">
                    On the case
                  </h3>
                  <span className="text-xs text-base-400">
                    {stages.filter((s) => s.status === "done").length}/
                    {stages.length}
                  </span>
                </CardHeader>
                <CardContent>
                  <StagePipeline stages={stages} labels={stageLabels} />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {!itinerary && isActive && <ItinerarySkeleton />}

        <AnimatePresence>
          {itinerary && (
            <motion.div
              key="itinerary"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              {/* Total cost banner */}
              <Card>
                <CardContent className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/12 text-accent-300">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-base-400">
                        Total cost
                      </p>
                      <p className="text-2xl font-semibold tabular-nums text-base-50">
                        {money(itinerary.totalCost, itinerary.currency)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-base-400">
                    {itinerary.legs.length} legs
                  </span>
                </CardContent>
              </Card>

              {/* Compliance verdict */}
              <ComplianceBadge
                status={itinerary.status}
                reason={itinerary.approval?.reason}
              />

              {/* Legs */}
              <div className="space-y-2.5">
                {itinerary.legs.map((leg, i) => (
                  <LegCard
                    key={`${leg.mode}-${i}`}
                    leg={leg}
                    currency={itinerary.currency}
                    index={i}
                    flagged={flaggedHotel && leg.mode === "hotel"}
                  />
                ))}
              </div>

              {/* Citations */}
              {itinerary.citations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-base-400">
                    Policy citations
                  </p>
                  <CitationChips citations={itinerary.citations} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

"use client";

import { Route } from "lucide-react";

export function ItineraryEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-base-600 text-base-500">
        <Route className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-base-200">
        No itinerary yet
      </h3>
      <p className="mt-1.5 max-w-xs text-balance text-sm text-base-400">
        Send a request and the plan builds here — live progress, priced legs,
        policy citations, and an approval verdict.
      </p>
    </div>
  );
}

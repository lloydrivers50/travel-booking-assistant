"use client";

import { useQuery } from "@tanstack/react-query";
import { getItineraryResult } from "@/features/itinerary/api/itinerary-api";

/**
 * TanStack Query read of the persisted itinerary by turn id. The live stream
 * is the primary source during a turn; this is the durable re-fetch (refresh,
 * deep link, or reconciliation after the stream closes).
 */
export function useItineraryResult(id: string | null) {
  return useQuery({
    queryKey: ["itinerary", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { itinerary } = await getItineraryResult(id!);
      return itinerary;
    },
    staleTime: 30_000,
  });
}

import { apiClient } from "@/shared/lib/api-client";
import type { ResultResponse } from "@/features/itinerary/types";

/** GET the persisted itinerary for a turn id. */
export function getItineraryResult(id: string): Promise<ResultResponse> {
  return apiClient.get<ResultResponse>(`/api/result/${id}`);
}

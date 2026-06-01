/** Locked itinerary contract — mirrors the backend seam exactly. */

export type ItineraryStatus =
  | "proposed"
  | "approved"
  | "over_threshold"
  | "out_of_policy";

export type LegMode = "rail" | "hotel" | "taxi";

export interface Leg {
  mode: LegMode;
  from: string;
  to: string;
  depart?: string;
  arrive?: string;
  cost: number;
  class?: string;
}

export interface Citation {
  clause: string;
  sourceDocument: string;
  text: string;
}

export interface Approval {
  required: boolean;
  reason?: string;
}

export interface Itinerary {
  id: string;
  status: ItineraryStatus;
  legs: Leg[];
  totalCost: number;
  currency: string;
  citations: Citation[];
  approval?: Approval;
}

export interface ResultResponse {
  itinerary: Itinerary;
}

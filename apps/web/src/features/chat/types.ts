import type { Itinerary } from "@/features/itinerary/types";

export type StageName = "intent" | "policy" | "pricing" | "approval";
export type StageStatus = "active" | "done" | "error";

/** Discriminated union of SSE payloads, all correlated by `id`. */
export interface TokenEvent {
  id: string;
  chunk: string;
}
export interface StageEvent {
  id: string;
  name: StageName;
  status: StageStatus;
  detail?: string;
}
export interface ItineraryEvent {
  id: string;
  itinerary: Itinerary;
}
export interface DoneEvent {
  id: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** True while tokens are still streaming into this assistant message. */
  streaming?: boolean;
}

export interface StageState {
  name: StageName;
  status: StageStatus | "pending";
  detail?: string;
}

export interface SendMessageResponse {
  id: string;
}

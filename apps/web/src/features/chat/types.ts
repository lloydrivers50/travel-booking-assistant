// Typed contract for the chat slice.
// Every file in this feature (the SSE hook, the API call, the components) imports
// its shapes from here, so they can't drift apart. Two groups live below:
//   1. WIRE types — the exact shape of what the server pushes over SSE.
//   2. VIEW types — the shape the UI holds after the reducer translates those events.

import type { Itinerary } from "@/features/itinerary/types";
// The itinerary slice owns the Itinerary shape; chat only references it, never redefines it.

// Allowed values for a pipeline stage. Anything outside these unions won't compile.
export type StageName = "intent" | "policy" | "pricing" | "approval";
export type StageStatus = "active" | "done" | "error";

// ── WIRE TYPES ──────────────────────────────────────────────────────────────
// These four ARE the SSE contract. Every frame carries `id` — the server-minted
// turn id — so the reducer knows which message a frame belongs to.

/** A chunk of streamed assistant text. */
export interface TokenEvent {
  id: string;
  chunk: string;
}

/** Progress update for one stage of the pipeline. */
export interface StageEvent {
  id: string;
  name: StageName;
  status: StageStatus;
  detail?: string;
}

/** The structured itinerary, sent once it has firmed up. */
export interface ItineraryEvent {
  id: string;
  itinerary: Itinerary;
}

/** Signals the turn is complete; no more frames will arrive for this id. */
export interface DoneEvent {
  id: string;
}

// ── VIEW TYPES ──────────────────────────────────────────────────────────────
// What the UI stores. These differ from the wire types on purpose — the reducer
// in useChatStream builds them from the incoming events.

/** A rendered chat bubble. */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** True while tokens are still streaming into this assistant message (drives the caret). */
  streaming?: boolean;
}

/**
 * A stage as the panel renders it. Adds "pending" — a stage that hasn't started
 * yet — which never comes over the wire: the UI shows all four stages up front
 * and flips each one as its StageEvent arrives.
 */
export interface StageState {
  name: StageName;
  status: StageStatus | "pending";
  detail?: string;
}

/** Body of the 202 returned by POST /api/chat. */
export interface SendMessageResponse {
  id: string;
}

// DEV MOCK — delete when the NestJS backend is live. Not part of the real app.
//
// Module-level in-memory job store. Next dev runs a single process, so a
// module-level Map survives across requests for the lifetime of the server.

import type { Itinerary } from "@/features/itinerary/types";
import type { StageName, StageStatus } from "@/features/chat/types";

export type ScriptedEvent =
  | { kind: "token"; chunk: string; delay: number }
  | { kind: "stage"; name: StageName; status: StageStatus; detail?: string; delay: number }
  | { kind: "itinerary"; itinerary: Itinerary; delay: number }
  | { kind: "done"; delay: number };

export interface Job {
  id: string;
  message: string;
  events: ScriptedEvent[];
  itinerary: Itinerary;
}

declare global {
  var __mockJobs: Map<string, Job> | undefined;
}

export const jobs: Map<string, Job> =
  globalThis.__mockJobs ?? (globalThis.__mockJobs = new Map());

function words(text: string): string[] {
  // Preserve trailing spaces so reassembly reads naturally.
  return text.match(/\S+\s*/g) ?? [text];
}

/**
 * Builds the north-star scripted job:
 * "2 Band 8 nurses, Cardiff → Manchester, cheapest compliant, overnight."
 * Rail outbound + return, overnight hotel that trips the band-8 cap → an
 * over_threshold approval, with a policy citation.
 */
export function buildJob(id: string, message: string): Job {
  const itinerary: Itinerary = {
    id,
    status: "over_threshold",
    currency: "GBP",
    totalCost: 486.4,
    legs: [
      {
        mode: "rail",
        from: "Cardiff Central",
        to: "Manchester Piccadilly",
        depart: "2026-06-15T07:12:00",
        arrive: "2026-06-15T10:34:00",
        cost: 79.5,
        class: "Standard Advance",
      },
      {
        mode: "hotel",
        from: "Manchester city centre",
        to: "Manchester city centre",
        depart: "2026-06-15",
        arrive: "2026-06-16",
        cost: 168.0,
        class: "1 twin room · 1 night",
      },
      {
        mode: "taxi",
        from: "Manchester Piccadilly",
        to: "Training venue, Oxford Road",
        cost: 11.2,
        class: "Pre-booked transfer",
      },
      {
        mode: "rail",
        from: "Manchester Piccadilly",
        to: "Cardiff Central",
        depart: "2026-06-16T16:48:00",
        arrive: "2026-06-16T20:09:00",
        cost: 79.5,
        class: "Standard Advance",
      },
    ],
    citations: [
      {
        clause: "§4.2.1 Overnight accommodation",
        sourceDocument: "NHS Wales Travel & Subsistence Policy v12.pdf",
        text: "Overnight accommodation is reimbursable where the return journey exceeds the daily commuting threshold. Band 8 staff are entitled to a single occupancy room.",
      },
      {
        clause: "§4.2.4 Accommodation cap",
        sourceDocument: "NHS Wales Travel & Subsistence Policy v12.pdf",
        text: "Hotel costs are capped at £140 per night outside London. Bookings above the cap require line-manager approval before confirmation.",
      },
      {
        clause: "§3.1 Rail class",
        sourceDocument: "NHS Wales Travel & Subsistence Policy v12.pdf",
        text: "Standard class rail is the default. Advance fares should be selected where the schedule permits to minimise cost.",
      },
    ],
    approval: {
      required: true,
      reason:
        "Hotel at £168/night exceeds the £140 Band 8 accommodation cap (§4.2.4). Line-manager approval required before booking.",
    },
  };

  const narration =
    "Found a compliant plan for both nurses. Standard Advance rail Cardiff → " +
    "Manchester and back, with one overnight twin room near the training venue. " +
    "The cheapest available room is £168 — that's over the £140 Band 8 cap, so " +
    "I've flagged it for line-manager approval and cited the relevant clauses. " +
    "Everything else sits inside policy.";

  const events: ScriptedEvent[] = [];

  // Stage pipeline interleaved with narration tokens.
  events.push({ kind: "stage", name: "intent", status: "active", detail: "Reading the request", delay: 220 });
  events.push({ kind: "stage", name: "intent", status: "done", detail: "2 travellers · Band 8 · Cardiff → Manchester · overnight OK", delay: 900 });

  events.push({ kind: "stage", name: "policy", status: "active", detail: "Resolving entitlement & policy version", delay: 260 });
  events.push({ kind: "stage", name: "policy", status: "done", detail: "NHS Wales T&S v12 · effective 2026-06-15", delay: 1100 });

  events.push({ kind: "stage", name: "pricing", status: "active", detail: "Pricing rail + hotel + transfer", delay: 280 });

  // Stream the narration during pricing for a lively feel.
  for (const w of words(narration)) {
    events.push({ kind: "token", chunk: w, delay: 38 });
  }

  events.push({ kind: "stage", name: "pricing", status: "done", detail: "4 legs priced · total £486.40", delay: 420 });

  events.push({ kind: "stage", name: "approval", status: "active", detail: "Checking thresholds", delay: 300 });
  events.push({ kind: "stage", name: "approval", status: "error", detail: "Over threshold — manager approval needed", delay: 800 });

  events.push({ kind: "itinerary", itinerary, delay: 360 });
  events.push({ kind: "done", delay: 120 });

  return { id, message, events, itinerary };
}

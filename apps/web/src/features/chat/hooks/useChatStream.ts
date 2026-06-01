"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { openChatStream, type SseEventName } from "@/shared/lib/sse-client";
import type {
  ChatMessage,
  DoneEvent,
  ItineraryEvent,
  StageEvent,
  StageName,
  StageState,
  TokenEvent,
} from "@/features/chat/types";
import type { Itinerary } from "@/features/itinerary/types";

const STAGE_ORDER: StageName[] = ["intent", "policy", "pricing", "approval"];

const STAGE_LABELS: Record<StageName, string> = {
  intent: "Understanding the request",
  policy: "Resolving entitlement & policy",
  pricing: "Pricing live options",
  approval: "Approval & compliance",
};

function freshStages(): StageState[] {
  return STAGE_ORDER.map((name) => ({ name, status: "pending" }));
}

export interface ChatStreamState {
  messages: ChatMessage[];
  stages: StageState[];
  itinerary: Itinerary | null;
  /** Turn id currently streaming, or null when idle. */
  activeTurnId: string | null;
  /** True from POST until the first stream activity for that turn. */
  pendingTurnId: string | null;
}

type Action =
  | { type: "user_message"; id: string; content: string }
  | { type: "begin_turn"; turnId: string }
  | { type: "token"; e: TokenEvent }
  | { type: "stage"; e: StageEvent }
  | { type: "itinerary"; e: ItineraryEvent }
  | { type: "done"; e: DoneEvent };

function reducer(state: ChatStreamState, action: Action): ChatStreamState {
  switch (action.type) {
    case "user_message":
      return {
        ...state,
        messages: [
          ...state.messages,
          { id: action.id, role: "user", content: action.content },
        ],
      };

    case "begin_turn":
      // Reset the work surfaces for a new turn.
      return {
        ...state,
        pendingTurnId: action.turnId,
        activeTurnId: action.turnId,
        stages: freshStages(),
        itinerary: null,
      };

    case "token": {
      const { id, chunk } = action.e;
      const existing = state.messages.find(
        (m) => m.id === id && m.role === "assistant",
      );
      const messages = existing
        ? state.messages.map((m) =>
            m.id === id && m.role === "assistant"
              ? { ...m, content: m.content + chunk }
              : m,
          )
        : [
            ...state.messages,
            {
              id,
              role: "assistant" as const,
              content: chunk,
              streaming: true,
            },
          ];
      return {
        ...state,
        messages,
        pendingTurnId: null,
        activeTurnId: id,
      };
    }

    case "stage": {
      const { id, name, status, detail } = action.e;
      const stages = state.stages.map((s) =>
        s.name === name ? { ...s, status, detail } : s,
      );
      return {
        ...state,
        stages,
        pendingTurnId: null,
        activeTurnId: id,
      };
    }

    case "itinerary":
      return {
        ...state,
        itinerary: action.e.itinerary,
        pendingTurnId: null,
      };

    case "done": {
      const messages = state.messages.map((m) =>
        m.id === action.e.id && m.role === "assistant"
          ? { ...m, streaming: false }
          : m,
      );
      return {
        ...state,
        messages,
        activeTurnId: null,
        pendingTurnId: null,
      };
    }

    default:
      return state;
  }
}

const initialState: ChatStreamState = {
  messages: [],
  stages: freshStages(),
  itinerary: null,
  activeTurnId: null,
  pendingTurnId: null,
};

/**
 * Opens the single long-lived SSE stream on mount and dispatches every event
 * (token / stage / itinerary / done) to the right turn by id. Exposes the
 * derived chat state plus controls for the composer to register a new turn.
 */
export function useChatStream() {
  const [state, dispatch] = useReducer(reducer, initialState);
  // Track turns this client initiated so we ignore stray stream frames.
  const ownTurns = useRef<Set<string>>(new Set());

  const handleEvent = useCallback((name: SseEventName, data: unknown) => {
    const id = (data as { id?: string })?.id;
    if (!id || !ownTurns.current.has(id)) return;

    switch (name) {
      case "token":
        dispatch({ type: "token", e: data as TokenEvent });
        break;
      case "stage":
        dispatch({ type: "stage", e: data as StageEvent });
        break;
      case "itinerary":
        dispatch({ type: "itinerary", e: data as ItineraryEvent });
        break;
      case "done":
        dispatch({ type: "done", e: data as DoneEvent });
        break;
    }
  }, []);

  useEffect(() => {
    const close = openChatStream({ onEvent: handleEvent });
    return close;
  }, [handleEvent]);

  /** Append the agent's user message immediately (optimistic). */
  const addUserMessage = useCallback((content: string) => {
    const localId = `user-${crypto.randomUUID()}`;
    dispatch({ type: "user_message", id: localId, content });
  }, []);

  /** Register a server-minted turn id and reset the work surfaces. */
  const beginTurn = useCallback((turnId: string) => {
    ownTurns.current.add(turnId);
    dispatch({ type: "begin_turn", turnId });
  }, []);

  return {
    ...state,
    stageLabels: STAGE_LABELS,
    addUserMessage,
    beginTurn,
  };
}

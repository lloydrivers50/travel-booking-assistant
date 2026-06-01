import { apiUrl } from "@/shared/config/env";

/** Named SSE event types emitted by the stream. */
export type SseEventName = "token" | "stage" | "itinerary" | "done";

export interface SseHandlers {
  onEvent: (name: SseEventName, data: unknown) => void;
  onError?: (err: Event) => void;
  onOpen?: () => void;
}

/**
 * Opens the single long-lived SSE stream. Every event carries an `id` that
 * correlates it to a turn; routing by id is the caller's job. Returns a
 * cleanup function that closes the connection.
 *
 * Uses the native EventSource. The browser auto-reconnects on transient drops.
 */
export function openChatStream(handlers: SseHandlers): () => void {
  const source = new EventSource(apiUrl("/api/chat/stream"));

  const names: SseEventName[] = ["token", "stage", "itinerary", "done"];
  const listeners = names.map((name) => {
    const listener = (e: MessageEvent) => {
      try {
        handlers.onEvent(name, JSON.parse(e.data));
      } catch {
        /* ignore malformed frame */
      }
    };
    source.addEventListener(name, listener as EventListener);
    return { name, listener };
  });

  if (handlers.onOpen) source.addEventListener("open", handlers.onOpen);
  if (handlers.onError) source.addEventListener("error", handlers.onError);

  return () => {
    for (const { name, listener } of listeners) {
      source.removeEventListener(name, listener as EventListener);
    }
    source.close();
  };
}

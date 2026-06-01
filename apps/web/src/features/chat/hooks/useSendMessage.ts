"use client";

import { useCallback, useState } from "react";
import { postChatMessage } from "@/features/chat/api/chat-api";

interface UseSendMessageArgs {
  conversationId?: string;
  /** Optimistically render the agent's message before POST resolves. */
  onUserMessage: (content: string) => void;
  /** Called with the server-minted turn id once 202 returns. */
  onTurnAccepted: (turnId: string) => void;
}

/**
 * POSTs a turn. Locks the composer between submit and the 202 response, then
 * unlocks it. The client never mints the id — the server returns it.
 */
export function useSendMessage({
  conversationId,
  onUserMessage,
  onTurnAccepted,
}: UseSendMessageArgs) {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || isSending) return;

      setError(null);
      setIsSending(true);
      onUserMessage(trimmed);

      try {
        const { id } = await postChatMessage({
          message: trimmed,
          conversationId,
        });
        onTurnAccepted(id);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to send. Try again.",
        );
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, isSending, onUserMessage, onTurnAccepted],
  );

  return { send, isSending, error };
}

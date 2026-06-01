import { apiClient } from "@/shared/lib/api-client";
import type { SendMessageResponse } from "@/features/chat/types";

/**
 * POST a turn. The server mints the id and returns 202 instantly; the actual
 * work streams over the separate long-lived SSE channel, correlated by id.
 */
export function postChatMessage(input: {
  message: string;
  conversationId?: string;
}): Promise<SendMessageResponse> {
  return apiClient.post<SendMessageResponse>("/api/chat", input);
}

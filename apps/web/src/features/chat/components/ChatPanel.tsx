"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowDown } from "lucide-react";
import type { ChatMessage } from "@/features/chat/types";
import { MessageBubble } from "./MessageBubble";
import { Composer } from "./Composer";
import { ChatEmptyState } from "./ChatEmptyState";
import { useAutoScroll } from "@/features/chat/hooks/useAutoScroll";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  isSending: boolean;
  isStreaming: boolean;
  error: string | null;
}

export function ChatPanel({
  messages,
  onSend,
  isSending,
  isStreaming,
  error,
}: ChatPanelProps) {
  // Re-pin on message count and last content length so streaming tokens follow.
  const last = messages[messages.length - 1];
  const scrollDep = `${messages.length}:${last?.content.length ?? 0}`;
  const { ref, pinned, jumpToBottom } = useAutoScroll(scrollDep);

  const isEmpty = messages.length === 0;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div
        ref={ref}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6"
      >
        {isEmpty ? (
          <ChatEmptyState onPick={onSend} />
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {messages.map((m) => (
              <MessageBubble key={`${m.role}-${m.id}`} message={m} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {!pinned && !isEmpty && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={jumpToBottom}
            className="glass-strong absolute bottom-32 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-base-100 shadow-lg"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            {isStreaming ? "Aria is replying" : "Latest"}
          </motion.button>
        )}
      </AnimatePresence>

      <Composer
        onSend={onSend}
        disabled={isSending}
        isSending={isSending}
        error={error}
      />
    </div>
  );
}

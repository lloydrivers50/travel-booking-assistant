"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { ChatMessage } from "@/features/chat/types";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-500/15 ring-1 ring-accent-500/30">
          <Sparkles className="h-4 w-4 text-accent-300" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-4 py-2.5 text-[0.94rem] leading-relaxed",
          isUser
            ? "rounded-br-md bg-accent-500 text-base-950 shadow-[0_10px_30px_-12px_var(--color-accent-700)]"
            : "rounded-bl-md glass text-base-100",
        )}
      >
        <span className={cn(message.streaming && "stream-caret")}>
          {message.content}
        </span>
      </div>
    </motion.div>
  );
}

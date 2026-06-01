"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";

interface ComposerProps {
  onSend: (message: string) => void;
  disabled: boolean;
  isSending: boolean;
  error: string | null;
}

export function Composer({ onSend, disabled, isSending, error }: ComposerProps) {
  const [value, setValue] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [value]);

  const submit = () => {
    if (disabled || !value.trim()) return;
    onSend(value);
    setValue("");
  };

  return (
    <div className="px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
      {error && (
        <div className="mb-2 flex items-center gap-2 text-xs text-danger-400">
          <TriangleAlert className="h-3.5 w-3.5" />
          {error}
        </div>
      )}
      <div
        className={cn(
          "glass-strong flex items-end gap-2 rounded-2xl p-2 transition-shadow",
          "focus-within:ring-2 focus-within:ring-accent-400/60",
        )}
      >
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Describe the trip — e.g. 2 Band 8 nurses, Cardiff to Manchester, cheapest compliant, overnight if needed"
          aria-label="Travel request"
          className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2.5 text-[0.94rem] leading-relaxed text-base-100 placeholder:text-base-400 focus:outline-none"
        />
        <Button
          size="icon"
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Send request"
          className="rounded-xl"
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowUp className="h-5 w-5" />
          )}
        </Button>
      </div>
      <p className="mt-2 px-1 text-[0.7rem] text-base-500">
        Aria proposes — it never sets a limit, approves, or books without review.
      </p>
    </div>
  );
}

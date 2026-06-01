"use client";

import { motion } from "motion/react";
import { Sparkles, Train, ShieldCheck, Receipt } from "lucide-react";

const PROMPTS = [
  "2 Band 8 nurses, Cardiff → Manchester, cheapest compliant, overnight if needed",
  "Day return for 1 Band 6, Leeds → London, standard class only",
  "Police sergeant, Bristol → Birmingham, arrive before 09:00",
];

export function ChatEmptyState({
  onPick,
}: {
  onPick: (prompt: string) => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500/15 ring-1 ring-accent-500/30"
      >
        <Sparkles className="h-7 w-7 text-accent-300" />
      </motion.div>

      <h2 className="mt-5 text-balance text-xl font-semibold text-base-50">
        Book compliant corporate travel, fast
      </h2>
      <p className="mt-2 max-w-sm text-balance text-sm text-base-400">
        Describe the journey in plain words. Aria extracts intent, checks policy
        with citations, prices live options, and flags anything needing approval.
      </p>

      <div className="mt-6 flex items-center gap-5 text-[0.7rem] font-medium uppercase tracking-wide text-base-500">
        <span className="flex items-center gap-1.5">
          <Train className="h-3.5 w-3.5" /> Priced
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" /> Cited
        </span>
        <span className="flex items-center gap-1.5">
          <Receipt className="h-3.5 w-3.5" /> Auditable
        </span>
      </div>

      <div className="mt-8 grid w-full max-w-md gap-2">
        {PROMPTS.map((p, i) => (
          <motion.button
            key={p}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.07, duration: 0.3 }}
            onClick={() => onPick(p)}
            className="glass group rounded-xl px-4 py-3 text-left text-sm text-base-200 transition-colors hover:bg-base-750 hover:text-base-50"
          >
            <span className="line-clamp-2">{p}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

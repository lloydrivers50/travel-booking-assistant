"use client";

import { FileText, Quote } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import type { Citation } from "@/features/itinerary/types";

export function CitationChips({ citations }: { citations: Citation[] }) {
  if (citations.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {citations.map((c, i) => (
        <Popover key={`${c.clause}-${i}`}>
          <PopoverTrigger asChild>
            <button className="glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-base-200 transition-colors hover:bg-base-750 hover:text-base-50">
              <Quote className="h-3 w-3 text-accent-300" />
              {c.clause}
            </button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-accent-200">
                <Quote className="h-3.5 w-3.5" />
                {c.clause}
              </div>
              <p className="text-sm leading-relaxed text-base-100">“{c.text}”</p>
              <div className="flex items-center gap-1.5 border-t border-base-700 pt-2 text-[0.7rem] text-base-400">
                <FileText className="h-3 w-3" />
                {c.sourceDocument}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
}

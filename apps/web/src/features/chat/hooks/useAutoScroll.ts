"use client";

import { useStableCallback } from "@/shared/lib/use-stable-callback";
import { useEffect, useRef, useState } from "react";

/**
 * Keeps a scroll container pinned to the bottom as content grows, but yields
 * to the user the moment they scroll up. Returns the container ref and a flag
 * + jump helper for a "new messages" affordance.
 */
export function useAutoScroll<T>(dep: T) {
  const ref = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(true);

  const onScroll = useStableCallback(() => {
    const el = ref.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setPinned(distance < 80);
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  useEffect(() => {
    if (!pinned) return;
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [dep, pinned]);

  const jumpToBottom = () => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setPinned(true);
  };

  return { ref, pinned, jumpToBottom };
}

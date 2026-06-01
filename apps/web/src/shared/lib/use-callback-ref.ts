"use client";

import { useCallback, useInsertionEffect, useRef } from "react";

/**
 * Returns a stable callback identity that always invokes the latest version of
 * the passed function — avoids re-subscribing effects on every render.
 */
export function useCallbackRef<A extends unknown[], R>(
  fn: (...args: A) => R,
): (...args: A) => R {
  const ref = useRef(fn);
  useInsertionEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: A) => ref.current(...args), []);
}

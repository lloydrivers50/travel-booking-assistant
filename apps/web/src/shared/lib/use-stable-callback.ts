"use client";

import { useCallback, useInsertionEffect, useRef } from "react";

/**
 * Returns a stable callback identity that always invokes the latest version of
 * the passed function — so effects can depend on it without re-subscribing.
 */
export function useStableCallback<A extends unknown[], R>(
  fn: (...args: A) => R,
): (...args: A) => R {
  const ref = useRef(fn);
  // useInsertionEffect (not useEffect): it runs synchronously at commit, before
  // paint, so ref.current is already the latest fn before any event can fire.
  // useEffect would refresh it after paint, leaving a gap where a click invokes
  // the stale fn. Do not "simplify" this to useEffect.
  useInsertionEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: A) => ref.current(...args), []);
}

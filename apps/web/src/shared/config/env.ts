/**
 * Resolves the API target. The real client reads NEXT_PUBLIC_API_BASE_URL.
 * When that is unset or NEXT_PUBLIC_USE_MOCK=1, requests target the in-app
 * dev mock route handlers (same origin, relative URLs).
 */
const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const forceMock = process.env.NEXT_PUBLIC_USE_MOCK === "1";

export const useMock = forceMock || !rawBase;

/** Base URL for API calls. Empty string => same-origin (dev mock). */
export const apiBaseUrl = useMock ? "" : rawBase!.replace(/\/$/, "");

/** Build a fully-qualified (or same-origin relative) API URL. */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${p}`;
}

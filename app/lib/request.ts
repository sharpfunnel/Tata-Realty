import "server-only";

import { headers } from "next/headers";

/**
 * Resolve the visitor's IP. Vercel sets `x-forwarded-for` (client IP first);
 * `x-real-ip` is the fallback for other hosts. Never trust a body-supplied IP.
 */
export function ipFromHeaders(h: Headers): string | null {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || null;
}

export async function clientIp(): Promise<string> {
  return ipFromHeaders(await headers()) ?? "unknown";
}

/**
 * "City, Country" from Vercel's edge geolocation headers, which arrive on every
 * request at no cost. Returns null off-Vercel (local dev), where the admin
 * shows "–" rather than a wrong guess.
 */
export function locationFromHeaders(h: Headers): string | null {
  const rawCity = h.get("x-vercel-ip-city");
  const city = rawCity ? decodeURIComponent(rawCity) : null;
  const country = h.get("x-vercel-ip-country");

  if (city && country) return `${city}, ${country}`;
  return city ?? country ?? null;
}

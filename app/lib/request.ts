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

/** The only browser families the admin reports; everything else is "Other". */
export const BROWSERS = ["Chrome", "Safari", "Edge", "Firefox", "Other"] as const;
export type Browser = (typeof BROWSERS)[number];

/**
 * Coarse browser family from the User-Agent header. Order matters: Edge embeds
 * "Chrome", and Chrome embeds "Safari", so the more specific tokens are checked
 * first. Chromium-based browsers (Opera, Brave, Samsung) carry the Chrome token
 * and count as Chrome. Returns null for an empty UA.
 */
export function browserFromHeaders(h: Headers): Browser | null {
  const ua = h.get("user-agent") ?? "";
  if (!ua) return null;
  if (/\bEdg(A|iOS|)\//.test(ua)) return "Edge";
  if (/\bFirefox\/|\bFxiOS\//.test(ua)) return "Firefox";
  if (/Chrome\/|\bCriOS\//.test(ua)) return "Chrome";
  if (/\bSafari\//.test(ua) && /\bVersion\//.test(ua)) return "Safari";
  return "Other";
}

/**
 * Loopback and private-range IPs that can never be geolocated — a visit from
 * localhost or inside a LAN has no public location, so we skip the lookup
 * rather than record a wrong guess.
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip || ip === "unknown") return true;
  if (ip === "::1" || ip.startsWith("127.") || ip.startsWith("::ffff:127.")) return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (ip.startsWith("169.254.") || ip.startsWith("fe80:") || ip.startsWith("fc") || ip.startsWith("fd"))
    return true;
  const m = ip.match(/^172\.(\d+)\./);
  if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return true;
  return false;
}

/**
 * Geolocate a public IP when the host provides no geo headers (i.e. anywhere
 * that isn't Vercel). Uses the keyless ipwho.is service with a short timeout so
 * a slow or down lookup never delays the tracking beacon. Returns "City, CC" or
 * null — the admin shows "–" rather than a wrong guess.
 */
export async function geolocateIp(ip: string): Promise<string | null> {
  if (isPrivateIp(ip)) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,city,country_code`,
      { signal: controller.signal, cache: "no-store" },
    );
    clearTimeout(timeout);
    if (!res.ok) return null;

    const data = (await res.json()) as {
      success?: boolean;
      city?: string;
      country_code?: string;
    };
    if (!data.success) return null;

    if (data.city && data.country_code) return `${data.city}, ${data.country_code}`;
    return data.city ?? data.country_code ?? null;
  } catch {
    return null;
  }
}

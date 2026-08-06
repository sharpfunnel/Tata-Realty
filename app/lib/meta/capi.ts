import "server-only";

import { createHash, randomUUID } from "node:crypto";

/**
 * Meta Conversions API (server-side events).
 *
 * Two entry points write to the same Lead columns:
 *  - sendLeadConversionEvent()   — fired automatically when a lead is created
 *  - sendManualConversionEvent() — fired from the Send button on /admin/leads
 */

// Highest version the Graph API currently accepts; v27+ falls back to
// unversioned. Override if Meta deprecates it before this is revisited.
const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || "v26.0";

import { CUSTOM_EVENT_NAME_PATTERN } from "./events";
import type { CapiPreview, ManualCapiOptions, ManualCapiResult } from "./events";

export type { CapiPreview } from "./events";
export type {
  CapiEventType,
  ManualCapiOptions,
  ManualCapiResult,
} from "./events";
export { CAPI_EVENT_TYPES } from "./events";

/** The lead + session context a conversion event is built from. */
export type CapiLeadContext = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  submittedAt: Date;
  session: {
    ip: string | null;
    userAgent: string | null;
    location: string | null;
    fbclid: string | null;
    /** Meta's browser cookies, captured when the enquiry was submitted. */
    fbp: string | null;
    fbc: string | null;
    arrivedAt: Date;
  } | null;
};

/** The Prisma `select` every caller needs to build a CapiLeadContext. */
export const CAPI_LEAD_SELECT = {
  id: true,
  name: true,
  phone: true,
  email: true,
  submittedAt: true,
  session: {
    select: {
      ip: true,
      userAgent: true,
      location: true,
      fbclid: true,
      fbp: true,
      fbc: true,
      arrivedAt: true,
    },
  },
} as const;

/** Browser cookies the Pixel writes; both are sent to Meta unhashed. */
export type MetaBrowserCookies = { fbp?: string; fbc?: string };

/**
 * Pulls `_fbp` / `_fbc` out of a request's Cookie header.
 *
 * They belong to the Pixel, not to us, so they only exist once it has loaded —
 * which by form-submit time it has. Values are format-checked rather than
 * trusted: they reach Meta verbatim.
 */
export function readMetaCookies(cookieHeader: string | null): MetaBrowserCookies {
  if (!cookieHeader) return {};

  const cookies: MetaBrowserCookies = {};
  for (const part of cookieHeader.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;

    const name = part.slice(0, index).trim();
    if (name !== "_fbp" && name !== "_fbc") continue;

    const value = decodeURIComponent(part.slice(index + 1).trim());
    // Both cookies are "fb.<subdomain-index>.<timestamp>.<payload>".
    if (!/^fb\.\d+\.\d+\..+$/.test(value) || value.length > 400) continue;

    cookies[name === "_fbp" ? "fbp" : "fbc"] = value;
  }

  return cookies;
}

/* -------------------------------------------------------------------------- */
/* Normalisation + hashing                                                     */
/* -------------------------------------------------------------------------- */

/** Meta requires SHA-256 of the normalised value, hex encoded. */
function hash(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const normalised = value.trim().toLowerCase();
  if (!normalised) return undefined;
  return createHash("sha256").update(normalised).digest("hex");
}

/**
 * Meta wants digits only, including country code, with no leading "+" or zeros.
 * The landing form collects bare 10-digit Indian mobiles, so assume +91 for
 * those; anything longer is treated as already carrying a country code.
 */
function normalisePhone(phone: string): string | undefined {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return undefined;
  return digits.length === 10 ? `91${digits}` : digits;
}

/** Names are hashed lowercase with punctuation stripped. */
function splitName(fullName: string): { first?: string; last?: string } {
  const parts = fullName
    .trim()
    .replace(/[^\p{L}\s'-]/gu, "")
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return {};
  if (parts.length === 1) return { first: parts[0] };
  return { first: parts[0], last: parts[parts.length - 1] };
}

/** Session.location is stored as "City, CC" — split it back apart. */
function splitLocation(location: string | null): { city?: string; country?: string } {
  if (!location) return {};
  const [city, country] = location.split(",").map((part) => part.trim());
  return {
    // Meta wants city lowercase with spaces and punctuation removed.
    city: city ? city.toLowerCase().replace(/[^a-z]/g, "") : undefined,
    country: country ? country.toLowerCase().slice(0, 2) : undefined,
  };
}

/**
 * Meta's click id cookie. The Pixel writes the real `_fbc`; when it is missing
 * — an older lead, or a submission from a browser that blocked the Pixel — this
 * reconstructs the same shape from the stored fbclid. The click timestamp is
 * then only an approximation (session arrival, not the ad click), which Meta
 * accepts and still matches on.
 */
function deriveFbc(fbclid: string | null, arrivedAt: Date): string | undefined {
  if (!fbclid) return undefined;
  return `fb.1.${arrivedAt.getTime()}.${fbclid}`;
}

function buildUserData(lead: CapiLeadContext, cookies: MetaBrowserCookies = {}) {
  const { first, last } = splitName(lead.name);
  const { city, country } = splitLocation(lead.session?.location ?? null);

  // Hashed identifiers; undefined keys are dropped from the JSON body.
  const userData: Record<string, string | undefined> = {
    em: hash(lead.email),
    ph: hash(normalisePhone(lead.phone)),
    fn: hash(first),
    ln: hash(last),
    ct: hash(city),
    country: hash(country),
    // IP and user agent are sent in the clear — Meta hashes neither.
    client_ip_address: lead.session?.ip ?? undefined,
    client_user_agent: lead.session?.userAgent ?? undefined,
    fbp: cookies.fbp ?? lead.session?.fbp ?? undefined,
    fbc:
      cookies.fbc ??
      lead.session?.fbc ??
      deriveFbc(
        lead.session?.fbclid ?? null,
        lead.session?.arrivedAt ?? lead.submittedAt,
      ),
  };

  for (const key of Object.keys(userData)) {
    if (userData[key] === undefined) delete userData[key];
  }

  return userData;
}

/* -------------------------------------------------------------------------- */
/* Payload                                                                     */
/* -------------------------------------------------------------------------- */

export type CapiPayload = {
  data: Array<Record<string, unknown>>;
  test_event_code?: string;
};

export type BuildOptions = ManualCapiOptions & {
  eventId?: string;
  eventSourceUrl?: string;
  /** Cookies read off the submitting request, when there is one. */
  cookies?: MetaBrowserCookies;
};

export function buildEventPayload(
  lead: CapiLeadContext,
  options: BuildOptions,
): { payload: CapiPayload; eventId: string; eventName: string } {
  const eventName =
    options.eventType === "Custom"
      ? (options.customEventName || "").trim() || "CustomEvent"
      : options.eventType;

  // Prefer the caller's order id so a Pixel firing the same reference
  // deduplicates against this event.
  const eventId = options.orderId?.trim() || options.eventId || randomUUID();

  const customData: Record<string, unknown> = {};
  if (typeof options.value === "number" && Number.isFinite(options.value)) {
    customData.value = options.value;
    customData.currency = (options.currency || "INR").toUpperCase();
  }
  if (options.orderId?.trim()) customData.order_id = options.orderId.trim();

  const event: Record<string, unknown> = {
    event_name: eventName,
    // Seconds, not milliseconds. Meta rejects events older than 7 days.
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: "website",
    user_data: buildUserData(lead, options.cookies),
  };

  const sourceUrl = options.eventSourceUrl || process.env.NEXT_PUBLIC_SITE_URL;
  if (sourceUrl) event.event_source_url = sourceUrl;
  if (Object.keys(customData).length) event.custom_data = customData;

  const payload: CapiPayload = { data: [event] };

  // Routes the event to Events Manager's Test Events tab instead of live data.
  const testCode = process.env.META_TEST_EVENT_CODE;
  if (testCode) payload.test_event_code = testCode;

  return { payload, eventId, eventName };
}

/* -------------------------------------------------------------------------- */
/* Preview                                                                     */
/* -------------------------------------------------------------------------- */

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

/**
 * Renders the payload the live send would post, token redacted, alongside the
 * problems worth seeing before pressing Send. Same builder as the real send, so
 * the two cannot drift apart.
 */
export function buildEventPreview(
  lead: CapiLeadContext,
  options: BuildOptions,
): CapiPreview {
  const { payload, eventId, eventName } = buildEventPayload(lead, options);
  const event = payload.data[0];
  const userData = (event.user_data ?? {}) as Record<string, unknown>;
  const customData = (event.custom_data ?? {}) as Record<string, unknown>;
  const eventTime = event.event_time as number;

  const warnings: string[] = [];

  if (Object.keys(userData).length === 0) {
    warnings.push("user_data is empty — Meta rejects events with no identifier.");
  }
  if (!eventId) {
    warnings.push("No event_id — the browser Pixel cannot deduplicate against this.");
  }

  const phoneDigits = lead.phone.replace(/\D/g, "").replace(/^0+/, "");
  if (!userData.ph) {
    warnings.push("No phone on this lead — the strongest identifier we normally have.");
  } else if (phoneDigits.length === 10) {
    warnings.push("Phone had no country code; 91 was prefixed before hashing.");
  }
  if (!userData.em) warnings.push("No email — match quality will be lower.");
  if (!userData.fbc) {
    warnings.push("No fbc — no _fbc cookie and no fbclid, so the ad click cannot be matched.");
  }
  if (!userData.fbp) {
    warnings.push("No fbp — the _fbp cookie was not captured for this lead.");
  }
  if (!userData.client_ip_address || !userData.client_user_agent) {
    warnings.push("Missing IP or user agent — this lead has no tracking session.");
  }

  if (Math.floor(Date.now() / 1000) - eventTime > SEVEN_DAYS_SECONDS) {
    warnings.push("event_time is older than 7 days — Meta will reject it.");
  }
  if (eventName === "Purchase" && customData.value === undefined) {
    warnings.push("Purchase without a value — Meta expects value and currency.");
  }
  if (
    options.eventType === "Custom" &&
    !CUSTOM_EVENT_NAME_PATTERN.test((options.customEventName ?? "").trim())
  ) {
    warnings.push("Custom event names must be 1-50 letters, digits or underscores.");
  }
  if (payload.test_event_code) {
    warnings.push(
      `META_TEST_EVENT_CODE is set (${payload.test_event_code}) — this lands in Test Events, not live reporting.`,
    );
  }
  if (!capiConfigured()) {
    warnings.push(
      "META_PIXEL_ID / META_CAPI_ACCESS_TOKEN are not both set — nothing will actually be delivered.",
    );
  }

  return {
    // The token is added at the moment of sending and never leaves the server.
    json: JSON.stringify({ ...payload, access_token: "<ACCESS_TOKEN>" }, null, 2),
    warnings,
  };
}

/* -------------------------------------------------------------------------- */
/* Delivery                                                                    */
/* -------------------------------------------------------------------------- */

function credentials() {
  return {
    pixelId: process.env.META_PIXEL_ID?.trim(),
    // A connected ad-account token could be added here later; for now the
    // env var is the only source.
    accessToken: process.env.META_CAPI_ACCESS_TOKEN?.trim(),
  };
}

export function capiConfigured(): boolean {
  const { pixelId, accessToken } = credentials();
  return Boolean(pixelId && accessToken);
}

/**
 * Posts one conversion event to Meta.
 *
 * When credentials are absent AND we are not in production, this skips the
 * Graph call and returns a fake success so the UI can be reviewed before Meta
 * credentials exist. It never writes to the lead's real send status. Once real
 * credentials are set this path stops being hit — no cleanup needed.
 */
async function deliver(payload: CapiPayload): Promise<
  | { ok: true; preview: boolean; eventsReceived?: number; fbtraceId?: string }
  | { ok: false; error: string }
> {
  const { pixelId, accessToken } = credentials();

  if (!pixelId || !accessToken) {
    if (process.env.NODE_ENV !== "production") {
      return { ok: true, preview: true };
    }
    return {
      ok: false,
      error: !pixelId
        ? "META_PIXEL_ID is not set."
        : "META_CAPI_ACCESS_TOKEN is not set.",
    };
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, access_token: accessToken }),
      // Never let a slow Graph call hold a lead submission open.
      signal: AbortSignal.timeout(10_000),
    });

    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string; error_user_msg?: string; fbtrace_id?: string };
      events_received?: number;
      fbtrace_id?: string;
    } | null;

    if (!response.ok) {
      const message =
        body?.error?.error_user_msg ||
        body?.error?.message ||
        `Meta returned HTTP ${response.status}`;
      // The trace id is what support and Events Manager can actually look up.
      const trace = body?.error?.fbtrace_id ?? body?.fbtrace_id;
      return {
        ok: false,
        error: trace ? `HTTP ${response.status}: ${message} (fbtrace_id ${trace})` : message,
      };
    }

    return {
      ok: true,
      preview: false,
      eventsReceived: body?.events_received,
      fbtraceId: body?.fbtrace_id,
    };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "Meta did not respond within 10s."
        : error instanceof Error
          ? error.message
          : "Unknown error contacting Meta.";
    return { ok: false, error: message };
  }
}

/** Manual send from the admin Send button. */
export async function sendManualConversionEvent(
  lead: CapiLeadContext,
  options: ManualCapiOptions,
): Promise<ManualCapiResult> {
  if (options.eventType === "Custom") {
    const name = options.customEventName?.trim() ?? "";
    if (!name) return { ok: false, error: "Enter a name for the custom event." };
    if (!CUSTOM_EVENT_NAME_PATTERN.test(name)) {
      return {
        ok: false,
        error: "Custom event names must be 1-50 letters, digits or underscores.",
      };
    }
  }

  const { payload, eventId, eventName } = buildEventPayload(lead, options);
  const result = await deliver(payload);

  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    eventId,
    eventName,
    preview: result.preview,
    eventsReceived: result.eventsReceived,
    fbtraceId: result.fbtraceId,
  };
}

/**
 * Automatic send when a lead is created. Deliberately returns a result rather
 * than throwing: a Meta outage must never fail an enquiry.
 */
export async function sendLeadConversionEvent(
  lead: CapiLeadContext,
  options: {
    eventId?: string;
    eventSourceUrl?: string;
    cookies?: MetaBrowserCookies;
  } = {},
): Promise<ManualCapiResult> {
  const { payload, eventId, eventName } = buildEventPayload(lead, {
    eventType: "Lead",
    eventId: options.eventId,
    eventSourceUrl: options.eventSourceUrl,
    cookies: options.cookies,
  });

  const result = await deliver(payload);

  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    eventId,
    eventName,
    preview: result.preview,
    eventsReceived: result.eventsReceived,
    fbtraceId: result.fbtraceId,
  };
}

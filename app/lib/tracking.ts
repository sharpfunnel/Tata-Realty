import { z } from "zod";
import { isValidEmail, isValidName, isValidPhone } from "./validation";

/**
 * Wire format shared by public/tracker.js and /api/track.
 * Everything here arrives from an untrusted browser, so every field is
 * validated and length-capped before it reaches the database.
 */

const shortString = z.string().trim().min(1).max(120);

// Client-generated ids. Constrained so they cannot be used to smuggle payloads.
const idString = z
  .string()
  .trim()
  .min(8)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, "invalid id");

const pathString = z.string().trim().max(300).optional();

export const INTERACTION_TYPES = ["click", "hover", "scroll", "pageview"] as const;

/** A single acquisition tag. Nullable because the client sends explicit nulls. */
const tag = z.string().trim().max(200).nullish();

/**
 * Acquisition params captured on the landing URL, once per session.
 *
 * The named fields are the ones we filter and group by in SQL; `rawParams` is
 * the catch-all so a new ad platform or a custom param is never lost. Bounded
 * on every axis — this arrives from an untrusted browser.
 */
export const entryMetaSchema = z.object({
  entryPath: z.string().trim().max(300).nullish(),
  referrer: z.string().trim().max(600).nullish(),
  utmSource: tag,
  utmMedium: tag,
  utmCampaign: tag,
  utmContent: tag,
  utmTerm: tag,
  gclid: tag,
  fbclid: tag,
  msclkid: tag,
  placement: tag,
  metaCampaignId: tag,
  metaAdsetId: tag,
  metaAdId: tag,
  rawParams: z
    .record(z.string().max(100), z.string().max(500))
    // A landing URL with 50 distinct params is an attack, not a campaign.
    .refine((value) => Object.keys(value).length <= 50, {
      message: "too many params",
    })
    .optional(),
});

export type EntryMeta = z.infer<typeof entryMetaSchema>;

/**
 * What the visitor is browsing on. Sent once at session start.
 *
 * Every field is optional: an older cached tracker.js posts sessions without
 * them, and several are unsupported outside Chrome.
 */
export const environmentSchema = z.object({
  os: shortString.nullish(),
  browserVersion: shortString.nullish(),
  screenWidth: z.number().int().min(0).max(20000).nullish(),
  screenHeight: z.number().int().min(0).max(20000).nullish(),
  viewportWidth: z.number().int().min(0).max(20000).nullish(),
  viewportHeight: z.number().int().min(0).max(20000).nullish(),
  language: z.string().trim().max(35).nullish(),
  timezone: z.string().trim().max(60).nullish(),
  connection: z.string().trim().max(20).nullish(),
});

export type Environment = z.infer<typeof environmentSchema>;

export const sessionStartSchema = z.object({
  kind: z.literal("session"),
  clientId: idString,
  visitorId: idString,
  isReturning: z.boolean(),
  device: z.enum(["mobile", "tablet", "desktop"]),
  source: shortString.optional(),
  medium: shortString.optional(),
  campaign: shortString.optional(),
  path: pathString,
  // Optional so an older cached tracker.js keeps working after deploy.
  entryMeta: entryMetaSchema.optional(),
  environment: environmentSchema.optional(),
});

export const CTA_EVENT_TYPES = ["viewed", "hover", "click"] as const;

export const FORM_EVENT_TYPES = [
  "viewed",
  "started",
  "field_focus",
  "field_complete",
  "validation_error",
  "abandoned",
  "submitted",
] as const;

export const MOUSE_SIGNAL_TYPES = ["rage_click", "dead_click", "double_click"] as const;

export const VITALS_METRICS = ["LCP", "INP", "CLS", "FCP", "TTFB"] as const;

export const VITALS_RATINGS = ["good", "needs-improvement", "poor"] as const;

export const ERROR_KINDS = ["js", "promise", "resource"] as const;

/** Identifier read out of a `data-cta-id` / `data-form-id` attribute. */
const markupId = z.string().trim().min(1).max(100);

/** Free text captured from the page — always length-capped before storage. */
const captured = (max: number) => z.string().trim().max(max).nullish();

const ctaEventSchema = z.object({
  ctaId: markupId,
  type: z.enum(CTA_EVENT_TYPES),
  label: captured(200),
  path: pathString,
});

const formEventSchema = z.object({
  formId: markupId,
  type: z.enum(FORM_EVENT_TYPES),
  // Field *names* only. The tracker must never send what was typed into them.
  field: captured(100),
  path: pathString,
});

const mouseSignalSchema = z.object({
  type: z.enum(MOUSE_SIGNAL_TYPES),
  selector: captured(300),
  label: captured(200),
  path: pathString,
});

const performanceMetricSchema = z.object({
  name: z.enum(VITALS_METRICS),
  // Milliseconds, except CLS which is a unitless ratio. Bounded so one broken
  // measurement cannot skew a whole distribution.
  value: z.number().min(0).max(3_600_000),
  rating: z.enum(VITALS_RATINGS),
  path: pathString,
});

const errorEventSchema = z.object({
  kind: z.enum(ERROR_KINDS),
  message: z.string().trim().min(1).max(1000),
  source: captured(500),
  line: z.number().int().min(0).max(10_000_000).nullish(),
  path: pathString,
});

/**
 * One flush carries every event type the collectors produced since the last
 * one — interactions, CTAs, forms, frustration signals, vitals and errors —
 * rather than one request per kind. Every array is optional and independently
 * capped; a batch that ends up carrying nothing at all is rejected.
 */
export const eventBatchSchema = z
  .object({
    kind: z.literal("events"),
    clientId: idString,
    events: z
      .array(
        z.object({
          type: z.enum(INTERACTION_TYPES),
          // Normalised page coordinates; anything outside 0-1 is a bug or a forgery.
          xPct: z.number().min(0).max(1).optional(),
          yPct: z.number().min(0).max(1).optional(),
          path: pathString,
        }),
      )
      .max(50)
      .optional(),
    cta: z.array(ctaEventSchema).max(50).optional(),
    forms: z.array(formEventSchema).max(50).optional(),
    mouse: z.array(mouseSignalSchema).max(50).optional(),
    vitals: z.array(performanceMetricSchema).max(20).optional(),
    errors: z.array(errorEventSchema).max(20).optional(),
  })
  .refine(
    (batch) =>
      (batch.events?.length ?? 0) +
        (batch.cta?.length ?? 0) +
        (batch.forms?.length ?? 0) +
        (batch.mouse?.length ?? 0) +
        (batch.vitals?.length ?? 0) +
        (batch.errors?.length ?? 0) >
      0,
    { message: "empty batch" },
  );

export type EventBatch = z.infer<typeof eventBatchSchema>;

export const heartbeatSchema = z.object({
  kind: z.literal("heartbeat"),
  clientId: idString,
  scrollDepth: z.number().int().min(0).max(100),
});

export const trackPayloadSchema = z.discriminatedUnion("kind", [
  sessionStartSchema,
  eventBatchSchema,
  heartbeatSchema,
]);

export type TrackPayload = z.infer<typeof trackPayloadSchema>;

export const leadPayloadSchema = z.object({
  clientId: idString.optional(),
  // Same helpers the form uses, so the two boundaries cannot drift apart. This
  // is the one that matters: DevTools or a plain curl skips every client check.
  name: z.string().trim().max(120).refine(isValidName, "invalid name"),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine(isValidPhone, "invalid phone")
    // Store digits only — the tel: link and Meta's phone hashing both want a
    // bare number.
    .transform((value) => value.replace(/\D/g, "")),
  email: z
    .string()
    .trim()
    .max(200)
    .refine(isValidEmail, "invalid email")
    .optional()
    .or(z.literal("")),
  budgetRange: shortString.optional(),
  configuration: shortString.optional(),
  /// Generated by the browser and passed to both the Pixel and the Conversions
  /// API so Meta deduplicates the two deliveries of the same conversion.
  eventId: z.string().trim().min(8).max(64).regex(/^[A-Za-z0-9_-]+$/).optional(),
});

export type LeadPayload = z.infer<typeof leadPayloadSchema>;

/**
 * Optional details added on the thank-you page, PATCHed onto the lead the
 * short landing-page form already created.
 */
export const leadEnrichSchema = z.object({
  // A cuid from the POST response — unguessable, so it doubles as the token
  // that authorises the update.
  leadId: z.string().trim().min(20).max(40).regex(/^[a-z0-9]+$/, "invalid id"),
  // Optional, so an empty string is allowed — but anything non-empty must be a
  // real address, checked with the same helper the thank-you form uses.
  email: z
    .string()
    .trim()
    .max(200)
    .refine(isValidEmail, "invalid email")
    .optional()
    .or(z.literal("")),
  budgetRange: shortString.optional().or(z.literal("")),
  configuration: shortString.optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type LeadEnrichPayload = z.infer<typeof leadEnrichSchema>;

/**
 * How long after submission a lead stays open to enrichment. The id travels in
 * a URL, so it can leak through history, referrers or a shared link — this
 * stops an old link being used to rewrite a lead indefinitely.
 */
export const ENRICH_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * A batch of rrweb DOM-recording events for full session replay. The events
 * themselves are opaque rrweb objects, validated only for shape and count —
 * their internal structure is rrweb's concern, not ours.
 */
export const replayPayloadSchema = z.object({
  clientId: idString,
  seq: z.number().int().min(0),
  // Cap generously: the first batch carries rrweb's full DOM snapshot plus the
  // burst of hydration mutations, which can be large. Rejecting it would lose
  // the snapshot and leave an unplayable recording.
  events: z
    .array(z.object({ type: z.number(), timestamp: z.number() }).passthrough())
    .min(1)
    .max(5000),
});

export type ReplayPayload = z.infer<typeof replayPayloadSchema>;

/**
 * Bounce is derived server-side rather than trusted from the client.
 * A visit bounces when it shows no evidence of engagement: no meaningful
 * interaction, a short stay, and barely any scrolling.
 */
export function deriveBounced(input: {
  interactionCount: number;
  durationSec: number;
  scrollDepth: number;
  formFilled: boolean;
}): boolean {
  if (input.formFilled) return false;
  return (
    input.interactionCount <= 1 &&
    input.durationSec < 10 &&
    input.scrollDepth < 25
  );
}

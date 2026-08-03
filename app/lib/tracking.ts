import { z } from "zod";

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
});

export const eventBatchSchema = z.object({
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
    .min(1)
    .max(50),
});

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
  name: z.string().trim().min(1).max(120),
  // The landing page normalises to 10 digits; accept a little slack for
  // country codes without letting junk through.
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\s-]{8,20}$/, "invalid phone")
    .transform((value) => value.replace(/[^\d+]/g, "")),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  budgetRange: shortString.optional(),
  configuration: shortString.optional(),
});

export type LeadPayload = z.infer<typeof leadPayloadSchema>;

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

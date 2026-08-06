/**
 * Browser Pixel helpers — the client half of the Meta integration.
 *
 * Deliberately free of `server-only` and of any Node import so client
 * components can use it; capi.ts holds everything that must stay on the
 * server, including the access token.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Inlined at build time, so changing it needs a redeploy, not a restart.
 * Empty string when unset — every guard below must treat that as "off".
 */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Always `trackSingle`, never `track`.
 *
 * This site loads a GTM container, and any Meta tag inside it initialises a
 * second pixel on the same page. `fbq("track", …)` broadcasts to *every*
 * initialised pixel, which would write our conversions into whichever other
 * dataset GTM brought along. `trackSingle` pins each call to our id.
 */
export function trackPixelPageView() {
  if (!META_PIXEL_ID) return;
  window.fbq?.("trackSingle", META_PIXEL_ID, "PageView");
}

/**
 * Fires the browser side of a lead conversion.
 *
 * `eventId` MUST be the same value the server sends as `event_id` — the id the
 * form generates and posts to /api/lead, which is stored on the lead row as
 * `metaEventId`. If the two ever diverge, Meta counts every enquiry twice.
 */
export function trackPixelLead(eventId: string) {
  if (!META_PIXEL_ID) return;
  window.fbq?.("trackSingle", META_PIXEL_ID, "Lead", {}, { eventID: eventId });
}

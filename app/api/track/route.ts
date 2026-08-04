import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { rateLimit } from "../../lib/rate-limit";
import {
  browserFromHeaders,
  geolocateIp,
  ipFromHeaders,
  locationFromHeaders,
} from "../../lib/request";
import {
  deriveBounced,
  trackPayloadSchema,
  type EntryMeta,
} from "../../lib/tracking";
import type { Prisma } from "../../../generated/prisma/client";

/**
 * Maps the client's acquisition capture onto Session columns.
 * Empty strings collapse to null so "no value" is one thing in SQL, not two.
 */
function acquisitionFields(meta: EntryMeta | undefined) {
  const value = (raw: string | null | undefined) => raw?.trim() || null;

  const rawParams = meta?.rawParams;
  return {
    entryPath: value(meta?.entryPath),
    referrer: value(meta?.referrer),
    utmSource: value(meta?.utmSource),
    utmMedium: value(meta?.utmMedium),
    utmCampaign: value(meta?.utmCampaign),
    utmContent: value(meta?.utmContent),
    utmTerm: value(meta?.utmTerm),
    gclid: value(meta?.gclid),
    fbclid: value(meta?.fbclid),
    msclkid: value(meta?.msclkid),
    placement: value(meta?.placement),
    metaCampaignId: value(meta?.metaCampaignId),
    metaAdsetId: value(meta?.metaAdsetId),
    metaAdId: value(meta?.metaAdId),
    // `undefined` tells Prisma "don't set this", leaving the column NULL.
    // Writing `{}` instead would put an empty JSON blob on every direct visit.
    rawParams:
      rawParams && Object.keys(rawParams).length
        ? (rawParams as Prisma.InputJsonValue)
        : undefined,
  };
}

// Public endpoint: the landing page must reach it without a session.
// It is deliberately excluded from the proxy.ts matcher.
export const dynamic = "force-dynamic";

// 204 with no body — the tracker never needs a response, and this keeps
// beacons cheap.
const NO_CONTENT = new NextResponse(null, { status: 204 });

export async function POST(request: Request) {
  const ip = ipFromHeaders(request.headers) ?? "unknown";

  // Generous enough for batched beacons from a real visitor, tight enough to
  // stop a script filling the tables.
  if (!rateLimit(`track:${ip}`, { limit: 120, windowMs: 60_000 })) {
    return new NextResponse(null, { status: 429 });
  }

  // sendBeacon may deliver as text/plain, so parse the body manually.
  let json: unknown;
  try {
    json = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = trackPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const payload = parsed.data;

  try {
    if (payload.kind === "session") {
      // IP and location are resolved here, never trusted from the client. Use
      // the host's geo headers when present (Vercel), otherwise fall back to an
      // IP lookup so location is captured on any host, not just Vercel.
      const location =
        locationFromHeaders(request.headers) ?? (await geolocateIp(ip));

      await prisma.session.upsert({
        where: { clientId: payload.clientId },
        create: {
          clientId: payload.clientId,
          visitorId: payload.visitorId,
          isReturning: payload.isReturning,
          device: payload.device,
          browser: browserFromHeaders(request.headers),
          // Kept raw (not just the family name) because Meta's Conversions API
          // matches on the full client_user_agent string.
          userAgent: request.headers.get("user-agent")?.slice(0, 500) || null,
          ip,
          location,
          source: payload.source ?? null,
          medium: payload.medium ?? null,
          campaign: payload.campaign ?? null,
          ...acquisitionFields(payload.entryMeta),
        },
        // A reload of the same tab re-sends this; only refresh liveness.
        update: { lastSeenAt: new Date() },
      });

      return NO_CONTENT;
    }

    if (payload.kind === "events") {
      const session = await prisma.session.findUnique({
        where: { clientId: payload.clientId },
        select: { id: true },
      });

      // Beacon arrived before (or without) the session row — drop it rather
      // than inventing a session with no device or attribution data.
      if (!session) return NO_CONTENT;

      // Only clicks and hovers count as engagement for the bounce heuristic.
      const interactions = payload.events.filter(
        (event) => event.type === "click" || event.type === "hover",
      ).length;

      await prisma.$transaction([
        prisma.pageEvent.createMany({
          data: payload.events.map((event) => ({
            sessionId: session.id,
            type: event.type,
            xPct: event.xPct ?? null,
            yPct: event.yPct ?? null,
            path: event.path ?? null,
          })),
        }),
        prisma.session.update({
          where: { id: session.id },
          data: {
            lastSeenAt: new Date(),
            eventCount: { increment: interactions },
          },
        }),
      ]);

      return NO_CONTENT;
    }

    // heartbeat — carries max scroll depth and closes out duration/bounce.
    const session = await prisma.session.findUnique({
      where: { clientId: payload.clientId },
      select: {
        id: true,
        arrivedAt: true,
        scrollDepth: true,
        eventCount: true,
        formFilled: true,
      },
    });

    if (!session) return NO_CONTENT;

    const now = new Date();
    const durationSec = Math.max(
      0,
      Math.round((now.getTime() - session.arrivedAt.getTime()) / 1000),
    );
    // Scroll depth only ever grows — a later beacon must not lower the max.
    const scrollDepth = Math.max(session.scrollDepth, payload.scrollDepth);

    await prisma.session.update({
      where: { id: session.id },
      data: {
        lastSeenAt: now,
        scrollDepth,
        durationSec,
        bounced: deriveBounced({
          interactionCount: session.eventCount,
          durationSec,
          scrollDepth,
          formFilled: session.formFilled,
        }),
      },
    });

    return NO_CONTENT;
  } catch (error) {
    console.error("[track] failed", error);
    // Never surface internals to the public endpoint.
    return new NextResponse(null, { status: 500 });
  }
}

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
  type Environment,
} from "../../lib/tracking";
import type { Prisma } from "../../../generated/prisma/client";

/**
 * Maps the client's environment capture onto Session columns.
 *
 * Nothing here is load-bearing, and all of it is unverifiable client input, so
 * every field is bounded by the schema and stored as-is or not at all.
 */
function environmentFields(environment: Environment | undefined) {
  if (!environment) return {};

  const text = (raw: string | null | undefined) => raw?.trim() || null;

  return {
    os: text(environment.os),
    browserVersion: text(environment.browserVersion),
    screenWidth: environment.screenWidth ?? null,
    screenHeight: environment.screenHeight ?? null,
    viewportWidth: environment.viewportWidth ?? null,
    viewportHeight: environment.viewportHeight ?? null,
    language: text(environment.language),
    timezone: text(environment.timezone),
    connection: text(environment.connection),
  };
}

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
          ...environmentFields(payload.environment),
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

      const sessionId = session.id;
      const events = payload.events ?? [];

      // What counts as engagement for the bounce heuristic: a click or hover,
      // or any deliberate act on a CTA or a form. An impression does not —
      // it only means something scrolled past.
      const interactions =
        events.filter((event) => event.type === "click" || event.type === "hover").length +
        (payload.cta ?? []).filter((event) => event.type === "click").length +
        (payload.forms ?? []).filter((event) => event.type !== "viewed").length;

      // One transaction per flush: either the whole batch lands or none of it
      // does, so an event never counts toward eventCount without being stored.
      const writes: Prisma.PrismaPromise<unknown>[] = [];

      if (events.length) {
        writes.push(
          prisma.pageEvent.createMany({
            data: events.map((event) => ({
              sessionId,
              type: event.type,
              xPct: event.xPct ?? null,
              yPct: event.yPct ?? null,
              path: event.path ?? null,
            })),
          }),
        );
      }

      if (payload.cta?.length) {
        writes.push(
          prisma.ctaEvent.createMany({
            data: payload.cta.map((event) => ({
              sessionId,
              ctaId: event.ctaId,
              type: event.type,
              label: event.label ?? null,
              path: event.path ?? null,
            })),
          }),
        );
      }

      if (payload.forms?.length) {
        writes.push(
          prisma.formEvent.createMany({
            data: payload.forms.map((event) => ({
              sessionId,
              formId: event.formId,
              type: event.type,
              field: event.field ?? null,
              path: event.path ?? null,
            })),
          }),
        );
      }

      if (payload.mouse?.length) {
        writes.push(
          prisma.mouseInteraction.createMany({
            data: payload.mouse.map((event) => ({
              sessionId,
              type: event.type,
              selector: event.selector ?? null,
              label: event.label ?? null,
              path: event.path ?? null,
            })),
          }),
        );
      }

      if (payload.vitals?.length) {
        writes.push(
          prisma.performanceMetric.createMany({
            data: payload.vitals.map((metric) => ({
              sessionId,
              name: metric.name,
              value: metric.value,
              rating: metric.rating,
              path: metric.path ?? null,
            })),
          }),
        );
      }

      if (payload.errors?.length) {
        writes.push(
          prisma.errorEvent.createMany({
            data: payload.errors.map((error) => ({
              sessionId,
              kind: error.kind,
              message: error.message,
              source: error.source ?? null,
              line: error.line ?? null,
              path: error.path ?? null,
            })),
          }),
        );
      }

      writes.push(
        prisma.session.update({
          where: { id: sessionId },
          data: {
            lastSeenAt: new Date(),
            eventCount: { increment: interactions },
          },
        }),
      );

      await prisma.$transaction(writes);

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

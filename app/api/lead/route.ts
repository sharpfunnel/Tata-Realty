import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { rateLimit } from "../../lib/rate-limit";
import { ipFromHeaders } from "../../lib/request";
import { sendLeadConversionEvent } from "../../lib/meta/capi";
import {
  ENRICH_WINDOW_MS,
  leadEnrichSchema,
  leadPayloadSchema,
} from "../../lib/tracking";

// Public endpoint — the landing page form posts here without a session.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = ipFromHeaders(request.headers) ?? "unknown";

  // A real person submits once or twice, not twenty times a minute.
  if (!rateLimit(`lead:${ip}`, { limit: 8, windowMs: 10 * 60_000 })) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = leadPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form fields and try again." },
      { status: 400 },
    );
  }

  const { clientId, eventId, ...lead } = parsed.data;

  try {
    // Resolve the tracking session so the lead links back to its visit.
    const session = clientId
      ? await prisma.session.findUnique({
          where: { clientId },
          select: { id: true },
        })
      : null;

    // sessionId is unique, so a session can own at most one Lead. If this
    // visitor already submitted, keep the new lead but leave it unlinked —
    // losing an enquiry would be worse than losing the association.
    let sessionId: string | null = session?.id ?? null;
    if (sessionId) {
      const existing = await prisma.lead.findUnique({
        where: { sessionId },
        select: { id: true },
      });
      if (existing) sessionId = null;
    }

    const created = await prisma.lead.create({
      data: {
        name: lead.name,
        phone: lead.phone,
        email: lead.email || null,
        budgetRange: lead.budgetRange ?? null,
        configuration: lead.configuration ?? null,
        // Audit trail: keeps whatever the form sent, even fields added later.
        raw: { ...lead, ip, receivedAt: new Date().toISOString() },
        sessionId,
        // Shared with the browser Pixel so Meta counts one conversion, not two.
        metaEventId: eventId ?? null,
      },
      select: {
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
            arrivedAt: true,
          },
        },
      },
    });

    if (session) {
      await prisma.session.update({
        where: { id: session.id },
        data: { formFilled: true, bounced: false },
      });
    }

    // Fire the Meta conversion event. Awaited so the serverless function is not
    // torn down mid-request, but a failure only records an error on the lead —
    // the enquiry itself is already saved and the visitor still gets a 201.
    try {
      const capi = await sendLeadConversionEvent(created, {
        eventId: eventId ?? undefined,
        eventSourceUrl: request.headers.get("referer") ?? undefined,
      });

      if (!("preview" in capi && capi.preview)) {
        await prisma.lead.update({
          where: { id: created.id },
          data: capi.ok
            ? {
                metaCapiSentAt: new Date(),
                metaCapiError: null,
                metaCapiEventName: capi.eventName,
                metaEventId: capi.eventId,
              }
            : { metaCapiError: capi.error.slice(0, 500) },
        });
      }
    } catch (capiError) {
      console.error("[lead] meta capi failed", capiError);
    }

    // The id is what lets the thank-you page enrich this same row rather than
    // creating a second lead.
    return NextResponse.json({ ok: true, leadId: created.id }, { status: 201 });
  } catch (error) {
    console.error("[lead] failed", error);
    return NextResponse.json(
      { error: "Could not save your enquiry. Please try again." },
      { status: 500 },
    );
  }
}

/**
 * Fills in the optional details a visitor adds on the thank-you page.
 *
 * Public, like POST — the landing page has no session. `leadId` is an
 * unguessable cuid returned only to the browser that submitted the form, and
 * it is the only thing authorising the update.
 */
export async function PATCH(request: Request) {
  const ip = ipFromHeaders(request.headers) ?? "unknown";

  if (!rateLimit(`lead-enrich:${ip}`, { limit: 15, windowMs: 10 * 60_000 })) {
    return NextResponse.json(
      { error: "Too many updates. Please try again later." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = leadEnrichSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the fields and try again." },
      { status: 400 },
    );
  }

  const { leadId, email, budgetRange, configuration, message } = parsed.data;

  // Only write what was actually filled in — someone who adds just a budget
  // must not blank out an email they already gave.
  const updates: Record<string, string> = {};
  if (email) updates.email = email;
  if (budgetRange) updates.budgetRange = budgetRange;
  if (configuration) updates.configuration = configuration;
  if (message) updates.message = message;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, submittedAt: true },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    if (Date.now() - lead.submittedAt.getTime() > ENRICH_WINDOW_MS) {
      return NextResponse.json(
        { error: "This enquiry can no longer be updated. Please call us instead." },
        { status: 410 },
      );
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: { ...updates, enrichedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[lead] enrich failed", error);
    return NextResponse.json(
      { error: "Could not save your details. Please try again." },
      { status: 500 },
    );
  }
}

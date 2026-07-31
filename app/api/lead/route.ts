import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { rateLimit } from "../../lib/rate-limit";
import { ipFromHeaders } from "../../lib/request";
import { leadPayloadSchema } from "../../lib/tracking";

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

  const { clientId, ...lead } = parsed.data;

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

    await prisma.lead.create({
      data: {
        name: lead.name,
        phone: lead.phone,
        email: lead.email || null,
        budgetRange: lead.budgetRange ?? null,
        configuration: lead.configuration ?? null,
        // Audit trail: keeps whatever the form sent, even fields added later.
        raw: { ...lead, ip, receivedAt: new Date().toISOString() },
        sessionId,
      },
    });

    if (session) {
      await prisma.session.update({
        where: { id: session.id },
        data: { formFilled: true, bounced: false },
      });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[lead] failed", error);
    return NextResponse.json(
      { error: "Could not save your enquiry. Please try again." },
      { status: 500 },
    );
  }
}

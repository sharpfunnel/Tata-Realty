import { NextResponse } from "next/server";
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { rateLimit } from "../../lib/rate-limit";
import { ipFromHeaders } from "../../lib/request";
import { replayPayloadSchema } from "../../lib/tracking";

// Public endpoint: the landing page recorder posts here without a session.
export const dynamic = "force-dynamic";

// The recorder never needs a response body; 204 keeps the beacon cheap.
const NO_CONTENT = new NextResponse(null, { status: 204 });

export async function POST(request: Request) {
  const ip = ipFromHeaders(request.headers) ?? "unknown";

  // rrweb flushes a few times a minute per visitor; this stops a script from
  // filling the table while leaving real recordings plenty of headroom.
  if (!rateLimit(`replay:${ip}`, { limit: 240, windowMs: 60_000 })) {
    return new NextResponse(null, { status: 429 });
  }

  // sendBeacon may deliver as text/plain, so parse the body manually.
  let json: unknown;
  try {
    json = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = replayPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const { clientId, seq, events } = parsed.data;

  try {
    const session = await prisma.session.findUnique({
      where: { clientId },
      select: { id: true },
    });

    // The recording batch beat the session row (or the session was pruned) —
    // drop it rather than inventing an orphan recording.
    if (!session) return NO_CONTENT;

    // Same (session, seq) can be re-sent by sendBeacon retries; ignore dupes
    // instead of erroring on the unique constraint.
    await prisma.replayChunk.upsert({
      where: { sessionId_seq: { sessionId: session.id, seq } },
      create: {
        sessionId: session.id,
        seq,
        events: events as unknown as Prisma.InputJsonValue,
      },
      update: {},
    });

    return NO_CONTENT;
  } catch (error) {
    console.error("[replay] failed", error);
    return new NextResponse(null, { status: 500 });
  }
}

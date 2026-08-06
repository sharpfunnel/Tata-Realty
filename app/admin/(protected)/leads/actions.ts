"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "../../../lib/auth";
import { leadStatusSchema } from "../../../lib/leads";
import { prisma } from "../../../lib/prisma";

/**
 * Moves one lead along the sales pipeline.
 *
 * A Server Action is a public POST endpoint whether or not anything calls it —
 * proxy.ts does not cover it, so the admin check has to happen right here.
 */
export async function setLeadStatus(
  leadId: string,
  status: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await requireAdmin())) {
    return { ok: false, error: "Not signed in." };
  }

  const parsed = leadStatusSchema.safeParse(status);
  if (!parsed.success) {
    return { ok: false, error: "Unknown status." };
  }

  try {
    await prisma.lead.update({
      where: { id: leadId },
      // statusAt answers "how long has this been sitting here", which the
      // submission time cannot once the stage has moved on.
      data: { status: parsed.data, statusAt: new Date() },
    });
  } catch {
    return { ok: false, error: "Could not update this lead." };
  }

  // The leads page is force-dynamic, so there is no cache entry to purge —
  // what we want is the client router to re-render the row.
  refresh();
  return { ok: true };
}

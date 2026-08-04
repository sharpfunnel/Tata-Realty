"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "../auth";
import { prisma } from "../prisma";
import { sendManualConversionEvent } from "./capi";
import { CAPI_EVENT_VALUES, type ManualCapiResult } from "./events";

const optionsSchema = z.object({
  eventType: z.enum(CAPI_EVENT_VALUES),
  customEventName: z.string().trim().max(60).optional(),
  value: z.number().min(0).max(1_000_000_000).optional(),
  currency: z.string().trim().length(3).optional(),
  orderId: z.string().trim().max(100).optional(),
});

export type SendCapiInput = z.infer<typeof optionsSchema>;

/**
 * Sends a conversion event for one lead.
 *
 * A Server Action is a public POST endpoint — proxy.ts does not cover it, so
 * the admin check has to happen here.
 */
export async function sendManualCapiEvent(
  leadId: string,
  input: SendCapiInput,
): Promise<ManualCapiResult> {
  if (!(await requireAdmin())) {
    return { ok: false, error: "Not signed in." };
  }

  const parsed = optionsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid event options." };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
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

  if (!lead) return { ok: false, error: "Lead not found." };

  const result = await sendManualConversionEvent(lead, parsed.data);

  // The dev-preview path never touches the lead's real send status.
  if ("preview" in result && result.preview) return result;

  await prisma.lead.update({
    where: { id: leadId },
    data: result.ok
      ? {
          metaCapiSentAt: new Date(),
          metaCapiError: null,
          metaCapiEventName: result.eventName,
          metaEventId: result.eventId,
        }
      : { metaCapiError: result.error.slice(0, 500) },
  });

  // The leads page is force-dynamic, so there is no cache entry to purge —
  // what we want is the client router to re-render the row's badge.
  refresh();
  return result;
}

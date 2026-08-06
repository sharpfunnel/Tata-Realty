import { z } from "zod";

/**
 * The sales pipeline.
 *
 * Shared between the server action that writes a stage and the client control
 * that offers them, so this file must stay free of `server-only` and of any
 * Node import.
 *
 * The order here is the order of the pipeline, and the order the dropdown and
 * the filter tabs render in.
 */
export const LEAD_STATUSES = [
  { value: "new", label: "New", tone: "blue" },
  { value: "contacted", label: "Contacted", tone: "orange" },
  { value: "qualified", label: "Qualified", tone: "neutral" },
  { value: "won", label: "Won", tone: "green" },
  { value: "lost", label: "Lost", tone: "red" },
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number]["value"];

/** Literal tuple for `z.enum` — `.map()` alone widens these to `string`. */
export const LEAD_STATUS_VALUES = LEAD_STATUSES.map((status) => status.value) as unknown as [
  LeadStatus,
  ...LeadStatus[],
];

export const leadStatusSchema = z.enum(LEAD_STATUS_VALUES);

/** Rows written before the column existed read as "new", never as blank. */
export function statusOf(value: string | null | undefined): LeadStatus {
  const match = LEAD_STATUSES.find((status) => status.value === value);
  return match ? match.value : "new";
}

export function statusLabel(value: string | null | undefined): string {
  const status = statusOf(value);
  return LEAD_STATUSES.find((entry) => entry.value === status)!.label;
}

"use client";

import { useState, useTransition } from "react";

// Import from leads.ts, not the action module — a "use server" file exports
// only callable actions.
import { LEAD_STATUSES, statusOf, type LeadStatus } from "../../../lib/leads";
import { setLeadStatus } from "./actions";

const TONE: Record<LeadStatus, string> = {
  new: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  contacted: "border-[#ff7a1a]/25 bg-[#ff7a1a]/10 text-[#ff9d55]",
  qualified: "border-white/15 bg-white/[0.06] text-white/70",
  won: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  lost: "border-red-400/25 bg-red-400/10 text-red-300",
};

/**
 * Inline pipeline control. Optimistic on purpose: the sales team works this
 * list at speed, and waiting for a round trip per row reads as a broken page.
 */
export default function StatusSelect({
  leadId,
  status,
}: {
  leadId: string;
  status: string | null;
}) {
  const [value, setValue] = useState<LeadStatus>(statusOf(status));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(next: LeadStatus) {
    const previous = value;
    setValue(next);
    setError(null);

    startTransition(async () => {
      const result = await setLeadStatus(leadId, next);
      if (!result.ok) {
        // Roll back rather than leave the row claiming something untrue.
        setValue(previous);
        setError(result.error);
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <select
        aria-label="Lead status"
        value={value}
        disabled={pending}
        onChange={(event) => handleChange(event.target.value as LeadStatus)}
        className={`cursor-pointer rounded-md border px-2 py-1 text-xs font-medium outline-none transition disabled:opacity-60 ${TONE[value]}`}
      >
        {LEAD_STATUSES.map((entry) => (
          <option key={entry.value} value={entry.value} className="bg-[#121214] text-white">
            {entry.label}
          </option>
        ))}
      </select>
      {error && (
        <span role="alert" title={error} className="text-xs text-red-300">
          !
        </span>
      )}
    </span>
  );
}

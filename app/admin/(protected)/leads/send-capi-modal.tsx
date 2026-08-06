"use client";

import { useEffect, useMemo, useState } from "react";
// Import from events.ts, not capi.ts — the latter is server-only.
import {
  CAPI_EVENT_TYPES,
  CUSTOM_EVENT_NAME_PATTERN,
  type CapiEventType,
  type CapiPreview,
} from "../../../lib/meta/events";
import {
  previewCapiEvent,
  sendManualCapiEvent,
  type SendCapiInput,
} from "../../../lib/meta/actions";

export type CapiLeadSummary = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  visitorNumber: number | null;
  location: string | null;
  metaAdId: string | null;
  placement: string | null;
};

const field =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-[#ff7a1a]/60 focus:ring-4 focus:ring-[#ff7a1a]/15";

const label =
  "mb-1.5 block text-[11px] font-medium tracking-wider text-white/45 uppercase";

export default function SendCapiModal({ lead }: { lead: CapiLeadSummary }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-white/10 px-2.5 py-1 text-xs font-medium text-white/70 transition hover:border-[#ff7a1a]/40 hover:text-[#ff9d55]"
      >
        Send
      </button>
      {open && <Modal lead={lead} onClose={() => setOpen(false)} />}
    </>
  );
}

function Modal({
  lead,
  onClose,
}: {
  lead: CapiLeadSummary;
  onClose: () => void;
}) {
  const [eventType, setEventType] = useState<CapiEventType>("Lead");
  const [customEventName, setCustomEventName] = useState("");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [orderId, setOrderId] = useState("");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<SentSummary | null>(null);
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState<CapiPreview | null>(null);

  // Escape closes, matching every other dialog the admin will ever use.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const eventName =
    eventType === "Custom" ? customEventName.trim() || "CustomEvent" : eventType;

  // Meta's own constraint. Checked here too so the operator sees why Send is
  // disabled instead of a generic rejection after the round trip.
  const customNameValid =
    eventType !== "Custom" ||
    CUSTOM_EVENT_NAME_PATTERN.test(customEventName.trim());

  // The options the server will build from — only choices, never identity.
  const options = useMemo<SendCapiInput>(() => {
    const numericValue = Number.parseFloat(value);
    const hasValue = Number.isFinite(numericValue);
    return {
      eventType,
      customEventName: eventType === "Custom" ? customEventName.trim() : undefined,
      value: hasValue ? numericValue : undefined,
      currency: hasValue ? currency.toUpperCase() : undefined,
      orderId: orderId.trim() || undefined,
    };
  }, [eventType, customEventName, value, currency, orderId]);

  // The preview is rendered by the *same* builder the live send uses, so it
  // cannot drift away from what actually reaches Meta. Debounced because it is
  // a round trip on every keystroke otherwise.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await previewCapiEvent(lead.id, options);
      if (cancelled) return;
      setPreview(result.ok ? result.preview : null);
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [lead.id, options]);

  async function handleSend() {
    setPending(true);
    setError(null);

    const result = await sendManualCapiEvent(lead.id, options);

    setPending(false);
    if (result.ok) {
      setSent({
        eventId: result.eventId,
        preview: result.preview,
        eventsReceived: result.eventsReceived,
        fbtraceId: result.fbtraceId,
      });
    } else {
      setError(result.error);
    }
  }

  const needsValue = CAPI_EVENT_TYPES.find(
    (type) => type.value === eventType,
  )?.needsValue;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Send Meta conversion event for ${lead.name}`}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="my-8 w-full max-w-lg rounded-2xl border border-white/10 bg-[#121214] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
          <div>
            <h2 className="font-display text-base font-semibold text-white">
              Send conversion event
            </h2>
            <p className="mt-0.5 text-xs text-white/40">
              Meta Conversions API · {lead.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md px-2 py-1 text-lg leading-none text-white/40 transition hover:bg-white/[0.06] hover:text-white"
          >
            ×
          </button>
        </div>

        {sent ? (
          <SuccessPanel sent={sent} eventName={eventName} onClose={onClose} />
        ) : (
          <div className="px-5 py-4">
            <LeadContext lead={lead} />

            <div className="mt-4">
              <span className={label}>Event type</span>
              <div className="flex flex-wrap gap-1.5">
                {CAPI_EVENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setEventType(type.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      eventType === type.value
                        ? "bg-[#ff7a1a] text-black"
                        : "border border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {eventType === "Custom" && (
              <div className="mt-4">
                <label htmlFor="capi-custom" className={label}>
                  Custom event name
                </label>
                <input
                  id="capi-custom"
                  value={customEventName}
                  onChange={(event) => setCustomEventName(event.target.value)}
                  placeholder="SiteVisitBooked"
                  aria-invalid={!customNameValid}
                  className={field}
                />
                {!customNameValid && (
                  <p className="mt-1.5 text-xs text-amber-300/80">
                    Letters, digits and underscores only, up to 50 characters.
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label htmlFor="capi-value" className={label}>
                  Value {needsValue ? "" : "(optional)"}
                </label>
                <input
                  id="capi-value"
                  inputMode="decimal"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder="15000000"
                  className={field}
                />
              </div>
              <div>
                <label htmlFor="capi-currency" className={label}>
                  Currency
                </label>
                <select
                  id="capi-currency"
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  className={field}
                >
                  {["INR", "USD", "AED", "GBP", "EUR"].map((code) => (
                    <option key={code} value={code} className="bg-[#121214]">
                      {code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="capi-order" className={label}>
                Order / reference ID (optional)
              </label>
              <input
                id="capi-order"
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                placeholder="Used as event_id to dedupe against the Pixel"
                className={field}
              />
            </div>

            {preview && preview.warnings.length > 0 && (
              <ul className="mt-5 space-y-1 rounded-lg border border-amber-400/25 bg-amber-400/[0.07] px-3 py-2 text-xs text-amber-200/90">
                {preview.warnings.map((warning) => (
                  <li key={warning} className="flex gap-2">
                    <span aria-hidden="true">·</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            )}

            <details className="mt-3 rounded-lg border border-white/[0.07] bg-white/[0.02]">
              <summary className="cursor-pointer list-none px-3 py-2 text-xs font-medium text-white/50 transition hover:text-white/80">
                Payload preview
              </summary>
              <div className="relative border-t border-white/[0.07]">
                <button
                  type="button"
                  onClick={() => {
                    if (!preview) return;
                    navigator.clipboard?.writeText(preview.json);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="absolute top-2 right-2 rounded-md border border-white/10 bg-[#121214] px-2 py-1 text-[11px] text-white/60 transition hover:text-white"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
                <pre className="max-h-64 overflow-auto p-3 text-[11px] leading-relaxed text-white/55">
                  {preview?.json ?? "Building preview…"}
                </pre>
              </div>
            </details>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-sm text-red-300"
              >
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-2 text-sm text-white/50 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={pending || !customNameValid}
                className="rounded-lg bg-[#ff7a1a] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#ff8c3a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Sending…" : `Send ${eventName}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LeadContext({ lead }: { lead: CapiLeadSummary }) {
  const rows: Array<[string, string]> = [
    ["Visitor", lead.visitorNumber ? `#${lead.visitorNumber}` : "No session"],
    ["Location", lead.location || "—"],
    ["Ad ID", lead.metaAdId || "—"],
    ["Placement", lead.placement || "—"],
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-white/[0.07] bg-white/[0.02] p-3 text-xs">
      {rows.map(([term, description]) => (
        <div key={term} className="flex justify-between gap-2">
          <dt className="text-white/35">{term}</dt>
          <dd className="truncate text-white/70" title={description}>
            {description}
          </dd>
        </div>
      ))}
    </dl>
  );
}

type SentSummary = {
  eventId: string;
  preview: boolean;
  eventsReceived?: number;
  fbtraceId?: string;
};

function SuccessPanel({
  sent,
  eventName,
  onClose,
}: {
  sent: SentSummary;
  eventName: string;
  onClose: () => void;
}) {
  return (
    <div className="px-5 py-8 text-center">
      <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-emerald-400/12 text-emerald-300">
        <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
          <path
            d="m5 13 4 4L19 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <p className="mt-3 text-sm font-medium text-white">{eventName} sent</p>

      {sent.preview ? (
        <p className="mx-auto mt-2 max-w-sm rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          Preview only — no Meta credentials configured, so nothing was actually
          delivered and the lead&apos;s status was left unchanged.
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-white/40">
          Meta accepted{" "}
          {sent.eventsReceived === undefined
            ? "the event"
            : `${sent.eventsReceived} event${sent.eventsReceived === 1 ? "" : "s"}`}
          .
        </p>
      )}

      {/* event_id finds the conversion in the dataset; fbtrace_id is what Meta
          support and Events Manager can look this delivery up by. */}
      <dl className="mx-auto mt-3 max-w-sm space-y-1 text-left font-mono text-[11px] break-all text-white/45">
        <div>
          <dt className="inline text-white/30">event_id </dt>
          <dd className="inline">{sent.eventId}</dd>
        </div>
        {sent.fbtraceId && (
          <div>
            <dt className="inline text-white/30">fbtrace_id </dt>
            <dd className="inline">{sent.fbtraceId}</dd>
          </div>
        )}
      </dl>

      <button
        type="button"
        onClick={onClose}
        className="mt-5 rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:text-white"
      >
        Done
      </button>
    </div>
  );
}

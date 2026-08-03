"use client";

import { useState } from "react";
import { BUDGET_OPTIONS, CONFIG_OPTIONS, CONTACT } from "../lib/site";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    /** Set by public/tracker.js — links this submission to the visit. */
    __trSessionId?: string;
  }
}

type Tone = "light" | "dark";

type Props = {
  /** Section 7 asks for configuration as well as the hero fields. */
  withConfiguration?: boolean;
  tone?: Tone;
  submitLabel: string;
  id?: string;
};

const styles = {
  light: {
    frame: "border-line bg-white",
    label: "text-muted",
    // Faintly tinted so the inputs still read as inputs on the white panel.
    field:
      "border-line bg-cream/70 text-ink placeholder:text-muted/60 focus:border-gold focus:bg-white focus:ring-gold/25",
    note: "text-muted",
    error: "text-red-600",
  },
  dark: {
    frame: "border-white/15 bg-white/[0.03]",
    label: "text-white/55",
    field:
      "border-white/15 bg-white/[0.06] text-white placeholder:text-white/35 focus:border-gold focus:ring-gold/30",
    note: "text-white/55",
    error: "text-red-300",
  },
} satisfies Record<Tone, Record<string, string>>;

export default function LeadForm({
  withConfiguration = false,
  tone = "light",
  submitLabel,
  id,
}: Props) {
  const s = styles[tone];
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").replace(/\D/g, "");
    const budget = String(data.get("budget") ?? "");
    const configuration = String(data.get("configuration") ?? "");

    if (!name) return setError("Please enter your full name.");
    if (phone.length !== 10) return setError("Please enter a valid 10-digit phone number.");
    if (!budget) return setError("Please select a budget range.");
    if (withConfiguration && !configuration)
      return setError("Please select a configuration.");

    setError(null);

    // Meta conversion event - Pixel ID still pending from client.
    window.fbq?.("track", "Lead");

    // Persist to the admin panel. Fire-and-forget so a slow database never
    // delays the confirmation the user sees.
    void fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: window.__trSessionId,
        name,
        phone,
        budgetRange: budget,
        configuration: withConfiguration ? configuration : undefined,
      }),
      keepalive: true,
    }).catch(() => {
      // Never block the enquiry on a network failure.
    });

    setDone(true);
  }

  if (done) {
    return (
      <div
        className={`rounded-2xl border p-8 text-center ${
          tone === "dark" ? "border-white/15 bg-white/[0.06]" : "border-line bg-white"
        }`}
      >
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold/20 text-gold">
          <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden="true">
            <path
              d="m5 13 4 4L19 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p
          className={`font-display mt-4 text-xl font-semibold ${
            tone === "dark" ? "text-white" : "text-black"
          }`}
        >
          Thank you - request received
        </p>
        <p className={`mt-2 text-sm ${s.note}`}>
          {CONTACT.firstName} will call you within 30 minutes.
        </p>
      </div>
    );
  }

  const fieldClass = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${s.field}`;

  return (
    <form
      id={id}
      onSubmit={handleSubmit}
      noValidate
      className={`grid gap-4 rounded-3xl border p-6 sm:grid-cols-2 sm:p-8 ${s.frame}`}
    >
      <div className="sm:col-span-2">
        <label htmlFor={`${id}-name`} className={`mb-2 block text-xs font-medium tracking-wide uppercase ${s.label}`}>
          Full Name
        </label>
        <input
          id={`${id}-name`}
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          className={fieldClass}
        />
      </div>

      <div className={withConfiguration ? "" : "sm:col-span-2"}>
        <label htmlFor={`${id}-phone`} className={`mb-2 block text-xs font-medium tracking-wide uppercase ${s.label}`}>
          Phone Number
        </label>
        <input
          id={`${id}-phone`}
          name="phone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          autoComplete="tel-national"
          placeholder="10-digit mobile number"
          className={fieldClass}
        />
      </div>

      <div className={withConfiguration ? "" : "sm:col-span-2"}>
        <label htmlFor={`${id}-budget`} className={`mb-2 block text-xs font-medium tracking-wide uppercase ${s.label}`}>
          Budget Range
        </label>
        <select id={`${id}-budget`} name="budget" defaultValue="" className={fieldClass}>
          <option value="" disabled>
            Select budget
          </option>
          {BUDGET_OPTIONS.map((option) => (
            <option key={option} value={option} className="text-ink">
              {option}
            </option>
          ))}
        </select>
      </div>

      {withConfiguration && (
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-configuration`} className={`mb-2 block text-xs font-medium tracking-wide uppercase ${s.label}`}>
            Configuration
          </label>
          <select
            id={`${id}-configuration`}
            name="configuration"
            defaultValue=""
            className={fieldClass}
          >
            <option value="" disabled>
              Select configuration
            </option>
            {CONFIG_OPTIONS.map((option) => (
              <option key={option} value={option} className="text-ink">
                {option}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p role="alert" className={`sm:col-span-2 text-sm ${s.error}`}>
          {error}
        </p>
      )}

      <button
        type="submit"
        className="group inline-flex items-center justify-between gap-3 rounded-xl bg-black py-2 pr-2 pl-6 text-sm font-semibold text-white ring-1 ring-white/10 shadow-[0_12px_32px_-14px_rgba(0,0,0,0.6)] transition hover:bg-black/85 focus-visible:ring-4 focus-visible:ring-gold/40 focus-visible:outline-none sm:col-span-2"
      >
        <span>{submitLabel}</span>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gold text-black transition group-hover:translate-x-0.5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </button>

      <p className={`sm:col-span-2 text-center text-xs ${s.note}`}>
        100% free &amp; confidential · {CONTACT.firstName} calls back within 30 minutes
      </p>
    </form>
  );
}

"use client";

import { useState } from "react";
import { BUDGET_OPTIONS, CONFIG_OPTIONS, CONTACT, whatsappLink } from "../lib/site";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
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
    field:
      "border-line bg-white text-ink placeholder:text-muted/60 focus:border-gold focus:ring-gold/25",
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

    // Meta conversion event — Pixel ID still pending from client.
    window.fbq?.("track", "Lead");

    const lines = [
      "Hi, I am interested in Tata Realty Ghansoli pre-launch. Please share details.",
      "",
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Budget: ${budget}`,
    ];
    if (withConfiguration) lines.push(`Configuration: ${configuration}`);

    window.open(whatsappLink(lines.join("\n")), "_blank", "noopener,noreferrer");
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
            tone === "dark" ? "text-white" : "text-navy"
          }`}
        >
          Thank you — request received
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
        className="sm:col-span-2 rounded-xl bg-gold px-6 py-3.5 text-sm font-semibold text-navy-deep transition hover:bg-gold-soft focus-visible:ring-4 focus-visible:ring-gold/40 focus-visible:outline-none"
      >
        {submitLabel}
      </button>

      <p className={`sm:col-span-2 text-center text-xs ${s.note}`}>
        100% free &amp; confidential · {CONTACT.firstName} calls back within 30 minutes
      </p>
    </form>
  );
}

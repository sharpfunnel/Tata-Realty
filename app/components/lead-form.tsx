"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { whatsappLink } from "../lib/site";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    /** Set by public/tracker.js — links this submission to the visit. */
    __trSessionId?: string;
  }
}

type Tone = "light" | "dark";

type Props = {
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

/**
 * Two required fields only. Budget, configuration, email and any message are
 * collected afterwards on /thank-you, where they are optional — a shorter form
 * converts better, and the lead is captured either way.
 */
export default function LeadForm({ tone = "light", submitLabel, id }: Props) {
  const s = styles[tone];
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").replace(/\D/g, "");

    if (!name) return setError("Please enter your full name.");
    if (phone.length !== 10)
      return setError("Please enter a valid 10-digit phone number.");

    setError(null);
    setPending(true);

    // One id shared by the browser Pixel and the server-side Conversions API,
    // so Meta counts this conversion once rather than twice.
    const eventId =
      window.crypto?.randomUUID?.().replace(/-/g, "") ??
      `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;

    window.fbq?.("track", "Lead", {}, { eventID: eventId });

    // Opened here, synchronously inside the submit gesture — a popup blocker
    // would reject it after the await below. The thank-you page repeats the
    // link for anyone whose browser blocks it anyway.
    const whatsappTab = window.open(
      whatsappLink(
        [
          "Hi, I am interested in Tata Realty Ghansoli pre-launch. Please share details.",
          "",
          `Name: ${name}`,
          `Phone: ${phone}`,
        ].join("\n"),
      ),
      "_blank",
      "noopener,noreferrer",
    );

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: window.__trSessionId,
          eventId,
          name,
          phone,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        leadId?: string;
        error?: string;
      } | null;

      if (!response.ok) {
        setPending(false);
        return setError(
          payload?.error ?? "Could not send your enquiry. Please try again.",
        );
      }

      // The id lets the thank-you page add optional details to this same lead.
      router.push(
        payload?.leadId ? `/thank-you?leadId=${payload.leadId}` : "/thank-you",
      );
    } catch {
      setPending(false);
      // WhatsApp already carried the enquiry, so say so rather than implying
      // the whole thing failed.
      setError(
        whatsappTab
          ? "We could not save your details here, but your WhatsApp message went through."
          : "Network error. Please try again, or call us directly.",
      );
    }
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
        <label
          htmlFor={`${id}-name`}
          className={`mb-2 block text-xs font-medium tracking-wide uppercase ${s.label}`}
        >
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

      <div className="sm:col-span-2">
        <label
          htmlFor={`${id}-phone`}
          className={`mb-2 block text-xs font-medium tracking-wide uppercase ${s.label}`}
        >
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

      {error && (
        <p role="alert" className={`sm:col-span-2 text-sm ${s.error}`}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="group inline-flex items-center justify-between gap-3 rounded-xl bg-black py-2 pr-2 pl-6 text-sm font-semibold text-white ring-1 ring-white/10 shadow-[0_12px_32px_-14px_rgba(0,0,0,0.6)] transition hover:bg-black/85 focus-visible:ring-4 focus-visible:ring-gold/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
      >
        <span>{pending ? "Sending…" : submitLabel}</span>
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
        Just your name and number — we&apos;ll call you back within 30 minutes.
      </p>
    </form>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { BUDGET_OPTIONS, CONFIG_OPTIONS, CONTACT } from "../lib/site";
import { isValidEmail } from "../lib/validation";

type Status = "idle" | "submitting" | "success" | "error";

const field =
  "w-full rounded-xl border border-line bg-cream/70 px-4 py-3 text-sm text-ink placeholder:text-muted/60 outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/25";

const label =
  "mb-2 block text-xs font-medium tracking-wide text-muted uppercase";

/**
 * Adds optional details to the lead the landing-page form already created.
 * Everything here is genuinely optional — the enquiry is complete without it.
 */
export default function ThankYouOptionalForm({ leadId }: { leadId: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const budgetRange = String(data.get("budgetRange") ?? "");
    const configuration = String(data.get("configuration") ?? "");
    const message = String(data.get("message") ?? "").trim();

    // At least one field, or there is nothing to send.
    if (!email && !budgetRange && !configuration && !message) {
      return setError("Add at least one detail before saving.");
    }

    // Optional field: only validate the format once it has been filled in.
    if (email && !isValidEmail(email)) {
      setStatus("error");
      return setError("Please enter a valid email address.");
    }

    setError(null);
    setStatus("submitting");

    try {
      const response = await fetch("/api/lead", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          email,
          budgetRange,
          configuration,
          message,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setStatus("error");
        return setError(payload?.error ?? "Could not save. Please try again.");
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="mt-10 rounded-3xl border border-line bg-white p-8 text-center">
        <p className="font-display text-lg font-semibold text-black">
          Got it — thank you
        </p>
        <p className="mt-2 text-sm text-muted">
          {CONTACT.firstName} will have this in front of him before he calls.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-10 grid gap-4 rounded-3xl border border-line bg-white p-6 sm:grid-cols-2 sm:p-8"
    >
      <div className="sm:col-span-2">
        <h2 className="font-display text-lg font-semibold text-black">
          Want a more useful call?
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          Optional — tell us what you&apos;re looking for and we&apos;ll bring
          the right options to the call.
        </p>
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="ty-email" className={label}>
          Email
        </label>
        <input
          id="ty-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={field}
        />
      </div>

      <div>
        <label htmlFor="ty-budget" className={label}>
          Budget Range
        </label>
        <select id="ty-budget" name="budgetRange" defaultValue="" className={field}>
          <option value="">Select budget</option>
          {BUDGET_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="ty-configuration" className={label}>
          Configuration
        </label>
        <select
          id="ty-configuration"
          name="configuration"
          defaultValue=""
          className={field}
        >
          <option value="">Select configuration</option>
          {CONFIG_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="ty-message" className={label}>
          Anything else?
        </label>
        <textarea
          id="ty-message"
          name="message"
          rows={3}
          maxLength={2000}
          placeholder="Preferred floor, possession timeline, site visit dates…"
          className={`${field} resize-y`}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 sm:col-span-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="group inline-flex items-center justify-between gap-3 rounded-xl bg-black py-2 pr-2 pl-6 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-black/85 focus-visible:ring-4 focus-visible:ring-gold/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
      >
        <span>{status === "submitting" ? "Saving…" : "Save these details"}</span>
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
    </form>
  );
}

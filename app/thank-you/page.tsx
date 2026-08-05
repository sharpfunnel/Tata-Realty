import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT, whatsappLink } from "../lib/site";
import ThankYouOptionalForm from "./thank-you-optional-form";

export const metadata: Metadata = {
  title: "Thank You - Tata Realty Ghansoli",
  description: "Your enquiry has been received. Our team will call you shortly.",
  // A transient confirmation URL, not something that should rank. `follow`
  // stays on so link equity still passes back to the landing page.
  robots: { index: false, follow: true },
};

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string | string[] }>;
}) {
  const { leadId } = await searchParams;
  // A direct visit with no id still gets the confirmation — just no form,
  // because there would be no lead to attach the answers to.
  const resolvedLeadId = typeof leadId === "string" ? leadId : undefined;

  return (
    <main className="flex min-h-dvh flex-col bg-cream">
      <header className="border-b border-line/70 bg-cream/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="font-display grid size-9 place-items-center rounded-lg bg-black text-sm font-semibold text-gold">
              TR
            </span>
            <span className="leading-tight">
              <span className="block text-[10px] tracking-[0.18em] text-muted uppercase">
                Channel Partner for
              </span>
              <span className="font-display block text-sm font-semibold text-black">
                Tata Realty
              </span>
            </span>
          </Link>
          <a
            href={CONTACT.phoneHref}
            className="group inline-flex items-center gap-3 rounded-xl bg-black py-1.5 pr-2 pl-5 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-black/85"
          >
            <span>Call Us</span>
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gold text-black">
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
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
              </svg>
            </span>
          </a>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-14 sm:px-8 lg:py-20">
        <div className="text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-gold/20 text-gold">
            <svg viewBox="0 0 24 24" fill="none" className="size-8" aria-hidden="true">
              <path
                d="m5 13 4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <h1 className="font-display mt-6 text-3xl leading-tight font-semibold text-black sm:text-4xl">
            Thank you for reaching out
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted">
            Your enquiry has been received. {CONTACT.firstName} will call you
            within 30 minutes with pre-launch pricing and floor plans.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#25D366]/85 sm:w-auto"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden="true">
                <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.07-.13-.27-.2-.57-.35Z" />
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 8.24 8.25c0 4.54-3.7 8.24-8.24 8.24Z" />
              </svg>
              Continue on WhatsApp
            </a>
            <a
              href={CONTACT.phoneHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-gold sm:w-auto"
            >
              Call {CONTACT.phone}
            </a>
          </div>
        </div>

        {resolvedLeadId ? <ThankYouOptionalForm leadId={resolvedLeadId} /> : null}

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-muted underline-offset-4 transition hover:text-ink hover:underline"
          >
            ← Back to the project page
          </Link>
        </div>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../lib/auth";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Admin Login - Tata Realty",
  robots: { index: false, follow: false },
};

// Reads the session cookie, so it must never be prerendered.
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Already signed in? Skip the form.
  if (await requireAdmin()) redirect("/admin/sessions");

  const nextParam = (await searchParams).next;
  const next = typeof nextParam === "string" ? nextParam : undefined;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0a0a0b] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#ff7a1a] uppercase">
            Tata Realty
          </p>
          <h1 className="font-display mt-2 text-2xl font-semibold text-white">
            Admin Panel
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Sign in to view sessions, leads and heatmaps.
          </p>
        </div>

        <LoginForm next={next} />

        <p className="mt-6 text-center text-xs text-white/30">
          Authorised access only. Activity is logged.
        </p>
      </div>
    </main>
  );
}

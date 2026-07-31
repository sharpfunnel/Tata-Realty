import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../lib/auth";
import { logout } from "../login/actions";
import AdminNav from "./admin-nav";

export const metadata: Metadata = {
  title: "Admin - Tata Realty",
  robots: { index: false, follow: false },
};

// Every admin page reads live data and the session cookie.
export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The real auth gate. proxy.ts only checks a cookie *exists*; this decrypts
  // it and confirms the session actually carries a user.
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-dvh bg-[#0a0a0b] text-white">
      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#0a0a0b]/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5">
          <div className="flex items-baseline gap-2.5">
            <span className="text-[11px] font-semibold tracking-[0.2em] text-[#ff7a1a] uppercase">
              Tata Realty
            </span>
            <span className="text-sm font-medium text-white/40">Admin</span>
          </div>

          <AdminNav />

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-white/35 sm:inline">
              {session.email}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-white/20 hover:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-5 py-7">{children}</main>
    </div>
  );
}

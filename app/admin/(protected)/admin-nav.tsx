"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/overview", label: "Overview" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/heatmap", label: "Heatmap" },
] as const;

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-[#ff7a1a]/12 text-[#ff7a1a]"
                : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

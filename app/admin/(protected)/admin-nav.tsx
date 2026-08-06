"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Roughly in the order they get looked at: the daily check first, the
// diagnostics that answer a specific question last.
const LINKS = [
  { href: "/admin/overview", label: "Overview" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/funnels", label: "Funnels" },
  { href: "/admin/ctas", label: "CTAs" },
  { href: "/admin/forms", label: "Forms" },
  { href: "/admin/heatmap", label: "Heatmap" },
  { href: "/admin/tech-stack", label: "Tech Stack" },
  { href: "/admin/performance", label: "Performance" },
  { href: "/admin/errors", label: "Errors" },
] as const;

export default function AdminNav() {
  const pathname = usePathname();

  return (
    // Wraps rather than scrolls: ten pills do not fit one line on a laptop,
    // and a nav you have to scroll sideways hides half of itself.
    <nav className="flex flex-wrap items-center gap-1">
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

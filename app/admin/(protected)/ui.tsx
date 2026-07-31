import type { ReactNode } from "react";

/** Em dash placeholder for every null/unknown cell, so the tables read consistently. */
export const DASH = <span className="text-white/20">–</span>;

export function PageHeader({
  title,
  count,
  children,
}: {
  title: string;
  count?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-white">{title}</h1>
        {count && <p className="mt-1 text-sm text-white/40">{count}</p>}
      </div>
      {children}
    </div>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#121214]">
      {children}
    </div>
  );
}

/** Tables are wide; this keeps the horizontal scroll inside the card. */
export function TableScroll({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function Th({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={`whitespace-nowrap px-3.5 py-2.5 text-[11px] font-medium tracking-wider text-white/35 uppercase ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={`whitespace-nowrap px-3.5 py-2.5 text-white/70 ${className}`}>
      {children}
    </td>
  );
}

type BadgeTone = "orange" | "blue" | "green" | "neutral" | "red";

const TONES: Record<BadgeTone, string> = {
  orange: "bg-[#ff7a1a]/12 text-[#ff9d55] ring-[#ff7a1a]/20",
  blue: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
  green: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  red: "bg-red-400/10 text-red-300 ring-red-400/20",
  neutral: "bg-white/[0.06] text-white/55 ring-white/10",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint: string;
}) {
  return (
    <div className="px-5 py-16 text-center">
      <p className="text-sm font-medium text-white/60">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-white/30">{hint}</p>
    </div>
  );
}

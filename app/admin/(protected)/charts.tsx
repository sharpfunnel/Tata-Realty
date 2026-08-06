import type { ReactNode } from "react";

import { Card } from "./ui";

/**
 * Every chart in the admin, hand-rolled in SVG.
 *
 * Deliberately no charting library: these are all server-rendered, static
 * shapes over at most a few dozen points, which is exactly the case a
 * dependency would not earn its weight on. They are shared from here so a
 * second page reusing one cannot quietly drift from the first.
 */

export const SEGMENT_COLORS = [
  "#3b82f6",
  "#ff7a1a",
  "#10b981",
  "#a855f7",
  "#f59e0b",
  "#ef4444",
  "#64748b",
];

export type Point = { label: string; value: number };

export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
        <h2 className="text-sm font-semibold text-white/80">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </Card>
  );
}

export function Delta({ value, unit }: { value: number | null; unit?: "pt" }) {
  if (value === null) return <span className="text-xs text-white/30">no prior day</span>;
  const up = value >= 0;
  const text = `${up ? "▲" : "▼"} ${Math.abs(value).toFixed(unit === "pt" ? 1 : 0)}${
    unit === "pt" ? "pt" : "%"
  }`;
  return (
    <span className={`text-xs font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
      {text} <span className="text-white/30">vs yesterday</span>
    </span>
  );
}

export function StatTile({
  label,
  value,
  delta,
  deltaUnit,
  hint,
}: {
  label: string;
  value: string;
  delta?: number | null;
  deltaUnit?: "pt";
  hint?: string;
}) {
  return (
    <Card>
      <div className="p-4">
        <p className="text-[11px] font-medium tracking-wider text-white/35 uppercase">{label}</p>
        <p className="font-display mt-2 text-2xl font-semibold text-white">{value}</p>
        <div className="mt-1.5">
          {hint ? (
            <span className="text-xs text-white/30">{hint}</span>
          ) : (
            <Delta value={delta ?? null} unit={deltaUnit} />
          )}
        </div>
      </div>
    </Card>
  );
}

/** Rounds a max value up to a clean axis top (5, 10, 20, 50, 100, …). */
function niceMax(v: number): number {
  if (v <= 5) return 5;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function axisLabel(v: number): string {
  if (v >= 1000) return `${v % 1000 === 0 ? v / 1000 : (v / 1000).toFixed(1)}K`;
  return String(v);
}

export function TrendChart({
  data,
  color,
  label,
}: {
  data: Point[];
  color: string;
  label: string;
}) {
  const w = 640;
  const h = 200;
  const pad = { l: 38, r: 10, t: 10, b: 24 };
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)));
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const x = (i: number) =>
    pad.l + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - (v / max) * innerH;

  const line = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const area = `${x(0)},${pad.t + innerH} ${line} ${x(data.length - 1)},${pad.t + innerH}`;
  const gid = `grad-${color.replace("#", "")}`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  return (
    <div>
      <span className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-white/60">
        <span className="size-2 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={`${label} trend`}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y gridlines + value labels */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={pad.l}
              x2={w - pad.r}
              y1={y(t)}
              y2={y(t)}
              stroke="#ffffff"
              strokeOpacity="0.06"
            />
            <text
              x={pad.l - 8}
              y={y(t) + 3}
              textAnchor="end"
              className="fill-white/30"
              style={{ fontSize: "10px" }}
            >
              {axisLabel(t)}
            </text>
          </g>
        ))}

        <polygon points={area} fill={`url(#${gid})`} />
        <polyline
          points={line}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {data.map((d, i) => (
          <g key={d.label + i}>
            <circle cx={x(i)} cy={y(d.value)} r="2.5" fill={color} />
            <text
              // Anchor the edge labels inward so they never clip at the viewBox.
              x={i === 0 ? pad.l : i === data.length - 1 ? w - pad.r : x(i)}
              y={h - 7}
              textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
              className="fill-white/30"
              style={{ fontSize: "10px" }}
            >
              {d.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function Donut({ data }: { data: Point[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="size-32 shrink-0 -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#ffffff12" strokeWidth="16" />
        {total > 0 &&
          data.map((d, i) => {
            const len = (d.value / total) * c;
            const seg = (
              <circle
                key={d.label}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
                strokeWidth="16"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return seg;
          })}
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
              />
              <span className="truncate text-white/70">{d.label}</span>
            </span>
            <span className="shrink-0 text-white/45">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
        {data.length === 0 && <li className="text-sm text-white/30">No data yet</li>}
      </ul>
    </div>
  );
}

export function BarList({
  data,
  unit = "",
  color = "#ff7a1a",
}: {
  data: Point[];
  unit?: string;
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.label} className="text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-white/70">{d.label}</span>
            <span className="shrink-0 text-white/45">
              {d.value.toLocaleString("en-IN")}
              {unit}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full"
              style={{ width: `${(d.value / max) * 100}%`, background: color, opacity: 0.7 }}
            />
          </div>
        </li>
      ))}
      {data.length === 0 && <li className="text-sm text-white/30">No data yet</li>}
    </ul>
  );
}

/**
 * Stage-by-stage conversion.
 *
 * Bars are sized against the *first* stage, so the shape of the whole journey
 * is visible at a glance, while the drop-off figure compares each stage with
 * the one directly above it — which is where a fixable problem actually shows.
 */
export function ConversionFunnel({ stages }: { stages: Point[] }) {
  const top = stages.length ? Math.max(stages[0].value, 1) : 1;

  return (
    <ol className="space-y-3">
      {stages.map((stage, i) => {
        const previous = i === 0 ? null : stages[i - 1].value;
        const dropOff =
          previous && previous > 0 ? ((previous - stage.value) / previous) * 100 : null;

        return (
          <li key={stage.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-white/70">{stage.label}</span>
              <span className="shrink-0 tabular-nums text-white/45">
                {stage.value.toLocaleString("en-IN")}
                <span className="ml-2 text-white/25">
                  {Math.round((stage.value / top) * 100)}%
                </span>
              </span>
            </div>
            <div className="mt-1.5 h-7 overflow-hidden rounded-lg bg-white/[0.04]">
              <div
                className="h-full rounded-lg"
                style={{
                  width: `${Math.max((stage.value / top) * 100, stage.value > 0 ? 2 : 0)}%`,
                  background: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                  opacity: 0.75,
                }}
              />
            </div>
            {dropOff !== null && (
              <p className="mt-1 text-xs text-white/30">
                {dropOff > 0 ? `${dropOff.toFixed(1)}% drop-off from previous stage` : "No drop-off"}
              </p>
            )}
          </li>
        );
      })}
      {stages.length === 0 && <li className="text-sm text-white/30">No data yet</li>}
    </ol>
  );
}

/** Google's good / needs-improvement / poor split, as one stacked bar. */
export function RatingBar({
  good,
  needsImprovement,
  poor,
}: {
  good: number;
  needsImprovement: number;
  poor: number;
}) {
  const total = good + needsImprovement + poor;
  if (total === 0) return <p className="text-sm text-white/30">No samples yet</p>;

  const segments = [
    { label: "Good", value: good, color: "#10b981" },
    { label: "Needs work", value: needsImprovement, color: "#f59e0b" },
    { label: "Poor", value: poor, color: "#ef4444" },
  ];

  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        {segments.map((segment) => (
          <div
            key={segment.label}
            style={{ width: `${(segment.value / total) * 100}%`, background: segment.color }}
            title={`${segment.label}: ${segment.value}`}
          />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: segment.color }} />
            {segment.label} {Math.round((segment.value / total) * 100)}%
          </li>
        ))}
      </ul>
    </div>
  );
}

import { formatDuration } from "../../../lib/format";
import { prisma } from "../../../lib/prisma";
import { BROWSERS } from "../../../lib/request";
import { Card, DASH, PageHeader } from "../ui";

// Fixed category sets, always shown in this order so the breakdowns read the
// same every time regardless of which values happen to be in the data.
const DEVICE_ORDER = ["Mobile", "Desktop", "Tablet"] as const;

// Live data, never cached — the admin wants the current picture.
export const dynamic = "force-dynamic";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // Asia/Kolkata, no DST

/** UTC instant of IST midnight, `offsetDays` from today. */
function istDayStart(now: Date, offsetDays = 0): Date {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  ist.setUTCHours(0, 0, 0, 0);
  ist.setUTCDate(ist.getUTCDate() + offsetDays);
  return new Date(ist.getTime() - IST_OFFSET_MS);
}

function istDayKey(date: Date): string {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function pct(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0;
}

/** Percentage change of `today` vs `yesterday`, or null when there's no base. */
function delta(today: number, yesterday: number): number | null {
  if (yesterday === 0) return null;
  return ((today - yesterday) / yesterday) * 100;
}

async function getOverview() {
  const now = new Date();
  const todayStart = istDayStart(now);
  const yesterdayStart = istDayStart(now, -1);
  const weekStart = istDayStart(now, -6);
  const liveSince = new Date(now.getTime() - 5 * 60 * 1000);

  const [
    sessionsTotal,
    sessionsToday,
    sessionsYesterday,
    leadsTotal,
    leadsToday,
    leadsYesterday,
    avgAll,
    avgToday,
    avgYesterday,
    distinctVisitors,
    distinctVisitorsToday,
    distinctVisitorsYesterday,
    weekSessions,
    weekLeads,
    live,
    devices,
    browsers,
    cities,
    pages,
  ] = await Promise.all([
    prisma.session.count(),
    prisma.session.count({ where: { arrivedAt: { gte: todayStart } } }),
    prisma.session.count({
      where: { arrivedAt: { gte: yesterdayStart, lt: todayStart } },
    }),
    prisma.lead.count(),
    prisma.lead.count({ where: { submittedAt: { gte: todayStart } } }),
    prisma.lead.count({
      where: { submittedAt: { gte: yesterdayStart, lt: todayStart } },
    }),
    prisma.session.aggregate({ _avg: { durationSec: true } }),
    prisma.session.aggregate({
      _avg: { durationSec: true },
      where: { arrivedAt: { gte: todayStart } },
    }),
    prisma.session.aggregate({
      _avg: { durationSec: true },
      where: { arrivedAt: { gte: yesterdayStart, lt: todayStart } },
    }),
    prisma.session.findMany({ distinct: ["visitorId"], select: { visitorId: true } }),
    prisma.session.findMany({
      distinct: ["visitorId"],
      where: { arrivedAt: { gte: todayStart } },
      select: { visitorId: true },
    }),
    prisma.session.findMany({
      distinct: ["visitorId"],
      where: { arrivedAt: { gte: yesterdayStart, lt: todayStart } },
      select: { visitorId: true },
    }),
    prisma.session.findMany({
      where: { arrivedAt: { gte: weekStart } },
      select: { arrivedAt: true },
    }),
    prisma.lead.findMany({
      where: { submittedAt: { gte: weekStart } },
      select: { submittedAt: true },
    }),
    prisma.session.findMany({
      where: { lastSeenAt: { gte: liveSince } },
      orderBy: { lastSeenAt: "desc" },
      take: 8,
      select: { visitorNumber: true, location: true, device: true, arrivedAt: true },
    }),
    prisma.session.groupBy({ by: ["device"], _count: { _all: true } }),
    prisma.session.groupBy({ by: ["browser"], _count: { _all: true } }),
    prisma.session.groupBy({
      by: ["location"],
      where: { location: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { location: "desc" } },
      take: 8,
    }),
    prisma.pageEvent.groupBy({
      by: ["path"],
      where: { type: "pageview", path: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: 8,
    }),
  ]);

  // Build 7 contiguous IST-day buckets so gaps render as zero, not skipped.
  const days: { key: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = istDayStart(now, -i);
    days.push({
      key: istDayKey(d),
      label: new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        timeZone: "Asia/Kolkata",
      }).format(d),
    });
  }
  const bucket = (rows: { key: string }[]) => {
    const counts = new Map(days.map((d) => [d.key, 0]));
    for (const r of rows) counts.set(r.key, (counts.get(r.key) ?? 0) + 1);
    return days.map((d) => ({ label: d.label, value: counts.get(d.key) ?? 0 }));
  };

  const visitorsTrend = bucket(weekSessions.map((s) => ({ key: istDayKey(s.arrivedAt) })));
  const leadsTrend = bucket(weekLeads.map((l) => ({ key: istDayKey(l.submittedAt) })));

  const visitors = distinctVisitors.length;
  const convRateToday = pct(leadsToday, sessionsToday);
  const convRateYesterday = pct(leadsYesterday, sessionsYesterday);

  return {
    now,
    kpis: {
      visitors: {
        value: visitors,
        delta: delta(distinctVisitorsToday.length, distinctVisitorsYesterday.length),
      },
      sessions: { value: sessionsTotal, delta: delta(sessionsToday, sessionsYesterday) },
      leads: { value: leadsTotal, delta: delta(leadsToday, leadsYesterday) },
      conversion: {
        value: pct(leadsTotal, sessionsTotal),
        delta:
          convRateYesterday === 0
            ? null
            : convRateToday - convRateYesterday,
        deltaUnit: "pt" as const,
      },
      avgTime: {
        value: Math.round(avgAll._avg.durationSec ?? 0),
        delta: delta(
          Math.round(avgToday._avg.durationSec ?? 0),
          Math.round(avgYesterday._avg.durationSec ?? 0),
        ),
      },
    },
    visitorsTrend,
    leadsTrend,
    live: live.map((s) => ({
      visitorNumber: s.visitorNumber,
      location: s.location,
      device: s.device,
      durationSec: Math.max(0, Math.round((now.getTime() - s.arrivedAt.getTime()) / 1000)),
    })),
    // Fold the raw rows into the fixed category sets so every category is always
    // shown (0% when absent), and null/unknown values roll up into the sensible
    // bucket rather than appearing as a stray "Unknown" slice.
    devices: DEVICE_ORDER.map((label) => ({
      label,
      value: devices
        .filter((d) => d.device.toLowerCase() === label.toLowerCase())
        .reduce((s, d) => s + d._count._all, 0),
    })),
    browsers: BROWSERS.map((label) => ({
      label,
      value: browsers
        .filter((b) =>
          label === "Other"
            ? !BROWSERS.includes((b.browser ?? "") as (typeof BROWSERS)[number]) ||
              b.browser === "Other"
            : b.browser === label,
        )
        .reduce((s, b) => s + b._count._all, 0),
    })),
    cities: cities.map((c) => ({ label: c.location ?? "Unknown", value: c._count._all })),
    pages: pages.map((p) => ({ label: p.path ?? "/", value: p._count._all })),
    sessionsTotal,
  };
}

/* ---------- presentational helpers (server-rendered SVG) ---------- */

const SEGMENT_COLORS = ["#3b82f6", "#ff7a1a", "#10b981", "#a855f7", "#f59e0b", "#ef4444", "#64748b"];

function Delta({ value, unit }: { value: number | null; unit?: "pt" }) {
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

function StatTile({
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

function TrendChart({
  data,
  color,
  label,
}: {
  data: { label: string; value: number }[];
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

function Donut({ data }: { data: { label: string; value: number }[] }) {
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

function BarList({
  data,
  unit = "",
}: {
  data: { label: string; value: number }[];
  unit?: string;
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
              className="h-full rounded-full bg-[#ff7a1a]/70"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
      {data.length === 0 && <li className="text-sm text-white/30">No data yet</li>}
    </ul>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
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

/** Static period label — the data window is fixed to the last 7 days. */
function RangePill() {
  return (
    <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/50">
      Last 7 days
    </span>
  );
}

export default async function OverviewPage() {
  const o = await getOverview();
  const avg = formatDuration(o.kpis.avgTime.value) ?? "0:00";

  return (
    <>
      <PageHeader title="Overview" count="All-time totals, with today vs yesterday" />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile
          label="Visitors"
          value={o.kpis.visitors.value.toLocaleString("en-IN")}
          delta={o.kpis.visitors.delta}
        />
        <StatTile
          label="Sessions"
          value={o.kpis.sessions.value.toLocaleString("en-IN")}
          delta={o.kpis.sessions.delta}
        />
        <StatTile
          label="Leads"
          value={o.kpis.leads.value.toLocaleString("en-IN")}
          delta={o.kpis.leads.delta}
        />
        <StatTile
          label="Conversion Rate"
          value={`${o.kpis.conversion.value.toFixed(1)}%`}
          delta={o.kpis.conversion.delta}
          deltaUnit={o.kpis.conversion.deltaUnit}
        />
        {/* CPL needs ad-spend data, which isn't tracked here — shown honestly. */}
        <StatTile label="CPL" value="–" hint="Connect ad spend" />
        <StatTile label="Avg. Time on Site" value={avg} delta={o.kpis.avgTime.delta} />
      </div>

      {/* Trends + live visitors */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_0.8fr]">
        <Panel title="Visitors Trend" action={<RangePill />}>
          <TrendChart data={o.visitorsTrend} color="#3b82f6" label="Visitors" />
        </Panel>
        <Panel title="Leads Trend" action={<RangePill />}>
          <TrendChart data={o.leadsTrend} color="#ff7a1a" label="Leads" />
        </Panel>
        <Panel title={`Live Visitors · ${o.live.length}`}>
          {o.live.length === 0 ? (
            <p className="text-sm text-white/30">No active visitors right now.</p>
          ) : (
            <ul className="space-y-3">
              {o.live.map((v) => (
                <li
                  key={v.visitorNumber}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full bg-emerald-400" />
                      <span className="text-white/80">#{v.visitorNumber}</span>
                    </span>
                    <span className="mt-0.5 block truncate pl-4 text-xs text-white/40">
                      {v.location ?? "Unknown"} · {v.device}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-white/50">
                    {formatDuration(v.durationSec) ?? "0:00"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Breakdowns */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Panel title="Device Breakdown">
          <Donut data={o.devices} />
        </Panel>
        <Panel title="Browser Breakdown">
          <Donut data={o.browsers} />
        </Panel>
        <Panel title="Top Cities">
          <BarList data={o.cities} />
        </Panel>
        <Panel title="Page Performance">
          {o.pages.length === 0 ? (
            <p className="text-sm text-white/30">
              No page views recorded yet.{" "}
              <span className="text-white/20">
                {DASH} tracker.js records these on the landing page.
              </span>
            </p>
          ) : (
            <BarList data={o.pages} unit=" views" />
          )}
        </Panel>
      </div>
    </>
  );
}

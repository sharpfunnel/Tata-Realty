import { formatDuration } from "../../../lib/format";
import { prisma } from "../../../lib/prisma";
import { BROWSERS } from "../../../lib/request";
import {
  BarList,
  Donut,
  Panel,
  StatTile,
  TrendChart,
} from "../charts";
import { DASH, PageHeader } from "../ui";

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

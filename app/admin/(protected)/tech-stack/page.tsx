import { prisma } from "../../../lib/prisma";
import { BarList, Donut, Panel } from "../charts";
import { Card, EmptyState, PageHeader, TableScroll, Td, Th } from "../ui";

/**
 * What visitors actually browse on — and whether it costs us anything.
 *
 * The breakdowns are the easy half. The cohort table underneath is the point:
 * bounce and conversion *per browser* and *per OS* is what answers "is Safari
 * secretly broken", which no aggregate number ever will.
 */

type Cohort = {
  label: string;
  sessions: number;
  bounced: number;
  leads: number;
};

/** Groups a dimension and folds bounce + lead counts into each value. */
async function cohortsBy(field: "browser" | "os" | "device"): Promise<Cohort[]> {
  const [all, bounced, converted] = await Promise.all([
    prisma.session.groupBy({ by: [field], _count: { _all: true } }),
    prisma.session.groupBy({ by: [field], where: { bounced: true }, _count: { _all: true } }),
    prisma.session.groupBy({
      by: [field],
      where: { lead: { isNot: null } },
      _count: { _all: true },
    }),
  ]);

  const lookup = (rows: typeof all, key: string | null) =>
    rows.find((row) => row[field] === key)?._count._all ?? 0;

  return all
    .map((row) => ({
      label: row[field] ?? "Unknown",
      sessions: row._count._all,
      bounced: lookup(bounced, row[field]),
      leads: lookup(converted, row[field]),
    }))
    .sort((a, b) => b.sessions - a.sessions);
}

/** Buckets a raw pixel width into the breakpoint it actually lands in. */
function viewportBucket(width: number | null): string | null {
  if (!width) return null;
  if (width < 480) return "< 480px (small phone)";
  if (width < 768) return "480–767px (phone)";
  if (width < 1024) return "768–1023px (tablet)";
  if (width < 1440) return "1024–1439px (laptop)";
  return "≥ 1440px (desktop)";
}

function tally(values: (string | null)[], limit = 8) {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

async function getTechStack() {
  const [browsers, operatingSystems, devices, environments] = await Promise.all([
    cohortsBy("browser"),
    cohortsBy("os"),
    cohortsBy("device"),
    // Screen/viewport/language/connection are all derived by bucketing, which
    // SQL cannot group by directly — read the columns and fold in memory.
    prisma.session.findMany({
      select: {
        screenWidth: true,
        screenHeight: true,
        viewportWidth: true,
        language: true,
        connection: true,
      },
    }),
  ]);

  return {
    browsers,
    operatingSystems,
    devices,
    total: environments.length,
    screens: tally(
      environments.map((row) =>
        row.screenWidth && row.screenHeight ? `${row.screenWidth} × ${row.screenHeight}` : null,
      ),
    ),
    viewports: tally(environments.map((row) => viewportBucket(row.viewportWidth))),
    languages: tally(environments.map((row) => row.language)),
    connections: tally(environments.map((row) => row.connection)),
  };
}

function pct(part: number, whole: number): string {
  if (whole === 0) return "–";
  return `${((part / whole) * 100).toFixed(1)}%`;
}

function CohortTable({ title, cohorts }: { title: string; cohorts: Cohort[] }) {
  return (
    <Card>
      <div className="border-b border-white/[0.07] px-4 py-3">
        <h2 className="text-sm font-semibold text-white/80">{title}</h2>
      </div>
      {cohorts.length === 0 ? (
        <EmptyState title="No sessions yet" hint="This fills in as soon as traffic arrives." />
      ) : (
        <TableScroll>
          <table className="w-full border-collapse text-sm">
            <thead className="border-b border-white/[0.07] bg-white/[0.02]">
              <tr>
                <Th>Cohort</Th>
                <Th align="right">Sessions</Th>
                <Th align="right">Bounce</Th>
                <Th align="right">Leads</Th>
                <Th align="right">Conversion</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {cohorts.map((cohort) => {
                // A conversion rate off three sessions is noise, not a signal.
                const thin = cohort.sessions < 10;
                return (
                  <tr key={cohort.label} className="transition-colors hover:bg-white/[0.02]">
                    <Td className="font-medium text-white/80">{cohort.label}</Td>
                    <Td className="text-right tabular-nums">
                      {cohort.sessions.toLocaleString("en-IN")}
                    </Td>
                    <Td className="text-right tabular-nums text-white/50">
                      {pct(cohort.bounced, cohort.sessions)}
                    </Td>
                    <Td className="text-right tabular-nums">
                      {cohort.leads.toLocaleString("en-IN")}
                    </Td>
                    <Td
                      className={`text-right tabular-nums ${thin ? "text-white/25" : "text-white/90"}`}
                    >
                      {pct(cohort.leads, cohort.sessions)}
                      {thin && <span className="ml-1 text-[10px] text-white/20">thin</span>}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      )}
    </Card>
  );
}

export default async function TechStackPage() {
  const data = await getTechStack();

  return (
    <>
      <PageHeader
        title="Tech Stack"
        count={
          data.total === 0
            ? "No sessions yet"
            : `${data.total.toLocaleString("en-IN")} sessions · cohorts under 10 sessions are marked thin`
        }
      />

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Panel title="Devices">
          <Donut data={data.devices.map((d) => ({ label: d.label, value: d.sessions }))} />
        </Panel>
        <Panel title="Browsers">
          <Donut data={data.browsers.map((b) => ({ label: b.label, value: b.sessions }))} />
        </Panel>
        <Panel title="Operating Systems">
          <BarList data={data.operatingSystems.map((o) => ({ label: o.label, value: o.sessions }))} />
        </Panel>
        <Panel title="Languages">
          <BarList data={data.languages} />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Screen Resolution">
          <BarList data={data.screens} />
        </Panel>
        <Panel title="Viewport Width">
          <BarList data={data.viewports} color="#3b82f6" />
        </Panel>
        <Panel title="Connection Quality">
          {data.connections.length === 0 ? (
            <p className="text-sm text-white/30">
              No samples. Only Chromium browsers report the Network Information API — Safari and
              Firefox never will.
            </p>
          ) : (
            <BarList data={data.connections} color="#10b981" />
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <CohortTable title="Performance by Browser" cohorts={data.browsers} />
        <CohortTable title="Performance by OS" cohorts={data.operatingSystems} />
      </div>
    </>
  );
}

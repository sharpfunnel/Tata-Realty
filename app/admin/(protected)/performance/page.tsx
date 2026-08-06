import { prisma } from "../../../lib/prisma";
import { Panel, RatingBar, StatTile } from "../charts";
import { EmptyState, PageHeader } from "../ui";

/**
 * Core Web Vitals, as the visitors actually experienced them.
 *
 * Lab numbers from a developer laptop are not this: every sample here came off
 * a real device on a real connection, rated with Google's own thresholds at
 * capture time.
 */

const METRICS = [
  {
    name: "LCP",
    title: "Largest Contentful Paint",
    blurb: "When the main content finished rendering. Good ≤ 2.5s.",
    unit: "ms",
  },
  {
    name: "INP",
    title: "Interaction to Next Paint",
    blurb: "Worst interaction latency in the visit. Good ≤ 200ms.",
    unit: "ms",
  },
  {
    name: "CLS",
    title: "Cumulative Layout Shift",
    blurb: "How much the page moved under the visitor. Good ≤ 0.1.",
    unit: "",
  },
  {
    name: "FCP",
    title: "First Contentful Paint",
    blurb: "When anything at all appeared. Good ≤ 1.8s.",
    unit: "ms",
  },
  {
    name: "TTFB",
    title: "Time to First Byte",
    blurb: "Server + network before rendering could start. Good ≤ 800ms.",
    unit: "ms",
  },
] as const;

/** The 75th percentile is what Google itself scores a site on. */
function p75(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.75))];
}

function formatValue(name: string, value: number | null): string {
  if (value === null) return "–";
  if (name === "CLS") return value.toFixed(3);
  return value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${Math.round(value)}ms`;
}

async function getPerformance() {
  const [samples, ratings] = await Promise.all([
    // Bounded read: the percentile only needs a representative window, and an
    // unbounded findMany here would grow with every visit forever.
    prisma.performanceMetric.findMany({
      orderBy: { timestamp: "desc" },
      take: 5000,
      select: { name: true, value: true },
    }),
    prisma.performanceMetric.groupBy({
      by: ["name", "rating"],
      _count: { _all: true },
    }),
  ]);

  return METRICS.map((metric) => {
    const values = samples.filter((s) => s.name === metric.name).map((s) => s.value);
    const counts = ratings.filter((r) => r.name === metric.name);
    const count = (rating: string) =>
      counts.find((r) => r.rating === rating)?._count._all ?? 0;

    return {
      ...metric,
      p75: p75(values),
      samples: values.length,
      good: count("good"),
      needsImprovement: count("needs-improvement"),
      poor: count("poor"),
    };
  });
}

export default async function PerformancePage() {
  const metrics = await getPerformance();
  const total = metrics.reduce((sum, metric) => sum + metric.samples, 0);

  return (
    <>
      <PageHeader
        title="Performance"
        count={
          total === 0
            ? "No Web Vitals recorded yet"
            : `${total.toLocaleString("en-IN")} field samples · 75th percentile, as Google scores it`
        }
      />

      {total === 0 ? (
        <EmptyState
          title="No Web Vitals yet"
          hint="tracker.js measures LCP, INP, CLS, FCP and TTFB on every visit and sends them when the tab is closed — the first samples land as soon as real traffic does."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {metrics.map((metric) => (
              <StatTile
                key={metric.name}
                label={metric.name}
                value={formatValue(metric.name, metric.p75)}
                hint={
                  metric.samples === 0
                    ? "No samples"
                    : `p75 of ${metric.samples.toLocaleString("en-IN")}`
                }
              />
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => (
              <Panel key={metric.name} title={metric.title}>
                <p className="mb-3 text-xs text-white/35">{metric.blurb}</p>
                <RatingBar
                  good={metric.good}
                  needsImprovement={metric.needsImprovement}
                  poor={metric.poor}
                />
              </Panel>
            ))}
          </div>
        </>
      )}
    </>
  );
}

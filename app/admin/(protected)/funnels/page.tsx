import { prisma } from "../../../lib/prisma";
import { ConversionFunnel, Panel, StatTile } from "../charts";
import { PageHeader } from "../ui";

/**
 * Where visitors are lost, stage by stage.
 *
 * Every stage counts *sessions*, never events: one visitor rage-clicking a CTA
 * eight times is one session that reached the CTA stage, not eight.
 */

type Traffic = "all" | "meta";

/** Sessions whose attribution says Meta — the only cohort the ads pay for. */
const META_FILTER = {
  OR: [
    { fbclid: { not: null } },
    { metaCampaignId: { not: null } },
    { utmSource: { in: ["meta", "facebook", "instagram", "fb", "ig"] } },
    { source: { in: ["meta", "facebook", "instagram"] } },
  ],
};

async function getFunnel(traffic: Traffic) {
  const sessionWhere = traffic === "meta" ? META_FILTER : {};

  // Each stage is "how many sessions have at least one of X", which is a
  // relation filter on Session rather than a count of the event tables.
  const [sessions, scrolled, ctaClicked, formStarted, leads] = await Promise.all([
    prisma.session.count({ where: sessionWhere }),
    prisma.session.count({ where: { ...sessionWhere, scrollDepth: { gte: 25 } } }),
    prisma.session.count({
      where: { ...sessionWhere, ctaEvents: { some: { type: "click" } } },
    }),
    prisma.session.count({
      where: {
        ...sessionWhere,
        formEvents: { some: { type: { in: ["started", "submitted"] } } },
      },
    }),
    prisma.session.count({ where: { ...sessionWhere, lead: { isNot: null } } }),
  ]);

  return [
    { label: "Page View", value: sessions },
    { label: "Scrolled 25%+", value: scrolled },
    { label: "CTA Click", value: ctaClicked },
    { label: "Form Start", value: formStarted },
    { label: "Lead Submitted", value: leads },
  ];
}

function TrafficToggle({ traffic }: { traffic: Traffic }) {
  const options: { value: Traffic; label: string }[] = [
    { value: "all", label: "All traffic" },
    { value: "meta", label: "Meta ads only" },
  ];

  return (
    <div className="flex gap-1 rounded-lg border border-white/10 p-0.5">
      {options.map((option) => (
        <a
          key={option.value}
          href={`/admin/funnels?traffic=${option.value}`}
          aria-current={traffic === option.value ? "page" : undefined}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
            traffic === option.value
              ? "bg-[#ff7a1a]/12 text-[#ff9d55]"
              : "text-white/45 hover:text-white/80"
          }`}
        >
          {option.label}
        </a>
      ))}
    </div>
  );
}

export default async function FunnelsPage({
  searchParams,
}: {
  searchParams: Promise<{ traffic?: string }>;
}) {
  const { traffic: requested } = await searchParams;
  const traffic: Traffic = requested === "meta" ? "meta" : "all";

  const stages = await getFunnel(traffic);
  const top = stages[0].value;
  const bottom = stages[stages.length - 1].value;

  // The single worst stage transition — the one place a fix pays most.
  let worst: { from: string; to: string; lost: number } | null = null;
  for (let i = 1; i < stages.length; i++) {
    const previous = stages[i - 1];
    if (previous.value === 0) continue;
    const lost = ((previous.value - stages[i].value) / previous.value) * 100;
    if (!worst || lost > worst.lost) {
      worst = { from: previous.label, to: stages[i].label, lost };
    }
  }

  return (
    <>
      <PageHeader
        title="Funnels"
        count={
          traffic === "meta"
            ? "Sessions attributed to Meta ads"
            : "Every session, all sources"
        }
      >
        <TrafficToggle traffic={traffic} />
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Sessions" value={top.toLocaleString("en-IN")} hint="Top of funnel" />
        <StatTile label="Leads" value={bottom.toLocaleString("en-IN")} hint="Bottom of funnel" />
        <StatTile
          label="End-to-end"
          value={top > 0 ? `${((bottom / top) * 100).toFixed(1)}%` : "–"}
          hint="Session → lead"
        />
        <StatTile
          label="Biggest drop"
          value={worst ? `${worst.lost.toFixed(0)}%` : "–"}
          hint={worst ? `${worst.from} → ${worst.to}` : "Not enough data"}
        />
      </div>

      <div className="mt-4">
        <Panel title="Conversion Funnel">
          <ConversionFunnel stages={stages} />
        </Panel>
      </div>
    </>
  );
}

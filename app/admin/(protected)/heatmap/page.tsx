import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { Card, EmptyState, PageHeader } from "../ui";
import HeatmapCanvas from "./heatmap-canvas";

// Guard against pulling an unbounded event set into memory once traffic ramps.
const MAX_POINTS = 5000;

const MODES = [
  { value: "click", label: "Click" },
  { value: "hover", label: "Hover" },
] as const;

type Mode = (typeof MODES)[number]["value"];

function parseMode(value: string | string[] | undefined): Mode {
  return value === "hover" ? "hover" : "click";
}

export default async function HeatmapPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const mode = parseMode((await searchParams).mode);

  const events = await prisma.pageEvent.findMany({
    where: {
      type: mode,
      // Rows without coordinates cannot be plotted.
      xPct: { not: null },
      yPct: { not: null },
    },
    select: { id: true, xPct: true, yPct: true },
    orderBy: { timestamp: "desc" },
    take: MAX_POINTS,
  });

  const points = events.map((event) => ({
    id: event.id,
    x: event.xPct as number,
    y: event.yPct as number,
  }));

  return (
    <>
      <PageHeader
        title="Heatmap"
        count={`${points.length.toLocaleString("en-IN")} ${mode} ${
          points.length === 1 ? "point" : "points"
        }${points.length === MAX_POINTS ? ` (most recent ${MAX_POINTS})` : ""}`}
      >
        {/* Server-rendered toggle — the mode lives in the URL, so a given view
            is shareable and survives refresh. */}
        <div
          role="group"
          aria-label="Heatmap mode"
          className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5"
        >
          {MODES.map((option) => {
            const active = option.value === mode;
            return (
              <Link
                key={option.value}
                href={`/admin/heatmap?mode=${option.value}`}
                scroll={false}
                aria-current={active ? "true" : undefined}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-[#ff7a1a] text-black"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </div>
      </PageHeader>

      <Card>
        {points.length === 0 ? (
          <EmptyState
            title={`No ${mode} events recorded yet`}
            hint="tracker.js reports normalised coordinates for every click and hover pause. They will appear here as soon as the landing page gets traffic."
          />
        ) : (
          <HeatmapCanvas points={points} mode={mode} />
        )}
      </Card>
    </>
  );
}

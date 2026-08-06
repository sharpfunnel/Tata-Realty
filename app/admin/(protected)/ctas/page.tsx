import { prisma } from "../../../lib/prisma";
import { BarList, Panel, StatTile } from "../charts";
import { Card, DASH, EmptyState, PageHeader, TableScroll, Td, Th } from "../ui";

/**
 * Per-CTA performance.
 *
 * A CTA appears here purely because its markup carries `data-cta-id` — adding
 * a button to this table is an attribute, not a code change.
 */

const COLUMNS = ["CTA", "Label", "Viewed", "Hovered", "Clicked", "CTR", "Hover → Click"] as const;

type Row = {
  ctaId: string;
  label: string | null;
  viewed: number;
  hover: number;
  click: number;
};

async function getCtaStats() {
  const [grouped, labels] = await Promise.all([
    prisma.ctaEvent.groupBy({
      by: ["ctaId", "type"],
      _count: { _all: true },
    }),
    // The most recent label wins: a renamed button should read by its current
    // text, not the one it shipped with.
    prisma.ctaEvent.findMany({
      where: { label: { not: null } },
      distinct: ["ctaId"],
      orderBy: { timestamp: "desc" },
      select: { ctaId: true, label: true },
    }),
  ]);

  const labelById = new Map(labels.map((row) => [row.ctaId, row.label]));
  const rows = new Map<string, Row>();

  for (const group of grouped) {
    const row =
      rows.get(group.ctaId) ??
      ({
        ctaId: group.ctaId,
        label: labelById.get(group.ctaId) ?? null,
        viewed: 0,
        hover: 0,
        click: 0,
      } satisfies Row);

    if (group.type === "viewed") row.viewed = group._count._all;
    if (group.type === "hover") row.hover = group._count._all;
    if (group.type === "click") row.click = group._count._all;

    rows.set(group.ctaId, row);
  }

  return [...rows.values()].sort((a, b) => b.click - a.click || b.viewed - a.viewed);
}

function rate(part: number, whole: number): string {
  if (whole === 0) return "–";
  return `${((part / whole) * 100).toFixed(1)}%`;
}

export default async function CtasPage() {
  const rows = await getCtaStats();

  const totals = rows.reduce(
    (sum, row) => ({
      viewed: sum.viewed + row.viewed,
      hover: sum.hover + row.hover,
      click: sum.click + row.click,
    }),
    { viewed: 0, hover: 0, click: 0 },
  );

  return (
    <>
      <PageHeader
        title="CTAs"
        count={
          rows.length === 0
            ? "No CTA activity yet"
            : `${rows.length} tracked call${rows.length === 1 ? "" : "s"} to action`
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Impressions" value={totals.viewed.toLocaleString("en-IN")} hint="Scrolled into view" />
        <StatTile label="Hovers" value={totals.hover.toLocaleString("en-IN")} hint="Pointer devices only" />
        <StatTile label="Clicks" value={totals.click.toLocaleString("en-IN")} hint="All CTAs" />
        <StatTile label="Overall CTR" value={rate(totals.click, totals.viewed)} hint="Clicks ÷ impressions" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          {rows.length === 0 ? (
            <EmptyState
              title="No CTA events yet"
              hint="Add data-cta-id to a button or link on the landing page and it starts appearing here — no other code needed."
            />
          ) : (
            <TableScroll>
              <table className="w-full border-collapse text-sm">
                <thead className="border-b border-white/[0.07] bg-white/[0.02]">
                  <tr>
                    {COLUMNS.map((column, i) => (
                      <Th key={column} align={i > 1 ? "right" : "left"}>
                        {column}
                      </Th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {rows.map((row) => (
                    <tr key={row.ctaId} className="transition-colors hover:bg-white/[0.02]">
                      <Td className="font-medium text-white/80">{row.ctaId}</Td>
                      <Td className="max-w-[16rem] truncate text-white/45">
                        {row.label ?? DASH}
                      </Td>
                      <Td className="text-right tabular-nums">
                        {row.viewed.toLocaleString("en-IN")}
                      </Td>
                      <Td className="text-right tabular-nums">
                        {row.hover.toLocaleString("en-IN")}
                      </Td>
                      <Td className="text-right tabular-nums text-white/90">
                        {row.click.toLocaleString("en-IN")}
                      </Td>
                      <Td className="text-right tabular-nums">{rate(row.click, row.viewed)}</Td>
                      {/* Of the people who reached for it, how many committed. */}
                      <Td className="text-right tabular-nums text-white/45">
                        {rate(row.click, row.hover)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </Card>

        <Panel title="Most Clicked">
          <BarList
            data={rows.slice(0, 8).map((row) => ({ label: row.ctaId, value: row.click }))}
            unit=" clicks"
          />
        </Panel>
      </div>
    </>
  );
}

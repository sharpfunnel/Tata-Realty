import { prisma } from "../../../lib/prisma";
import { ConversionFunnel, Panel, StatTile } from "../charts";
import { Card, EmptyState, PageHeader, TableScroll, Td, Th } from "../ui";

/**
 * Per-form completion and abandonment, keyed by `data-form-id`.
 *
 * Counts are of *sessions*, not events: a visitor who focuses three fields
 * started one form, and one who reloads and tries again is still one person
 * who could not finish.
 */

const COLUMNS = [
  "Form",
  "Viewed",
  "Started",
  "Submitted",
  "Abandoned",
  "Errors",
  "Start Rate",
  "Completion",
] as const;

type Row = {
  formId: string;
  viewed: number;
  started: number;
  submitted: number;
  abandoned: number;
  validationErrors: number;
};

async function getFormStats() {
  // Distinct sessions per (formId, type) — hence a findMany + fold rather than
  // a groupBy, which cannot count distinct sessions per group in one pass.
  const rows = await prisma.formEvent.findMany({
    distinct: ["formId", "type", "sessionId"],
    // Every field named in `distinct` is selected too — Prisma applies the
    // de-duplication over the selected columns.
    select: { formId: true, type: true, sessionId: true },
  });

  const byForm = new Map<string, Row>();

  for (const row of rows) {
    const entry =
      byForm.get(row.formId) ??
      ({
        formId: row.formId,
        viewed: 0,
        started: 0,
        submitted: 0,
        abandoned: 0,
        validationErrors: 0,
      } satisfies Row);

    if (row.type === "viewed") entry.viewed++;
    else if (row.type === "started") entry.started++;
    else if (row.type === "submitted") entry.submitted++;
    else if (row.type === "abandoned") entry.abandoned++;
    else if (row.type === "validation_error") entry.validationErrors++;

    byForm.set(row.formId, entry);
  }

  // The fields people actually stumble on, across every form.
  const problemFields = await prisma.formEvent.groupBy({
    by: ["field"],
    where: { type: "validation_error", field: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { field: "desc" } },
    take: 8,
  });

  return {
    rows: [...byForm.values()].sort((a, b) => b.viewed - a.viewed),
    problemFields: problemFields.map((field) => ({
      label: field.field ?? "unknown",
      value: field._count._all,
    })),
  };
}

function rate(part: number, whole: number): string {
  if (whole === 0) return "–";
  return `${((part / whole) * 100).toFixed(1)}%`;
}

export default async function FormsPage() {
  const { rows, problemFields } = await getFormStats();

  const totals = rows.reduce(
    (sum, row) => ({
      viewed: sum.viewed + row.viewed,
      started: sum.started + row.started,
      submitted: sum.submitted + row.submitted,
      abandoned: sum.abandoned + row.abandoned,
    }),
    { viewed: 0, started: 0, submitted: 0, abandoned: 0 },
  );

  return (
    <>
      <PageHeader
        title="Forms"
        count={
          rows.length === 0
            ? "No form activity yet"
            : `${rows.length} tracked form${rows.length === 1 ? "" : "s"} · sessions, not events`
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Seen" value={totals.viewed.toLocaleString("en-IN")} hint="Scrolled into view" />
        <StatTile label="Started" value={totals.started.toLocaleString("en-IN")} hint="First field focused" />
        <StatTile label="Submitted" value={totals.submitted.toLocaleString("en-IN")} hint="Reached submit" />
        <StatTile
          label="Abandoned"
          value={totals.abandoned.toLocaleString("en-IN")}
          hint="Started, then left"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          {rows.length === 0 ? (
            <EmptyState
              title="No form events yet"
              hint="Add data-form-id to a <form> and its whole lifecycle — seen, started, per-field, abandoned, submitted — appears here."
            />
          ) : (
            <TableScroll>
              <table className="w-full border-collapse text-sm">
                <thead className="border-b border-white/[0.07] bg-white/[0.02]">
                  <tr>
                    {COLUMNS.map((column, i) => (
                      <Th key={column} align={i > 0 ? "right" : "left"}>
                        {column}
                      </Th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {rows.map((row) => (
                    <tr key={row.formId} className="transition-colors hover:bg-white/[0.02]">
                      <Td className="font-medium text-white/80">{row.formId}</Td>
                      <Td className="text-right tabular-nums">
                        {row.viewed.toLocaleString("en-IN")}
                      </Td>
                      <Td className="text-right tabular-nums">
                        {row.started.toLocaleString("en-IN")}
                      </Td>
                      <Td className="text-right tabular-nums text-white/90">
                        {row.submitted.toLocaleString("en-IN")}
                      </Td>
                      <Td className="text-right tabular-nums text-amber-300/80">
                        {row.abandoned.toLocaleString("en-IN")}
                      </Td>
                      <Td className="text-right tabular-nums text-red-300/80">
                        {row.validationErrors.toLocaleString("en-IN")}
                      </Td>
                      <Td className="text-right tabular-nums">{rate(row.started, row.viewed)}</Td>
                      <Td className="text-right tabular-nums">
                        {rate(row.submitted, row.started)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </Card>

        <div className="grid gap-4">
          <Panel title="Overall Form Funnel">
            <ConversionFunnel
              stages={[
                { label: "Seen", value: totals.viewed },
                { label: "Started", value: totals.started },
                { label: "Submitted", value: totals.submitted },
              ]}
            />
          </Panel>
          <Panel title="Fields That Fail Validation">
            {problemFields.length === 0 ? (
              <p className="text-sm text-white/30">No validation errors recorded.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {problemFields.map((field) => (
                  <li key={field.label} className="flex items-center justify-between gap-3">
                    <span className="truncate text-white/70">{field.label}</span>
                    <span className="shrink-0 tabular-nums text-white/45">
                      {field.value.toLocaleString("en-IN")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

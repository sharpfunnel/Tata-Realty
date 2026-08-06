import { formatDateTime, relativeTime } from "../../../lib/format";
import { prisma } from "../../../lib/prisma";
import { StatTile } from "../charts";
import { Badge, Card, DASH, EmptyState, PageHeader, TableScroll, Td, Th } from "../ui";

/**
 * Client-side failures, as visitors hit them.
 *
 * The point of this page is the things that never reach a server log: a
 * script that throws only on Safari, an image that 404s on mobile.
 */

const COLUMNS = ["When", "Kind", "Message", "Source", "Page", "Visitor"] as const;

const KIND_TONE = {
  js: "red",
  promise: "orange",
  resource: "blue",
} as const;

const KIND_LABEL = {
  js: "JS error",
  promise: "Promise",
  resource: "Asset",
} as const;

async function getErrors() {
  const [recent, byKind, distinctMessages] = await Promise.all([
    prisma.errorEvent.findMany({
      take: 100,
      orderBy: { timestamp: "desc" },
      select: {
        id: true,
        kind: true,
        message: true,
        source: true,
        line: true,
        path: true,
        timestamp: true,
        session: { select: { visitorNumber: true, browser: true } },
      },
    }),
    prisma.errorEvent.groupBy({ by: ["kind"], _count: { _all: true } }),
    prisma.errorEvent.findMany({ distinct: ["message"], select: { message: true } }),
  ]);

  return {
    recent,
    total: byKind.reduce((sum, kind) => sum + kind._count._all, 0),
    distinct: distinctMessages.length,
    counts: Object.fromEntries(byKind.map((kind) => [kind.kind, kind._count._all])) as Record<
      string,
      number | undefined
    >,
  };
}

export default async function ErrorsPage() {
  const { recent, total, distinct, counts } = await getErrors();
  const now = new Date();

  return (
    <>
      <PageHeader
        title="Errors"
        count={
          total === 0
            ? "No client-side errors recorded"
            : `${total.toLocaleString("en-IN")} recorded · showing the ${recent.length} most recent`
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Total" value={total.toLocaleString("en-IN")} hint="All time" />
        <StatTile label="Distinct" value={distinct.toLocaleString("en-IN")} hint="Unique messages" />
        <StatTile
          label="JS errors"
          value={(counts.js ?? 0).toLocaleString("en-IN")}
          hint="Thrown exceptions"
        />
        <StatTile
          label="Failed assets"
          value={(counts.resource ?? 0).toLocaleString("en-IN")}
          hint="Images, scripts, styles"
        />
      </div>

      <div className="mt-4">
        <Card>
          {recent.length === 0 ? (
            <EmptyState
              title="No errors recorded"
              hint="tracker.js reports thrown exceptions, unhandled promise rejections and failed asset loads. An empty table here is good news."
            />
          ) : (
            <TableScroll>
              <table className="w-full border-collapse text-sm">
                <thead className="border-b border-white/[0.07] bg-white/[0.02]">
                  <tr>
                    {COLUMNS.map((column) => (
                      <Th key={column}>{column}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {recent.map((error) => (
                    <tr key={error.id} className="transition-colors hover:bg-white/[0.02]">
                      <Td className="text-white/50">
                        <time
                          dateTime={error.timestamp.toISOString()}
                          title={formatDateTime(error.timestamp)}
                        >
                          {relativeTime(error.timestamp, now)}
                        </time>
                      </Td>
                      <Td>
                        <Badge tone={KIND_TONE[error.kind as keyof typeof KIND_TONE] ?? "neutral"}>
                          {KIND_LABEL[error.kind as keyof typeof KIND_LABEL] ?? error.kind}
                        </Badge>
                      </Td>
                      {/* The message is the one column worth wrapping for. */}
                      <Td className="max-w-[26rem] !whitespace-normal text-white/80">
                        {error.message}
                      </Td>
                      <Td className="max-w-[18rem] truncate text-white/40" >
                        {error.source ? (
                          <span title={error.source}>
                            {error.source.split("/").pop()}
                            {error.line ? `:${error.line}` : ""}
                          </span>
                        ) : (
                          DASH
                        )}
                      </Td>
                      <Td className="text-white/50">{error.path ?? DASH}</Td>
                      <Td className="text-white/50">
                        {error.session?.visitorNumber ? (
                          <>
                            #{error.session.visitorNumber}
                            {error.session.browser && (
                              <span className="ml-1.5 text-white/25">
                                {error.session.browser}
                              </span>
                            )}
                          </>
                        ) : (
                          DASH
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </Card>
      </div>
    </>
  );
}

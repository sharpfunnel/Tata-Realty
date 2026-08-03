import { formatDateTime, formatDuration, relativeTime } from "../../../lib/format";
import { prisma } from "../../../lib/prisma";
import { isPrivateIp } from "../../../lib/request";
import {
  Badge,
  Card,
  DASH,
  EmptyState,
  PageHeader,
  TableScroll,
  Td,
  Th,
} from "../ui";

const COLUMNS = [
  "Time",
  "User (ID)",
  "Device",
  "New/Returning",
  "IP",
  "Location",
  "Source",
  "Medium",
  "Campaign",
  "Duration",
  "Bounce",
  "Scroll Depth",
  "Form Filled",
  "Replay",
] as const;

export default async function SessionsPage() {
  const sessions = await prisma.session.findMany({
    take: 100,
    orderBy: { arrivedAt: "desc" },
    include: { lead: true, _count: { select: { replayChunks: true } } },
  });

  // One `now` for the whole render so every relative timestamp agrees.
  const now = new Date();

  return (
    <>
      <PageHeader
        title="Sessions"
        count={
          sessions.length === 0
            ? "No sessions yet"
            : `Showing the ${sessions.length} most recent ${
                sessions.length === 1 ? "session" : "sessions"
              }`
        }
      />

      <Card>
        {sessions.length === 0 ? (
          <EmptyState
            title="No sessions recorded yet"
            hint="Once tracker.js is live on the landing page, every visit appears here within seconds."
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
                {sessions.map((session) => {
                  const duration = formatDuration(session.durationSec);
                  // A linked Lead is proof of submission even if the
                  // formFilled beacon never landed.
                  const formFilled = session.formFilled || session.lead !== null;
                  const isMobile = session.device === "mobile";

                  return (
                    <tr
                      key={session.id}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      <Td className="text-white/50">
                        <time
                          dateTime={session.arrivedAt.toISOString()}
                          title={formatDateTime(session.arrivedAt)}
                        >
                          {relativeTime(session.arrivedAt, now)}
                        </time>
                      </Td>

                      <Td className="font-medium text-white">
                        #{session.visitorNumber}
                      </Td>

                      <Td>
                        <Badge tone={isMobile ? "orange" : "blue"}>
                          {isMobile ? "Mobile" : "Desktop"}
                        </Badge>
                      </Td>

                      <Td>
                        <Badge tone={session.isReturning ? "neutral" : "green"}>
                          {session.isReturning ? "Returning" : "New"}
                        </Badge>
                      </Td>

                      <Td className="font-mono text-xs text-white/50">
                        {session.ip || DASH}
                      </Td>

                      {/* Loopback/private IPs have no geo — show "Local" so a
                          local test reads as such, not as a tracking failure. */}
                      <Td>
                        {session.location ??
                          (session.ip && isPrivateIp(session.ip) ? "Local" : DASH)}
                      </Td>
                      {/* No UTM/referrer/click-id means the visit was direct. */}
                      <Td>{session.source || "Direct"}</Td>
                      <Td>{session.medium || (session.source ? DASH : "None")}</Td>
                      <Td>{session.campaign || DASH}</Td>

                      <Td className="font-mono text-xs">{duration ?? DASH}</Td>

                      <Td
                        className={
                          session.bounced ? "text-red-300/80" : "text-white/70"
                        }
                      >
                        {session.bounced ? "Yes" : "No"}
                      </Td>

                      <Td>
                        <div className="flex items-center gap-2">
                          {/* Inline bar makes depth scannable down the column. */}
                          <span className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-white/[0.08]">
                            <span
                              className="block h-full rounded-full bg-[#ff7a1a]/70"
                              style={{
                                width: `${Math.min(100, Math.max(0, session.scrollDepth))}%`,
                              }}
                            />
                          </span>
                          <span className="tabular-nums">
                            {session.scrollDepth}%
                          </span>
                        </div>
                      </Td>

                      <Td
                        className={
                          formFilled
                            ? "font-medium text-emerald-300"
                            : "text-white/40"
                        }
                      >
                        {formFilled ? "Yes" : "No"}
                      </Td>

                      <Td>
                        {session._count.replayChunks > 0 ? (
                          <a
                            href={`/admin/sessions/${session.id}/replay`}
                            className="text-[#ff9d55] transition hover:text-[#ff7a1a] hover:underline"
                          >
                            ⊙ Watch
                          </a>
                        ) : (
                          DASH
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
        )}
      </Card>
    </>
  );
}

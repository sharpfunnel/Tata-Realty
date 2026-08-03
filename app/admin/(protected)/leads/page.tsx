import { formatDateTime, relativeTime } from "../../../lib/format";
import { prisma } from "../../../lib/prisma";
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

type LeadSession = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  placement: string | null;
  rawParams: unknown;
};

/** Full landing-URL params as tooltip text, so odd traffic is inspectable. */
function rawParamsTitle(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;

  const entries = Object.entries(raw as Record<string, unknown>);
  if (entries.length === 0) return undefined;

  return entries.map(([key, value]) => `${key}=${String(value)}`).join("\n");
}

function Attribution({ session }: { session: LeadSession | null }) {
  // No session means the lead was submitted without tracking (blocked script,
  // Do Not Track). Better to say so than to imply direct traffic.
  if (!session) return <span className="text-white/25">Unknown</span>;

  const { source, medium, campaign, utmContent, utmTerm, placement } = session;

  if (!source) return <span className="text-white/45">Direct</span>;

  return (
    <div className="text-xs leading-relaxed" title={rawParamsTitle(session.rawParams)}>
      <div className="text-white/70">
        {source}
        {medium && <span className="text-white/40">/{medium}</span>}
        {campaign && <span className="text-white/70"> · {campaign}</span>}
      </div>
      {(utmContent || utmTerm || placement) && (
        <div className="text-white/40">
          {utmContent && `ad: ${utmContent}`}
          {utmContent && utmTerm && " · "}
          {utmTerm && `adset: ${utmTerm}`}
          {(utmContent || utmTerm) && placement && " · "}
          {placement}
        </div>
      )}
    </div>
  );
}

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { submittedAt: "desc" },
    include: {
      session: {
        select: {
          // Links each lead back to its session row.
          visitorNumber: true,
          // Attribution: which ad or campaign actually produced this enquiry.
          source: true,
          medium: true,
          campaign: true,
          utmContent: true,
          utmTerm: true,
          placement: true,
          rawParams: true,
        },
      },
    },
  });

  const now = new Date();

  return (
    <>
      <PageHeader
        title="Leads"
        count={
          leads.length === 0
            ? "No leads yet"
            : `${leads.length} ${leads.length === 1 ? "submission" : "submissions"}`
        }
      />

      <Card>
        {leads.length === 0 ? (
          <EmptyState
            title="No leads captured yet"
            hint="Every Enquire Now submission on the landing page lands here."
          />
        ) : (
          <TableScroll>
            <table className="w-full border-collapse text-sm">
              <thead className="border-b border-white/[0.07] bg-white/[0.02]">
                <tr>
                  <Th>Name</Th>
                  <Th>Phone</Th>
                  <Th>Email</Th>
                  <Th>Budget Range</Th>
                  <Th>Configuration</Th>
                  <Th>Attribution</Th>
                  <Th>Submitted At</Th>
                  <Th>Session</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    <Td className="font-medium text-white">{lead.name}</Td>

                    <Td>
                      {/* Tap-to-call: the sales team works this list on mobile. */}
                      <a
                        href={`tel:${lead.phone}`}
                        className="font-mono text-xs text-[#ff9d55] transition hover:text-[#ff7a1a] hover:underline"
                      >
                        {lead.phone}
                      </a>
                    </Td>

                    <Td>
                      {lead.email ? (
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-white/70 transition hover:text-white hover:underline"
                        >
                          {lead.email}
                        </a>
                      ) : (
                        DASH
                      )}
                    </Td>

                    <Td>{lead.budgetRange || DASH}</Td>

                    <Td>
                      {lead.configuration ? (
                        <Badge tone="orange">{lead.configuration}</Badge>
                      ) : (
                        DASH
                      )}
                    </Td>

                    {/* Which ad produced this enquiry — the number the client
                        actually asks about. */}
                    <Td>
                      <Attribution session={lead.session} />
                    </Td>

                    <Td className="text-white/50">
                      <time
                        dateTime={lead.submittedAt.toISOString()}
                        title={relativeTime(lead.submittedAt, now)}
                      >
                        {formatDateTime(lead.submittedAt)}
                      </time>
                    </Td>

                    <Td>
                      {lead.session ? (
                        <span className="font-medium text-white/70">
                          #{lead.session.visitorNumber}
                        </span>
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
    </>
  );
}

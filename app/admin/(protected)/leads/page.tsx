import { formatDateTime, relativeTime } from "../../../lib/format";
import { LEAD_STATUSES, statusOf, type LeadStatus } from "../../../lib/leads";
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
import SendCapiModal from "./send-capi-modal";
import StatusSelect from "./status-select";

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

/**
 * Reflects whichever send fired most recently — the automatic one on lead
 * creation or a manual one from the Send button.
 */
function CapiStatus({
  sentAt,
  error,
  eventName,
}: {
  sentAt: Date | null;
  error: string | null;
  eventName: string | null;
}) {
  if (error) {
    return (
      <span title={error}>
        <Badge tone="red">Failed</Badge>
      </span>
    );
  }

  if (sentAt) {
    return (
      <span title={`${eventName ?? "Event"} · ${formatDateTime(sentAt)}`}>
        <Badge tone="green">Sent</Badge>
      </span>
    );
  }

  return <span className="text-xs text-white/25">Not sent</span>;
}

/** Pipeline filter tabs, each carrying its own count. */
function StatusTabs({
  active,
  counts,
  total,
}: {
  active: LeadStatus | null;
  counts: Record<string, number | undefined>;
  total: number;
}) {
  const tabs = [
    { value: null, label: "All", count: total },
    ...LEAD_STATUSES.map((status) => ({
      value: status.value as LeadStatus | null,
      label: status.label,
      count: counts[status.value] ?? 0,
    })),
  ];

  return (
    <div className="flex flex-wrap gap-1">
      {tabs.map((tab) => {
        const selected = active === tab.value;
        return (
          <a
            key={tab.label}
            href={tab.value ? `/admin/leads?status=${tab.value}` : "/admin/leads"}
            aria-current={selected ? "page" : undefined}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              selected
                ? "bg-[#ff7a1a]/12 text-[#ff9d55]"
                : "text-white/45 hover:bg-white/[0.04] hover:text-white/80"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-white/25">{tab.count}</span>
          </a>
        );
      })}
    </div>
  );
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: requested } = await searchParams;
  const active = LEAD_STATUSES.some((status) => status.value === requested)
    ? (requested as LeadStatus)
    : null;

  const [leads, grouped, total] = await Promise.all([
    prisma.lead.findMany({
      where: active ? { status: active } : {},
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
            // Context for the Meta CAPI modal.
            location: true,
            metaAdId: true,
          },
        },
      },
    }),
    prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.lead.count(),
  ]);

  // Rows written before the status column existed group under whatever is in
  // the database; statusOf folds those into "new" so the tabs still add up.
  const counts: Record<string, number> = {};
  for (const group of grouped) {
    const key = statusOf(group.status);
    counts[key] = (counts[key] ?? 0) + group._count._all;
  }

  const now = new Date();

  return (
    <>
      <PageHeader
        title="Leads"
        count={
          total === 0
            ? "No leads yet"
            : active
              ? `${leads.length} of ${total} ${total === 1 ? "submission" : "submissions"}`
              : `${total} ${total === 1 ? "submission" : "submissions"}`
        }
      >
        <StatusTabs active={active} counts={counts} total={total} />
      </PageHeader>

      <Card>
        {leads.length === 0 ? (
          <EmptyState
            title={active ? `No leads marked ${active}` : "No leads captured yet"}
            hint={
              active
                ? "Move a lead into this stage from the Status column, or switch back to All."
                : "Every Enquire Now submission on the landing page lands here."
            }
          />
        ) : (
          <TableScroll>
            <table className="w-full border-collapse text-sm">
              <thead className="border-b border-white/[0.07] bg-white/[0.02]">
                <tr>
                  <Th>Status</Th>
                  <Th>Name</Th>
                  <Th>Phone</Th>
                  <Th>Email</Th>
                  <Th>Budget Range</Th>
                  <Th>Configuration</Th>
                  <Th>Message</Th>
                  <Th>Attribution</Th>
                  <Th>Submitted At</Th>
                  <Th>Session</Th>
                  <Th>Meta CAPI</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    <Td>
                      <StatusSelect leadId={lead.id} status={lead.status} />
                      {lead.statusAt && (
                        <span
                          className="mt-1 block text-[10px] text-white/25"
                          title={formatDateTime(lead.statusAt)}
                        >
                          {relativeTime(lead.statusAt, now)}
                        </span>
                      )}
                    </Td>

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

                    {/* Only ever filled in on the thank-you page. Truncated —
                        the full text is in the tooltip. */}
                    <Td className="max-w-[14rem] truncate whitespace-normal">
                      {lead.message ? (
                        <span title={lead.message} className="cursor-help text-xs">
                          {lead.message.length > 60
                            ? `${lead.message.slice(0, 60)}…`
                            : lead.message}
                        </span>
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

                    <Td>
                      <div className="flex items-center gap-2">
                        <CapiStatus
                          sentAt={lead.metaCapiSentAt}
                          error={lead.metaCapiError}
                          eventName={lead.metaCapiEventName}
                        />
                        <SendCapiModal
                          lead={{
                            id: lead.id,
                            name: lead.name,
                            phone: lead.phone,
                            email: lead.email,
                            visitorNumber: lead.session?.visitorNumber ?? null,
                            location: lead.session?.location ?? null,
                            metaAdId: lead.session?.metaAdId ?? null,
                            placement: lead.session?.placement ?? null,
                          }}
                        />
                      </div>
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

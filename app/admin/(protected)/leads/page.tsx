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

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { submittedAt: "desc" },
    // Pull the visitor number so each lead links back to its session row.
    include: { session: { select: { visitorNumber: true } } },
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

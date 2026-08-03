import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateTime } from "../../../../../lib/format";
import { prisma } from "../../../../../lib/prisma";
import { Card, PageHeader } from "../../../ui";
import ReplayPlayer from "./replay-player";

type RrwebEvent = { type: number; timestamp: number };

export default async function ReplayPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const session = await prisma.session.findUnique({
    where: { id },
    select: {
      visitorNumber: true,
      arrivedAt: true,
      device: true,
      location: true,
      replayChunks: {
        orderBy: { seq: "asc" },
        select: { events: true },
      },
    },
  });

  if (!session) notFound();

  // Flatten the batches back into one ordered event stream for the player.
  const events = session.replayChunks.flatMap(
    (chunk) => chunk.events as unknown as RrwebEvent[],
  );

  return (
    <>
      <PageHeader
        title={`Session #${session.visitorNumber} replay`}
        count={`${session.device} · ${session.location ?? "Unknown location"} · ${formatDateTime(
          session.arrivedAt,
        )} · ${events.length} events`}
      />

      <div className="mb-4">
        <Link
          href="/admin/sessions"
          className="text-sm text-white/50 transition hover:text-white/80"
        >
          ← Back to sessions
        </Link>
      </div>

      <Card>
        <div className="p-4 sm:p-6">
          <ReplayPlayer events={events} />
        </div>
      </Card>
    </>
  );
}

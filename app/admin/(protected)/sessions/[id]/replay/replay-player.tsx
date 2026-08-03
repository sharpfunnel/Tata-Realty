"use client";

import { useEffect, useRef } from "react";
import "rrweb-player/dist/style.css";

type RrwebEvent = { type: number; timestamp: number };

/**
 * Mounts rrweb-player and plays back a visitor's recorded events. The player is
 * a DOM-constructing class, so it is imported dynamically and built inside an
 * effect — it must never run during SSR.
 */
export default function ReplayPlayer({ events }: { events: RrwebEvent[] }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = container.current;
    if (!target || events.length < 2) return;

    let cancelled = false;

    void import("rrweb-player").then(({ default: RrwebPlayer }) => {
      if (cancelled || !target) return;
      target.innerHTML = "";
      // Fit the player to the available width; height follows the recording.
      const width = Math.min(target.clientWidth || 960, 1200);
      // Constructed for its side effect of rendering into `target`; the
      // instance is torn down by clearing the container on cleanup.
      new RrwebPlayer({
        target,
        props: {
          events: events as never,
          width,
          height: Math.round((width * 9) / 16),
          autoPlay: false,
          showController: true,
        },
      });
    });

    return () => {
      cancelled = true;
      if (target) target.innerHTML = "";
    };
  }, [events]);

  if (events.length < 2) {
    return (
      <p className="text-sm text-white/50">
        This recording is too short to replay — the visitor left before enough
        of the session was captured.
      </p>
    );
  }

  return <div ref={container} className="overflow-hidden rounded-xl" />;
}

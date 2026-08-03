"use client";

import { useEffect } from "react";

/**
 * Full-page session recording via rrweb. Captures the DOM and every mutation,
 * scroll, click and input so the admin can replay a visit like a video.
 *
 * Runs as a module-level singleton, started exactly once per page load. This is
 * deliberate: React Strict Mode mounts effects twice in dev, and letting rrweb
 * start/stop/restart across those mounts makes the second record() resume
 * WITHOUT re-emitting the initial DOM snapshot — leaving an unplayable, blank
 * recording. Initialising once, tracker-style, avoids that entirely.
 *
 * Ordering matters: rrweb's first events (Meta + FullSnapshot) are the initial
 * DOM. We resolve the tracker's clientId first, then start recording, so the
 * snapshot is always linked to a session and flushed promptly. rrweb is
 * imported dynamically, keeping it out of the hero's first paint.
 */

const SESSION_KEY = "tr_session_id";
const ENDPOINT = "/api/replay";
const FLUSH_MS = 4000;
const MAX_BUFFER = 200;

type RrwebEvent = { type: number; timestamp: number };

let started = false;

function initRecorder() {
  if (started) return;
  if (typeof window === "undefined") return;
  const legacyDnt = (window as unknown as { doNotTrack?: string }).doNotTrack;
  if (navigator.doNotTrack === "1" || legacyDnt === "1") return;
  started = true;

  let buffer: RrwebEvent[] = [];
  let seq = 0;
  let clientId = "";

  function readClientId(): string | null {
    try {
      return window.sessionStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  }

  function flush(useBeacon = false) {
    if (buffer.length === 0 || !clientId) return;
    const batch = buffer;
    buffer = [];
    const body = JSON.stringify({ clientId, seq, events: batch });
    seq += 1;

    // On unload only, use sendBeacon for the (small) tail of the session. Both
    // sendBeacon and `keepalive: true` cap the body at 64KB — far smaller than
    // the initial DOM snapshot — so periodic flushes must use a plain fetch,
    // or the snapshot batch is silently dropped and the replay plays blank.
    if (useBeacon && navigator.sendBeacon) {
      try {
        const blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon(ENDPOINT, blob)) return;
      } catch {
        /* fall through to fetch */
      }
    }
    try {
      void fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        // No keepalive: the snapshot batch routinely exceeds the 64KB keepalive
        // ceiling. Periodic flushes are not unload-time, so they don't need it.
        keepalive: useBeacon,
      }).catch(() => {});
    } catch {
      /* recording must never break the page */
    }
  }

  function start() {
    void import("rrweb").then((rrweb) => {
      rrweb.record({
        emit(event: RrwebEvent) {
          buffer.push(event);
          if (buffer.length >= MAX_BUFFER) flush();
        },
        sampling: { mousemove: 50, scroll: 150 },
        maskInputOptions: { password: true },
      });
      // Push the initial snapshot out quickly, then keep a steady cadence.
      setTimeout(() => flush(), 800);
      setInterval(() => flush(), FLUSH_MS);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush(true);
    });
    window.addEventListener("pagehide", () => flush(true));
  }

  // Wait for the tracker to establish the session id, then record — so the
  // snapshot is never buffered without a session to attach it to.
  const existing = readClientId();
  if (existing) {
    clientId = existing;
    start();
    return;
  }
  let waited = 0;
  const idPoll = setInterval(() => {
    const id = readClientId();
    if (id) {
      clientId = id;
      clearInterval(idPoll);
      start();
    } else if ((waited += 200) >= 8000) {
      clearInterval(idPoll); // tracker never ran (blocked/DNT)
    }
  }, 200);
}

export default function SessionRecorder() {
  useEffect(() => {
    initRecorder();
  }, []);
  return null;
}

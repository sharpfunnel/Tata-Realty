/**
 * Tata Realty landing page tracker.
 *
 * Records the session, scroll depth, clicks and hover pauses, and posts them to
 * /api/track. IP, location, duration and bounce are all derived server-side —
 * this file never sends them.
 *
 * Coordinates are normalised against the full document (0-1) so the admin
 * heatmap can render them at any width.
 */
(function () {
  "use strict";

  if (typeof window === "undefined") return;

  // Respect Do Not Track and the admin panel itself.
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return;
  if (location.pathname.indexOf("/admin") === 0) return;

  var ENDPOINT = "/api/track";
  var VISITOR_KEY = "tr_visitor_id";
  var SESSION_KEY = "tr_session_id";
  var FLUSH_MS = 5000;
  var HEARTBEAT_MS = 15000;
  var MAX_BATCH = 50;
  // A hover only counts once the pointer settles — otherwise every mouse
  // sweep across the page would flood the heatmap.
  var HOVER_DWELL_MS = 450;

  function makeId() {
    if (window.crypto && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, "");
    }
    return (
      Date.now().toString(36) + Math.random().toString(36).slice(2, 12)
    ).slice(0, 32);
  }

  function safeStorage(storage) {
    // Safari private mode and cookie-blocking extensions throw on access.
    try {
      var probe = "__tr__";
      storage.setItem(probe, "1");
      storage.removeItem(probe);
      return storage;
    } catch {
      return null;
    }
  }

  var local = safeStorage(window.localStorage);
  var tab = safeStorage(window.sessionStorage);

  // A returning visitor is one who already had a visitor id before this load.
  var visitorId = local && local.getItem(VISITOR_KEY);
  var isReturning = Boolean(visitorId);
  if (!visitorId) {
    visitorId = makeId();
    if (local) local.setItem(VISITOR_KEY, visitorId);
  }

  var clientId = tab && tab.getItem(SESSION_KEY);
  if (!clientId) {
    clientId = makeId();
    if (tab) tab.setItem(SESSION_KEY, clientId);
  }

  // Expose the session id so the lead form can link the submission to it.
  window.__trSessionId = clientId;

  function send(payload, useBeacon) {
    var body = JSON.stringify(payload);

    // sendBeacon survives page unload; fetch does not.
    if (useBeacon && navigator.sendBeacon) {
      try {
        var blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon(ENDPOINT, blob)) return;
      } catch {
        /* fall through to fetch */
      }
    }

    try {
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
        keepalive: true,
      }).catch(function () {});
    } catch {
      /* tracking must never break the page */
    }
  }

  /* ---------- session start ---------- */

  var params = new URLSearchParams(location.search);

  function attribution() {
    var source = params.get("utm_source");
    var medium = params.get("utm_medium");
    var campaign = params.get("utm_campaign");

    // Fall back to the referrer host when there are no UTM tags.
    if (!source && document.referrer) {
      try {
        var refHost = new URL(document.referrer).hostname;
        if (refHost && refHost !== location.hostname) {
          source = refHost.replace(/^www\./, "");
          medium = medium || "referral";
        }
      } catch {
        /* malformed referrer */
      }
    }

    // Meta and Google click ids imply paid traffic even without utm tags.
    if (!source && (params.get("fbclid") || params.get("gclid"))) {
      source = params.get("gclid") ? "google" : "facebook";
      medium = medium || "cpc";
    }

    return { source: source, medium: medium, campaign: campaign };
  }

  function isMobile() {
    if (navigator.userAgentData && typeof navigator.userAgentData.mobile === "boolean") {
      return navigator.userAgentData.mobile;
    }
    return window.matchMedia("(max-width: 767px)").matches ||
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }

  var attr = attribution();
  var sessionPayload = {
    kind: "session",
    clientId: clientId,
    visitorId: visitorId,
    isReturning: isReturning,
    device: isMobile() ? "mobile" : "desktop",
    path: location.pathname,
  };
  if (attr.source) sessionPayload.source = attr.source;
  if (attr.medium) sessionPayload.medium = attr.medium;
  if (attr.campaign) sessionPayload.campaign = attr.campaign;

  send(sessionPayload, false);

  /* ---------- event batching ---------- */

  var queue = [];
  var flushTimer = null;

  function pageHeight() {
    return Math.max(
      document.body ? document.body.scrollHeight : 0,
      document.documentElement.scrollHeight,
      1
    );
  }

  function push(type, event) {
    var item = { type: type, path: location.pathname };

    if (event) {
      var width = Math.max(document.documentElement.clientWidth, 1);
      var height = pageHeight();
      // pageX/pageY include the scroll offset, so the point is anchored to the
      // document rather than the viewport.
      var x = (event.pageX != null ? event.pageX : event.clientX) / width;
      var y =
        (event.pageY != null ? event.pageY : event.clientY + window.scrollY) /
        height;

      item.xPct = Math.min(1, Math.max(0, x));
      item.yPct = Math.min(1, Math.max(0, y));
    }

    queue.push(item);
    if (queue.length >= MAX_BATCH) return flush(false);
    if (!flushTimer) flushTimer = setTimeout(function () { flush(false); }, FLUSH_MS);
  }

  function flush(useBeacon) {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (!queue.length) return;

    var events = queue.splice(0, MAX_BATCH);
    send({ kind: "events", clientId: clientId, events: events }, useBeacon);
  }

  push("pageview", null);

  /* ---------- clicks ---------- */

  document.addEventListener(
    "click",
    function (event) {
      push("click", event);
    },
    { capture: true, passive: true }
  );

  /* ---------- hover dwell ---------- */

  if (window.matchMedia("(hover: hover)").matches) {
    var hoverTimer = null;
    document.addEventListener(
      "mousemove",
      function (event) {
        if (hoverTimer) clearTimeout(hoverTimer);
        var pageX = event.pageX;
        var pageY = event.pageY;
        hoverTimer = setTimeout(function () {
          push("hover", { pageX: pageX, pageY: pageY });
        }, HOVER_DWELL_MS);
      },
      { passive: true }
    );
  }

  /* ---------- scroll depth ---------- */

  var maxScroll = 0;
  var scrollTicking = false;

  function measureScroll() {
    var viewport = window.innerHeight;
    var total = pageHeight();
    var reached = total <= viewport
      ? 100
      : Math.round(((window.scrollY + viewport) / total) * 100);

    var clamped = Math.min(100, Math.max(0, reached));
    if (clamped > maxScroll) maxScroll = clamped;
    scrollTicking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      // rAF throttle: at most one measurement per frame.
      if (scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(measureScroll);
    },
    { passive: true }
  );

  measureScroll();

  /* ---------- heartbeat + close-out ---------- */

  function heartbeat(useBeacon) {
    send({ kind: "heartbeat", clientId: clientId, scrollDepth: maxScroll }, useBeacon);
  }

  var heartbeatTimer = setInterval(function () {
    // Do not keep counting duration for a backgrounded tab.
    if (document.visibilityState === "visible") heartbeat(false);
  }, HEARTBEAT_MS);

  function closeOut() {
    flush(true);
    heartbeat(true);
  }

  // visibilitychange is the reliable signal on mobile; pagehide covers bfcache.
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") closeOut();
  });
  window.addEventListener("pagehide", closeOut);
  window.addEventListener("beforeunload", function () {
    clearInterval(heartbeatTimer);
    closeOut();
  });
})();

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
  var SESSION_META_KEY = "tr_smeta";
  var FLUSH_MS = 5000;
  var HEARTBEAT_MS = 15000;
  // Flush once this many events have piled up, whatever kind they are.
  var FLUSH_AT = 20;
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

  /**
   * Acquisition params, captured ONCE per session and cached in sessionStorage.
   *
   * Reading them on every pageview would be wrong: a visitor who lands on
   * "/?utm_source=meta" and then clicks an internal link to a page with no
   * query string would have their attribution overwritten with nulls.
   */
  function getOrCreateSessionEntryMeta() {
    try {
      var existing = tab && tab.getItem(SESSION_META_KEY);
      if (existing) return JSON.parse(existing);
    } catch {
      /* corrupt or unreadable — fall through and capture fresh */
    }

    var raw = {};
    params.forEach(function (value, key) {
      // Cap key/value length so a hostile URL cannot bloat the row.
      raw[key.slice(0, 100)] = String(value).slice(0, 500);
    });

    var meta = {
      entryPath: location.pathname,
      referrer: document.referrer || "",
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
      utmContent: params.get("utm_content"),
      utmTerm: params.get("utm_term"),
      gclid: params.get("gclid"),
      fbclid: params.get("fbclid"),
      msclkid: params.get("msclkid"),
      placement: params.get("placement"),
      // Meta's dynamic URL parameters, filled in per click by Meta itself.
      metaCampaignId: params.get("campaign_id"),
      metaAdsetId: params.get("adset_id"),
      metaAdId: params.get("ad_id"),
      rawParams: raw,
    };

    try {
      if (tab) tab.setItem(SESSION_META_KEY, JSON.stringify(meta));
    } catch {
      // Private browsing / quota — fail open, just don't persist.
    }

    return meta;
  }

  /**
   * The derived, human-readable view shown in the admin's Source/Medium/Campaign
   * columns. Derived from the *captured* meta, never from live `location.search`,
   * so an internal navigation cannot blank it out.
   */
  function attribution(meta) {
    var source = meta.utmSource;
    var medium = meta.utmMedium;
    var campaign = meta.utmCampaign;

    // Fall back to the referrer host when there are no UTM tags.
    if (!source && meta.referrer) {
      try {
        var refHost = new URL(meta.referrer).hostname;
        if (refHost && refHost !== location.hostname) {
          source = refHost.replace(/^www\./, "");
          medium = medium || "referral";
        }
      } catch {
        /* malformed referrer */
      }
    }

    // Click ids imply paid traffic even when the ad carries no utm tags.
    if (!source && (meta.gclid || meta.fbclid || meta.msclkid)) {
      source = meta.gclid ? "google" : meta.msclkid ? "bing" : "facebook";
      medium = medium || "cpc";
    }

    return { source: source, medium: medium, campaign: campaign };
  }

  function deviceType() {
    var ua = navigator.userAgent || "";
    // iPadOS 13+ reports a desktop UA, so treat any multi-touch Mac as a tablet.
    if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1))
      return "tablet";
    // Android tablets omit the "Mobile" token that phones include.
    if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return "tablet";

    if (navigator.userAgentData && typeof navigator.userAgentData.mobile === "boolean") {
      return navigator.userAgentData.mobile ? "mobile" : "desktop";
    }
    var isPhone =
      window.matchMedia("(max-width: 767px)").matches ||
      /iPhone|iPod|Android.*Mobile|Mobile/i.test(ua);
    return isPhone ? "mobile" : "desktop";
  }

  /**
   * What this visitor browses on. Read once, at session start.
   *
   * The browser *family* is derived server-side from the User-Agent header;
   * everything here is only available in the page: screen and viewport size,
   * language, timezone, and the connection quality (Chrome only — Safari and
   * Firefox do not implement the Network Information API).
   */
  function environment() {
    var ua = navigator.userAgent || "";
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    var os = /Windows NT/i.test(ua)
      ? "Windows"
      : /Android/i.test(ua)
        ? "Android"
        : /(iPhone|iPad|iPod)/i.test(ua)
          ? "iOS"
          : /Mac OS X/i.test(ua)
            ? "macOS"
            : /(Linux|X11)/i.test(ua)
              ? "Linux"
              : null;

    // The version of whichever engine token appears last is the browser's own:
    // Chrome's UA also carries Safari's, and Edge's carries Chrome's.
    var version = null;
    var match =
      /(?:Edg|EdgA)\/(\d+)/.exec(ua) ||
      /(?:OPR|Opera)\/(\d+)/.exec(ua) ||
      /Chrome\/(\d+)/.exec(ua) ||
      /Firefox\/(\d+)/.exec(ua) ||
      /Version\/(\d+).*Safari/.exec(ua);
    if (match) version = match[1];

    var timezone = null;
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    } catch {
      /* Intl unavailable — leave it null */
    }

    return {
      os: os,
      browserVersion: version,
      screenWidth: screen && screen.width ? Math.round(screen.width) : null,
      screenHeight: screen && screen.height ? Math.round(screen.height) : null,
      viewportWidth: Math.round(document.documentElement.clientWidth) || null,
      viewportHeight: Math.round(document.documentElement.clientHeight) || null,
      language: navigator.language || null,
      timezone: timezone,
      connection: conn && conn.effectiveType ? conn.effectiveType : null,
    };
  }

  var entryMeta = getOrCreateSessionEntryMeta();
  var attr = attribution(entryMeta);
  var sessionPayload = {
    kind: "session",
    clientId: clientId,
    visitorId: visitorId,
    isReturning: isReturning,
    device: deviceType(),
    path: location.pathname,
    entryMeta: entryMeta,
    environment: environment(),
  };
  if (attr.source) sessionPayload.source = attr.source;
  if (attr.medium) sessionPayload.medium = attr.medium;
  if (attr.campaign) sessionPayload.campaign = attr.campaign;

  send(sessionPayload, false);

  /* ---------- event batching ---------- */

  /**
   * One batch, every event type.
   *
   * Each collector below drops its output into a bucket here and the whole
   * thing goes out in a single request. Per-bucket caps mirror the server's
   * validation limits, so a runaway collector drops its own overflow instead
   * of getting the entire batch rejected.
   */
  var CAPS = { events: 50, cta: 50, forms: 50, mouse: 50, vitals: 20, errors: 20 };
  var batch = { events: [], cta: [], forms: [], mouse: [], vitals: [], errors: [] };
  var queued = 0;
  var flushTimer = null;

  function pageHeight() {
    return Math.max(
      document.body ? document.body.scrollHeight : 0,
      document.documentElement.scrollHeight,
      1
    );
  }

  function queueItem(bucket, item) {
    // Silently drop past the cap: losing a hover beats losing the batch.
    if (batch[bucket].length >= CAPS[bucket]) return;

    item.path = location.pathname;
    batch[bucket].push(item);
    queued++;

    if (queued >= FLUSH_AT) return flush(false);
    if (!flushTimer) flushTimer = setTimeout(function () { flush(false); }, FLUSH_MS);
  }

  function push(type, event) {
    var item = { type: type };

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

    queueItem("events", item);
  }

  function flush(useBeacon) {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (!queued) return;

    var payload = { kind: "events", clientId: clientId };
    for (var bucket in batch) {
      if (batch[bucket].length) payload[bucket] = batch[bucket];
      batch[bucket] = [];
    }
    queued = 0;

    send(payload, useBeacon);
  }

  push("pageview", null);

  /* ---------- element description ---------- */

  /** Short, stable-ish CSS selector — enough to find the element again. */
  function selectorFor(el) {
    if (!el || !el.tagName) return null;
    var out = el.tagName.toLowerCase();
    if (el.id) return out + "#" + el.id;

    var cls = typeof el.className === "string" ? el.className.trim().split(/\s+/) : [];
    // Tailwind puts dozens of utility classes on everything; two is plenty to
    // tell two buttons apart without turning the selector into a paragraph.
    if (cls.length && cls[0]) out += "." + cls.slice(0, 2).join(".");
    return out.slice(0, 300);
  }

  /** What a human would call the element. */
  function labelFor(el) {
    if (!el) return null;
    var text =
      el.getAttribute("aria-label") ||
      el.getAttribute("data-cta-label") ||
      (el.textContent || "").replace(/\s+/g, " ").trim();
    return text ? text.slice(0, 200) : null;
  }

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

  /* ---------- CTAs ---------- */

  /**
   * Tracking a new button is a markup change, not a code change: put
   * `data-cta-id="hero-call"` on it and it is counted from the next deploy.
   *
   * Impressions and hovers fire once per element per page — a button that
   * scrolls in and out of view is one impression, not ten.
   */
  var ctaViewed = new WeakSet();
  var ctaHovered = new WeakSet();

  function ctaEvent(el, type) {
    queueItem("cta", {
      ctaId: String(el.getAttribute("data-cta-id")).slice(0, 100),
      type: type,
      label: labelFor(el),
    });
  }

  var ctaObserver =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          function (entries) {
            for (var i = 0; i < entries.length; i++) {
              var entry = entries[i];
              if (!entry.isIntersecting || ctaViewed.has(entry.target)) continue;
              ctaViewed.add(entry.target);
              ctaEvent(entry.target, "viewed");
              ctaObserver.unobserve(entry.target);
            }
          },
          // Half the button visible counts as seen; a 1px sliver does not.
          { threshold: 0.5 }
        )
      : null;

  /* ---------- forms ---------- */

  var formState = Object.create(null);
  var formsViewed = new WeakSet();
  var fieldSeen = new WeakSet();

  function formIdOf(el) {
    var form = el && el.closest ? el.closest("[data-form-id]") : null;
    return form ? String(form.getAttribute("data-form-id")).slice(0, 100) : null;
  }

  function formEvent(formId, type, field) {
    if (!formId) return;
    queueItem("forms", { formId: formId, type: type, field: field || null });
  }

  /** Field *names* only — the tracker must never see what was typed. */
  function fieldName(el) {
    if (!el) return null;
    var name = el.getAttribute("name") || el.getAttribute("id") || el.type || null;
    return name ? String(name).slice(0, 100) : null;
  }

  function markStarted(formId) {
    if (!formId || (formState[formId] && formState[formId].started)) return;
    formState[formId] = formState[formId] || {};
    formState[formId].started = true;
    formEvent(formId, "started");
  }

  var formObserver =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          function (entries) {
            for (var i = 0; i < entries.length; i++) {
              var entry = entries[i];
              if (!entry.isIntersecting || formsViewed.has(entry.target)) continue;
              formsViewed.add(entry.target);
              formEvent(
                String(entry.target.getAttribute("data-form-id")).slice(0, 100),
                "viewed"
              );
              formObserver.unobserve(entry.target);
            }
          },
          { threshold: 0.3 }
        )
      : null;

  document.addEventListener(
    "focusin",
    function (event) {
      var formId = formIdOf(event.target);
      if (!formId) return;
      markStarted(formId);
      if (!fieldSeen.has(event.target)) {
        fieldSeen.add(event.target);
        formEvent(formId, "field_focus", fieldName(event.target));
      }
    },
    { capture: true, passive: true }
  );

  // "Complete" means: they left the field and it has something in it.
  document.addEventListener(
    "focusout",
    function (event) {
      var target = event.target;
      var formId = formIdOf(target);
      if (!formId || !target || typeof target.value !== "string") return;
      if (target.value.trim()) formEvent(formId, "field_complete", fieldName(target));
    },
    { capture: true, passive: true }
  );

  // Native constraint validation. The enquiry form sets `noValidate` and
  // renders its own messages, so it reports through window.__tr instead.
  document.addEventListener(
    "invalid",
    function (event) {
      formEvent(formIdOf(event.target), "validation_error", fieldName(event.target));
    },
    { capture: true, passive: true }
  );

  document.addEventListener(
    "submit",
    function (event) {
      var formId = formIdOf(event.target);
      if (!formId) return;
      formState[formId] = formState[formId] || {};
      formState[formId].submitted = true;
      formEvent(formId, "submitted");
    },
    { capture: true, passive: true }
  );

  /**
   * Hook for app code that validates by hand, so a React form's own error
   * messages land in the same funnel as native ones.
   */
  window.__tr = {
    formError: function (formId, field) {
      formEvent(String(formId).slice(0, 100), "validation_error", field || null);
    },
    formSubmitted: function (formId) {
      formState[formId] = formState[formId] || {};
      formState[formId].submitted = true;
      formEvent(String(formId).slice(0, 100), "submitted");
    },
  };

  /* ---------- frustration signals ---------- */

  var INTERACTIVE = "a,button,input,select,textarea,label,summary,[role=button],[tabindex]";
  var RAGE_WINDOW_MS = 1000;
  var RAGE_CLICKS = 3;
  var DEAD_CLICK_MS = 600;

  var rageTarget = null;
  var rageCount = 0;
  var rageAt = 0;
  var rageReported = false;

  // One dead click per element per burst. Someone jabbing at the same inert
  // heading three times is one thing that does not work, not three.
  var DEAD_CLICK_DEDUPE_MS = 2000;
  var deadTarget = null;
  var deadAt = 0;

  function mouseSignal(type, el) {
    queueItem("mouse", { type: type, selector: selectorFor(el), label: labelFor(el) });
  }

  document.addEventListener(
    "click",
    function (event) {
      var el = event.target;
      if (!el || el.nodeType !== 1) return;

      var now = Date.now();
      if (el === rageTarget && now - rageAt < RAGE_WINDOW_MS) {
        rageCount++;
      } else {
        rageTarget = el;
        rageCount = 1;
        rageReported = false;
      }
      rageAt = now;

      // Report once per burst, not on every click past the third.
      if (rageCount >= RAGE_CLICKS && !rageReported) {
        rageReported = true;
        mouseSignal("rage_click", el);
      }

      // A dead click is one on something inert that changes nothing: no
      // navigation, no DOM update. Watching for mutations is the only way to
      // tell "did nothing" from "did something invisible to us".
      if (el.closest && el.closest(INTERACTIVE)) return;
      if (typeof MutationObserver !== "function") return;

      var mutated = false;
      var watcher = new MutationObserver(function () {
        mutated = true;
      });
      watcher.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      setTimeout(function () {
        watcher.disconnect();
        if (mutated) return;

        // Deduped here rather than at click time: every click in a burst is
        // dispatched before the first one's watcher has reported, so a
        // click-time check would let the whole burst through.
        var settled = Date.now();
        if (el === deadTarget && settled - deadAt < DEAD_CLICK_DEDUPE_MS) return;
        deadTarget = el;
        deadAt = settled;

        mouseSignal("dead_click", el);
      }, DEAD_CLICK_MS);
    },
    { capture: true, passive: true }
  );

  document.addEventListener(
    "dblclick",
    function (event) {
      if (event.target && event.target.nodeType === 1) {
        mouseSignal("double_click", event.target);
      }
    },
    { capture: true, passive: true }
  );

  /* ---------- Core Web Vitals ---------- */

  /**
   * Measured straight off PerformanceObserver rather than via the web-vitals
   * package: this file is served as-is, not bundled, so it cannot import one.
   * Thresholds are Google's published good / needs-improvement boundaries.
   */
  var VITAL_THRESHOLDS = {
    LCP: [2500, 4000],
    INP: [200, 500],
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    TTFB: [800, 1800],
  };

  var vitalsSent = Object.create(null);

  function reportVital(name, value) {
    if (vitalsSent[name] || value == null || !isFinite(value)) return;
    vitalsSent[name] = true;

    var bounds = VITAL_THRESHOLDS[name];
    var rounded = name === "CLS" ? Math.round(value * 1000) / 1000 : Math.round(value);

    queueItem("vitals", {
      name: name,
      value: Math.max(0, rounded),
      rating:
        rounded <= bounds[0] ? "good" : rounded <= bounds[1] ? "needs-improvement" : "poor",
    });
  }

  function observePerformance(type, callback, extra) {
    if (typeof PerformanceObserver !== "function") return null;
    try {
      var observer = new PerformanceObserver(function (list) {
        callback(list.getEntries());
      });
      var options = { type: type, buffered: true };
      for (var key in extra) options[key] = extra[key];
      observer.observe(options);
      return observer;
    } catch {
      // Unsupported entry type in this browser — nothing to measure.
      return null;
    }
  }

  var lcpValue = null;
  var clsValue = 0;
  var inpValue = 0;

  // LCP keeps being revised upward until the user interacts; only the final
  // value is the metric, so it is held back until the page is hidden.
  observePerformance("largest-contentful-paint", function (entries) {
    var last = entries[entries.length - 1];
    if (last) lcpValue = last.renderTime || last.loadTime || last.startTime;
  });

  observePerformance("layout-shift", function (entries) {
    for (var i = 0; i < entries.length; i++) {
      // Shifts within 500ms of a click or keypress are the user's doing.
      if (!entries[i].hadRecentInput) clsValue += entries[i].value;
    }
  });

  // Approximates INP with the worst single interaction latency. The real
  // metric is the 98th percentile across a longer visit; on a one-page
  // landing site the two rarely disagree, and the worst case is the one
  // worth knowing about anyway.
  observePerformance(
    "event",
    function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].interactionId && entries[i].duration > inpValue) {
          inpValue = entries[i].duration;
        }
      }
    },
    { durationThreshold: 40 }
  );

  observePerformance("paint", function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].name === "first-contentful-paint") {
        reportVital("FCP", entries[i].startTime);
      }
    }
  });

  observePerformance("navigation", function (entries) {
    if (entries[0] && entries[0].responseStart) {
      reportVital("TTFB", entries[0].responseStart);
    }
  });

  /** Called on the way out, when the deferred metrics are finally settled. */
  function reportFinalVitals() {
    if (lcpValue != null) reportVital("LCP", lcpValue);
    reportVital("CLS", clsValue);
    if (inpValue > 0) reportVital("INP", inpValue);
  }

  /* ---------- errors ---------- */

  var MAX_ERRORS = 10;
  var errorCount = 0;
  var errorsSeen = Object.create(null);

  function reportError(kind, message, source, line) {
    if (errorCount >= MAX_ERRORS || !message) return;

    // One broken image in a loop must not fill the batch with itself.
    var key = kind + "|" + message;
    if (errorsSeen[key]) return;
    errorsSeen[key] = true;
    errorCount++;

    queueItem("errors", {
      kind: kind,
      message: String(message).slice(0, 1000),
      source: source ? String(source).slice(0, 500) : null,
      line: typeof line === "number" && isFinite(line) ? Math.max(0, Math.round(line)) : null,
    });
  }

  window.addEventListener(
    "error",
    function (event) {
      var target = event.target;
      // A failed <img>/<script>/<link> fires an error event that does not
      // bubble, which is why this listener is registered on the capture phase.
      if (target && target !== window && target.nodeType === 1) {
        var url = target.currentSrc || target.src || target.href;
        if (url) reportError("resource", "Failed to load " + target.tagName.toLowerCase(), url);
        return;
      }
      reportError("js", event.message, event.filename, event.lineno);
    },
    true
  );

  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    var message =
      reason && reason.message ? reason.message : String(reason || "Unhandled rejection");
    reportError("promise", message, reason && reason.stack ? reason.stack.slice(0, 500) : null);
  });

  /* ---------- element discovery ---------- */

  /**
   * Wires up whatever is on the page now, and keeps watching: React mounts the
   * hero form and half the buttons after this script runs, so a one-shot pass
   * at load would miss them.
   */
  function observeAll(root, attribute, seen, observer) {
    if (!observer) return;

    // querySelectorAll only looks *inside* the node, so a newly mounted button
    // that is itself the tagged element has to be checked separately.
    if (root.matches && root.matches(attribute) && !seen.has(root)) observer.observe(root);

    var found = root.querySelectorAll(attribute);
    for (var i = 0; i < found.length; i++) {
      if (!seen.has(found[i])) observer.observe(found[i]);
    }
  }

  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    observeAll(root, "[data-cta-id]", ctaViewed, ctaObserver);
    observeAll(root, "[data-form-id]", formsViewed, formObserver);
  }

  document.addEventListener(
    "mouseover",
    function (event) {
      var el = event.target && event.target.closest ? event.target.closest("[data-cta-id]") : null;
      if (!el || ctaHovered.has(el)) return;
      ctaHovered.add(el);
      ctaEvent(el, "hover");
    },
    { capture: true, passive: true }
  );

  document.addEventListener(
    "click",
    function (event) {
      var el = event.target && event.target.closest ? event.target.closest("[data-cta-id]") : null;
      if (el) ctaEvent(el, "click");
    },
    { capture: true, passive: true }
  );

  scan(document);

  if (typeof MutationObserver === "function" && document.body) {
    new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var added = records[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          if (added[j].nodeType === 1) scan(added[j]);
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  /* ---------- heartbeat + close-out ---------- */

  function heartbeat(useBeacon) {
    send({ kind: "heartbeat", clientId: clientId, scrollDepth: maxScroll }, useBeacon);
  }

  var heartbeatTimer = setInterval(function () {
    // Do not keep counting duration for a backgrounded tab.
    if (document.visibilityState === "visible") heartbeat(false);
  }, HEARTBEAT_MS);

  /**
   * A form that was started and never submitted is the most actionable thing
   * this tracker records, and the only moment it can be known is on the way out.
   */
  function reportAbandonedForms() {
    for (var formId in formState) {
      var state = formState[formId];
      if (state.started && !state.submitted && !state.abandoned) {
        state.abandoned = true;
        formEvent(formId, "abandoned");
      }
    }
  }

  function closeOut() {
    // Both add to the batch, so they have to run before it is sent.
    reportFinalVitals();
    reportAbandonedForms();
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

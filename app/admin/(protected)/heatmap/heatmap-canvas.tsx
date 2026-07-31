"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type HeatPoint = { id: string; x: number; y: number };

// The landing page is rendered at a fixed desktop width and scaled down to fit
// the admin panel, so the overlay geometry is stable regardless of the admin
// window size. Coordinates are stored normalised, so they map onto any width.
const DESIGN_WIDTH = 1440;

// Used until the real document height can be measured.
const FALLBACK_HEIGHT = 6000;

export default function HeatmapCanvas({
  points,
  siteUrl,
  mode,
}: {
  points: HeatPoint[];
  siteUrl: string;
  mode: "click" | "hover";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [containerWidth, setContainerWidth] = useState(DESIGN_WIDTH);
  const [pageHeight, setPageHeight] = useState(FALLBACK_HEIGHT);
  const [measured, setMeasured] = useState(false);

  const scale = containerWidth / DESIGN_WIDTH;
  const displayHeight = pageHeight * scale;

  // Track the admin container width so the preview scales responsively.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(element);
    setContainerWidth(element.clientWidth);

    return () => observer.disconnect();
  }, []);

  // The admin and the landing page share an origin, so the iframe's document is
  // readable and we can size the overlay to the real page height. If the site
  // URL ever points elsewhere this throws, and we keep the fallback height.
  const measurePage = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.body) return;

    const height = Math.max(
      doc.body.scrollHeight,
      doc.documentElement.scrollHeight,
    );
    if (height > 0) {
      setPageHeight(height);
      setMeasured(true);
    }
  }, []);

  const handleLoad = useCallback(() => {
    try {
      measurePage();
      // Fonts and lazy images shift the height after load; re-measure shortly.
      const timer = setTimeout(measurePage, 1200);
      return () => clearTimeout(timer);
    } catch {
      // Cross-origin — keep the fallback height.
    }
  }, [measurePage]);

  // Paint the heat blobs.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerWidth === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(containerWidth * dpr);
    canvas.height = Math.round(displayHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, containerWidth, displayHeight);

    // Additive blending so overlapping points build into hot spots.
    ctx.globalCompositeOperation = "lighter";

    // Hover points are far more numerous, so each contributes less heat.
    const radius = mode === "click" ? 22 : 30;
    const intensity = mode === "click" ? 0.5 : 0.28;

    for (const point of points) {
      const px = point.x * containerWidth;
      const py = point.y * displayHeight;

      const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
      gradient.addColorStop(0, `rgba(255, 122, 26, ${intensity})`);
      gradient.addColorStop(0.5, `rgba(255, 90, 40, ${intensity * 0.45})`);
      gradient.addColorStop(1, "rgba(255, 60, 60, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // A crisp core dot keeps individual events visible in sparse areas.
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(255, 220, 190, 0.85)";
    for (const point of points) {
      ctx.beginPath();
      ctx.arc(point.x * containerWidth, point.y * displayHeight, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [points, containerWidth, displayHeight, mode]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-2.5 text-xs text-white/40">
        <span>
          Landing page preview at {DESIGN_WIDTH}px wide
          {measured ? "" : " · using estimated page height"}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-white/30">Low</span>
          <span
            aria-hidden="true"
            className="h-1.5 w-24 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,122,26,0.15), rgba(255,122,26,0.6), rgba(255,60,60,0.95))",
            }}
          />
          <span className="text-white/30">High</span>
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden bg-white"
        style={{ height: displayHeight }}
      >
        <iframe
          ref={iframeRef}
          src={siteUrl}
          title="Landing page preview"
          onLoad={handleLoad}
          // The preview is a backdrop, not an interactive page — swallow input
          // so admins cannot accidentally navigate or submit the real form.
          className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
          style={{
            width: DESIGN_WIDTH,
            height: pageHeight,
            transform: `scale(${scale})`,
          }}
          scrolling="no"
          tabIndex={-1}
        />

        <canvas
          ref={canvasRef}
          aria-label={`${mode} heatmap overlay`}
          className="pointer-events-none absolute top-0 left-0"
          style={{ width: containerWidth, height: displayHeight }}
        />
      </div>
    </div>
  );
}

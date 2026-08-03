"use client";

import { useEffect, useRef, useState } from "react";

export type HeatPoint = { id: string; x: number; y: number };

// The backdrop is a full-page screenshot captured at this width; coordinates are
// stored normalised (0-1), so they map onto the image at any displayed size.
const DESIGN_WIDTH = 1440;

// Screenshot's natural height at DESIGN_WIDTH, used until the image reports its
// real dimensions on load. Keeps the overlay geometry correct from first paint.
const FALLBACK_HEIGHT = 10232;

const BACKDROP_SRC = "/heatmap-home.webp";

export default function HeatmapCanvas({
  points,
  mode,
}: {
  points: HeatPoint[];
  mode: "click" | "hover";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [containerWidth, setContainerWidth] = useState(DESIGN_WIDTH);
  // Aspect ratio (height / width) of the backdrop, so the overlay always lines
  // up with the page image regardless of the admin window size.
  const [aspect, setAspect] = useState(FALLBACK_HEIGHT / DESIGN_WIDTH);

  const displayHeight = containerWidth * aspect;

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
        <span>Landing page snapshot at {DESIGN_WIDTH}px wide</span>
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
        {/* eslint-disable-next-line @next/next/no-img-element -- fixed backdrop
            screenshot, not a responsive content image */}
        <img
          src={BACKDROP_SRC}
          alt="Landing page snapshot"
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth > 0) setAspect(img.naturalHeight / img.naturalWidth);
          }}
          className="pointer-events-none absolute top-0 left-0 block select-none"
          style={{ width: containerWidth, height: displayHeight }}
          draggable={false}
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

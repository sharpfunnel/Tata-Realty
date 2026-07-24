/**
 * Placeholder artwork standing in for the project renders that are still
 * pending from the client (see the Drive link in the brief). Swap any
 * <TowerVisual /> for a <Image /> once the real assets land.
 */
export function TowerVisual({
  uid,
  className = "",
  dense = false,
}: {
  uid: string;
  className?: string;
  dense?: boolean;
}) {
  const towers = dense
    ? [
        { x: 8, w: 40, h: 150 },
        { x: 54, w: 34, h: 196 },
        { x: 94, w: 46, h: 118 },
        { x: 146, w: 36, h: 168 },
        { x: 188, w: 44, h: 214 },
        { x: 238, w: 32, h: 140 },
        { x: 276, w: 44, h: 182 },
      ]
    : [
        { x: 24, w: 46, h: 176 },
        { x: 78, w: 38, h: 224 },
        { x: 124, w: 52, h: 132 },
        { x: 184, w: 40, h: 200 },
        { x: 232, w: 60, h: 158 },
      ];

  return (
    <svg
      viewBox="0 0 320 260"
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label="Illustration of high-rise towers against open green hills"
      className={className}
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#101b31" />
          <stop offset="70%" stopColor="#1b2a4a" />
          <stop offset="100%" stopColor="#2b3d63" />
        </linearGradient>
        <linearGradient id={`${uid}-tower`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5f3ee" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#f5f3ee" stopOpacity="0.06" />
        </linearGradient>
        <pattern
          id={`${uid}-windows`}
          width="8"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <rect width="4" height="5" x="1" y="2" fill="#c9a84c" opacity="0.5" />
        </pattern>
      </defs>

      <rect width="320" height="260" fill={`url(#${uid}-sky)`} />
      <circle cx="256" cy="58" r="30" fill="#c9a84c" opacity="0.16" />

      {/* Hills — the "lifetime open green / hill views" from the brief */}
      <path
        d="M0 196 C 56 158, 104 186, 156 170 C 208 154, 262 184, 320 164 L320 260 L0 260 Z"
        fill="#2b3d63"
        opacity="0.75"
      />

      <g>
        {towers.map((t) => (
          <g key={t.x}>
            <rect
              x={t.x}
              y={260 - t.h}
              width={t.w}
              height={t.h}
              rx="3"
              fill={`url(#${uid}-tower)`}
            />
            <rect
              x={t.x + 4}
              y={260 - t.h + 8}
              width={t.w - 8}
              height={t.h - 24}
              fill={`url(#${uid}-windows)`}
              opacity="0.55"
            />
          </g>
        ))}
      </g>

      <rect x="0" y="256" width="320" height="4" fill="#c9a84c" opacity="0.55" />
    </svg>
  );
}

// The street around the building on wide screens: dark neighbouring buildings fill the space to the
// left of the main building, so a wide window shows more city instead of empty sky. Drawn from a
// fixed seed, so the street looks the same on every visit.

import { memo } from "react";

/** A small deterministic random generator (mulberry32). */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Block = { x: number; w: number; h: number; tone: string; roof: "flat" | "tank" | "antenna" | "step" };

/** Buildings from the right edge (next to the main building) towards the left, until `width` is filled. */
function street(width: number): Block[] {
  const r = rng(4242);
  const tones = ["#241e3d", "#2a2346", "#1f1a35", "#272042"];
  const out: Block[] = [];
  let right = width;
  let i = 0;
  while (right > -40) {
    const w = 110 + Math.round(r() * 110);
    // the one next to the main building is low, so the main building stays the tallest
    const h = i === 0 ? 260 + Math.round(r() * 60) : 300 + Math.round(r() * 280);
    const roofs: Block["roof"][] = ["flat", "tank", "antenna", "step"];
    out.push({ x: right - w, w, h, tone: tones[i % tones.length]!, roof: roofs[Math.floor(r() * roofs.length)]! });
    right -= w + Math.round(r() * 14);
    i++;
  }
  return out;
}

export const Neighbors = memo(function Neighbors({ width, height }: { width: number; height: number }) {
  if (width < 20) return null;
  const r = rng(77);
  const blocks = street(width);
  return (
    <svg className="s4-hood" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {blocks.map((b, i) => {
        const y = height - b.h;
        const cols = Math.max(2, Math.floor((b.w - 24) / 30));
        const rows = Math.floor((b.h - 50) / 46);
        const gap = (b.w - cols * 16) / (cols + 1);
        const windows = [];
        for (let row = 0; row < rows; row++)
          for (let col = 0; col < cols; col++) {
            const lit = r() < 0.12;
            const dim = r() < 0.5;
            windows.push(
              <rect
                key={`${row}-${col}`}
                x={b.x + gap + col * (16 + gap)}
                y={y + 30 + row * 46}
                width="16"
                height="22"
                rx="1.5"
                fill={lit ? "#F2C27E" : "#352d55"}
                opacity={lit ? 0.45 : dim ? 0.5 : 0.85}
              />,
            );
          }
        return (
          <g key={i}>
            <rect x={b.x} y={y} width={b.w} height={b.h} fill={b.tone} />
            <rect x={b.x - 3} y={y} width={b.w + 6} height="6" fill="#322a4f" />
            {b.roof === "tank" && (
              <g fill="#2f2849">
                <rect x={b.x + b.w * 0.6} y={y - 30} width="30" height="24" rx="3" />
                <rect x={b.x + b.w * 0.6 + 4} y={y - 6} width="3" height="6" />
                <rect x={b.x + b.w * 0.6 + 23} y={y - 6} width="3" height="6" />
              </g>
            )}
            {b.roof === "antenna" && (
              <g stroke="#3a3258" strokeWidth="2">
                <line x1={b.x + b.w * 0.3} y1={y} x2={b.x + b.w * 0.3} y2={y - 42} />
                <line x1={b.x + b.w * 0.3 - 10} y1={y - 30} x2={b.x + b.w * 0.3 + 10} y2={y - 30} />
                <circle cx={b.x + b.w * 0.3} cy={y - 44} r="2.5" fill="#ff6b6b" stroke="none" opacity=".8" />
              </g>
            )}
            {b.roof === "step" && <rect x={b.x + 12} y={y - 22} width={b.w * 0.45} height="22" fill={b.tone} />}
            {windows}
          </g>
        );
      })}
    </svg>
  );
});

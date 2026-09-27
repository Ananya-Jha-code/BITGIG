// MOCK: procedurally drawn H&E-style tissue. Not an image of any real sample.
import { PATHOLOGY_LABELS } from "@/mocks/pathology";

export const SLIDE_W = 800;
export const SLIDE_H = 520;

// mulberry32: tiny seeded PRNG so the slide is identical on server and client.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n) => Math.round(n * 10) / 10;
const NUCLEI = ["#5b2a86", "#4a2170", "#6d3796", "#3f1d63"];
const CYTO = ["#e7a3c4", "#eeb6d0", "#dc8fb5", "#f2c4d9"];

function buildTissue(seed) {
  const rand = rng(seed);
  const fibers = Array.from({ length: 26 }, () => {
    const y = rand() * SLIDE_H;
    return { d: `M0 ${r1(y)} Q ${r1(rand() * SLIDE_W)} ${r1(y + (rand() - 0.5) * 160)} ${SLIDE_W} ${r1(y + (rand() - 0.5) * 90)}`, w: r1(4 + rand() * 10) };
  });
  const cells = Array.from({ length: 520 }, () => {
    const rx = 5 + rand() * 6;
    return {
      x: r1(rand() * SLIDE_W),
      y: r1(rand() * SLIDE_H),
      rx: r1(rx),
      ry: r1(rx * (0.6 + rand() * 0.35)),
      rot: Math.round(rand() * 180),
      cyto: CYTO[Math.floor(rand() * CYTO.length)],
      nucleus: NUCLEI[Math.floor(rand() * NUCLEI.length)],
      n: r1(rx * (0.35 + rand() * 0.2)),
    };
  });
  return { fibers, cells };
}

const cache = new Map();
function tissue(seed) {
  if (!cache.has(seed)) cache.set(seed, buildTissue(seed));
  return cache.get(seed);
}

export default function SyntheticSlide({ seed, regions, selectedId, showOverlay = true, onSelect }) {
  const { fibers, cells } = tissue(seed);

  return (
    <svg viewBox={`0 0 ${SLIDE_W} ${SLIDE_H}`} className="block h-auto w-full" role="img" aria-label="H&E tissue slide">
      <rect width={SLIDE_W} height={SLIDE_H} fill="#f6dbe8" />
      <g opacity="0.55">
        {fibers.map((f, i) => (
          <path key={i} d={f.d} stroke="#e9a8c8" strokeWidth={f.w} fill="none" strokeLinecap="round" />
        ))}
      </g>
      <g>
        {cells.map((c, i) => (
          <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.rot})`}>
            <ellipse rx={c.rx} ry={c.ry} fill={c.cyto} opacity="0.85" />
            <ellipse rx={c.n} ry={r1(c.n * 0.85)} fill={c.nucleus} opacity="0.8" />
          </g>
        ))}
      </g>

      {showOverlay &&
        regions.map((region) => {
          const meta = PATHOLOGY_LABELS[region.label];
          const selected = region.id === selectedId;
          const [lx, ly] = region.points[0];
          return (
            <g key={region.id} onClick={() => onSelect?.(region.id)} className="cursor-pointer">
              <polygon
                points={region.points.map((p) => p.join(",")).join(" ")}
                fill={meta.color}
                fillOpacity={selected ? 0.28 : 0.14}
                stroke={meta.color}
                strokeWidth={selected ? 3.5 : 2}
                strokeDasharray={region.source === "ai" ? "8 5" : undefined}
                strokeLinejoin="round"
              />
              <g transform={`translate(${lx} ${ly - 12})`}>
                <rect x="-4" y="-13" width={meta.name.length * 7 + 12} height="20" rx="6" fill="#fffcf6" stroke={meta.color} />
                <text x="2" y="1" fontSize="12" fontWeight="600" fill={meta.color} fontFamily="var(--font-inter)">
                  {meta.name}
                </text>
              </g>
            </g>
          );
        })}
    </svg>
  );
}

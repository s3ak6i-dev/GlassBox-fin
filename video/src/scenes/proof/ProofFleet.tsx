import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PushIn } from "../../components/PushIn";
import { SPRING_POP } from "../../lib/easings";
import { COLOR, FONT } from "../../lib/theme";

const NODES = [
  { id: "loan_uw", x: 550, y: 310, r: 46, kind: "agent" },
  { id: "kyc_bot", x: 300, y: 180, r: 34, kind: "agent" },
  { id: "fraud_ai", x: 300, y: 440, r: 34, kind: "agent" },
  { id: "openai", x: 820, y: 200, r: 30, kind: "vendor" },
  { id: "anthropic", x: 820, y: 420, r: 30, kind: "vendor" },
];
const EDGES = [
  [0, 1], [0, 2], [0, 3], [0, 4], [1, 3], [2, 4],
];

// S5d · Fleet topology blooms, with packets traveling the edges (live data).
export const ProofFleet: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rot = Math.sin(frame / 120) * 1.2; // slow drift of the whole graph

  return (
    <PushIn from={0.8} to={1.0}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <svg width={1100} height={620} viewBox="0 0 1100 620" style={{ transform: `rotate(${rot}deg)` }}>
          {EDGES.map(([a, b], i) => {
            const A = NODES[a], B = NODES[b];
            const draw = interpolate(frame, [30 + i * 4, 52 + i * 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <line
                key={`e${i}`}
                x1={A.x} y1={A.y}
                x2={A.x + (B.x - A.x) * draw} y2={A.y + (B.y - A.y) * draw}
                stroke={COLOR.amber}
                strokeOpacity={0.3}
                strokeWidth={2}
              />
            );
          })}

          {/* traveling data packets */}
          {EDGES.map(([a, b], i) => {
            const A = NODES[a], B = NODES[b];
            const start = 70 + i * 6;
            if (frame < start) return null;
            const t = ((frame - start) / 40 + i * 0.13) % 1;
            const x = A.x + (B.x - A.x) * t;
            const y = A.y + (B.y - A.y) * t;
            const isV = NODES[b].kind === "vendor";
            return (
              <circle key={`p${i}`} cx={x} cy={y} r={4} fill={isV ? COLOR.cyan : COLOR.coral}
                style={{ filter: `drop-shadow(0 0 6px ${isV ? COLOR.cyan : COLOR.coral})` }} />
            );
          })}

          {NODES.map((n, i) => {
            const s = spring({ frame: frame - i * 6, fps, config: SPRING_POP });
            const isVendor = n.kind === "vendor";
            const pulse = 1 + Math.sin(frame / 18 + i) * 0.04;
            const ring = 0.5 + 0.5 * Math.sin(frame / 18 + i);
            return (
              <g key={n.id} transform={`translate(${n.x},${n.y}) scale(${s * pulse})`}>
                <circle r={n.r + 8} fill="none" stroke={isVendor ? COLOR.cyan : COLOR.amber} strokeOpacity={ring * 0.3} strokeWidth={2} />
                <circle
                  r={n.r}
                  fill={isVendor ? "rgba(34,211,238,0.12)" : "rgba(240,180,41,0.14)"}
                  stroke={isVendor ? COLOR.cyan : COLOR.amber}
                  strokeWidth={2}
                />
                <text textAnchor="middle" y={n.r + 26} fill={COLOR.inkDim} fontSize={18} fontFamily={FONT.mono}>
                  {n.id}
                </text>
              </g>
            );
          })}
        </svg>
      </AbsoluteFill>
    </PushIn>
  );
};

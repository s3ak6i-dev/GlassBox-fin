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

// S5d · Fleet topology blooms (zoom-out reveal of scale).
export const ProofFleet: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <PushIn from={0.8} to={1.0}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <svg width={1100} height={620} viewBox="0 0 1100 620">
          {EDGES.map(([a, b], i) => {
            const p = interpolate(frame, [30 + i * 4, 50 + i * 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const A = NODES[a], B = NODES[b];
            return (
              <line
                key={i}
                x1={A.x} y1={A.y}
                x2={A.x + (B.x - A.x) * p} y2={A.y + (B.y - A.y) * p}
                stroke={COLOR.amber}
                strokeOpacity={0.35}
                strokeWidth={2}
              />
            );
          })}
          {NODES.map((n, i) => {
            const s = spring({ frame: frame - (i * 6), fps, config: SPRING_POP });
            const isVendor = n.kind === "vendor";
            return (
              <g key={n.id} transform={`translate(${n.x},${n.y}) scale(${s})`}>
                <circle
                  r={n.r}
                  fill={isVendor ? "rgba(34,211,238,0.12)" : "rgba(240,180,41,0.14)"}
                  stroke={isVendor ? COLOR.cyan : COLOR.amber}
                  strokeWidth={2}
                />
                <text
                  textAnchor="middle"
                  y={n.r + 24}
                  fill={COLOR.inkDim}
                  fontSize={18}
                  fontFamily={FONT.mono}
                >
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

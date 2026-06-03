import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { GlassPanel } from "../../components/GlassPanel";
import { PushIn } from "../../components/PushIn";
import { COLOR, FONT } from "../../lib/theme";

const STEPS = [
  ["llm_call", "37efed1fe8"],
  ["tool_call", "b39d53b02a"],
  ["decision", "d35da867e0"],
  ["llm_call", "9a1c4f0b22"],
  ["tool_call", "5f89c38191"],
];

// S5c · Hash chain verify — tamper-evident cascade.
export const ProofHash: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <PushIn from={1.04} to={1.0}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <GlassPanel style={{ width: 820, padding: 36, fontFamily: FONT.mono }}>
          <div style={{ color: COLOR.inkDim, fontSize: 18, marginBottom: 20, letterSpacing: "0.1em" }}>
            VERIFYING HASH CHAIN
          </div>
          {STEPS.map((s, i) => {
            const start = 20 + i * 14;
            const ck = interpolate(frame, [start, start + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, padding: "12px 0", fontSize: 24 }}>
                <span style={{ width: 36, color: COLOR.cyan, opacity: ck, transform: `scale(${0.5 + ck * 0.5})` }}>✓</span>
                <span style={{ color: COLOR.ink, width: 160 }}>{s[0]}</span>
                <span style={{ color: COLOR.inkDim }}>{s[1]}</span>
              </div>
            );
          })}
          <div
            style={{
              marginTop: 22,
              color: COLOR.cyan,
              fontSize: 26,
              opacity: interpolate(frame, [110, 130], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            ✓ chain intact · 0 tampered
          </div>
        </GlassPanel>
      </AbsoluteFill>
    </PushIn>
  );
};

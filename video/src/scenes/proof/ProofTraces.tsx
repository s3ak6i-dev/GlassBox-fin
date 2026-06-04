import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Float } from "../../components/Float";
import { GlassPanel } from "../../components/GlassPanel";
import { GradientText } from "../../components/GradientText";
import { PushIn } from "../../components/PushIn";
import { EXPO_OUT } from "../../lib/easings";
import { COLOR, FONT } from "../../lib/theme";

const ROWS = [
  ["12:04:31", "loan_uw", "llm_call", "assess applicant"],
  ["12:04:33", "loan_uw", "tool_call", "credit_check"],
  ["12:04:34", "kyc_bot", "llm_call", "verify identity"],
  ["12:04:36", "loan_uw", "decision", "approved"],
  ["12:04:38", "fraud_ai", "tool_call", "score_txn"],
];

const Banner: React.FC = () => (
  <GradientText style={{ fontFamily: FONT.mono, fontSize: 22, fontWeight: 700, letterSpacing: "0.18em" }}>
    ██ glassbox ██
  </GradientText>
);

// S5a · Traces stream.
export const ProofTraces: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <PushIn>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <Float>
        <GlassPanel style={{ width: 1100, padding: 36, fontFamily: FONT.mono }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <Banner />
            <span style={{ color: COLOR.cyan, fontSize: 16 }}>
              {Math.round(interpolate(frame, [0, 140], [118, 142], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))} traces · ● LIVE
            </span>
          </div>
          {ROWS.map((r, i) => {
            const start = 18 + i * 12;
            const p = interpolate(frame, [start, start + 14], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EXPO_OUT,
            });
            return (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px 120px 120px 1fr",
                  gap: 18,
                  padding: "12px 4px",
                  fontSize: 22,
                  color: COLOR.ink,
                  borderBottom: `1px solid ${COLOR.line}`,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 16}px)`,
                }}
              >
                <span style={{ color: COLOR.inkDim }}>{r[0]}</span>
                <span style={{ color: COLOR.amber }}>{r[1]}</span>
                <span style={{ color: COLOR.cyan }}>{r[2]}</span>
                <span>{r[3]}</span>
              </div>
            );
          })}
        </GlassPanel>
        </Float>
      </AbsoluteFill>
    </PushIn>
  );
};

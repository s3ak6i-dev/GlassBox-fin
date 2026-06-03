import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { GlassPanel } from "../../components/GlassPanel";
import { PushIn } from "../../components/PushIn";
import { EXPO_OUT } from "../../lib/easings";
import { COLOR, FONT } from "../../lib/theme";

const SECTIONS = ["Executive summary", "Trace integrity", "Violations & resolutions", "Regulatory mapping"];
const TAGS = ["EU AI Act", "MiFID II", "GDPR Art. 22"];

// S5e · Compliance report assembles itself.
export const ProofReport: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <PushIn>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <GlassPanel style={{ width: 720, padding: 48, fontFamily: FONT.display }}>
          <div style={{ color: COLOR.ink, fontSize: 34, fontWeight: 700, marginBottom: 6 }}>
            Compliance Report
          </div>
          <div style={{ color: COLOR.inkDim, fontSize: 18, marginBottom: 30 }}>
            Generated · audit-ready · tamper-evident
          </div>

          {SECTIONS.map((s, i) => {
            const start = 18 + i * 16;
            const p = interpolate(frame, [start, start + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EXPO_OUT });
            return (
              <div
                key={i}
                style={{
                  height: 16,
                  marginBottom: 16,
                  borderRadius: 6,
                  width: `${60 + (i % 2) * 30}%`,
                  background: COLOR.line,
                  opacity: p,
                  transform: `translateX(${(1 - p) * -20}px)`,
                }}
                title={s}
              />
            );
          })}

          <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
            {TAGS.map((t, i) => {
              const p = interpolate(frame, [90 + i * 8, 104 + i * 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return (
                <div
                  key={t}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    border: `1px solid ${COLOR.cyan}`,
                    color: COLOR.cyan,
                    fontSize: 16,
                    fontFamily: FONT.mono,
                    opacity: p,
                    transform: `scale(${0.8 + p * 0.2})`,
                  }}
                >
                  {t}
                </div>
              );
            })}
          </div>
        </GlassPanel>
      </AbsoluteFill>
    </PushIn>
  );
};

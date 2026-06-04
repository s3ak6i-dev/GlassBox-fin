import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { BlurReveal } from "../components/BlurReveal";
import { COLOR, FONT } from "../lib/theme";

// S2 · The Question + violation glitch — 8–15s.
export const SceneQuestion: React.FC = () => {
  const frame = useCurrentFrame();

  // Violation glitch window ~270–300 (local).
  const glitchIn = interpolate(frame, [270, 276], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glitchOut = interpolate(frame, [294, 306], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glitch = glitchIn * (1 - glitchOut);
  const jitter = glitch ? (random(`j${frame}`) - 0.5) * 14 : 0;
  const dim = interpolate(frame, [270, 280], [1, 0.25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <BlurReveal
        text="can you prove what they did?"
        delay={12}
        stagger={4}
        style={{ fontSize: 76, fontWeight: 600, color: COLOR.ink, opacity: dim }}
      />

      {glitch > 0.01 && (
        <div
          style={{
            position: "absolute",
            top: "62%",
            opacity: glitch,
            transform: `translateX(${jitter}px)`,
            fontFamily: FONT.mono,
            fontSize: 34,
            color: COLOR.danger,
            textShadow: `2px 0 ${COLOR.cyan}, -2px 0 ${COLOR.danger}`,
            letterSpacing: "0.04em",
          }}
        >
          ⚠ DECISION_WITHOUT_TRACE
        </div>
      )}
    </AbsoluteFill>
  );
};

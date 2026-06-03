import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BlurReveal } from "../components/BlurReveal";
import { GradientText } from "../components/GradientText";
import { EXPO_OUT } from "../lib/easings";
import { COLOR, FONT } from "../lib/theme";

// S6 · Payoff / CTA — settle to calm.
export const ScenePayoff: React.FC = () => {
  const frame = useCurrentFrame();
  const underline = interpolate(frame, [120, 160], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EXPO_OUT });
  const url = interpolate(frame, [150, 180], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.base, justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 24 }}>
      <GradientText style={{ fontFamily: FONT.display, fontSize: 130, fontWeight: 800, letterSpacing: "-0.04em" }}>
        glassbox
      </GradientText>

      <BlurReveal text="Prove it." delay={40} stagger={4} style={{ fontSize: 44, fontWeight: 600, color: COLOR.ink }} />

      <div style={{ position: "relative", marginTop: 18, opacity: url }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 24, color: COLOR.inkDim }}>
          github.com/s3ak6i-dev/Glassdoor-fin
        </span>
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: -8,
            height: 2,
            width: `${underline * 100}%`,
            background: COLOR.cyan,
            boxShadow: `0 0 10px ${COLOR.cyan}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

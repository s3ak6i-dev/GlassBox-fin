import { AbsoluteFill } from "remotion";
import { BlurReveal } from "../components/BlurReveal";
import { GradientText } from "../components/GradientText";
import { COLOR, FONT } from "../lib/theme";

// S4 · Tagline — 24–28s.
export const SceneTagline: React.FC = () => (
  <AbsoluteFill
    style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 28 }}
  >
    <GradientText
      style={{ fontFamily: FONT.display, fontSize: 96, fontWeight: 800, letterSpacing: "-0.04em" }}
    >
      glassbox
    </GradientText>
    <BlurReveal
      text="Real-time compliance for financial AI."
      delay={6}
      stagger={3}
      style={{ fontSize: 40, fontWeight: 500, color: COLOR.inkDim }}
    />
  </AbsoluteFill>
);

import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { GradientText } from "../components/GradientText";
import { SPRING_PANEL } from "../lib/easings";
import { COLOR, FONT } from "../lib/theme";

const HIT = 30; // ½-beat of black silence, then the drop.

// S3 · Logo reveal — 15–24s. The drop.
export const SceneLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({ frame: frame - HIT, fps, config: SPRING_PANEL });
  const scale = interpolate(s, [0, 1], [0.86, 1]); // settles with overshoot via spring
  const appear = interpolate(frame, [HIT, HIT + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Left→right mask wipe forming the wordmark.
  const wipe = interpolate(frame, [HIT, HIT + 22], [100, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // White bloom flash on the hit frame.
  const flash = interpolate(frame, [HIT, HIT + 8], [0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Black silence cover before the hit.
  const cover = interpolate(frame, [HIT - 2, HIT + 2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const glow = interpolate(frame, [HIT, HIT + 40], [0, 60], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          transform: `scale(${scale})`,
          opacity: appear,
          clipPath: `inset(0 ${wipe}% 0 0)`,
          filter: `drop-shadow(0 0 ${glow}px rgba(249,97,123,0.35))`,
        }}
      >
        <GradientText
          style={{
            fontFamily: FONT.display,
            fontSize: 220,
            fontWeight: 800,
            letterSpacing: "-0.04em",
          }}
        >
          glassbox
        </GradientText>
      </div>

      {/* bloom flash */}
      <AbsoluteFill style={{ background: "white", opacity: flash, pointerEvents: "none" }} />
      {/* black silence cover */}
      <AbsoluteFill style={{ background: COLOR.base, opacity: cover, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

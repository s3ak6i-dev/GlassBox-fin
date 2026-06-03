import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Typewriter } from "../components/Typewriter";
import { EXPO_OUT } from "../lib/easings";
import { COLOR, FONT } from "../lib/theme";

// S1 · The Fear — 0–8s. Black, a cursor, one slow line that blurs away.
export const SceneCursor: React.FC = () => {
  const frame = useCurrentFrame();
  // Blur the whole line out at the end (410–470).
  const out = interpolate(frame, [410, 470], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EXPO_OUT,
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLOR.base,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity: 1 - out,
          filter: `blur(${out * 16}px)`,
          transform: `translateY(${out * -24}px)`,
          fontFamily: FONT.mono,
          fontSize: 46,
          color: COLOR.ink,
          letterSpacing: "-0.01em",
        }}
      >
        <Typewriter text="your AI agents are making decisions." startFrame={36} framesPerChar={1.6} />
      </div>
    </AbsoluteFill>
  );
};

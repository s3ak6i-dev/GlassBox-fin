import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { EXPO_OUT } from "../lib/easings";
import { COLOR } from "../lib/theme";

/** Expanding ring on an impact frame. */
export const Shockwave: React.FC<{
  startFrame: number;
  duration?: number;
  maxSize?: number;
  color?: string;
}> = ({ startFrame, duration = 34, maxSize = 1700, color = COLOR.coral }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EXPO_OUT,
  });
  if (p <= 0 || p >= 1) return null;
  const size = p * maxSize;
  const opacity = (1 - p) * 0.6;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", pointerEvents: "none" }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: `${interpolate(p, [0, 1], [6, 1])}px solid ${color}`,
          opacity,
          boxShadow: `0 0 60px ${color}`,
        }}
      />
    </AbsoluteFill>
  );
};

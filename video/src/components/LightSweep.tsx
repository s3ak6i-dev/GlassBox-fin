import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { EXPO_OUT } from "../lib/easings";

/** A specular sheen that sweeps across the parent — premium "glint". */
export const LightSweep: React.FC<{
  delay?: number;
  duration?: number;
  angle?: number;
  width?: number;
  strength?: number;
}> = ({ delay = 0, duration = 36, angle = 18, width = 26, strength = 0.4 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + duration], [-30, 130], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EXPO_OUT,
  });
  const visible = frame >= delay && frame <= delay + duration;
  if (!visible) return null;
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: "-50%",
          left: `${p}%`,
          width: `${width}%`,
          height: "200%",
          transform: `rotate(${angle}deg)`,
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,${strength}), transparent)`,
          filter: "blur(10px)",
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};

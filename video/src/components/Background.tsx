import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLOR } from "../lib/theme";

/** Base near-black with two slow-drifting amber/coral glows for depth. */
export const Background: React.FC<{ glow?: number }> = ({ glow = 0.18 }) => {
  const frame = useCurrentFrame();
  const x1 = interpolate(frame, [0, 4200], [20, 40]);
  const y1 = interpolate(frame, [0, 4200], [30, 20]);
  const x2 = interpolate(frame, [0, 4200], [80, 65]);
  const y2 = interpolate(frame, [0, 4200], [70, 80]);
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.base }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(40% 40% at ${x1}% ${y1}%, rgba(240,180,41,${glow}), transparent 70%),
                       radial-gradient(40% 40% at ${x2}% ${y2}%, rgba(249,97,123,${glow}), transparent 70%)`,
          filter: "blur(40px)",
        }}
      />
    </AbsoluteFill>
  );
};

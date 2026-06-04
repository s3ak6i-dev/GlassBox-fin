import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";
import { COLOR } from "../lib/theme";

/** Slow-drifting dust/embers with parallax depth — ambient life. */
export const Particles: React.FC<{ count?: number }> = ({ count = 60 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      {Array.from({ length: count }).map((_, i) => {
        const depth = random(`d${i}`); // 0 far → 1 near
        const size = 1 + depth * 3.5;
        const speed = 0.15 + depth * 0.6;
        const x0 = random(`x${i}`) * width;
        const drift = Math.sin(frame / (60 + depth * 80) + i) * (8 + depth * 22);
        const y = ((random(`y${i}`) * height - frame * speed) % (height + 40) + height + 40) % (height + 40);
        const tint = random(`t${i}`) > 0.5 ? COLOR.amber : COLOR.coral;
        const opacity = (0.06 + depth * 0.22) * (0.6 + 0.4 * Math.sin(frame / 30 + i));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x0 + drift,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: tint,
              opacity,
              filter: `blur(${depth < 0.4 ? 1.5 : 0.5}px)`,
              boxShadow: `0 0 ${4 + depth * 8}px ${tint}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

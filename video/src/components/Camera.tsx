import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FRAMES_PER_BEAT } from "../lib/beats";

/**
 * A virtual camera so the whole film is alive: continuous low-frequency drift +
 * gentle breathing zoom + a tiny pulse on every beat. Subtle on purpose — it
 * reads as "filmed", not "wobbly".
 */
export const Camera: React.FC<{ children: React.ReactNode; intensity?: number }> = ({
  children,
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const driftX = Math.sin(frame / 130) * 10 * intensity;
  const driftY = Math.cos(frame / 165) * 7 * intensity;
  const rot = Math.sin(frame / 220) * 0.15 * intensity;
  const breathe = 1 + Math.sin(frame / 95) * 0.006 * intensity;

  // crisp pop right on each beat, decaying fast
  const phase = frame % FRAMES_PER_BEAT;
  const pulse = Math.max(0, 1 - phase / 10) * 0.006 * intensity;

  const scale = breathe + pulse;
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${driftX}px, ${driftY}px) rotate(${rot}deg) scale(${scale})`,
        transformOrigin: "50% 50%",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

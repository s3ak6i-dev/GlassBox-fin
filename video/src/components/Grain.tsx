import { AbsoluteFill, useCurrentFrame } from "remotion";

/** Animated film grain — the single biggest "filmic, not flat-CG" upgrade. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.06 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{ mixBlendMode: "overlay", opacity, pointerEvents: "none" }}
    >
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            seed={frame % 16}
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { COLOR } from "../lib/theme";
import { GlassCube } from "./GlassCube";

// Act timeline (full-comp frames): the cube clarifies on the drop (~logo start).
const DROP = 15 * 60; // 900

/** The hero cube as an act-aware background layer behind all 2D content. */
export const CubeLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // black monolith → clarified glass at the drop
  const clarity = interpolate(frame, [DROP - 30, DROP + 40], [0.04, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // tint: danger-red (fear) → amber (brand) across the drop
  const tint = interpolateColors(frame, [DROP - 30, DROP + 30], [COLOR.danger, COLOR.amber]);

  // glow: dim ember in Act I → bright on drop → dimmed during the proof montage
  const glow = interpolate(
    frame,
    [0, DROP - 30, DROP + 20, 28 * 60, 60 * 60, 64 * 60],
    [0.15, 0.2, 2.2, 1.2, 1.2, 2.0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // pull the cube back / dim during the proof UI so panels read
  const layerOpacity = interpolate(
    frame,
    [28 * 60, 30 * 60, 59 * 60, 61 * 60],
    [1, 0.45, 0.45, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const camZ = interpolate(frame, [0, DROP, 70 * 60], [6.6, 5.6, 6.0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: layerOpacity }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 0, camZ], fov: 35 }}
        gl={{ antialias: true }}
        style={{ background: "transparent" }}
      >
        <GlassCube clarity={clarity} tint={tint} glow={glow} />
      </ThreeCanvas>

      {/* halation / bloom bloom from the cube */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          mixBlendMode: "screen",
          opacity: clarity * 0.5,
          background: "radial-gradient(38% 38% at 50% 50%, rgba(249,150,80,0.28), transparent 72%)",
        }}
      />
    </AbsoluteFill>
  );
};

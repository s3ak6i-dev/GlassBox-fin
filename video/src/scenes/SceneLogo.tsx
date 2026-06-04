import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { GradientText } from "../components/GradientText";
import { LightSweep } from "../components/LightSweep";
import { Shockwave } from "../components/Shockwave";
import { SPRING_BOUNCE } from "../lib/easings";
import { COLOR, FONT } from "../lib/theme";

const HIT = 16; // black silence, then the drop
const WORD = "glassbox";
const SIZE = 220;
const WEIGHT = 800;

const wordStyle: React.CSSProperties = {
  fontFamily: FONT.display,
  fontSize: SIZE,
  fontWeight: WEIGHT,
  letterSpacing: "-0.04em",
  position: "absolute",
  whiteSpace: "nowrap",
};

// S3 · Logo reveal — the drop. Hash blocks assemble → wordmark slams in with
// RGB-split, shockwave, velocity blur and a specular sweep.
export const SceneLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // assembling hash-chain blocks before the hit
  const blocks = 8;

  const s = spring({ frame: frame - HIT, fps, config: SPRING_BOUNCE });
  const scale = interpolate(s, [0, 1], [0.7, 1]);
  const appear = interpolate(frame, [HIT, HIT + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const velBlur = interpolate(frame, [HIT, HIT + 14], [34, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const wipe = interpolate(frame, [HIT, HIT + 20], [100, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const split = interpolate(frame, [HIT, HIT + 22], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flash = interpolate(frame, [HIT, HIT + 9], [0.92, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cover = interpolate(frame, [HIT - 3, HIT + 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glow = interpolate(frame, [HIT, HIT + 50], [0, 70], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* assembling hash blocks (pre-hit) */}
      {frame < HIT + 4 &&
        Array.from({ length: blocks }).map((_, i) => {
          const bs = spring({ frame: frame - i * 1.5, fps, config: { stiffness: 200, damping: 16 } });
          const targetX = (i - (blocks - 1) / 2) * 70;
          const fromX = targetX + (random(`bx${i}`) - 0.5) * 600;
          const x = interpolate(bs, [0, 1], [fromX, targetX]);
          const o = interpolate(frame, [0, 6, HIT - 2, HIT + 2], [0, 1, 1, 0], { extrapolateRight: "clamp" });
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 46,
                height: 46,
                borderRadius: 12,
                background: "rgba(240,180,41,0.18)",
                border: `1.5px solid ${COLOR.amber}`,
                transform: `translateX(${x}px) scale(${interpolate(bs, [0, 1], [0.4, 1])})`,
                opacity: o,
                boxShadow: `0 0 18px rgba(240,180,41,0.4)`,
              }}
            />
          );
        })}

      {/* the wordmark, RGB-split + velocity blur */}
      <div
        style={{
          position: "relative",
          transform: `scale(${scale})`,
          opacity: appear,
          filter: `blur(${velBlur}px) drop-shadow(0 0 ${glow}px rgba(249,97,123,0.35))`,
          clipPath: `inset(0 ${wipe}% 0 0)`,
          width: SIZE * 4.2,
          height: SIZE * 1.2,
        }}
      >
        <span style={{ ...wordStyle, color: "#ff2d6b", opacity: 0.7, transform: `translateX(${-split}px)`, mixBlendMode: "screen", left: 0, top: 0 }}>
          {WORD}
        </span>
        <span style={{ ...wordStyle, color: "#1ce6ff", opacity: 0.7, transform: `translateX(${split}px)`, mixBlendMode: "screen", left: 0, top: 0 }}>
          {WORD}
        </span>
        <GradientText style={{ ...wordStyle, left: 0, top: 0 }}>{WORD}</GradientText>
      </div>

      <Shockwave startFrame={HIT} />
      <LightSweep delay={HIT + 16} duration={30} strength={0.5} />

      {/* bloom flash + black silence cover */}
      <AbsoluteFill style={{ background: "white", opacity: flash, pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: COLOR.base, opacity: cover, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

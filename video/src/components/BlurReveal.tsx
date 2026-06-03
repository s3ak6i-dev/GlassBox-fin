import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EXPO_OUT } from "../lib/easings";
import { FONT, TRACKING } from "../lib/theme";

/** Word-by-word blur-up reveal — the house text entrance. */
export const BlurReveal: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, stagger = 3, duration = 18, style }) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0.28em",
        fontFamily: FONT.display,
        letterSpacing: TRACKING,
        ...style,
      }}
    >
      {words.map((word, i) => {
        const start = delay + i * stagger;
        const p = interpolate(frame, [start, start + duration], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EXPO_OUT,
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              filter: `blur(${(1 - p) * 12}px)`,
              transform: `translateY(${(1 - p) * 22}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

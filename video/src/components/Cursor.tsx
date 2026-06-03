import React from "react";
import { useCurrentFrame } from "remotion";
import { COLOR } from "../lib/theme";

/** Blinking amber block cursor (blinks twice per beat at 120bpm). */
export const Cursor: React.FC<{ height?: number; color?: string }> = ({
  height = 56,
  color = COLOR.amber,
}) => {
  const frame = useCurrentFrame();
  const on = frame % 30 < 16;
  return (
    <span
      style={{
        display: "inline-block",
        width: height * 0.5,
        height,
        background: color,
        opacity: on ? 1 : 0,
        boxShadow: `0 0 18px ${color}`,
        marginLeft: 6,
        verticalAlign: "middle",
      }}
    />
  );
};

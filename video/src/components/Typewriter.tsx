import React from "react";
import { useCurrentFrame } from "remotion";
import { Cursor } from "./Cursor";

/** Monospace typewriter. framesPerChar controls cadence. */
export const Typewriter: React.FC<{
  text: string;
  startFrame?: number;
  framesPerChar?: number;
  style?: React.CSSProperties;
  showCursor?: boolean;
  cursorHeight?: number;
}> = ({ text, startFrame = 0, framesPerChar = 1.6, style, showCursor = true, cursorHeight = 44 }) => {
  const frame = useCurrentFrame();
  const shown = Math.max(0, Math.min(text.length, Math.floor((frame - startFrame) / framesPerChar)));
  return (
    <span style={style}>
      {text.slice(0, shown)}
      {showCursor && <Cursor height={cursorHeight} />}
    </span>
  );
};

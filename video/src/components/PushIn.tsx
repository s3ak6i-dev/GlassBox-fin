import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

/** Slow continuous Ken-Burns push so no shot is ever truly static. */
export const PushIn: React.FC<{
  children: React.ReactNode;
  from?: number;
  to?: number;
}> = ({ children, from = 1, to = 1.03 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [from, to], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>{children}</AbsoluteFill>
  );
};

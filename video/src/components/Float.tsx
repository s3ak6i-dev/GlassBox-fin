import { useCurrentFrame } from "remotion";

/** Gentle continuous 3D tilt + bob so panels feel alive and have depth. */
export const Float: React.FC<{ children: React.ReactNode; amount?: number }> = ({
  children,
  amount = 1,
}) => {
  const frame = useCurrentFrame();
  const rotX = Math.sin(frame / 85) * 1.3 * amount;
  const rotY = Math.cos(frame / 105) * 1.8 * amount;
  const y = Math.sin(frame / 70) * 7 * amount;
  return (
    <div
      style={{
        transform: `perspective(1400px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(${y}px)`,
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </div>
  );
};

import React from "react";
import { GRADIENT } from "../lib/theme";

export const GradientText: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  gradient?: string;
}> = ({ children, style, gradient = GRADIENT }) => (
  <span
    style={{
      backgroundImage: gradient,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      WebkitTextFillColor: "transparent",
      ...style,
    }}
  >
    {children}
  </span>
);

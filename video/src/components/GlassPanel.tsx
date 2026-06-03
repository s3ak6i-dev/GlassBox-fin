import React from "react";
import { COLOR } from "../lib/theme";

export const GlassPanel: React.FC<{
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.04)",
      border: `1px solid ${COLOR.line}`,
      borderRadius: 18,
      backdropFilter: "blur(24px)",
      boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
      ...style,
    }}
  >
    {children}
  </div>
);

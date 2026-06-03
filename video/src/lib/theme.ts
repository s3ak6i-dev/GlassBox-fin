// Visual tokens — mirror the glassbox app's design system.

export const COLOR = {
  base: "#06080d",
  ink: "#eef2f8",
  inkDim: "#7d8794",
  amber: "#f0b429",
  coral: "#f9617b",
  cyan: "#22d3ee",
  danger: "#ff5a5a",
  line: "rgba(255,255,255,0.08)",
  glass: "rgba(255,255,255,0.03)",
} as const;

// The signature amber → coral gradient (top → bottom).
export const GRADIENT_STOPS = ["#f0b429", "#f59e42", "#f97362", "#f9617b"];
export const GRADIENT = `linear-gradient(180deg, ${GRADIENT_STOPS.join(", ")})`;
export const GRADIENT_H = `linear-gradient(90deg, ${GRADIENT_STOPS.join(", ")})`;

export const FONT = {
  display: "Inter, system-ui, sans-serif", // swap for 'PP Neue Montreal' later
  mono: "'JetBrains Mono', 'SF Mono', monospace",
} as const;

export const TRACKING = "-0.02em";

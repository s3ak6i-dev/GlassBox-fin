import { Easing } from "remotion";

// House easing curves — use these everywhere for a consistent premium feel.
export const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1); // entrances: fast in, long settle
export const POWER_OUT = Easing.bezier(0.22, 1, 0.36, 1);
export const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const OUT_CUBIC = Easing.out(Easing.cubic);

// Spring presets (pass to remotion's spring({config})).
export const SPRING_PANEL = { stiffness: 100, damping: 14, mass: 1 } as const;
export const SPRING_POP = { stiffness: 200, damping: 12, mass: 0.8 } as const;
export const SPRING_SOFT = { stiffness: 60, damping: 16, mass: 1 } as const;

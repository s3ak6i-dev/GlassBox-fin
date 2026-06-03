// Tempo grid — everything snaps to the music so cuts land on the beat.

export const FPS = 60;
export const BPM = 120;
export const FRAMES_PER_BEAT = Math.round((60 / BPM) * FPS); // 30
export const FRAMES_PER_BAR = FRAMES_PER_BEAT * 4; // 120 = 2s

export const TOTAL_FRAMES = 4200; // 70s

/** Frame at beat n (0-indexed). */
export const beat = (n: number) => Math.round(n * FRAMES_PER_BEAT);
/** Frame at bar n (0-indexed). */
export const bar = (n: number) => Math.round(n * FRAMES_PER_BAR);
/** Convert seconds → frames. */
export const sec = (s: number) => Math.round(s * FPS);

// Scene cut points (frames) — see STORYBOARD.md beat map.
export const SCENES = {
  cursor: { from: 0, duration: sec(8) }, // 0–8s
  question: { from: sec(8), duration: sec(7) }, // 8–15s
  logo: { from: sec(15), duration: sec(9) }, // 15–24s
  tagline: { from: sec(24), duration: sec(4) }, // 24–28s
  proof: { from: sec(28), duration: sec(32) }, // 28–60s
  payoff: { from: sec(60), duration: sec(10) }, // 60–70s
} as const;

// Proof sub-scene offsets are RELATIVE to the proof sequence start.
export const PROOF = {
  traces: { from: 0, duration: sec(6) },
  hold: { from: sec(6), duration: sec(6) },
  hash: { from: sec(12), duration: sec(6) },
  fleet: { from: sec(18), duration: sec(6) },
  report: { from: sec(24), duration: sec(8) },
} as const;

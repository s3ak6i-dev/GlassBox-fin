// Tempo grid — everything snaps to the music so cuts land on the beat.

export const FPS = 60;
export const BPM = 120;
export const FRAMES_PER_BEAT = Math.round((60 / BPM) * FPS); // 30
export const FRAMES_PER_BAR = FRAMES_PER_BEAT * 4; // 120 = 2s

/** Frame at beat n (0-indexed). */
export const beat = (n: number) => Math.round(n * FRAMES_PER_BEAT);
/** Frame at bar n (0-indexed). */
export const bar = (n: number) => Math.round(n * FRAMES_PER_BAR);
/** Convert seconds → frames. */
export const sec = (s: number) => Math.round(s * FPS);

// Cross-scene transition length (overlap between adjacent scenes).
export const TR = 16;

const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

// Proof sub-scene durations (frames). Inner TransitionSeries length below.
export const PROOF_DUR = {
  traces: 360,
  hold: 360,
  hash: 360,
  fleet: 360,
  report: 480,
} as const;
export const PROOF_TOTAL = sum(PROOF_DUR) - 4 * TR; // 1856

// Top-level scene durations. `proof` must equal PROOF_TOTAL.
export const SCENE_DUR = {
  cursor: 480,
  question: 420,
  logo: 540,
  tagline: 240,
  proof: PROOF_TOTAL,
  payoff: 600,
} as const;

// Final composition length once transition overlaps are subtracted.
export const TOTAL_FRAMES = sum(SCENE_DUR) - 5 * TR; // 4056

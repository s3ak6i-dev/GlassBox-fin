// Frame-accurate SFX cue map. Drop files into public/audio/ and flip
// AUDIO_ENABLED on once they exist (missing files break renders, so it's off
// by default to keep the studio runnable on a fresh clone).

export const AUDIO_ENABLED = false;

export type Cue = { file: string; frame: number; volume?: number; loop?: boolean };

export const CUES: Cue[] = [
  { file: "audio/drone_bed.mp3", frame: 0, volume: 0.5, loop: true },
  { file: "audio/riser.mp3", frame: 780, volume: 0.7 },
  { file: "audio/boom_impact.mp3", frame: 930, volume: 1.0 },
  { file: "audio/music_main.mp3", frame: 930, volume: 0.8 },
  { file: "audio/click.mp3", frame: 2040, volume: 0.8 },
  { file: "audio/confirm_chime.mp3", frame: 2046, volume: 0.6 },
  { file: "audio/whoosh_low.mp3", frame: 2760, volume: 0.7 },
  { file: "audio/resolve_pad.mp3", frame: 3600, volume: 0.6 },
];

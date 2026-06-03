# Audio assets

Drop the SFX/music here, then set `AUDIO_ENABLED = true` in `src/lib/audio.ts`.
Files are placed on exact frames by `src/components/AudioTrack.tsx` (see the cue
sheet in `../../STORYBOARD.md`).

Expected files:
- `drone_bed.mp3` — Act I ambient (loops)
- `riser.mp3` — build into the logo drop
- `boom_impact.mp3` — the logo hit
- `music_main.mp3` — main track (kicks in at the drop)
- `click.mp3`, `confirm_chime.mp3` — Approve interaction
- `whoosh_low.mp3` — fleet zoom-out
- `resolve_pad.mp3` — payoff

Sources: Artlist / Epidemic Sound / Musicbed (premium), or Freesound (free).
Master the final mix to ~-14 LUFS.

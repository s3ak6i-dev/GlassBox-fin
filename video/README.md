# Glassbox — Launch Film (Remotion)

A premium, code-driven launch film for glassbox·fin. See
**[STORYBOARD.md](STORYBOARD.md)** for the full beat sheet, timing, and audio cues.

## Run

```bash
cd video
npm install
npm run studio        # open the Remotion studio at http://localhost:3000
```

Render:
```bash
npm run render            # 1920x1080 -> out/glassbox-launch.mp4
npm run render:vertical   # 1080x1920 social cut
```

## Structure

```
src/
  Root.tsx            # registers compositions (GlassboxLaunch, ...Vertical)
  Main.tsx            # stitches all scenes + global film layers
  lib/
    theme.ts          # colors, gradient, fonts (mirror the app)
    easings.ts        # house easing curves + spring presets
    beats.ts          # tempo grid (120bpm/60fps) + scene cut points
    audio.ts          # frame-accurate SFX cue map (AUDIO_ENABLED flag)
    fonts.ts          # webfont registration
  components/         # Grain, Vignette, Background, GradientText, BlurReveal,
                      # GlassPanel, Cursor, Typewriter, PushIn, AudioTrack
  scenes/
    SceneCursor       # S1 the fear
    SceneQuestion     # S2 the question + violation glitch
    SceneLogo         # S3 the drop (logo reveal)
    SceneTagline      # S4 tagline
    SceneProof        # S5 proof montage ->
      proof/ProofTraces, ProofHold, ProofHash, ProofFleet, ProofReport
    ScenePayoff       # S6 CTA
```

## Editing tips

- All timing lives in `lib/beats.ts` — change cut points there, scenes follow.
- Keep every entrance on `EXPO_OUT` or a spring preset for a consistent feel.
- Cuts should land on the beat (multiples of 30 frames at 120bpm).
- Audio is off until you add files to `public/audio/` and flip `AUDIO_ENABLED`.

## TODO / polish
- Add real audio (the single biggest quality jump — see STORYBOARD cue sheet).
- Swap Inter → PP Neue Montreal once licensed.
- Add whoosh-wipe transitions between proof sub-scenes (`@remotion/transitions`).
- Replace stylized proof panels with captures of the real app UI where it reads better.

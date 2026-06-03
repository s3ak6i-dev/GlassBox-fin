# Glassbox — Launch Film · Storyboard & Beat Sheet

> Creative thesis: **"A black box, made of glass."** Open on opacity and fear;
> resolve to transparency and control. Amber-warm, frosted, exact — scored like
> a product launch, not a tutorial.

## Spec

| | |
|---|---|
| Resolution | 1920×1080 (hero) · 1080×1920 + 1080×1080 cuts later |
| Frame rate | **60 fps** (motion blur on) |
| Length | **70 s = 4200 frames** |
| Tempo | **120 bpm** → 1 beat = 30 frames · 1 bar = 120 frames = 2 s |
| Voiceover | none (text + music, "Apple" style) |
| Master | ~-14 LUFS, headroom for the sub-bass hits |

## House style (locked, never deviate)

- **Easing**: entrances `EXPO_OUT` `cubic-bezier(0.16,1,0.3,1)`; physical objects `spring` (stiffness 100, damping 14); accents overshoot ~4%.
- **Color**: base `#06080d` · gradient amber `#f0b429` → coral `#f9617b` · accent cyan `#22d3ee` (verified/live only) · danger red `#ff5a5a` (Act I only).
- **Type**: Inter Display (swap to PP Neue Montreal later), tracking −2%, animate weight + blur, never plain opacity.
- **Always-on layers**: 5% film grain (overlay), vignette, slow ~1.03× push-in on every shot, layered parallax.
- **Discipline**: one hero motion per moment · cut on the downbeat · silence before the reveal.

---

## Beat map (cuts land on ✦)

```
BAR  0    2    4    6    8    10   12   14   16   18   20   22   24   28   32   35
     |----ACT I: FEAR----|--TURN--|---------ACT III: PROOF---------|--PAYOFF--|
sec  0    4    8    12   16   20   24   28   32   40   48   52   56   60   64   70
     ✦cursor   ✦question ✦SILENCE✦BOOM   ✦tagline ✦trace ✦hold ✦hash ✦fleet ✦pdf ✦logo
```

---

## Scene breakdown

### S1 · Cursor / The Fear — `0–8s` `frames 0–480`
- **Visual**: pure `#06080d`. A single amber block cursor blinks (every 30f). Ambient drone fades in.
- **Action**: at 1s, type line 1 — `your AI agents are making decisions.` ~28f/char cadence feel (mono), finishing ~5s. Hold. At ~7s it **blurs up and out** (blur 0→14px, y −24, opacity→0), EXPO_OUT.
- **Motion**: nothing else moves. Let it breathe.
- **Audio**: drone bed; soft mechanical key *tick* on each character (rides hi-hat pocket).

### S2 · The Question + Violation glitch — `8–15s` `frames 480–900`
- **Visual**: line 2 blur-reveals word-by-word (50ms stagger) — `can you prove what they did?`
- **At ~13s**: a **red violation** glitches across the void — `⚠ DECISION_WITHOUT_TRACE` flickers with chromatic-aberration + scanline jitter for ~12 frames, then snaps to black. Tension peak.
- **Audio**: riser/swell begins (~2.5s build), a glitch *zap* on the red flash.

### S3 · SILENCE → Logo Reveal — `15–24s` `frames 900–1440`
- **15.0–15.5s**: **total silence + black** (½ beat). The power move.
- **15.5s — THE DROP**: hash-chain links snap together L→R (6–8 small rounded blocks, spring, 60ms stagger) and resolve into the **GLASSBOX** wordmark. On the hit frame:
  - sub-bass **BOOM**, a 2-frame white **bloom flash** (opacity 0.8→0), gradient ignites amber→coral, scale overshoots 1.05→1.0 (spring).
- **Hold** the mark, slow push-in, gradient subtly sweeps.
- **Audio**: silence → **boom** + impact + the music's main loop kicks in here.

### S4 · Tagline — `24–28s` `frames 1440–1680`
- **Visual**: under the (now smaller, top-anchored) mark, tagline blur-reveals: *Real-time compliance for financial AI.*
- **Audio**: music rides; one soft *tick* as the line lands.

### S5 · The Proof (montage) — `28–60s` `frames 1680–3600`
Cut on the beat, each ~5–6s, continuous push-in + parallax. All on glass panels.

- **S5a · Traces stream** `28–34s` — terminal/CLI match-cut from cursor: rows of trace steps stream in (stagger 60ms), the **amber→coral GLASSBOX CLI banner** visible. UI *ticks* per row.
- **S5b · Hold + Approve** `34–40s` — a hold card pulses amber (`tnode-flash`), "agent paused mid-decision." Cursor moves, clicks **Approve** → card slides out left, cyan ✓. *The emotional hook.* Click SFX + soft confirm chime.
- **S5c · Hash chain verify** `40–46s` — zoom into the step list; a cascade of green/cyan `✓` runs top→bottom (40ms stagger) — "tamper-evident." Rising tick arpeggio synced to the cascade.
- **S5d · Fleet graph** `46–52s` — zoom *out*; the D3 fleet topology blooms (nodes spring in, edges draw on), revealing scale. Low whoosh on the zoom-out.
- **S5e · Report assembles** `52–60s` — a compliance PDF builds itself (sections stamp in), EU AI Act / MiFID II references highlight. Paper *shuffle* + stamp SFX.

### S6 · Payoff / CTA — `60–70s` `frames 3600–4200`
- Everything settles to `#06080d`. Wordmark re-centers (calm). Tagline: **Glassbox. Prove it.**
- CTA + URL fade up; cyan underline draws on. Final soft pad note resolves.
- **Audio**: music resolves, sub-bass tail, silence.

---

## SFX cue sheet (frame-accurate — place via Remotion `<Audio>`)

| Frame | Sound | Notes |
|---|---|---|
| 0 | drone_bed.mp3 (loop) | fade in over 60f |
| 60–300 | key_tick × N | one per typed char |
| 780 | riser.mp3 | 2.5s build into the drop |
| 900–930 | (silence) | duck everything |
| 930 | boom_impact.mp3 + music_main.mp3 | THE hit; bloom flash on same frame |
| 1680 | ui_tick | tagline land |
| 1680–2040 | ui_tick × rows | trace stream |
| 2040 | click + confirm_chime | Approve |
| 2400–2520 | tick_arp (rising) | hash cascade |
| 2760 | whoosh_low | fleet zoom-out |
| 3120 | paper_stamp ×3 | report build |
| 3600 | resolve_pad | payoff |

## Asset checklist
- [ ] `public/audio/` — drone, riser, boom, music_main, whooshes, ui_tick, click, confirm, tick_arp, paper_stamp, resolve_pad
- [ ] `public/grain.mp4` (or SVG turbulence — included) for film grain
- [ ] Font: Inter (via @remotion/google-fonts) → later PP Neue Montreal
- [ ] Real UI captures or rebuilt components for S5a–e (reuse app/frontend components)

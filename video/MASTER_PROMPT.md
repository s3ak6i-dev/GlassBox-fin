# GLASSBOX — Launch Film · MASTER PROMPT (Director's Bible)

> A production-grade creative bible for the glassbox·fin launch film. Written to
> be handed to a CG/motion studio, driven through Remotion + React-Three-Fiber,
> or decomposed into shot prompts for an AI video tool. Every lens, light, grade,
> font, material, motion curve, frequency, and beat is specified.
>
> **Tone target:** the restraint of Apple, the craft of ManvsMachine / Buck /
> Territory Studio, the sci-fi materiality of *Blade Runner 2049* and *Tron:
> Legacy*, the editorial confidence of a Vercel/Stripe launch. Cinema, not a demo.

---

## 0. DIRECTOR'S STATEMENT

We are filming a single idea: **trust you can see.** Financial AI makes decisions
in the dark — a *black box*. Our film takes that black box and, in one breath of
light and sound, turns it to **glass**. The audience should feel the shift in
their chest: dread → clarity → calm. We earn that with restraint. Long, confident
holds. Real darkness. One immaculate motion at a time. Then a drop that lands like
a held breath finally released.

**Emotional curve:** unease (0–15s) → revelation (15–24s) → quiet confidence
(24–60s) → resolution (60–70s). The product is never "shown"; it is *revealed*.

---

## 1. CINEMATIC LANGUAGE (the look)

### 1.1 Format & lens
- **Aspect:** master **2.39:1 anamorphic** for the hero (letterboxed within
  1920×1080), with protected-center 16:9, 1:1, and 9:16 reframes.
- **Virtual lens:** anamorphic character — **subtle horizontal flares** (tasteful,
  not JJ-Abrams), **oval bokeh**, gentle barrel breathing on focus pulls. Primary
  focal lengths: **35–50mm** for intimacy on the cube, **85mm** for compression on
  product detail, a single **24mm** push for the fleet reveal.
- **Depth of field:** shallow, cinematic. **Rack-focus** between foreground
  particulate and the cube; defocus background glows to creamy oval bokeh.
- **Shutter:** 180° equivalent — real motion blur on every move.

### 1.2 Lighting (motivated, the cube is a practical)
- The **cube is the key light** — a warm amber→coral source that lights the scene
  it sits in. Everything else is **negative fill** (deep shadow).
- **Rim/edge light** on the cube's bevels (cool cyan kicker on the shadow side for
  separation — used sparingly, the "verified" color).
- **Volumetric haze**: a low fog so light *rays* read — godrays raking from the
  cube's edges, beams catching dust. Atmosphere = depth = premium.
- **Contrast ratio** high (chiaroscuro). Protect true blacks; let highlights bloom.

### 1.3 Color science / grade
- **Base grade:** warm-amber highlights over **near-black, slightly desaturated
  shadows** (avoid the teal-orange cliché — keep shadows neutral/cool-neutral, not
  teal). Controlled saturation; the only saturated hits are the brand gradient and
  the cyan ✓.
- **Film emulation:** **Kodak 2383 print** feel — gentle S-curve, rich toe,
  **halation** glowing around the brightest edges, fine **35mm grain** (~5%,
  animated), faint gate-weave (sub-pixel) for organic life.
- **Bloom + diffusion:** a Black Pro-Mist 1/4 vibe — highlights bleed softly.
- **Vignette** ~55%; a **+⅓-stop exposure lift** on each musical downbeat
  (subliminal pulse). Subtle chromatic aberration only at frame edges.

### 1.4 Palette (exact)
| Token | Hex | Role |
|---|---|---|
| Void | `#06080d` | BG — never pure `#000` |
| Ink | `#eef2f8` | primary text |
| Ink dim | `#7d8794` | secondary |
| **Amber** | `#f0b429` | primary brand / key light |
| **Coral** | `#f9617b` | secondary / hot end of gradient |
| Cyan | `#22d3ee` | **verified / live / ✓ only** |
| Danger | `#ff5a5a` | **Act I only** — risk, the black-box state |

**Signature gradient (top→bottom):** `#f0b429 → #f59e42 → #f97362 → #f9617b` — the
cube's inner glow, the wordmark, key headline words, light sweeps.

---

## 2. ★ THE HERO — THE GLASS CUBE (rendered to a feature-VFX bar)

The film's protagonist. A single **monolithic glass cube** that *is* glassbox.
Render it like a hero product object (Apple keynote × *Tron* identity disc).

### 2.1 Form & staging
- One cube, **3/4 hero angle** (a touch above, a touch to the side — three faces
  read), ~45–55% frame height, levitating in a volumetric void above a faint
  reflective floor that catches **caustics**.
- **Rotation:** slow, weighty, on a tilted axis — eased with real **inertia**
  (spring + slight overshoot when it changes speed). ~6–8°/sec. It must feel
  *heavy and precious*, like a held artifact.

### 2.2 Material (physically-based)
- **Architectural frosted glass**: IOR ~1.45, roughness 0.12–0.22, thin-walled so
  we see *into* the volume. **Real refraction + double refraction** through the
  walls.
- **Prismatic edges**: bevels split light into a faint **spectral dispersion**
  (rainbow micro-fringe) and carry the **amber→coral fresnel rim** that intensifies
  at grazing angles.
- **Subsurface / internal volumetrics**: a warm glow suspended inside, soft
  god-rays within the glass, light scattering through haze.
- **Caustics**: moving amber/coral caustic patterns projected on the floor and rear
  haze as it turns. **Specular glints** sweep the faces. **Halation/bloom** on the
  brightest edges. Contact **AO** and a soft reflection on the floor.

### 2.3 What lives inside (the product as architecture)
- A **vertical hash-chain spine** — luminous links, each micro-etched with a hex
  hash (Geist Mono), **cyan ✓ pulses traveling downward** (verification heartbeat).
- **Trace filaments**: thin light threads (agent steps) routing through the volume
  like fiber-optic circuitry — amber = calls, cyan = verified.
- A **pulsing core** (amber→coral) — the heartbeat, pulsing exactly on the beat.
- Event color: a **red ember flicker** = violation (Act I only), resolving to calm.

### 2.4 The cube's arc (the metaphor, in four movements)
1. **Fear** — a **black monolith**: glass fogged to near-opaque obsidian, interior
   a dim red ember, surface scarred by faint glitch. *A black box.*
2. **The Drop** — on the sub-bass hit, the **frost flash-clears** (fog burns
   outward from the core), edges ignite, interior ignites and begins to flow.
   Black box → **glass box.** Halation blooms, caustics spill.
3. **Proof** — the cube **opens / its faces unfold** into floating UI in 3D space
   (trace terminal, hold card, hash spine, fleet graph), then refold. The product
   *lives inside the glass.* Camera can **push through a face** (portal cut).
4. **Resolution** — the cube **re-forms**, pristine and slow, the wordmark
   resolving within it. Calm. Trust.

---

## 3. TYPOGRAPHY AS TITLE DESIGN — **Geist**

Treat type like a film title sequence (Kyle Cooper / Territory restraint).
- **Geist** (variable grotesk) — display. Wordmark/hero **700–800 @ −4% tracking**;
  statements **600 @ −3%**; tagline/sub **500 @ −2%**; body **400–450**. Animate
  **weight (300→800)** and **tracking** as cinematic gestures.
- **Geist Mono** — all data/code/terminal: the CLI banner, hashes, timestamps,
  trace rows, regulation refs. Anchors the film to the real product.
- **Case:** lowercase wordmark `glassbox`; sentence case for emotional lines;
  UPPERCASE wide-tracked micro-labels (`LIVE`, `VERIFYING HASH CHAIN`).
- **Treatment:** type sits *in the world* — it catches the cube's light, casts soft
  shadow, has the same halation/grain as the plate. Never a flat overlay.

---

## 4. DYNAMIC TEXT EFFECTS (one dominant move per shot)

1. **Decode / cipher-settle** — glyphs scramble then resolve (mono). For
   `DECISION_WITHOUT_TRACE`, `LARGE_TRANSFER`, regulation codes.
2. **Per-character spring + blur-to-sharp** — letters rise from defocus, 30–50ms
   stagger. House headline entrance.
3. **Variable-weight morph** — a key word swells Geist 300→800 on the beat
   ("**prove**").
4. **Mask reveal through the cube edge / a light sweep** — type revealed by a moving
   light or the cube's silhouette.
5. **Kinetic beat-pop** — 1.0→1.04→1.0 on the downbeat.
6. **Anamorphic RGB-split** — on impacts, red+cyan offset (horizontal, lens-like)
   decaying 16→0px.
7. **Gradient + specular sweep** — brand gradient travels a word with a glint.
8. **3D extruded / face-mapped** — type extruded onto a rotating cube face, lit and
   refracted with the glass, turning with it.
9. **Magnetic assembly** — scattered glyphs spring into the word (pairs with hash
   blocks forming the logo).
10. **Tracking expand** on holds; 11. **line-mask rise** (tagline/CTA);
   12. **halation glow-pulse** on key words.

---

## 5. MOTION & EDITORIAL

- **Easing:** entrances `cubic-bezier(0.16,1,0.3,1)`; physical objects spring
  (stiffness 100–200, damping 12–18, ~3–5% overshoot). Anticipation +
  follow-through; secondaries lag the lead.
- **Camera as a physical body:** weighted dolly pushes/pulls, gentle handheld-float
  micro-drift (not shaky — *breathing*), **rack focus** between layers, one
  **whip-pan** (motion-blurred + whoosh) to jump product areas. Parallax across
  foreground dust / cube / background glow.
- **Editorial:** Act I breathes (3–5s holds, negative space); Act III is rapid
  (2–4s) but each shot completes one clean motion. **Cut on the downbeat.** Map the
  bars first. Arc: build → build → **silence** → **drop** → ride → resolve.

### Transitions
Gradient **whoosh-wipe** (motion-blurred band) · **match-cuts** (cursor block →
panel; cube face → full UI) · **portal push-through** a cube face · **text-as-mask**
reveals. A **half-beat of pure black + silence** precedes the drop.

---

## 6. SHOT LIST (70s · 2.39:1 · 60fps · 120bpm → beat=30f, bar=2s)

### ACT I — THE FEAR · 0–15s · *slow, cold, breathing*
- **S1 · 0–8s — Cursor / monolith.** 50mm, shallow. Void; a blinking **amber block
  cursor** (Geist Mono) floats in negative space. Behind, the **black-monolith cube**
  looms in soft defocus, a dim red ember pulsing within, faint glitch crawling its
  surface. Rack focus drifts cursor→cube. Type slowly: `your AI agents are making
  decisions.` Hold (let it breathe). It **blurs up and out**. Drone bed + sparse
  key-ticks.
- **S2 · 8–15s — The question.** `can you prove what they did?` (per-char spring +
  defocus). ~13s: a **red violation** *decodes* over the cube —
  `⚠ DECISION_WITHOUT_TRACE` — anamorphic RGB-split + scanline jitter; the cube
  flares red, the haze goes crimson, then **snap to black.** Riser swells into the
  silence.

### THE TURN — THE DROP · 15–24s · *the held breath, released*
- **S3 · 15–24s — Clarification / logo.** **½ beat: pure black, total silence.**
  Then **sub-bass boom (40–60Hz)** — the **frost flash-clears from the core
  outward**, the cube's edges ignite amber→coral, interior ignites and flows,
  **caustics spill** across the floor, godrays rake the haze, **halation blooms**.
  In the same beat, hash blocks **magnetically assemble** into **`glassbox`** (Geist
  800, −4%) — white bloom flash, RGB-split settle, velocity blur, **shockwave ring**,
  a **specular sweep** across the letters. Main musical theme enters on the hit.

### ACT II — THE PROMISE · 24–28s
- **S4 · 24–28s — Tagline.** Cube settles to a slow, confident rotation behind the
  mark. **Line-mask rise:** *Real-time compliance for financial AI.* (Geist 500,
  ink-dim). One soft tick as it lands.

### ACT III — THE PROOF · 28–60s · *confident, rhythmic, cut on beat*
The cube **opens**; its faces become floating UI in 3D (or panels drift out and
refold). 85mm compression on detail; everything lit by the cube; shallow DOF.
- **S5a · 28–34s — Traces.** Push through a face → the **live terminal**: amber→coral
  `glassbox` CLI banner (Geist Mono), trace rows streaming (stagger), counting
  `142 traces · ● LIVE` (cyan). Tactile ticks per row.
- **S5b · 34–40s — Hold + Approve.** A **glass hold card** pulses amber: *agent
  paused mid-decision — `LARGE_TRANSFER · $1,000,000 · MiFID II`.* Cursor travels
  with weight, **clicks Approve**; card slides off with motion blur; a **cyan ✓**
  blooms with halation. *(The human-in-the-loop heartbeat.)* Click + warm confirm
  chime.
- **S5c · 40–46s — Hash verify.** Rack-focus / push **into the cube's hash spine**;
  a cascade of **cyan ✓** runs top→bottom (stagger), `✓ chain intact · 0 tampered`.
  Rising tick arpeggio resolves.
- **S5d · 46–52s — Fleet bloom.** **24mm pull-out**: the topology graph blooms —
  nodes spring in, edges draw on, **luminous packets travel the edges** (live data),
  nodes breathe. Scale revealed. Low whoosh + sub swell.
- **S5e · 52–60s — Report.** A **compliance dossier** assembles itself — sections
  stamp in, **regulation tags decode**: `EU AI Act` · `MiFID II` · `GDPR Art. 22`
  (cyan mono). Paper + stamp foley.

### RESOLUTION — CTA · 60–70s · *calm, earned*
- **S6 · 60–70s.** Everything settles to the void. The **cube re-forms** —
  pristine, slow, perfect — the wordmark resolving within it. **`Prove it.`** ("prove"
  weight-morphs 300→800). CTA + URL rise (line-mask); a **cyan underline draws on**.
  Theme resolves; a long **sub-bass tail**; then silence and a final ember pulse.

---

## 7. SOUND DESIGN (the other 50% — composer/sound-designer grade)

- **Score:** one bespoke, building cue ~100–112bpm — minimal, cinematic electronic
  (Tycho × Jon Hopkins × *Blade Runner 2049* low-end). **The picture is cut to the
  music.**
- **Low end:** the **drop is a 40–60Hz sub-boom with a long tail**; felt, not just
  heard. Major cuts get smaller sub-hits.
- **Riser:** a 2.5–3s filtered swell + reverse-cymbal into the drop; **release into
  silence** at the hit.
- **Texture & foley:** granular glass shimmer as the cube clarifies; airy
  high-freq UI ticks living in the hat pocket; tactile click + warm chime on
  Approve; soft paper/stamp on the report; a faint "glass tone" (struck-crystal
  resonance) on the cube's presence.
- **Space:** wide stereo / binaural; whooshes panned to motion direction;
  everything sits in a long, expensive reverb that ducks under impacts.
- **Silence is a designed element** — the half-beat before the drop is *total*.
- **Mix:** master ~**-14 LUFS** integrated, true-peak −1dB; protect dynamic range
  for the boom.

---

## 8. TECHNICAL SPEC

- **Hero:** 3840×2160 (UHD) master, **2.39:1** active, **60fps**, motion blur on,
  ~70s. Deliver ProRes 422 HQ + H.264/H.265 web.
- **Reframes:** 16:9, 1:1, 9:16 — center-protected.
- **Color:** sRGB/Rec.709 delivery; baked 35mm grain + halation; optional HDR pass.
- **Type:** **Geist + Geist Mono** (open-source, Vercel).

---

## 9. PRODUCTION APPROACH

- **The cube + atmosphere:** real 3D — **React-Three-Fiber / three.js** (or Blender
  Cycles) for PBR glass, refraction, dispersion, volumetrics, caustics. This is the
  cinematic core; do not fake it with CSS.
- **UI + type:** **Remotion** (React) for pixel-perfect Geist UI, the CLI banner,
  trace rows, hold card — composited onto cube faces / floated in the 3D scene.
- **Grade + grain + halation + bloom:** a post pass (Remotion shader layer or
  DaVinci) so everything shares one filmic LUT.
- **AI video tools:** use only for **atmospheric cube/light/mood plates**;
  composite all UI, wordmarks, and legible text in post.

### Per-shot AI plate prompt (template)
> "Cinematic anamorphic 3/4 shot, slow-rotating frosted **glass cube** levitating in
> a near-black volumetric void (`#06080d`), prismatic **amber→coral** edges
> (`#f0b429`→`#f9617b`) with spectral dispersion, warm internal glow and god-rays,
> physically-based refraction, soft moving caustics on a dark reflective floor,
> low haze, floating dust, 35mm grain + halation, shallow depth of field, oval
> bokeh, subtle horizontal lens flare, Kodak 2383 print look, premium product-film
> lighting, 60fps, motion blur — [SHOT-SPECIFIC ACTION]."

---

## 10. DELIVERABLES
1. 70s hero film (2.39:1, sound).
2. 16:9 / 1:1 / 9:16 reframes.
3. A 6–10s **looping glass-cube sting** (web hero / social).
4. Hero stills: the monolith, the drop, the lit cube, proof panels.

---

*The 12 commandments: real darkness · one motion at a time · cut on the beat ·
silence before the drop · the cube is the light · type lives in the world ·
restraint over spectacle · grain & halation always · shallow focus · weighted
camera · cyan means verified · the product is revealed, never shown.*

*Companion: `STORYBOARD.md` (beat sheet) and the Remotion `src/` (palette, 120bpm
grid, text reveals, proof scenes) already encode the foundation.*

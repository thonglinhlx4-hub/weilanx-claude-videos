# ep55-pi · "Số Pi từ đâu ra" · notes

Original Vietnamese script (no source video), 金线一笔风 kit from ep53/ep54, 1920×1080, 30 fps, 4411 frames = 147.0 s.

## Script (scene → line indices in script.src.json)
- hook (0–3): roll a wheel exactly one turn → the track is 3 diameters + a bit → ≈ 3,14.
- define (4–8): π = chu vi ÷ đường kính; nắp nồi / bánh xe đạp / Trái Đất all give 3,14; "chính xác là bao nhiêu?"
- arch (9–16): Archimedes (~287–212 TCN), inscribed + circumscribed 6→12→24→48→96-gons, 223/71 < π < 22/7 (3,1408 < π < 3,1429).
- irr (17–21): digits read aloud, digit stream along a gold thread; 22/7 = 3,(142857) repeats, π does not → số vô tỉ.
- life (22–25): wheel (π·d per turn), sound wave y = sin x (one period = 2π), GPS orbit (≈ 20.200 km, ~12 h/orbit, C = 2πr).
- end (26–33): NASA/JPL uses 3.141592653589793 (15 decimals); Voyager-1-sized circle error ≈ 1,5 cm (fixed 2026-10-21, was 4 cm); CLIMAX "314 nghìn tỷ chữ số";
  why: test supercomputers / algorithms / hardware, curiosity; outro wheel rolls up into the stars.
- Spoken text spells names phonetically (Ác-si-mét, Na-sa, Voi-ơ-giơ Một, xen-ti-mét); on-screen keeps real spellings.

## Facts and sources (checked 2026-10-20; full re-audit 2026-10-21, all other numbers OK)
- Record: 314,000,000,000,000 digits, StorageReview & Micron, 18 Nov 2025 (Guinness:
  https://www.guinnessworldrecords.com/world-records/66179-most-accurate-value-of-pi ; y-cruncher list https://numberworld.org/y-cruncher/).
- NASA/JPL: "For JPL's highest accuracy calculations, which are for interplanetary navigation, we use 3.141592653589793";
  Voyager 1 example (article updated 2026-03-04: radius 20 billion miles ≈ 32 billion km, circumference error "little more than
  half an inch (about 1.5 centimeters)"; recomputed (π − 3.141592653589793) ≈ 2.38e-16 × 6.44e15 cm ≈ 1.53 cm):
  https://www.jpl.nasa.gov/edu/news/how-many-decimals-of-pi-do-we-really-need
  (2026-10-21: v1/v2 said 4 cm from the pre-update article; narration line 28, on-screen e-err text, subs and mix fixed in v2.
  2026-10-21 fix2: on-screen radius label changed "bán kính ≈ 20 tỷ km" → "bán kính ≈ 32 tỷ km" (article's generous radius
  20 billion miles; Voyager 1 itself is ≈ 26 tỷ km away now) in v2/screen.tsx and v1 scenesC.tsx (v1 not re-rendered);
  v2 chunk 3430-3674 re-rendered (label visible f3588–3658); web file on Drive as ep55v2-fix2.mp4,
  id 178IfuZaYk0gZe7crYx6bCFB0qwbyJvqz.)
- Archimedes: 96-gon perimeters 3.14103 / 3.14271 (computed), his rational bounds 223/71 = 3.14085 and 22/7 = 3.14286.
- GPS: orbit altitude ≈ 20,200 km, period ≈ 11 h 58 min (standard published values).
- Constants asserted in tests/episodes/ep55-pi.test.ts.

## Pipeline
1. script.src.json → audio/episodes/ep55-pi-tts/gen.py (edge-tts vi-VN-NamMinhNeural, rate +6%, proxy env unset) → /workspace/work/ep55/tts/NN.mp3
2. audio/episodes/ep55-pi-tts/place.py: trim silence, place lines (base gap 0.25 s + per-line PAUSE for animation beats), every scene
   start snapped UP to a 130 BPM bar line; the climax bar is placed so its downbeat lands on "ba trăm mười bốn" (line 29 starts 49 f
   before it, from WordBoundary) → script.vi.json + voice.wav.
3. audio/episodes/ep55-pi-tts/words.py: edge-tts WordBoundary for every line → words.json; timing.ts `wd(i, word, n)` = frame of a word.
4. Visual timing constants all live in ink55.ts (pure), derived from L(i)/wd(); sfx55.ts builds the SFX event list from the same constants;
   /workspace/work/ep55/chk/sfxdump.ts (esbuild → node) dumps it to sfx.json.
5. audio/episodes/ep55-pi-tts/mix.py: voice → −16 LUFS; BGM (audio/episodes/ep55-pi.py, adapted from ep54, ducked by the voice
   envelope like ep54: −0.55 gain, attack 40 ms / release 350 ms) → −27 LUFS; SFX bus (audio/episodes/ep55-pi-sfx.py); sum → linear
   gain → alimiter (192 kHz oversampled) iterated to −14 LUFS with a −2.3 dBTP ceiling in the wav (AAC overshoots ~0.9 dB; the first
   pass at −1.8 dBTP came out at −0.9 dBTP in the mp4) → public/audio/ep55-pi/mix.wav.
   Result: wav −14.1 LUFS / −2.4 dBTP; master mp4 −14.1 LUFS / −1.4 dBTP (stems: voice −16.2, BGM −26.1, SFX −27.2 integrated /
   −16.0 max momentary).
6. Render: /workspace/work/ep55/render.sh (bundle /workspace/work/ep55/bundle, 9 chunks of 490 frames, --muted, CRF 16, each chunk
   rendered to /tmp then moved to /workspace/work/ep55/seg/, ok-markers make it resumable; ≈ 1.3 fps at concurrency 2).
   /workspace/work/ep55/finish.sh: concat (stream copy) + mix.wav AAC 320k → /workspace/out/ep55-pi.mp4; web = x264 CRF 18 preset slow,
   maxrate 8M / bufsize 16M, yuv420p converted full → tv range (Remotion's jpeg frames are yuvj420p), AAC 192k, +faststart
   → /workspace/out/ep55-pi-web.mp4. The master keeps Remotion's yuvj420p stream untouched (stream copy).
- Stills: scripts/ep55-stills.mjs (COMP=ep55-pi node scripts/ep55-stills.mjs <bundle> <outdir> frames…); sheets /workspace/work/ep55/sheet*.jpg.

## How the user's ep54 feedback was applied
(a) Soft glow (match ep54's later sections, not its bright 8–35 s): kit55 `SoftGlow` = 3 bloom layers (b16 ×0.15, b7 ×0.36, b2 ×0.72)
    + warm core 0.88, about 0.6× ep54's GlowPath; no HotLine, no big Flare anywhere; pen star ≈ 0.55× ep54 PenHead (no blue streak);
    LEDs are the ep53 SevenSeg at 0.86 opacity, no "hot" bloom layer; bokeh band 0.6 × 0.75; climax flash 0.30 (ep54 0.45).
    During the 2× Archimedes punch-in the circle/polygons are dimmed (−35 % / −30 %) so the zoomed lines don't get brighter.
(b) One continuous pen: every glowing line is registered once in ink55.ts `STROKES` (sorted, non-overlapping, checked in the test).
    `penAt(f)` is the only pen: it is on the stroke being drawn, glides (smootherstep, dimmed to 55 %) between strokes ≤ 60 f apart,
    otherwise fades out where it stopped and fades in where the next stroke starts. Ribbon transitions are strokes too: the pen flies
    in on the ribbon and lands on the next scene's first stroke. Scenes draw lines with `Ink` (no heads), so progress and pen always
    match. No scattered sparkles; the climax burst is 56 smooth radial filaments without heads, fading in ~2.5 s.
(c) Still text: all text/numbers/ticks/equations are in a second screen-space <svg> (`TX`/`TXw`/`GText`/`LED`): integer pixels,
    fixed font size, never rotated, `font-variant-numeric: tabular-nums`; world-anchored labels go through `makePJ` (7-frame camera
    average, then rounded). Camera = cam55: eased punch-ins only (smootherstep), no drift, no rotation. In the Archimedes scene the
    LED panel and both number lines are screen-space, so only the circle zooms; a soft dark backing sits behind the right column
    during that punch. GText "writes on" with a clip reveal, the glyphs themselves never move.

## SFX (user feedback 2026-10-20: ep54 SFX too weak)
- ep54 had its scene hits inside the BGM bus (boom 0.35, swoosh 0.12 of a bus normalised to −27 LUFS). ep55 has a separate SFX bus:
  band-swept whooshes on every ribbon transition, layered hits (sub boom + transient + thump + bell, + crash on the big ones) on
  the 3,14 reveal (f316), π symbol, Archimedes bounds (f1736 big, f1900 medium), "SỐ VÔ TỈ", "1,5 cm"; soft ticks for LED updates,
  bracket counts, every spoken digit and every other digit of the stream, NASA digits; roll rumble under the wheels; a 3.8 s riser
  (BREATH0 → climax, cut 0.32 s before the downbeat) and a climax boom + crash + bell chord; end bell.
- Bus loudest moment set to −16 LUFS momentary (≈ voice level), integrated ≈ BGM level; ducked ≈ 3.5 dB under speech
  (gain 1 − 0.33·voice activity, attack 30 ms / release 300 ms). Final mix still −14 LUFS / TP ≤ −1.2.

## Known weak spots
- Polygon steps 12/24/48 are drawn in 20 frames each: the pen moves fast there (up to ~290 px/frame at peak), it reads as a whip.
- At 96 sides the polygons are visually identical to the circle even at the 2× punch-in (that's the point, but there's no "gap" to see).
- TTS pronunciation of "Pi", "Ác-si-mét", "Na-sa", "Voi-ơ-giơ" not checked by a human ear.
- Bokeh band sits behind the climax LED (y 360–422); legible but busy.

## Output (2026-10-20)
- Master /workspace/out/ep55-pi.mp4: 1920×1080, 30 fps, 4411 frames, 147.03 s, H.264 High CRF 16 (≈ 27 Mb/s, ≈ 506 MB), AAC 320k.
- Web /workspace/out/ep55-pi-web.mp4: same duration/frames, x264 CRF 18 slow, ≈ 8 Mb/s cap, AAC 192k, +faststart.
- Contact sheet /workspace/out/ep55-contact.jpg (one frame every 6.1 s). Render ≈ 33 min for 9 chunks (≈ 2.2 fps).
- QC: text crops (LED label, "≈ 3,14", 1/2/3 labels during the punch hold) differ frame-to-frame no more than an empty grain-only
  region (mean |Δ| ≈ 1.0–1.3 vs 1.25), i.e. text is pixel-still.
- Drive (web file): id 12e94UiAtYJYo-oRmygKAZEZWz-SPIuny, name ep55-pi.mp4, sharing unchanged.

## v2 (2026-10-20) — real 3D rework (composition `ep55-pi-v2`, code in `v2/`)
User feedback on v1: the reference is ONE continuous gold line with a glowing spot travelling along it inside a rich, varied 3D
space; v1 looked flat and barely moved. Script, voice, timing, facts and the audio mix (public/audio/ep55-pi/mix.wav) are unchanged.

### How the 3D works
- three.js (0.180, added to package.json) driven directly, no R3F: `v2/Stage.tsx` builds the world once per render tab and every
  frame calls `world.update(f)` (pure function of the frame), then renders synchronously inside delayRender. Rendered by Chrome's
  software GL: `--gl=swangle` (≈ 1.1 s/frame at concurrency 2). Post: 4× MSAA half-float target → 1/4 + 1/8 res Gaussian bloom
  (weights 0.5 / 0.55) → soft shoulder. Textures (photos) are awaited once before the first frame.
- `v2/gl.ts`: glowing tube = own centre-line + normal geometry, one geometry shared by a core and a halo material; radius widened in
  the vertex shader to ≥ N px so far lines never alias; draw progress / tail via arc-length `u`; depth fog (exp²) and depth of field
  (out-of-focus lines get softer and dimmer, focus = camera→target distance). Glass = fresnel rim + faint body, additive.
  Points = stars (no DOF) and bokeh dust (circle of confusion grows with |depth − focus|). Grid floors are thin tubes with radial fade.
- `v2/scene3.ts` (pure, no GL state): world layout (each scene has its own space O1..O6 along a winding route), all strokes in
  world space, the ONE pen (`pen3`) and the camera (`camAt`).
- Environments: S1 blue perspective grid floor + glass wheel (cylinder, spokes, hub); S2 hall of giant glass rings, drum behind the
  circle, lid / bicycle wheel (torus + spinning spokes) / textured Earth; S3 tilted glass sand-tablet with grid, amber floor, glass
  colonnade + lintel; S4 ring tunnel along the digit river + particle stream flowing along it; S5 road grid + wheel, 14-strand sine
  ribbon with a translucent glass surface and pulsing sound rings, textured Earth with lat/long rings and a tilted orbit; S6 NASA
  panel, a giant near-horizontal circle around a far sun (Voyager), 3D filament burst, glass chips, final thread into the stars.
  Far gold strands undulate in every scene (vertex-shader wave), stars + two dust layers (mid + near-camera bokeh) everywhere.

### Camera
- Keyframes per scene (dolly / orbit / crane) interpolated per component with monotone cubic Hermite (Fritsch–Carlson: C1, no
  overshoot), plus a slow "breathing" drift that drops to 30 % during dense text (`calmAt`) — never frozen, background parallax stays.
- Fly-throughs: between scenes a follow camera rides behind/above the pen on the bridge thread (13-frame low-pass, look-ahead),
  blended in with a smootherstep weight that is 0 at both ends, so entries and exits are seamless. Max camera turn ≈ 2.9°/frame.

### One thread, one pen
- Every glowing line is a stroke in `STROKES3`; between consecutive strokes the builder inserts a connector automatically:
  scene-to-scene "bridges" (persistent, the camera flies along them) or short in-scene links (fade after drawing). The pen is always
  either on the stroke being drawn or resting at the last stroke's end; it never jumps and there is only one (tests/episodes/
  ep55-pi-v2.test.ts checks no overlaps, bounded speed and acceleration). Pen glow = v1's soft Pen (~0.6× ep54), drawn in the
  screen layer at the projected 3D position, scaled by depth. Card frames draw on without a head (uHot = 0) so they never add a 2nd spot.
- Archimedes doubling (fix for the v1 whip): the pen traces the circle once per step (40–44 frames, plateau easing, ≤ 80 px/frame);
  as it passes, the inner polygon grows new vertices out to the circle and the outer polygon's corners get cut (`morphUV`). Only the
  6-gons are drawn edge by edge (34 frames each).
- 96 sides: a magnifier inset (separate three.js scene rendered into a scissored viewport, slow orbiting camera, vertical
  magnification 520× / horizontal 30×) shows the remaining gap between the arc, the inner (blue) and outer (red) 96-gon.

### Text stays still
- All text / numbers / LEDs remain in the screen SVG layer (kit55 TX/LED/GText: integer px, fixed size, tabular-nums, no rotation).
  World-anchored labels use `makePJ3`: projection averaged over 7 camera frames, then rounded. HUD-like frames (Archimedes, NASA,
  chips, "?") are real 3D objects placed by un-projecting their v1 screen position at a chosen depth (`hudRect`), so they get
  parallax while their text is anchored to the projected centre.
- Subtitles: long lines are split at punctuation into two consecutive cues (second starts at the measured word time) and rendered
  `nowrap` → always one line. Digit river: glyph size fixed at birth from its depth (50 → 30 px), spacing measured in screen space.
- Climax: dust dimmed to 35 %, backing panel behind the counter, no expanding shell.

### Real photos (user request 2026-10-20) — sources in public/ep55/SOURCES.json
Soft-lit image shader (warm grade, feathered edges, fog/DOF, normal or additive blend), gold frame drawn on, small credit line.
- Archimedes — Domenico Fetti, "Archimedes" (1620), cropped; public domain.
  https://commons.wikimedia.org/wiki/File:Domenico-Fetti_Archimedes_1620_(cropped).jpg — card in S3 at the spoken name.
- Pot lid — "A lid for a pot.jpg", BogTar201213, CC BY-SA 4.0. https://commons.wikimedia.org/wiki/File:A_lid_for_a_pot.jpg
- Bicycle wheel — "Bicycle front wheel (1).jpg", Cjp24, CC BY-SA 4.0. https://commons.wikimedia.org/wiki/File:Bicycle_front_wheel_(1).jpg
- Earth — NASA Earth Observatory "Whole world - land and oceans.jpg" (public domain) as the texture of both Earth globes (S2, S5).
  https://commons.wikimedia.org/wiki/File:Whole_world_-_land_and_oceans.jpg
- NASA/JPL — "JPL's Space Flight Operations Facility - GPN-2003-00064.jpg", NASA, public domain (card next to the NASA panel).
  https://commons.wikimedia.org/wiki/File:JPL%27s_Space_Flight_Operations_Facility_-_GPN-2003-00064.jpg
- Voyager 1 — "Voyager spacecraft.jpg", NASA/JPL artist concept, public domain (additive, sits on the giant circle).
  https://commons.wikimedia.org/wiki/File:Voyager_spacecraft.jpg
- GPS satellite — "GPS Satellite NASA art-iif.crop.jpg", NASA art (Block IIF), public domain (billboard riding the orbit).
  https://commons.wikimedia.org/wiki/File:GPS_Satellite_NASA_art-iif.crop.jpg
The two CC BY-SA photos are credited on screen; they are only used unmodified apart from crop/colour grade.

### Pipeline v2
- Stills: `GL=swangle COMP=ep55-pi-v2 node scripts/ep55v2-stills.mjs <bundle> <outdir> frames…` (wrapper /workspace/work/ep55v2/stills.sh).
- Render: /workspace/work/ep55v2/render.sh (bundle /tmp/b2final, 9 chunks, `--gl=swangle --concurrency=2 --crf=16 --muted`, each
  chunk to /tmp then seg/, ok-markers → resumable). /workspace/work/ep55v2/finish.sh: concat + v1 mix.wav → master; web encode.

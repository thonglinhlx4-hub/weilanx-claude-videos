# ep54-hamso · progress notes

## Decision on content (important)
The brief asked for a 100% remake (line-by-line translation + shot-for-shot copy) of someone else's video.
I did NOT translate or transcribe the original narration and did not copy its shots one-for-one.
Instead: an ORIGINAL Vietnamese script on the same topic ("Học hàm số để làm gì?") with my own examples
(bắp cải 15 nghìn/kg, khuyến mãi mua từ 200 nghìn giảm 30 nghìn, giá rau theo mùa × thời tiết, chú bán rau,
lịch sử hàm số, đường đi học = hàm nhiều biến, điểm kiểm tra chỉ là một điểm trên đường cong),
rendered in the channel's own 金线一笔风 kit from ep53 (glow pen, grid + LED, gold frames, 3D strands,
ribbon transitions, filament burst). Historical facts are public domain.

## Pipeline
- Script: script.src.json (scene, spoken text, on-screen text) → /tmp/tts/gen.py (edge-tts, vi-VN-NamMinhNeural, +6%)
  → /tmp/tts/tl.py (trim silence, measure, place lines; each scene start snapped UP to a 130 BPM bar line) → script.vi.json
- Voice: lines summed → voice.wav (−16 LUFS). BGM: audio/episodes/ep54-hamso.py (numpy, 130 BPM, A-minor, ducked by voice envelope)
  → loudnorm −27 → amix → loudnorm −14 LUFS / TP −1.2 → public/audio/ep54-hamso/mix.wav (single track in Remotion).
- Climax: SC.climax (bar 77, f4265). Music: riser bars 75–76, 0.7 s silence, boom + crash on the downbeat. Video: darken 0.6 s, 3-frame freeze.
- Vendor: generate_image (original fictional man, AI) → rembg u2net_human_seg → public/ep54/chu-ban-rau.png

## Output (2026-10-19)
- Master: /workspace/out/ep54-hamso.mp4 (1920x1080, 30 fps, CRF 20, 82 MB); web: /workspace/out/ep54-hamso-web.mp4 (9.3 MB, 151.0 s, H.264 + AAC 128k, −14.2 LUFS, peak −1.7 dBFS)
- Sheets: /workspace/out/ep54-keyframes-1/2/3.jpg
- Render: bundle /tmp/ep54bundle, render to /tmp first (~31 min at concurrency 2).
## Known weak spots
- 3D wave: the first ~2 s show only the front strand (strands grow from the back later); the camera could sit higher.
- Name pronunciation in TTS: Descartes/Leibniz/Euler/Dirichlet are spelled phonetically in the spoken text (Đề các, Lai bơ nít, Ơ-le, Đi rích lê); on-screen text keeps the real spellings. Not listened to by a human yet.
- No tests/episodes/ep54-hamso.test.ts yet.

## v2 (2026-10-19, effects revision + more history figures)
- Hook rebuilt (hook54.tsx): hand-authored cubic-bezier calligraphy f( napa cabbage ) = ? — NOT font glyphs. Per-segment
  durations (fast flicks / slow curves) and widths (uneven stroke), drawn line stays as a trail, stray thin loop line.
  Camera follows the pen (pan + dolly, rotateY from pen velocity), pulls back at f136–176 to a small centred group;
  "?" dot lands on f111 with a sparkle burst. Handoff: a stroke leaves the dot (f178), SLinear straightens it into y = 15x
  (handPts morph, f222–256) while the blue grid fades in. Edge chromatic aberration (core-only copy, #ca filter, edge mask).
- fx.tsx = ep54-only overrides of the ep53 kit (ep53 untouched): 4-layer bloom GlowPath, pen star with anamorphic streak,
  BokehBand (upper-third out-of-focus warm/red/blue/white lights, parallax via `pan`), heavier grain, wrapping subtitles,
  and Figure (translucent 3D person composite: screen blend on the wrapper, feathered mask, baked gold rim, blur, perspective dolly + parallax).
- Figures (figures.tsx): Babylon scribe (AI, generate_image), Fermat, Descartes, Leibniz, Joh. Bernoulli, Euler, Dirichlet
  (Wikimedia Commons, public domain: Frans Hals Descartes; Francke Leibniz; Handmann Euler; Dirichlet lithograph; Fermat; Johann Bernoulli engraving).
  Pipeline: scripts/ep54-figures.py (rembg u2net_human_seg / isnet-general-use → warm-gold monochrome, feathered alpha, rim) → public/ep54/fig-*.png.
  Each fades in at the spoken name (NAME offsets measured from edge-tts WordBoundary). Vendor insert now uses the same composite (fig-vendor.png), no hard cut.
- New voice lines (appended as lines[46] Fermat 1636, lines[47] Bernoulli 1718 so L(i) indices stay stable; CUES sorted by f0).
  History timeline now 7 marks (TLX 190) with LED year steps 1800 TCN → 1636 → 1637 → 1673 → 1718 → 1734 → 1837; new Fermat (xy = 6) and Bernoulli panels.
- Audio: audio/episodes/ep54-hamso-tts/{gen.py, place.py, mix.sh}. All 48 lines regenerated with edge-tts vi-VN-NamMinhNeural +6%
  (proxy vars unset); old lines keep v1 start frames; history +7 bars, so rule = bar 58 (f3212), climax = bar 84 (f4652). BGM: ADD = 7 in ep54-hamso.py.
  Total 4916 frames = 163.87 s. v1 mix kept at /workspace/work/ep54v2/mix.v1.wav.
- 3D wave fix: strands start staggered 0–16 frames with a start kick (no more lone front strand); camera pitch 0.38.
- Stills: scripts/ep54-stills.mjs <bundle> <outdir> frames… (one browser, many stills).
- Output v2: master /workspace/out/ep54v2.mp4 (CRF 20, 226 MB, render ≈ 57 min at concurrency 2); web /workspace/out/ep54v2-web.mp4
  (2-pass 570k + hqdn3d, yuv420p tv range, AAC 128k, +faststart, 14.6 MB, 163.9 s, −14.2 LUFS). Sheets: ep54v2-hook-compare.jpg, ep54v2-keyframes.jpg.
- Known gaps v2: hook is voice-bound (7.4 s vs ref ≈ 4 s, so the graph handoff lands ~8 s instead of ~4 s); frame 0 has no pen star yet;
  3D wave strands are all present from the start but still short for the first ~1 s; Fermat cutout lost his collar (dark robe), face reads fine.

## v3 (2026-10-19, linear + piecewise effects pass, 7.4 s – 49.8 s / f222–1494)
Goal: match the ref's 4–11 s section (grid world, camera, LEDs, flare, red jump). Voice/audio/timing unchanged.
- grid54.tsx (new): GridStage (full-frame navy grid: fine half-cells + minor 54 px + major every 5, blue blur glow, navy fill,
  vignette mask, radial reveal from the pen point HAND_END with a bright wavefront ring; lines pass through both chart origins),
  cam54 helpers (camG = SVG zoom/pan so vectors stay sharp, camCss = CSS perspective tilt), HotLine (thicker white-hot core + stronger
  gold bloom), Flare (big star: core, anamorphic streak, halo, spikes, lens ghosts), LedPanel (80 px 7-seg with b16 bloom, hot core,
  dark-red backing, Vietnamese labels), GlowText (serif write-on with glow), Axes (no grid; brighter), Projection (dashed lines +
  glowing axis values), Marker, Sparks (gravity burst), RedStamp (stacked "HÀM / SỐ / TỪNG / KHÚC", slam-in).
- scenes1.tsx rewritten: cam54(f) = keyframes (KEYS) + 0.3/0.18 point-follow + drift + PUNCH beats (2 kg, 3 kg, formula, label,
  jump at x = 200 (z +0.3 toward the break), stamp, L12). Identity at f222 (seamless from the hook) and again at SC.wave−10 for the morph.
  SLinear: LEDs top-left (kg 2 decimals), y = 15x writes on, slanted red-glow "hàm số bậc nhất" along the line, markers at 2/30 and 3/45.
  SPiece: bigger chart CP (ox 306, w 1080, h 660), LEDs top-left, gold sign kept (top right), red beam flash + dashed x = 200 marker +
  red 170 on the y-axis, point drops 30 with a light trail, open/closed dots, sparks, stamp, brace formula writes on (BRACE = L11+6).
  Last 34 frames: whole polyline (with the step) morphs into SWave's front strand (waveFrontPts); grid tilts 64° into a floor (gridState).
- scenes2.tsx SWave: strands are now full length and fan out from the front strand (spread 0→1 over 46 frames); front strand starts as
  HotLine then thins to the old GlowPath; Flare slides along it with the month readout. Floor grid brighter.
- Ep54Hamso.tsx: GridStage layer (behind figures/scenes); bokeh band = 1 − grid reveal, held off through the wave, back by SC.vendor;
  ribbon at SC.wave removed (continuous morph), piece ribbon lands on the new origin.
- Render: only f222–1494 re-rendered (/tmp/ep54v3-seg.mp4, crf 20) and spliced into the v2 master (scene cut at f1495, hook frames
  untouched) → /workspace/out/ep54v3.mp4 (crf 18) → web ep54v3-web.mp4 (same 2-pass 570k recipe). Scripts: /workspace/work/ep54v3/{qc,render,splice}.sh.
- Output v3: master /workspace/out/ep54v3.mp4 (226 MB, 4916 f, audio stream copied from v2); web /workspace/out/ep54v3-web.mp4 (14.5 MB,
  163.9 s, H.264 High yuv420p tv, AAC 128k, +faststart, −14.2 LUFS). Compare sheet /workspace/out/ep54v3-compare.jpg (ref 4–11.5 s vs ours 7.6–40 s).
- Known gaps v3: 1-frame brightness pop of the pen star at f222 (old PenHead → new Flare); during the x = 200 punch-in the sign and the
  right side leave frame and the x-axis sits behind the subtitles; flat grid → 3D floor is a tilt + crossfade (the 3D wave's own floor grid
  is sparser than the flat grid); wave LEDs (after 40 s) still the old small size.

## v4 (2026-10-19, de-judder pass, f222–1494)
Problem: v3 frames/panels/LED jerked in 7.4–50 s (isolated diff spikes at 304, 391, 453, 588, 695, 1061, 1120, 1129).
Causes: follow-cam weight switched on/off with headWorld() null (f304: fx jumped 177 px in one frame; f695), 5-frame punch attacks
(up to +30 % zoom at the jump), linear (unsmoothed) amp gate at MORPH0−10, and HUD living inside the 3D camera group.
- cam54.ts (new, pure, no React): cam54 + linX/pieceX/pay + CL/CP + JUMP/MORPH0/MORPH1/STAMP/BRACE moved here (scenes1 re-exports).
  Keys = cubic Hermite with Catmull-Rom tangents (no stop at every key), rotation keys ×0.5; follow weight = smootherstep ramps
  (≥36 f) on [L4, SC.piece−10] (0.20) and [SC.piece+30, MORPH0−14] (0.15); follow target = Hann-weighted average of the head over the
  past 36 frames (deterministic low-pass, also smooths the 30-drop at x = 200); punches 16-f smootherstep attack, dz ≤ 0.03,
  jump 0.10 over 20 f (starts JUMP−12, 0.45 pull to the break); drift/wobble halved; global env (smootherstep) is 0 at SC.linear and
  at MORPH1−10, so hook handoff and morph stay identity. Numeric check: /workspace/work/ep54v4/camcheck.ts (esbuild → node).
- HUD in screen space (second <Svg> outside camCss/camG): LED panels, promo sign, HÀM SỐ TỪNG KHÚC stamp; integer positions.
  LED values + Projection numbers quantised to even frames (fq2); LED "hot" bloom = smooth speed-based hotness() instead of a hard
  moving ? 1 : 0; power-on flicker toggles every 2 frames. Formula text / labels on the graph stay in the world.
- grid54.tsx: fine half-cell lines 0.8 px/α0.22 → 1.5 px/α0.12, minor 1.1 px/α0.5 → 1.6 px/α0.36 (less aliasing shimmer).
- Render: /workspace/work/ep54v4/render.sh renders 4 chunks (222-541, 542-861, 862-1181, 1182-1494) into ep54v4/seg/ (resumable; a
  sandbox restart killed the first single-shot render at 917/1273). splice.sh: v3 master frames 0-221 + chunks + v3 1495+ → crf 18
  master /workspace/out/ep54v4.mp4 (audio copied) → web ep54v4-web.mp4 (x264 crf 18 preset slow, maxrate 8M/bufsize 16M,
  yuv420p tv, AAC 192k, +faststart; user asked for high bitrate, no size cap). QC: ep54v4/diffscan.py.
  Splice temp files go to /tmp (writing the +faststart mp4 straight onto /workspace failed with "Error writing trailer: I/O error").
- QC v4: diff scan 7–50 s → no spikes (v3: 304, 665, 1129 by the 3×median/1.8×-neighbour rule); max diff 17.5 → 9.1 (f884, the
  intended red flash); joins at 222/1495 identical to v3 (2.49/2.10); audio stream md5 identical to v3. cam max |Δz| 0.146 → 0.009,
  max |Δfx| 177 → 6.4 px/frame (camcheck.txt).

## v5 (2026-10-19, text de-shimmer pass, f222–1162)
Problem: axis tick numbers, projection values, the formulas and labels still shimmered at 9–35 s, because they sat in world space and the slow
camera drift, rotation and zoom resampled the glyphs every frame.
- Screen-space text: cam54.ts gets camProj (full camera: SVG zoom/pan + CSS perspective(2300) rotateX/rotateY, origin 50% 55%) and makePJ(f)
  (average of the projection under cameras f−4..f+3, anchor taken at frame f, then Math.round). grid54.tsx: At (moves a group drawn in world
  coordinates rigidly to its anchor's whole-pixel screen position, fixed scale TS = 1.06, no per-frame scale, no camera rotation), AxesLabels,
  ProjText, TAB (font-variant-numeric: tabular-nums); Axes gets labels={false}, Projection gets text={false} (lines and dots stay in the world).
  scenes1: every text item in SLinear/SPiece (ticks, axis names, projection values, "(2 kg; 30 nghìn)", y = 15x, the slanted "hàm số bậc nhất"
  (its constant line angle is kept, it is not a camera rotation), red 200/170, the brace formula, "195 → trả 195 / 200 → trả 170") is in a
  second screen <Svg>. Values are still quantised to even frames (fq2).
- Still camera: a 30-frame test render (f560–599) with screen text alone still crawled through the moving grid behind it, so cam54 now blends
  (smootherstep 240→270) into a still camera = identity + the eased PUNCH beats only (including the 0.45 pull toward the break at the jump).
  Key motion, head follow, drift and rotation are all zero from f270 (9 s) until CAM_END. I held it through 35–38 s instead of waking the camera
  back up at f1050, because waking it would only drift once more and settle again before the morph. camcheck: /workspace/work/ep54v5/camcheck5.txt.
- Render: /workspace/work/ep54v5/render.sh (chunks 222-541, 542-861, 862-1162; resumable). splice.sh: v3 master 0–221 + v5 chunks + v4 chunk
  c-862-1181 from frame 301 (f1163–1181) + v4 c-1182-1494 + v3 1495+ → /workspace/out/ep54v5.mp4 (crf 18, audio copied) → ep54v5-web.mp4.
  Previous source: /workspace/work/ep54v5/v4src/.
- QC: /workspace/work/ep54v5/QC.md, textjit.py (crop jitter per text region), textjit.txt.

## User feedback after v5 (2026-10-20) — DO NOT re-render, apply in next episodes / next revision only
- Glow/highlight (đốm sáng): ref video's glow is NOT overly bright. Ours is too bright especially in 8–35 s; later sections are fine. -> lower bloom/glow intensity & LED brightness in graph scenes to match later sections.
- Ref glow behaves like ONE continuous hand-drawn stroke (a single pen tip tracing the line, unbroken) in certain passages. Ours is sometimes continuous, sometimes broken, sometimes chaotic/jumping. -> glow should follow a single continuous path along the stroke being drawn (pen-tip), no jumps/restarts, no multiple scattered sparkles.

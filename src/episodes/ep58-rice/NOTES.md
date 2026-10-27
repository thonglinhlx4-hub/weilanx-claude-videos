# ep58-rice · "Hạt gạo trên bàn cờ" · notes

Approved script: /workspace/work/ep58/SCRIPT.md (narration unchanged; only TTS spellings: numbers written as words in the spoken text,
digits in the on-screen subtitle text; line 16 of the script split in two lines at "trừ một," so the proof can sit in the pause).
**9:16 vertical**: composition `ep58-rice`, 1080×1920, 30 fps, **3121 frames = 104.03 s**.
Built on the ep57 pipeline (gl.ts / Stage.tsx / subs.ts / timing.ts / kit copied; kit55 text components reused).
Status 2026-10-23: **delivered**. Stills approved → visual fixes + BGM/SFX mix + full render. The composition plays public/audio/ep58-rice/mix.wav.
Outputs: master /workspace/out/ep58.mp4 (157.1 MB, ~11.8 Mb/s video CRF 16, AAC 320k), web /workspace/out/ep58-web.mp4 (88.4 MB, x264 CRF 18 maxrate 8M,
AAC 192k, faststart), both 104.03 s / 3121 frames, −14.1 LUFS, true peak −2.3 dBTP; contact sheet /workspace/out/ep58-contact.jpg (1 frame / 4 s);
QC script /workspace/work/ep58/qc.sh. Drive: ep58-hat-gao-ban-co.mp4, ID 1fvzpK3TpbuSDq9dcX78HpYo1L75p02iN (sharing untouched).

## Script → scenes (script.src.json, 24 lines: [scene, spoken, on-screen])
- hook (0–1): macro on one glowing glass rice grain on square 1, the pen rings it; "× 2 · 63 lần"; camera pulls back; title HẠT GẠO / TRÊN BÀN CỜ.
- legend (2–5): the pen draws the board outline (tiles fade up), then the gold frame of the Shahnama chess miniature card; line 4 rings
  square 1 and hops to square 2 ("ô 1 → 1 hạt · ô 2 → 2 hạt · … ô 64 → ?"), a dashed preview snake runs 2 → 64; line 5 a high arc back to square 1.
- half1 (6–10): the hop thread (one tube, `hops`, progress = sAt(f)) lands square by square; counter block (Ô n · LED 2^(n−1) hạt · weight);
  squares 2–6 show individual glass grains (falling in one by one), 7–32 small glass mounds with grain sparkles; labels 10 / 20 / 32;
  camera starts close (pool of light around the target) and widens; line 9–10 "32 Ô ĐẦU · 4.294.967.295 hạt · ≈ 107 tấn · 4–5 xe tải · vua vẫn trả được ✓".
- half2 (11–15): "NỬA SAU"; rule "ô mới = tổng các ô trước + 1 · 2³² = (1 + 2 + … + 2³¹) + 1" while the pen hops 32 → 33; then the mountain:
  one self-similar glass cone, radius/height ∝ 2^((s−32)/3) (volume ∝ 2^(s−32), honest relative scale), the thread climbs its apex;
  camera distance interpolated in log space = exponential pull-back (dist 21 → 27 → 120 → 3800).
- total (16–17): "CẢ BÀN CỜ · 1 + 2 + 4 + … + 2⁶³ = 2⁶⁴ − 1", proof chain in the 2.5 s pause ("thêm 1 hạt: 1+1=2, 2+2=4, 4+4=8, 8+8=16, …,
  2⁶³+2⁶³=2⁶⁴"), 3D dimmed 42 %; CLIMAX (frame 2049, bar downbeat on "mười" of "mười tám tỷ tỷ"): "≈ 18 tỷ tỷ hạt" + full LED
  18.446.744.073.709.551.615 + two gold shock rings from the mountain foot; "≈ 461 tỷ tấn (25 mg / hạt)".
- earth (18–20): camera cranes up ~5 km (scene units) into the stars; NASA Apollo 17 Earth in a circular gold frame drawn by the pen;
  "546,6 triệu tấn gạo" (FAO); line 19 the thread spirals 4.6 times around Earth while the LED counts 0 → 844 năm; line 20 Hà Giang rice-terrace
  card (pen frame) + "VIỆT NAM · 26,2 triệu tấn / năm · ≈ 17.600 năm".
- end (21–23): "HÀM MŨ · y = 2ˣ": the thread draws 2^x (flat then vertical) with a glowing grain at its foot; tags "lúc đầu: vô hại",
  "rồi: vượt mọi tưởng tượng", then "lãi kép / dịch bệnh / sức mạnh máy tính" on the curve; final title + the thread runs off into the stars.

## Facts (facts.ts, recomputed in tests/episodes/ep58-rice.test.ts with BigInt)
25 mg/hạt. ô10 = 512 (12,8 g); ô20 = 524.288 (13,1 kg); 32 ô đầu = 2³²−1 = 4.294.967.295 (107 t); ô40 = 2³⁹ (13.744 t); ô50 = 2⁴⁹ (14,07 triệu t);
ô64 = 2⁶³ = 9.223.372.036.854.775.808 (9,22 tỷ tỷ); total 2⁶⁴−1 = 18.446.744.073.709.551.615 ≈ 461 tỷ tấn ≈ 844 năm × 546,6 Mt ≈ 17.600 năm × 26,2 Mt.
Sources: FAO Food Outlook June 2025, Table 1.4 (world 2024/25 = 546.6 Mt milled); USDA FAS PSD "World Rice Production, Consumption, and Stocks"
(Vietnam 2025/26 = 26,200 kt milled, report dated 10/2026). Newer FAO figures exist (2024/25 revised to 549.8 Mt in Nov 2025; 2025/26 ≈ 556–562 Mt)
→ 820–839 years, so "hơn tám trăm năm" still holds; on-screen 844 is tied to the 546.6 figure the narration uses.

## Photos (public/ep58/SOURCES.json)
- chess.jpg — "Buzurjmihr Masters the Hindu Game of Chess", Shahnama of Shah Tahmasp, c. 1530–35, The Met — CC0 (crop of the painted panel).
- earth.jpg — The Blue Marble, Apollo 17, 7 Dec 1972 — NASA, public domain.
- vn.jpg — ripe rice terraces, Hà Giang 2012, Flickr minhphuc_99kdd — public domain per Commons (top 24 % sky cropped).

## Pipeline
1. TTS: audio/episodes/ep58-rice-tts/gen.py (edge-tts vi-VN-NamMinhNeural +6 %, HTTP(S)_PROXY unset) → /workspace/work/ep58/tts;
   words.py → /workspace/work/ep58/words_raw.json.
2. place.py: trim, 0.3 s gaps + per-line beats, scene starts snapped up to 130 BPM bars, climax ("mười" in line 17) snapped to a bar downbeat.
   Writes script.vi.json + words.json + /workspace/work/ep58/voice.wav (copied to public/audio/ep58-rice/voice.wav, 48 kHz mono, 104.033 s).
   Scene starts (frames): hook 0 · legend 277 · half1 775 · half2 1329 · total 1883 · climax 2049 · earth 2215 · end 2603 · total 3121.
   Subtitle breaks: a double space in the on-screen text forces a break (used for lines 1, 2, 12, 22).
3. Stills: /workspace/work/ep58/stills.sh <outdir> frames… (BUNDLE=1 re-bundles to /tmp/b58; FMT=png for PNG; scripts/ep58-stills.mjs;
   run with setsid nohup, poll <outdir>/log; ~4–5 s per still). Contact sheet: /workspace/work/ep58/sheet58.py <dir> <out.jpg> 6.
   Preview 2026-10-23: /workspace/out/ep58-stills/ (22 PNG: f40 90 175 380 600 800 870 1000 1150 1360 1495 1570 1660 1790 2025 2070 2290 2420
   2520 2700 2850 3000) + /workspace/out/ep58-stills.jpg. Scratch rounds /workspace/work/ep58/st1…st5.
4. Audio: sfx58.ts (event list from the scene3 constants; hop landings computed from sAt) →
   `SFXOUT=/workspace/work/ep58/sfx.json npx vitest run tests/episodes/zz-ep58-dump.test.ts`;
   `python3 audio/episodes/ep58-rice-tts/mix.py /workspace/work/ep58 .` (= ep57 mix.py, SFX target −15 LUFS momentary instead of −16):
   voice −16, BGM audio/episodes/ep58-rice.py (ep57 synth; map: intro 0–1 · soft hook 2–4 · sparse legend 5–13 · groove half1/half2 14–33 ·
   build 34–36 · CLIMAX bar 37 = frame 2049 · post-climax chords 75 % through earth · end fades out; ducked −55 % under voice) −27,
   SFX bus audio/episodes/ep58-rice-sfx.py (ep57 synth + `grain` = glassy rice clicks for ô 2–6, `hitHuge` = big hit + sub boom for ô 64;
   ducked ~3.5 dB) → alimiter → public/audio/ep58-rice/mix.wav (−14.1 LUFS, −2.4 dBTP wav). Riser CLIMAX−92 → ~0.2 s breath →
   `climax` hit on "mười" (2049); hitBig on ô 40 (1547) / ô 50 (1641), hitHuge on ô 64 (1741); ticks on every hop + proof line + LED counts;
   whooshes before each scene and on the crane (LE(17)+2).
5. Render: /workspace/work/ep58/render.sh (9 chunks in chunks.txt, swangle, CRF 16, muted, resumable via seg/ok-A-B, bundle
   /workspace/work/ep58/bundle — delete it first if code changed), finish.sh (expects public/audio/ep58-rice/mix.wav → /workspace/out/ep58.mp4
   + ep58-web.mp4).

## New in this episode (vs ep57)
- Camera = target + log-interpolated distance + yaw/pitch keys (exponential zoom-out through 3 orders of magnitude); fog (0.33/dist, near 0.95·dist),
  DOF (0.45/dist) and dust (sizes/spread sampled ∝ camera distance along the path) all scale with the camera distance.
- Stars live on a dome that follows the camera (own uFog = 0), warm palette, min 2.5 px.
- Glass shader: optional floor "pool of light" (uSpotC/uSpotR) — tiles/grid/board frame fade with distance from the camera target in close-ups,
  so the counter text never sits on bright tiles.
- Gotcha: never scale a group that holds a glow tube — the min-pixel radius is computed in local space and gets multiplied by the scale
  (first climax still was a full-frame wash); the shock rings now update world-space points each frame.

## Production fixes (2026-10-23, after the stills were approved)
- Hook grain: was a scaled sphere with the additive glass shader (read as a glowing pill). Now `grainGeo` = slender lathe grain
  (length : width ≈ 3.6 : 1, tapered ends, germ end blunter, slightly flattened) used for all individual grains; the hero grain uses the new
  `makePearl` shader (gl.ts: wrap diffuse + soft subsurface centre + silhouette falloff + small pearly highlight + faint longitudinal ridges,
  peak < ~0.7, FrontSide); halo haze 0.13+0.07 → 0.05+0.03, no pulsing.
- Mountain (ô 33+): was an open cone with the additive fresnel glass shader (rim-only → read as a flat sheet leaning on the board edge at ô 40).
  Now `pileGeo` = closed lathe pile (rounded apex, straight angle-of-repose sides, `pileY`) with the new `makePile` shader (gl.ts: directional
  light, back-lit rim, object-space granular texture that fades out when cells < 1 px (fwidth), "over" blending with uOcc 0.72 so it covers the
  grid behind it, FrontSide). renderOrder: pile 5 → sparkles 6 → hops thread 7 (thread always over the pile). Sparkle points sit on pileY.
- LED ghost segments: kit SevenSeg/LED got an optional `ghostO` (default 0.07 unchanged for older episodes); ep58 Counter uses 0.018.
- Found in the first full render and fixed (chunks 1041-1387, 1388-1734, 2429-2775, 2776-3120 re-rendered):
  - ô 49–50 (f≈1620–1665): the (now solid) mountain outgrew the frame and sat behind the subtitle (camera pull-back 4.4× vs pile 10×).
    scene3: in 1598–1700 the camera distance = log-space soft-max(keyframe, 2.6·k) and the target height eases to 0.1·k (separate, slower
    ramps 1600–1626 / 1668–1708 so there is no fast tilt) → pile stays between y ≈ 610 (apex) and ≈ 1275 (front foot), clear of the counter
    block and the subtitle. Dust is generated from `camKeyAt` / `distKeyAt` (keyframe-only camera) so the dust field is identical in every chunk.
  - f≈1320–1345: the per-square counter ("Ô 32 …") flashed back between the "32 Ô ĐẦU" block fading out and "NỬA SAU" fading in → one
    window `gap` over both now suppresses it.
  - End: tag "rồi: vượt mọi tưởng tượng" touched the 2ˣ curve → moved 52 px left.

## Known weak spots / next
- Earth card: the orbit thread wound 4.6× stacks into a thick, bright gold ring around the photo (as in the approved stills; not softened).
- Climax: 8-frame soft white screen flash on 2049 (by design, as in the stills).
- The hero grain is tiny at "Ô 1: một hạt" (f≈815, true scale, ~30 px).
- Square-1 macro board tiles still fairly warm.
- 25-digit LED at ô 64 is ~70 px tall max.
- TTS not human-listened ("khánh kiệt", "tỷ tỷ", "ký").

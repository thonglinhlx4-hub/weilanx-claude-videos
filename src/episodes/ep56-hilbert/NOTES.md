# ep56-hilbert · "Khách sạn vô cực của Hilbert" · notes

Original Vietnamese script (approved by the user 2026-10-21; draft + fact table: /workspace/work/ep56-hilbert/script-draft.md, checks.py).
**9:16 vertical only** (user change 2026-10-21): composition `ep56-hilbert`, 1080×1920, 30 fps, 4534 frames = 151.1 s.
Built on the accepted ep55 v2 three.js pipeline (gl.ts / Stage.tsx copied and adapted; kit55 text components reused).

## Script (scene → line indices in script.src.json, 32 lines)
- hook (0–5): endless corridor (odd rooms on the left wall, even on the right, receding up the frame into fog); the pen draws the
  floor thread and the doors light up 1, 2, 3, …; "KÍN PHÒNG"; a new guest (cream glass pawn) at the entrance; "vẫn còn.";
  Hilbert card (top) + Gamow card (below), stacked vertically.
- one (6–9): the pen runs down the corridor and every guest hops n → n+1 as it passes; "không có phòng cuối cùng"; room 1 empty, the
  new guest walks in; "“kín phòng” ≠ “hết chỗ”".
- bus (10–17): the bus (glass seats) arrives out of the fog with the pen at its front; arcs 1→2, 2→4, 3→6 drawn on the spoken words,
  all others follow (n → 2n); odd rooms go dark and passengers step into them; a curb stroke crosses 12 bus lanes receding to the
  horizon (∞ buses); prime-power chains 2→4→8→16 (old guests), lane 1 → 3, 9, 27, lane 2 → 25, 5, lane 3 → 7, 49 with a legend;
  rooms 6, 10, 12, 15 marked "trống"; primes row; the camera rises over the corridor and flies on.
- cantor (18–22): Cantor card; two rails of beads (1, 2, 3, … and 2, 4, 6, …), the pen draws the one-to-one ladder rung by rung;
  big ℵ₀, |{1, 2, 3, …}| = ℵ₀, the three cardinal equalities stacked, the "∞ không phải một số thông thường" caveat.
- twist (23–28): "Không." → "1891"; a glass table: rooms 1–7 with decimals; the pen runs down the diagonal on the spoken words, each
  diagonal digit is boxed and the new number 0,5555545… is built below (rule 5 → 4, else 5: never 0 or 9); the pen then runs down
  the corridor past rooms 1–7 marking "≠" — "Không phòng nào chứa nó."; CLIMAX (bar downbeat on "vô" of "một vô hạn lớn hơn") =
  90 filaments burst from the pen; "Số thực: không đếm được — một vô hạn lớn hơn ℵ₀".
- end (29–31): Hilbert card + both 1925 quotes; one tall door is drawn, swings open with warm light; the thread runs through the
  door and up into the stars; title "KHÁCH SẠN VÔ CỰC · của Hilbert".

## Facts
Only the facts in the approved fact table (script-draft.md §3). On-screen numbers are recomputed in
tests/episodes/ep56-hilbert.test.ts (n→n+1 / n→2n images, prime-power rooms + no collisions + 6/10/12/15 empty, primes row,
diagonal digits ≠ and no 0/9, demo rows = first decimals of π, e, √2, φ, years > 100). Labels: Hilbert "1862–1943 · nhà toán học
Đức · kể chuyện này ở Göttingen · 1924–1925" (never "1924" alone); Gamow "nhà vật lý · sách 1947: One Two Three… Infinity";
Cantor "1845–1918 · người sáng lập lý thuyết tập hợp"; quote "— Hilbert, 1925" (Münster address, 4 June 1925).
Spoken text = approved script except the letter "n" → "en" (lines 6, 11, 14, 15): edge-tts reads a bare "n" as the letter name
"en-nờ" (MFCC-DTW proxy: bare "n" ≈ "en nờ" distance 1.48 vs "en" 4.34; duration 0.36–0.54 s), which is clumsy in "hai mũ n".

## Photos (public/ep56/SOURCES.json)
- Hilbert — https://commons.wikimedia.org/wiki/File:Hilbert.jpg — public domain (PD-US-expired, PD-EU-no author disclosure), before 1912.
- Cantor — https://commons.wikimedia.org/wiki/File:Georg_Cantor2.jpg — public domain (PD-old), early 1900s.
- Gamow — https://commons.wikimedia.org/wiki/File:Bragg_lab1_1930_(cropped).jpg — Commons tag PD-Art (1931 photo, archive of
  A. A. Lebedev; the tag gives no further PD reason — weakest licence of the three). 195×284 source, shown small (196×286 px card).
- No Göttingen building photo (optional, skipped). The AIP "Attribution" Gamow photo is not used.

## Pipeline
1. TTS: audio/episodes/ep56-hilbert-tts/gen.py (edge-tts vi-VN-NamMinhNeural +6 %, proxy env unset) → /workspace/work/ep56/tts.
2. place.py: trim, gaps (0.25 s + per-line pauses), scene starts snapped to 130 BPM bars, climax bar downbeat on "vô" (line 28,
   85 f after line start) → script.vi.json + voice.wav. words.py → words.json (WordBoundary).
3. sfx56.ts (event list from the same constants) → dumped by `SFXOUT=… npx vitest run tests/episodes/zz-ep56-dump.test.ts`;
   mix.py: voice −16, BGM (ep56-hilbert.py, ducked) −27, SFX bus (ep56-hilbert-sfx.py, ducked ~3.5 dB under speech, loudest
   momentary −16) → alimiter → public/audio/ep56-hilbert/mix.wav (−14.1 LUFS, −2.3 dBTP in the wav).
4. Render: /workspace/work/ep56/render.sh (bundle /workspace/work/ep56/bundle, 12 chunks, swangle, CRF 16, resumable, finished
   chunks in /workspace/work/ep56/seg), finish.sh (concat + AAC → /workspace/out/ep56.mp4; web encode → ep56-web.mp4),
   sheet.py (vertical contact sheet). Stills: /workspace/work/ep56/stills.sh (scripts/ep56-stills.mjs).

## Lessons applied (ep55 v2 feedback)
- Background: warm-only stars and dust; stars ≥ 2.5 px with energy-conserving dimming; twinkle 0.9 + 0.1·sin at 0.25–0.6 rad/s;
  near-camera bokeh fades with smoothstep(1.2, 4.0) of distance, and sprites fade before the frame edge (GL clips a whole sprite
  when its centre leaves the frame — that was a pop source); bokeh max 34 px and dimmer when defocused; grain 0.045.
- Floor grids fade at grazing angles (uGraze) and the hotel floor grid is a narrow strip: a wide grid stacked into a bright bar at
  the horizon. Background strands kept well above/below eye level (at eye level they read as a stray horizontal line).
- Guests flying off to far rooms fade out with depth (dozens of additive pawns piling at one far point made a bright blob).
- Vertical layout: important text between y 192 and 1536; subtitles one line, top at y 1362 (≈72 %), max 860 px (split at
  punctuation / formula gaps, then by words, timed by WordBoundary; canvas-measured fallback shrink).

## Render fixes (2026-10-21, before the final render)
- Glass-shader NaN: `pow(1.0 - vNdv, 2.6)` went NaN when vNdv exceeded 1.0 by float error; NaN/Inf then bloomed into a white-blue
  blob. Fix: vNdv clamped in GLASS_VS, `clamp(1.0 - vNdv, 0, 1)` in GLASS_FS, and the post chain zeroes NaN channels and clamps to
  0–16 before the bloom downsample and in the composite (Stage.tsx).
- Far door-frame white blobs: far door frames were subdivided tubes seen almost along the line of sight, so many short segments
  stacked into a few pixels (additive) → white spot. Fix: frames use only their 4 corner points, halo only for rooms < 10, and frame
  / panel brightness falls off with room number (`fall = 1 / (1 + max(0, m − 6) / 7)`).
- f1284 "137 px white region" = the cream new-guest pawn (intended object), not a second light spot.
- Title "Không phòng nào chứa nó." no longer sits on the diagonal table: table digits fade out by L(27)+12, the title / 0,5555545…
  start at L(27)+36 / +46 (≈1.2 s into the line, after the table and its outline have scrolled away).
- Bloom fireflies (found in the chunk QC: single-frame white pixel with a teal / yellow / blue halo, e.g. f2329, 2360, 2420, 2443):
  the NaN check ran after the 4-tap average, so one garbage pixel got through at 1/4 strength and bloomed. Fix (Stage.tsx copy
  pass): each tap is dropped if NaN / Inf / ≥ 64 / < −1, or if it is HDR (> 1.5) and cooler than red (G or B > 1.15·R, never legit
  in this warm palette); the composite drops main-buffer pixels by the same NaN / ≥ 64 rule. QC script: /workspace/work/ep56/cool.py.
- Dust dims with camera speed (up to −75 % when the camera moves > 0.15 u/frame) so near bokeh doesn't pop during the fast flights.

## Known weak spots
- Prime-power view is busy (lanes of pawns on the right, arcs crossing); right-wall doors are seen nearly edge-on from above.
- Door numbers are hidden for far rooms (sizes fixed per segment from a reference camera; below ~19 px they fade out).
- TTS of "Hin-bớt", "Căng-to", "Ga-mốp", "a-lép không", "en" not checked by a human ear.

## Final (2026-10-22)
- Drive: ep56.mp4 id 1o4VK6Dsbt4sEolpZOMCDnKedsJgXUc_A (web encode)
- 1080x1920 30fps, 151.13 s; master 208.0 MB, web 109.2 MB
- Web MP4: -14.1 LUFS integrated, TP -2.1 dBTP

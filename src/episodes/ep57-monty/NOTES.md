# ep57-monty · "Ba cánh cửa · Monty Hall" · notes

Original Vietnamese script (structure + text approved by the user 2026-10-22; draft /workspace/work/ep57-monty/draft.py).
**9:16 vertical**: composition `ep57-monty`, 1080×1920, 30 fps, **3385 frames = 112.8 s** (target 1:45–2:00).
Built on the ep56 three.js pipeline (gl.ts / Stage.tsx / subs.ts / timing.ts copied and extended; kit55 text components reused).
Status 2026-10-22: stills approved by the user → fixes + BGM/SFX mix + full render (see "Production" below). The composition plays public/audio/ep57-monty/mix.wav.

## Script (scene → line indices in script.src.json, 23 lines) and what is on screen
- hook (0–3): camera rises from the glass floor; the pen draws the floor line and outlines doors 1 → 2 → 3 in one stroke; glass car + two
  goats float in front ("1 ô tô · 2 con dê") then slide back behind the doors; the pen runs on the floor to door 1 and rings its base
  ("Bạn chọn cửa 1"); line 2: Monty Hall photo card (host); the pen arcs to door 3, door 3 swings open → glass goat; line 3: arrow 1 → 2
  drawn only halfway, title "GIỮ hay ĐỔI?".
- fight (4–7): camera pulls up/back, doors small at the bottom (dimmed); "ĐA SỐ NGHĨ · 50% · 50%" struck through by the pen; Marilyn vos
  Savant **typographic** card (no free photo exists) "PARADE · 9/1990 · MARILYN vos SAVANT · chuyên mục “Ask Marilyn” · HÃY ĐỔI · 2/3";
  golden glass envelopes rise along a spiral stroke, LED counters ≈ 10.000 lá thư / ≈ 1.000 tiến sĩ, red stamp "BÀ SAI!" on the card
  corner; Erdős photo card + old monitor (glass box) whose screen fills with the first 60 games of the seeded simulation (gold = switch wins).
- why (8–11): back to door level, slow orbit; the door leaves fill with liquid light to 1/3 each; pen rings door 1 ("1/3") and doors 2+3
  ("2/3"); door 3 opens (goat) — "Người dẫn luôn mở cửa có dê"; line 11: the pen leads a liquid-light stream from door 3 into door 2,
  door 3 drains to 0, door 2 rises to 2/3, the "2/3" label slides onto door 2.
- cases (12–16): camera flies (along the bridge thread) to three stacked glass tiers; per tier the pen rings door 1, rises and arcs to the
  "switch" door; the car is shown at door k on the spoken word, the host door opens on "mở"; right column "xe ở cửa k · mở x · đổi → y" +
  THUA / THẮNG; line 16 tier 1 dims, a bracket joins tiers 2–3, "Đổi cửa: thắng 2/3".
- million (17–19): flight to an avenue of 7 × 120 doors (one merged DoorField mesh); camera rises to look down the avenue; pen outlines
  "cửa của bạn"; on "mở" a switch-off wave runs outward while the LED counts to 999.998; only your door and one far door (row 42) stay
  lit; the pen runs ~92 units down the avenue to the far door ("cửa còn lại"); "giữ?".
- end (20–22): long flight back to the three doors; two liquid-light columns (GIỮ / ĐỔI) fill with the running win rate of the seeded
  simulation (50/50 prior that separates), LED counts 0 → 10.000 games, "≈ 1/3" under GIỮ on "một phần ba"; 0.6 s held silence (screen
  dims) → CLIMAX on "hai" of "hai phần ba": "≈ 2/3" + 60 filaments burst from the pen on top of the ĐỔI liquid; line 21 "TRỰC GIÁC: 50 / 50 ·
  thông tin làm lệch cán cân", the pen re-traces door 2, it opens with warm light and the glass car rolls out; line 22 the thread runs
  through door 2 up into the stars, title "BA CÁNH CỬA · Monty Hall".

## Facts (en.wikipedia.org/wiki/Monty_Hall_problem)
Selvin 1975 (The American Statistician); Parade "Ask Marilyn" Sept 1990; ~10,000 letters, ~1,000 from PhDs, most said she was wrong
(Tierney 1991); Erdős unconvinced until shown a computer simulation (Vazsonyi); million-door example is vos Savant's.
On-screen numbers are recomputed in tests/episodes/ep57-monty.test.ts: simulation (mulberry32, seed 1990, 10,000 games, random car /
random pick / host opens a random goat door) → **giữ 3.393 (33,9 %), đổi 6.607 (66,1 %)**; 999.998 = 1,000,000 − 2; three-case table
[(car 1, open 3, switch→2, lose), (car 2, open 3, →2, win), (car 3, open 2, →3, win)]; duration 105–120 s; climax = bar downbeat on "hai";
pen continuity; subtitle width. Erdős label "1913–1996 · nhà toán học Hungary".

## Photos (public/ep57/SOURCES.json)
- Erdős — https://commons.wikimedia.org/wiki/File:Erdos_budapest_fall_1992_(cropped).jpg — CC BY 3.0, author Kmhkmh (credited on screen).
- Monty Hall — https://commons.wikimedia.org/wiki/File:Monty_hall_abc_tv.JPG — public domain (ABC publicity photo, c. 1968–1976).
- Marilyn vos Savant — **no freely licensed photo on Commons** (her Wikipedia article has no image) → typographic name card instead.

## Pipeline
1. TTS: audio/episodes/ep57-monty-tts/gen.py (edge-tts vi-VN-NamMinhNeural +6 %, run with HTTP(S)_PROXY unset) → /workspace/work/ep57/tts;
   words.py → /workspace/work/ep57/words.json (raw WordBoundary).
2. place.py: trim, 0.25 s gaps + per-line beats, scene starts snapped up to 130 BPM bars; **line 20 is cut just before "hai" (lowest-energy
   10 ms slot between "khoảng" and "hai") and 0.6 s of silence inserted**; the end scene start is re-snapped so "hai" lands on a bar
   downbeat (CLIMAX 2935). Writes script.vi.json + words.json (shifted for the hold) + /workspace/work/ep57/voice.wav (copied to
   public/audio/ep57-monty/voice.wav).
   Scene starts (frames / s): hook 0 · fight 554 / 18.5 · why 1218 / 40.6 · cases 1772 / 59.1 · million 2326 / 77.5 · end 2769 / 92.3 ·
   climax 2935 / 97.8 · total 3385 / 112.8.
3. Stills: /workspace/work/ep57/stills.sh <outdir> frames… (bundles to /tmp/b57 when BUNDLE=1; scripts/ep57-stills.mjs; run detached
   with setsid nohup and poll <outdir>/log; ~5–7 s per still with swangle). Contact sheet: /workspace/work/ep57/sheet57.py.
   Preview delivered 2026-10-22: 18 stills in /workspace/out/ep57-stills/ (f100 160 300 488 660 1030 1170 1420 1680 2020 2200 2450 2530
   2690 2900 2945 3100 3340) + contact sheet /workspace/out/ep57-stills.jpg. Scratch rounds: /workspace/work/ep57/st1…st6.
4. Audio: sfx57.ts (event list from the scene3 constants) → `SFXOUT=/workspace/work/ep57/sfx.json npx vitest run tests/episodes/zz-ep57-dump.test.ts`;
   `python3 audio/episodes/ep57-monty-tts/mix.py /workspace/work/ep57 .` (= ep56 mix.py): voice −16, BGM audio/episodes/ep57-monty.py (ep56 synth,
   ep57 section map: soft hook · groove fight · sparse why · groove cases · soft million · build 3 bars · CLIMAX bar 53 · outro; ducked −55 % under
   voice) −27, SFX bus audio/episodes/ep57-monty-sfx.py (ducked ~3.5 dB, loudest momentary −16) → alimiter → public/audio/ep57-monty/mix.wav.
   Climax: count ticks stop at CLIMAX−24, riser ends ≈ CLIMAX−8, BGM silent the last 0.7 s, voice hold 0.6 s → ~0.2 s digital silence, then the
   `climax` hit (boom + transient + crash + bells, g 1.15) + BGM kick/bell exactly on frame 2935 ("hai").
   (Sandbox note: numpy/scipy had to be re-installed with pip after a restart.)
5. Render: /workspace/work/ep57/render.sh (bundle /workspace/work/ep57/bundle, 9 chunks in chunks.txt, swangle, CRF 16, muted, resumable via
   seg/ok-A-B; run `setsid nohup bash render.sh &`, log render.log, done marker RENDER_OK), finish.sh (concat + AAC 320k → /workspace/out/ep57.mp4;
   web encode x264 slow CRF 18 maxrate 8M yuv420p tv range AAC 192k faststart → /workspace/out/ep57-web.mp4; marker FINISH_OK in finish.log).

## New in this episode (vs ep56)
- gl.ts: `makeVessel` (liquid-light container: uFill level with a soft wavy surface + gentle caustics; door leaves and the two columns),
  tube `uFlow` (soft travelling pulses for the liquid stream, modulation 0.62–1.0, never a spot), `makeHaze` (warm fog sheets),
  `makeDoorField` (hundreds of doors in one mesh: frames are ≥ 1 px ribbons, brightness falls off as 1/(1+(d/16)^1.7), fades when the door is
  < ~10 px tall, switch-off wave by floor distance; kept doors get a 2.4 px frame and ignore most fog).
- Stage.tsx: glass-floor reflection = the scene rendered a second time with scale.y = −1 and uDim × 0.12, only objects in the world's REFL
  set (main stage, its strokes, the liquid stream). The pen and all text are screen-space, so they are never reflected (no second spot).
- Subtitle fade band (pure black, y 1300–1480, 40 %) behind the subtitle line so reflections / floor light never fight the text.

## Fixes made while reviewing the stills
- DoorField switch-off wave was inverted (doors inside the radius stayed on) → fixed; kept doors got a 2.4 px frame (the far door was a
  faint 1 px outline); off doors stay at 15 % so the avenue's shape remains.
- Climax burst: 80 filaments from one point piled into a white blob → 60 filaments whose roots start on a 0.15–0.35 sphere, alpha 0.3.
- Columns' liquid too saturated → uLiqA 0.62. Reflection 0.2 → 0.12. Subtitle band tinted greenish over orange (it was #030308) → pure black.
- End: glass car + light + floor spill were blown out and sat behind the subtitles → car dimmer, smaller, stops at z 0.4; spill shorter;
  end camera looks lower (doors moved up ~90 px). Monty Hall card moved from the final title (it collided with door 2 as the camera rose)
  to line 2 ("Người dẫn chương trình biết hết").
- Million texts moved from the top (they covered the far door) to the dark avenue middle (y 600–700); cases tiers tightened (TIER_DY 2.15,
  lower arcs) so the "3 TRƯỜNG HỢP" title clears tier 1's arc. Door number 3 never appeared in the hook (span end = 1) → fixed.

## Production fixes (2026-10-22, after the stills were approved)
- Climax filaments are rejection-sampled so none crosses the "≈ 2/3" label (screen-space box ±150 × ±62 px around the label, tested at
  CLIMAX, +15, +30, +50, +75).
- Captions ≥ 24 px: Monty Hall line 19 → 24 (title 28, backing 540), photo sources 15 → 24 (backing height +6), Erdős line 20 → 24 (backing 580),
  "MÔ PHỎNG" 18 → 24, "đổi thắng n / m" 20 → 24, cases "mở x · đổi → y" 20 → 24.
- Subtitles: breaks now cost 0 after punctuation, 3 before a phrase-opening word (đã, khi, và, nhưng, rồi, hãy, chừa), 10 elsewhere; evenness
  weight halved; one extra chunk allowed (+3) when it buys a clean break. Fixed: "…cho / bạn", "…Hãy tưởng / tượng", "…có bằng / tiến sĩ",
  "…thắng / khoảng 1/3", "…người dẫn / để lại", "…dẫn mở / 999.998" (now "Lần tới, / khi ai đó mở bớt một cửa cho bạn, / hãy tự hỏi: …").
- Flight back from the far door: follow-cam weight 0.35 → 0.2 → peak camera speed 50.7 → 35.8 units/s (f2753), less speed stutter.
- Avenue after the switch-off wave: off doors 15 % → 22 %.
- Unused MCARD_E imports removed (typecheck clean for ep57; the remaining --noUnusedLocals errors are in ep54/55/56).

## Known weak spots (preview)
- Million scene: after the wave the avenue is very dark (off doors at 15 %); the far door sits high in the frame (~y 380).
- Envelopes read as small golden plates rather than envelopes; Marilyn card is text-only (licence).
- Climax burst still fairly bright and crosses the "≈ 2/3" label for ~1 s.
- The long flight back from the far door (≈ 130 units in 90 frames) is fast; dust is dimmed with camera speed, not yet checked in motion.
- Monty Hall card frame is not drawn by the pen (static frame, like ep56's Hilbert card); Erdős / Marilyn frames are pen strokes.
- TTS names ("Ma-ri-lin vốt Xa-vân", "Pa-rết", "Pôn Ẹc-đốt") not checked by a human ear; the 0.6 s hold cut inside line 20 not listened to.
- Subtitle splits are by width: "…mở bớt một cửa cho / bạn, hãy tự hỏi…" and "…giữ cửa thắng / khoảng 1/3…" break mid-phrase.
- Small captions (Monty Hall 19 px, sources 15 px) are tiny on a phone.

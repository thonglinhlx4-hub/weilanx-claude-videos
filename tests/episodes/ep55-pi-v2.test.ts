import {describe, expect, it} from 'vitest';
import {FRAMES, GLYPHS3, PI_DIGITS, STROKES3, camAt, len3, pen3, sub, lowB, upB, STEP3} from '../../src/episodes/ep55-pi/v2/scene3';
import {SUBS} from '../../src/episodes/ep55-pi/v2/subs';

describe('ep55-pi v2 (3D)', () => {
  it('one continuous thread: strokes never overlap, the pen never jumps in 3D', () => {
    for (let i = 1; i < STROKES3.length; i++) expect(STROKES3[i].at).toBeGreaterThanOrEqual(STROKES3[i - 1].at + STROKES3[i - 1].dur);
    // 位置连续（飞行段很快但平滑）：速度有上限、相邻帧的速度变化很小（不会瞬移）
    let a = pen3(0).p, b = pen3(1).p;
    for (let f = 2; f < FRAMES; f++) {
      const c = pen3(f).p;
      expect(len3(sub(c, b))).toBeLessThan(2.5);
      expect(len3(sub(sub(c, b), sub(b, a)))).toBeLessThan(1.2);
      a = b; b = c;
    }
  });
  it('camera is smooth (no jumps)', () => {
    for (let f = 1; f < FRAMES; f++) expect(len3(sub(camAt(f).pos, camAt(f - 1).pos))).toBeLessThan(1.5);
  });
  it('facts: polygon doubling 6→96, digit river is π', () => {
    expect(STEP3.map((s) => s.n)).toEqual([6, 12, 24, 48, 96]);
    expect(lowB(96)).toBeGreaterThan(223 / 71);
    expect(upB(96)).toBeLessThan(22 / 7);
    expect(GLYPHS3.map((g) => g.ch).join('')).toBe(PI_DIGITS.slice(0, GLYPHS3.length));
  });
  it('subtitles: one line each (≤ 72 chars), inside the video', () => {
    for (const [a, b, t] of SUBS) { expect(t.length).toBeLessThanOrEqual(72); expect(a).toBeGreaterThanOrEqual(0); expect(b).toBeLessThanOrEqual(FRAMES); }
  });
});

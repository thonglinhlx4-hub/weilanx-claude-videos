// ep58: recompute every on-screen number; pen continuity; timeline sanity; subtitle width.
import {describe, expect, it} from 'vitest';
import * as F from '../../src/episodes/ep58-rice/facts';
import {FRAMES, STROKES3, S_KEYS, sAt, pen3, hopFrac, CLIMAX, L, distAt} from '../../src/episodes/ep58-rice/scene3';
import {SUBS, subWidth, MAXW} from '../../src/episodes/ep58-rice/subs';

describe('ep58 facts', () => {
  it('numbers', () => {
    expect(F.SQ10).toBe('512');
    expect(F.SQ10_G).toBe('12,8');
    expect(F.SQ20).toBe('524.288');
    expect(F.SQ20_KG).toBe('13,1');
    expect(F.HALF).toBe('4.294.967.295');
    expect(F.HALF_T).toBe(107);
    expect(F.SQ40).toBe('549.755.813.888');
    expect(F.SQ40_T).toBe('13.744');
    expect(F.SQ50_MT).toBe('14,07');
    expect(F.SQ64).toBe('9.223.372.036.854.775.808');
    expect(F.SQ64_TT).toBe('9,22');
    expect(F.TOTAL_TXT).toBe('18.446.744.073.709.551.615');
    expect(F.TOTAL_TYT).toBe(461);
    expect(F.YEARS_WORLD).toBe(844);
    expect(F.YEARS_VN).toBe(17600);
    // proof: 1 + sum(2^0..2^63) = 2^64
    let s = 1n; for (let n = 1; n <= 64; n++) s += F.grains(n);
    expect(s).toBe(1n << 64n);
  });
});
describe('ep58 timeline', () => {
  it('duration ~104 s', () => { expect(FRAMES / 30).toBeGreaterThan(100); expect(FRAMES / 30).toBeLessThan(115); });
  it('hop keys monotone', () => { for (let i = 1; i < S_KEYS.length; i++) { expect(S_KEYS[i][0]).toBeGreaterThanOrEqual(S_KEYS[i - 1][0]); expect(S_KEYS[i][1]).toBeGreaterThanOrEqual(S_KEYS[i - 1][1]); } });
  it('hop milestones land', () => { for (const [f, s] of S_KEYS) expect(Math.abs(sAt(f) - s)).toBeLessThan(1e-6); expect(hopFrac(64)).toBeCloseTo(1, 6); });
  it('one pen: strokes never overlap and pen never jumps', () => {
    const ss = [...STROKES3].sort((a, b) => a.at - b.at);
    for (let i = 1; i < ss.length; i++) expect(ss[i].at).toBeGreaterThanOrEqual(ss[i - 1].at + ss[i - 1].dur - 0.001);
    for (let f = 1; f < FRAMES; f++) {
      const a = pen3(f - 1).p, b = pen3(f).p;
      const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      // pen speed relative to the scene scale (camera distance)
      expect(d / distAt(f), 'frame ' + f).toBeLessThan(0.15);
    }
  });
  it('climax after proof', () => { expect(CLIMAX).toBeGreaterThan(L(16)); expect(CLIMAX).toBeLessThan(L(18)); });
  it('subtitles fit', () => { for (const [, , t] of SUBS) expect(subWidth(t), t).toBeLessThanOrEqual(MAXW + 1); });
});

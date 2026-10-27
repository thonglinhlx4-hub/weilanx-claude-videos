import {describe, expect, it} from 'vitest';
import {GLYPHS, NASA_DIGITS, PI_DIGITS, STEPS, STROKES, lowB, penAt, upB} from '../../src/episodes/ep55-pi/ink55';
import {SFX} from '../../src/episodes/ep55-pi/sfx55';
import {BARF, CLIMAX, CUES, FRAMES, SC} from '../../src/episodes/ep55-pi/timing';

describe('ep55-pi facts', () => {
  it('Archimedes bounds: 96-gon values and 223/71 < π < 22/7', () => {
    expect(STEPS.map((s) => s.n)).toEqual([6, 12, 24, 48, 96]);
    expect(lowB(96)).toBeGreaterThan(223 / 71);
    expect(upB(96)).toBeLessThan(22 / 7);
    expect(223 / 71).toBeLessThan(Math.PI);
    expect(22 / 7).toBeGreaterThan(Math.PI);
    expect((223 / 71).toFixed(4)).toBe('3.1408');
    expect((22 / 7).toFixed(4)).toBe('3.1429');
  });
  it('digits: NASA/JPL uses 3.141592653589793 (15 decimals); digit stream is π', () => {
    expect(NASA_DIGITS).toBe('3.141592653589793');
    expect(NASA_DIGITS.split('.')[1].length).toBe(15);
    expect(Number(NASA_DIGITS)).toBe(Math.PI);
    expect(PI_DIGITS.replace(',', '.').slice(0, 17)).toBe(String(Math.PI).slice(0, 17));
    expect(GLYPHS.map((g) => g.ch).join('')).toBe(PI_DIGITS.slice(0, GLYPHS.length));
  });
});
describe('ep55-pi timing', () => {
  it('scene starts and the climax sit on 130 BPM bar lines', () => {
    for (const v of Object.values(SC)) expect(Math.abs(v / BARF - Math.round(v / BARF))).toBeLessThan(0.02);
    expect(CLIMAX).toBe(SC.climax);
  });
  it('cues inside the video; strokes never overlap; one pen never jumps', () => {
    for (const [a, b] of CUES) { expect(a).toBeGreaterThanOrEqual(0); expect(b).toBeLessThanOrEqual(FRAMES); }
    for (let i = 1; i < STROKES.length; i++) expect(STROKES[i].at).toBeGreaterThanOrEqual(STROKES[i - 1].at + STROKES[i - 1].dur);
    let prev = penAt(0);
    for (let f = 1; f < FRAMES; f++) { const p = penAt(f); if (p && prev) expect(Math.hypot(p.p[0] - prev.p[0], p.p[1] - prev.p[1])).toBeLessThan(400); prev = p; }
  });
  it('sfx inside the video', () => {
    for (const s of SFX) { expect(s.f).toBeGreaterThanOrEqual(0); expect(s.f).toBeLessThan(FRAMES); }
  });
});

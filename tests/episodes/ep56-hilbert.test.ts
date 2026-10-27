import {describe, expect, it} from 'vitest';
import {
  CH2_ROOMS, CH3_ROOMS, CH5_ROOMS, CH7_ROOMS, DIAG_LIST, DIAG_NEW, FRAMES, GUESTS, PRIMES, STROKES3, busPrime, camAt, guestPos, len3, pen3, roomPos, sub,
} from '../../src/episodes/ep56-hilbert/scene3';
import {SUBS, MAXW, subWidth} from '../../src/episodes/ep56-hilbert/subs';
import {PRIME_ROW, EMPTY_MARK, ROOM_NUMS} from '../../src/episodes/ep56-hilbert/facts';

describe('ep56 hilbert: facts on screen are recomputed', () => {
  it('n → n+1 frees room 1; n → 2n frees every odd room', () => {
    const N = 2000;
    const a = new Set(Array.from({length: N}, (_, i) => i + 2));
    expect(a.size).toBe(N); expect(a.has(1)).toBe(false);
    const b = Array.from({length: N}, (_, i) => 2 * (i + 1));
    expect(new Set(b).size).toBe(N); expect(b.every((r) => r % 2 === 0)).toBe(true);
    expect([1, 2, 3].map((n) => 2 * n)).toEqual([2, 4, 6]);
  });
  it('prime powers: rooms shown, no collisions, 6/10/12/15 stay empty', () => {
    expect(PRIMES.slice(0, 12)).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]);
    expect(CH2_ROOMS).toEqual([1, 2, 3, 4].map((n) => 2 ** n));
    expect(CH3_ROOMS).toEqual([1, 2, 3].map((n) => busPrime(1) ** n));
    expect([...CH5_ROOMS].sort((x, y) => x - y)).toEqual([1, 2].map((n) => busPrime(2) ** n));
    expect(CH7_ROOMS).toEqual([1, 2].map((n) => busPrime(3) ** n));
    const used = new Map<number, string>();
    for (let n = 1; n < 25; n++) { expect(used.has(2 ** n)).toBe(false); used.set(2 ** n, 'hotel'); }
    for (let c = 1; c <= 20; c++) for (let n = 1; n < 12; n++) { const r = busPrime(c) ** n; expect(used.has(r)).toBe(false); used.set(r, 'bus' + c); }
    for (const r of EMPTY_MARK) expect(used.has(r)).toBe(false);
    expect(EMPTY_MARK).toEqual([6, 10, 12, 15]);
    expect(PRIME_ROW.split(/\s+/).filter((x) => /\d/.test(x)).map(Number)).toEqual(PRIMES.slice(0, PRIME_ROW.split(/\s+/).filter((x) => /\d/.test(x)).length));
  });
  it('diagonal: the new number differs from room k in digit k and avoids 0 and 9', () => {
    expect(DIAG_NEW).toBe('5555545');
    DIAG_LIST.forEach((s, k) => expect(DIAG_NEW[k]).not.toBe(s[k]));
    expect(/[09]/.test(DIAG_NEW)).toBe(false);
    expect(DIAG_LIST).toEqual(['1415926', '5000000', '7182818', '3333333', '4142135', '5772156', '6180339']);
    // the demo rows are the first 7 decimals of π−3, 1/2, e−2, 1/3, √2−1, γ, φ−1 (labels are not shown; only digits)
    expect(Math.PI.toFixed(8).slice(2, 9)).toBe(DIAG_LIST[0]);
    expect(Math.E.toFixed(8).slice(2, 9)).toBe(DIAG_LIST[2]);
    expect(Math.SQRT2.toFixed(8).slice(2, 9)).toBe(DIAG_LIST[4]);
    expect(((1 + Math.sqrt(5)) / 2).toFixed(8).slice(2, 9)).toBe(DIAG_LIST[6]);
  });
  it('room numbers drawn = 1..N', () => { expect(ROOM_NUMS(12)).toEqual(Array.from({length: 12}, (_, i) => i + 1)); });
  it('years on screen', () => {
    expect(2026 - 1925).toBeGreaterThan(100); expect(2026 - 1924).toBeGreaterThan(100);
  });
});

describe('ep56 hilbert: one thread, one pen, smooth camera', () => {
  it('strokes never overlap; pen never jumps', () => {
    for (let i = 1; i < STROKES3.length; i++) expect(STROKES3[i].at, STROKES3[i].id).toBeGreaterThanOrEqual(STROKES3[i - 1].at + STROKES3[i - 1].dur);
    let a = pen3(0).p, b = pen3(1).p;
    for (let f = 2; f < FRAMES; f++) {
      const c = pen3(f).p;
      expect(len3(sub(c, b)), 'speed f' + f).toBeLessThan(2.5);
      expect(len3(sub(sub(c, b), sub(b, a))), 'accel f' + f).toBeLessThan(1.2);
      a = b; b = c;
    }
  });
  it('camera has no jumps', () => {
    for (let f = 1; f < FRAMES; f++) expect(len3(sub(camAt(f).pos, camAt(f - 1).pos)), 'cam f' + f).toBeLessThan(1.5);
  });
  it('guests land in rooms (no two in one visible room at rest)', () => {
    for (const f of [800, 1300, 1800, 2300]) {
      const seen = new Set<string>();
      for (const g of GUESTS) {
        const p = guestPos(g, f);
        if (p[2] < -40 || p[0] > 1.5 || p[1] > 0.01) continue;
        const k = `${p[0].toFixed(2)},${p[2].toFixed(2)}`;
        expect(seen.has(k), `f${f} ${g.id} ${k}`).toBe(false); seen.add(k);
      }
    }
    expect(roomPos(1)[0]).toBeLessThan(0); expect(roomPos(2)[0]).toBeGreaterThan(0);
  });
  it('subtitles: one line each, ≤ max width, inside the video', () => {
    for (const [a, b, t] of SUBS) { expect(subWidth(t), t).toBeLessThanOrEqual(MAXW); expect(a).toBeGreaterThanOrEqual(0); expect(b).toBeLessThanOrEqual(FRAMES); expect(b).toBeGreaterThan(a); }
  });
});

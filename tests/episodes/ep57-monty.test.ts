import {describe, expect, it} from 'vitest';
import {CASES, CASE_WINS, CUM_STAY, GAMES, MILLION, OPENED, OPENED_TXT, MILLION_TXT, SIM_N, SIM_SEED, STAY_WINS, SWITCH_WINS, simulate, vn, pct, LETTERS, PHDS} from '../../src/episodes/ep57-monty/facts';
import {CLIMAX, FRAMES, L, LE, STROKES3, camAt, gamesAt, len3, pen3, rates, sub, wd} from '../../src/episodes/ep57-monty/scene3';
import {SUBS, MAXW, subWidth} from '../../src/episodes/ep57-monty/subs';
import J from '../../src/episodes/ep57-monty/script.vi.json';

describe('ep57 monty hall: numbers on screen are recomputed', () => {
  it('simulation: 10,000 games with a fixed seed → stay ≈ 1/3, switch ≈ 2/3, and the shown counts match', () => {
    expect(SIM_N).toBe(10000);
    const again = simulate(SIM_N, SIM_SEED);
    expect(again.map((g) => g.car * 9 + g.pick * 3 + g.open)).toEqual(GAMES.map((g) => g.car * 9 + g.pick * 3 + g.open));
    for (const g of GAMES) {
      expect(g.open).not.toBe(g.pick); expect(g.open).not.toBe(g.car);   // host never opens your door or the car
      expect(g.stayWin !== g.switchWin).toBe(true);                       // exactly one strategy wins each game
    }
    expect(STAY_WINS + SWITCH_WINS).toBe(SIM_N);
    expect(STAY_WINS).toBe(GAMES.filter((g) => g.stayWin).length);
    expect(Math.abs(STAY_WINS / SIM_N - 1 / 3)).toBeLessThan(0.01);
    expect(Math.abs(SWITCH_WINS / SIM_N - 2 / 3)).toBeLessThan(0.01);
    expect(CUM_STAY[SIM_N]).toBe(STAY_WINS);
    // the end-scene counter reaches exactly 10.000 games before the climax and shows these counts
    expect(gamesAt(CLIMAX)).toBe(SIM_N);
    const r = rates(CLIMAX);
    expect(r.stayWins).toBe(STAY_WINS); expect(r.switchWins).toBe(SWITCH_WINS);
    expect(Math.abs(r.stay - 1 / 3)).toBeLessThan(0.012); expect(Math.abs(r.sw - 2 / 3)).toBeLessThan(0.012);
    expect(pct(STAY_WINS, SIM_N)).toMatch(/^3[23],\d%$/); expect(pct(SWITCH_WINS, SIM_N)).toMatch(/^6[67],\d%$/);
    console.log('sim', STAY_WINS, SWITCH_WINS, pct(STAY_WINS, SIM_N), pct(SWITCH_WINS, SIM_N));
  });
  it('a million doors: the host opens 1,000,000 − 2 = 999.998', () => {
    expect(OPENED).toBe(MILLION - 2);
    expect(OPENED_TXT).toBe('999.998'); expect(MILLION_TXT).toBe('1.000.000');
    expect(vn(10000)).toBe('10.000'); expect(vn(LETTERS)).toBe('10.000'); expect(vn(PHDS)).toBe('1.000');
  });
  it('three cases (you pick door 1): switching wins in 2 of 3', () => {
    expect(CASES.map((c) => [c.car, c.open, c.switchTo, c.switchWins])).toEqual([[1, 3, 2, false], [2, 3, 2, true], [3, 2, 3, true]]);
    for (const c of CASES) { expect(c.open).not.toBe(1); expect(c.open).not.toBe(c.car); }
    expect(CASE_WINS).toBe(2);
  });
});

describe('ep57 timing / thread / subtitles', () => {
  it('duration 105–120 s; climax bar downbeat on "hai" of "hai phần ba" (line 20)', () => {
    expect(FRAMES / 30).toBeGreaterThanOrEqual(105); expect(FRAMES / 30).toBeLessThanOrEqual(120);
    expect(wd(20, 'hai')).toBe(CLIMAX);
    const bar = (4 * 60 / 130) * 30;
    expect(Math.abs(CLIMAX / bar - Math.round(CLIMAX / bar))).toBeLessThan(0.02);
    expect(LE(22)).toBeLessThan(FRAMES);
    expect(J.lines.length).toBe(23);
  });
  it('one continuous pen: strokes never overlap in time and the pen never jumps', () => {
    for (let i = 1; i < STROKES3.length; i++) expect(STROKES3[i].at).toBeGreaterThanOrEqual(STROKES3[i - 1].at + STROKES3[i - 1].dur - 1);
    // continuity: outside the camera-followed scene flights (bridges) and the long run down the door avenue ('far', straight into
    // depth, small on screen) the pen moves < 1 world unit per frame
    const inBridge = (f: number) => STROKES3.some((s) => (s.bridge || s.id === 'far') && f >= s.at && f <= s.at + s.dur);
    let prev = pen3(0).p, worst = 0, wf = 0, worstB = 0;
    for (let f = 1; f < FRAMES; f++) { const p = pen3(f).p; const d = len3(sub(p, prev)); if (inBridge(f)) worstB = Math.max(worstB, d); else if (d > worst) { worst = d; wf = f; } prev = p; }
    console.log('max pen step', worst.toFixed(3), 'at', wf, 'bridges', worstB.toFixed(2));
    expect(worst).toBeLessThan(1.0);
    expect(worstB).toBeLessThan(4.5);
    expect(Number.isFinite(camAt(FRAMES - 1).pos[0])).toBe(true);
  });
  it('subtitles fit on one line', () => {
    for (const [, , s] of SUBS) expect(subWidth(s)).toBeLessThan(MAXW + 40);
    expect(SUBS.length).toBeGreaterThan(23);
    expect(L(0)).toBeGreaterThan(0);
  });
});

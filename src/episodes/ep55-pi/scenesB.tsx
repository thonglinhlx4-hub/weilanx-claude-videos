// ep55 场景 3–4：阿基米德用多边形夹住 π ／ 无理数：金线上的数字流。
import React from 'react';
import {Backing, C, GText, Ink, LED, TX, eo, prog, vis} from './kit55';
import {FaintGrid, SP} from './scenesA';
import {
  A_CIRC, A_FRAME, AC, AR, BOX_AT, EQ2_AT, EQ_AT, FINE, FRAME_R, GLYPHS, NUM, NUM_AT, PIROW_AT, PUNCHES, ROW_AT, STEPS, STROKE, VOTI_AT,
  fineX, lowB, numX, stepDone, upB,
} from './ink55';
import {punchK} from './cam55';
import {SC} from './timing';
import {clamp, lerp} from './geo55';

/* ---------------- S3 阿基米德 ---------------- */
const archVis = (f: number) => vis(f, A_CIRC - 6, SC.irr, 10, 16);
/** 当前显示的是第几步（LED / 区间） */
const stepIdx = (f: number) => STEPS.reduce((k, _s, i) => (f >= stepDone(i) ? i : k), -1);
const bounds = (f: number): [number, number] => {
  const i = stepIdx(f);
  if (i < 0) return [lowB(6), upB(6)];
  const t = eo(prog(f, stepDone(i), 12));
  const a = i > 0 ? STEPS[i - 1].n : STEPS[0].n, b = STEPS[i].n;
  return [lerp(lowB(a), lowB(b), t), lerp(upB(a), upB(b), t)];
};
export const ArchWorld: React.FC<SP> = ({f}) => {
  const o = archVis(f);
  if (o <= 0) return null;
  const zk = punchK(PUNCHES[1], f); // 推近时线条被放大 2 倍，整体压暗，保持柔光
  return (
    <g opacity={o}>
      <FaintGrid o={0.7 * eo(prog(f, A_CIRC, 30))} id="a" cx={600} cy={500} />
      <Ink s={STROKE.acirc} f={f} o={1 - 0.35 * zk} />
      {STEPS.map((s, i) => {
        const nx = STEPS[i + 1];
        const dim = nx ? 1 - 0.78 * eo(prog(f, nx.at, 10)) - 0.22 * prog(f, nx.at + 36, 14) : 1;
        if (dim <= 0) return null;
        return (
          <g key={s.n} opacity={dim * (1 - 0.3 * zk)}>
            <Ink s={STROKE['in' + s.n]} f={f} />
            <Ink s={STROKE['out' + s.n]} f={f} />
          </g>
        );
      })}
      <circle cx={AC[0]} cy={AC[1]} r={4} fill={C.mid} opacity={eo(prog(f, A_CIRC + 30, 10))} />
    </g>
  );
};
const LEG = [['#7fa6ff', 'đa giác trong'], ['#ff7a4a', 'đa giác ngoài']];
export const ArchScreen: React.FC<SP> = ({f}) => {
  const o = archVis(f);
  if (o <= 0) return null;
  const si = stepIdx(f);
  const ledO = eo(prog(f, stepDone(0) + 2, 8)) * (1 - prog(f, EQ_AT - 10, 10));
  const s = STEPS[Math.max(0, si)];
  const flick = si >= 0 && f - stepDone(si) < 4 ? 0.55 : 1;
  const [lo, hi] = bounds(f);
  const numO = eo(prog(f, NUM_AT + 16, 12));
  const fineO = eo(prog(f, EQ2_AT + 18, 12));
  const back = punchK(PUNCHES[1], f);
  return (
    <g opacity={o}>
      <Backing x={1080} y={120} w={790} h={790} o={back} />
      <Ink s={STROKE.aframe} f={f} />
      <TX x={FRAME_R.x + FRAME_R.w / 2} y={FRAME_R.y + 62} text="ARCHIMEDES" size={40} ls={10} anchor="middle" color="#ffe2b4" glow="#ff9a3a" glowO={0.35} o={eo(prog(f, A_FRAME + 18, 12))} />
      <TX x={FRAME_R.x + FRAME_R.w / 2} y={FRAME_R.y + 102} text="khoảng 287 – 212 TCN · Syracuse" size={22} anchor="middle" color="rgba(230,224,212,0.72)" o={eo(prog(f, A_FRAME + 26, 12))} />
      {ledO > 0 ? (
        <g opacity={ledO}>
          <TX x={1150} y={378} text="SỐ CẠNH" size={22} ls={3} color="rgba(236,230,218,0.82)" />
          <TX x={1150} y={452} text="TRONG" size={22} ls={3} color="#a9c0ff" />
          <TX x={1150} y={526} text="NGOÀI" size={22} ls={3} color="#ffa884" />
          <g opacity={flick}>
            <LED value={String(s.n).padStart(2, ' ')} x={1420} y={340} size={48} color="#ffb060" />
            <LED value={lowB(s.n).toFixed(4)} x={1420} y={414} size={48} color="#6f98ff" />
            <LED value={upB(s.n).toFixed(4)} x={1420} y={488} size={48} color="#ff5a36" />
          </g>
        </g>
      ) : null}
      {/* 数轴（屏幕层：阿基米德段的推近只作用在左边的圆上） */}
      <Ink s={STROKE.numline} f={f} />
      {numO > 0 ? (
        <g opacity={numO}>
          {[3.0, 3.1, 3.2, 3.3, 3.4, 3.5].map((v) => (
            <g key={v}>
              <path d={`M${Math.round(numX(v))},${NUM.y - 7}V${NUM.y + 7}`} stroke="rgba(230,232,255,0.7)" strokeWidth={1.4} />
              <TX x={numX(v)} y={NUM.y + 36} text={v.toFixed(1).replace('.', ',')} size={20} anchor="middle" color="rgba(214,222,255,0.72)" />
            </g>
          ))}
          <rect x={numX(lo)} y={NUM.y - 14} width={Math.max(1, numX(hi) - numX(lo))} height={28} fill="#ffc070" opacity={0.13} />
          <path d={`M${numX(lo).toFixed(1)},${NUM.y - 20}V${NUM.y + 20}`} stroke="#7fa6ff" strokeWidth={3} strokeLinecap="round" />
          <path d={`M${numX(hi).toFixed(1)},${NUM.y - 20}V${NUM.y + 20}`} stroke="#ff7a4a" strokeWidth={3} strokeLinecap="round" />
          <path d={`M${Math.round(numX(Math.PI))},${NUM.y - 26}V${NUM.y + 10}`} stroke={C.mid} strokeWidth={2} />
          <TX x={numX(Math.PI)} y={NUM.y - 36} text="π" size={28} italic anchor="middle" color="#ffe0b0" glow="#ff9a3a" glowO={0.35} />
          {LEG.map(([c, t], i) => (
            <g key={t}>
              <path d={`M${1150 + i * 320},${NUM.y - 82}h36`} stroke={c} strokeWidth={3} strokeLinecap="round" />
              <TX x={1198 + i * 320} y={NUM.y - 75} text={t} size={21} color="rgba(232,226,214,0.8)" />
            </g>
          ))}
        </g>
      ) : null}
      <GText id="a-eq" x={1450} y={430} f={f} at={EQ_AT} dur={14} text="223/71  <  π  <  22/7" size={60} />
      <GText id="a-eq2" x={1450} y={510} f={f} at={EQ2_AT} dur={14} text="3,1408  <  π  <  3,1429" size={44} color="#fff0d8" glowO={0.3} />
      <Ink s={STROKE.fine} f={f} />
      {fineO > 0 ? (
        <g opacity={fineO}>
          <g stroke="rgba(255,214,150,0.45)" strokeWidth={1.2} strokeDasharray="5 6" fill="none">
            <path d={`M${numX(3.1408).toFixed(1)},${NUM.y + 16}L${fineX(223 / 71).toFixed(1)},${FINE.y - 22}`} />
            <path d={`M${numX(22 / 7).toFixed(1)},${NUM.y + 16}L${fineX(22 / 7).toFixed(1)},${FINE.y - 22}`} />
          </g>
          {[3.14, 3.141, 3.142, 3.143].map((v) => (
            <g key={v}>
              <path d={`M${Math.round(fineX(v))},${FINE.y - 6}V${FINE.y + 6}`} stroke="rgba(230,232,255,0.7)" strokeWidth={1.4} />
              <TX x={fineX(v)} y={FINE.y + 34} text={v.toFixed(3).replace('.', ',')} size={19} anchor="middle" color="rgba(214,222,255,0.72)" />
            </g>
          ))}
          <rect x={fineX(223 / 71)} y={FINE.y - 12} width={fineX(22 / 7) - fineX(223 / 71)} height={24} fill="#ffc070" opacity={0.14} />
          <path d={`M${fineX(223 / 71).toFixed(1)},${FINE.y - 18}V${FINE.y + 18}`} stroke="#7fa6ff" strokeWidth={3} strokeLinecap="round" />
          <path d={`M${fineX(22 / 7).toFixed(1)},${FINE.y - 18}V${FINE.y + 18}`} stroke="#ff7a4a" strokeWidth={3} strokeLinecap="round" />
          <path d={`M${Math.round(fineX(Math.PI))},${FINE.y - 24}V${FINE.y + 8}`} stroke={C.mid} strokeWidth={2} />
          <TX x={fineX(Math.PI)} y={FINE.y - 32} text="π" size={26} italic anchor="middle" color="#ffe0b0" />
        </g>
      ) : null}
    </g>
  );
};

/* ---------------- S4 无理数 ---------------- */
const irrVis = (f: number) => vis(f, SC.irr - 4, SC.life, 10, 16);
export const IrrWorld: React.FC<SP> = ({f}) => {
  const o = irrVis(f);
  if (o <= 0) return null;
  return <g opacity={o}><Ink s={STROKE.thread} f={f} /></g>;
};
const ROW_X = 600, GX = (g: number) => 660 + g * 186;
const Row: React.FC<{y: number; head: string; groups: string[]; f: number; at: number; color: string}> = ({y, head, groups, f, at, color}) => {
  const o = eo(prog(f, at, 10));
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      <TX x={ROW_X - 14} y={y} text={head} size={44} anchor="end" color={color} />
      <TX x={ROW_X} y={y} text="3," size={44} color={color} />
      {groups.map((g, i) => <TX key={i} x={GX(i)} y={y} text={g} size={44} color={color} o={eo(prog(f, at + 4 + i * 4, 6))} />)}
      <TX x={GX(3)} y={y} text="…" size={44} color={color} o={eo(prog(f, at + 18, 6))} />
    </g>
  );
};
export const IrrScreen: React.FC<SP> = ({f}) => {
  const o = irrVis(f);
  if (o <= 0) return null;
  const topO = 1 - prog(f, VOTI_AT + 70, 16) * 0;
  return (
    <g opacity={o}>
      {GLYPHS.map((g, k) => {
        const a = eo(prog(f, g.t, 4));
        if (a <= 0) return null;
        const ripple = 0.78 + 0.22 * (0.5 + 0.5 * Math.sin(0.33 * k - f * 0.12));
        const fresh = 1 - prog(f, g.t, 14);
        return <TX key={k} x={g.x} y={g.y} text={g.ch} size={Math.round(g.size)} anchor="middle" color={fresh > 0 ? '#fff4dc' : '#f6d6a0'} glow="#ff9a3a" glowO={0.18 + 0.3 * fresh} o={a * ripple} />;
      })}
      <g opacity={topO}>
        <Row y={210} head="22/7 =" groups={['142857', '142857', '142857']} f={f} at={ROW_AT} color="rgba(214,224,255,0.92)" />
        {[0, 1, 2].map((g) => {
          const t = eo(prog(f, BOX_AT + g * 6, 8));
          return t > 0 ? <rect key={g} x={GX(g) - 9} y={210 - 42} width={172} height={56} rx={10} fill="#3a5cff" fillOpacity={0.08} stroke="#8fb0ff" strokeWidth={1.6} opacity={t * 0.9} /> : null;
        })}
        <TX x={GX(3) + 70} y={210} text="lặp lại mãi" size={26} color="#a9c0ff" o={eo(prog(f, BOX_AT + 18, 10))} />
        <Row y={300} head="π =" groups={['141592', '653589', '793238']} f={f} at={PIROW_AT} color="#ffe6c0" />
        <TX x={GX(3) + 70} y={300} text="không lặp lại" size={26} color="#ffc070" glow="#ff9a3a" glowO={0.3} o={eo(prog(f, PIROW_AT + 18, 10))} />
      </g>
      <GText id="i-vt" x={960} y={445} f={f} at={VOTI_AT} dur={14} text="SỐ VÔ TỈ" size={72} ls={8} />
      <TX x={960} y={495} text="không phân số p/q nào viết đúng được π" size={26} anchor="middle" color="rgba(240,232,220,0.82)" o={eo(prog(f, VOTI_AT + 14, 10))} />
    </g>
  );
};
export {clamp};

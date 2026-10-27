// ep55 v2 · 屏幕文字层：所有文字 / 数字 / 公式都在这里（整数像素、固定字号、不旋转、等宽数字）。
// 世界锚点经 makePJ3 投影：前后 7 帧相机的投影取平均再取整，所以 3D 世界在动、文字不闪。
import React from 'react';
import {Backing, C, GText, LED, SoftGlow, TX, ledWidth} from '../kit55';
import {
  AFRAME, AR3, BOX_AT, BR, CHIPS, CHIP_AT, CLIMAX, CURIOUS_AT, D_CIRC, D_DIAM, DC, DR, EQ2_AT, EQ_AT, ERR_AT, FINAL_AT, FRAMES, GLYPHS3, GPSF_AT, INSET_IN,
  INSET_OUT, L, LDIST3, LFORM_AT, LROLL0, LW_AT, LX03, NASA_AT, NASA_DIG0, NFRAME, NUM_AT, O5, O5B, OBJ, OBJ3, OBJ_IN, ORB_IN, O_AT, PERIOD_AT, PIROW_AT,
  Q2_AT, QMARK, QMARK_AT, Q_AT, REM_AT, REVEAL, ROLL0, ROW_AT, SAMP, SC, SINE_IN, SK3, STEP3, SXH, TITLE_AT, VOTI_AT, VOY_AT, VOY_C, VOY_LABEL, VOY_PROBE,
  WHEEL_AT, WHEEL_DUR, WHY_AT, WR, WX0, ZF, add, CARDS, card3, mul, camAt, clamp, eo, lerp, lerp3, lowB, lrollE, plane, prog, rollE, step3Done, upB,
} from './scene3';
import {V3, project} from './gl';
import {INSET_RECT} from './world';
import {PI_AT, FORM_AT, RATIO_AT} from '../ink55';

export type PJ3 = (p: V3) => [number, number];
export const makePJ3 = (f: number): PJ3 => {
  const cams = [-3, -2, -1, 0, 1, 2, 3].map((i) => camAt(f + i));
  return (p) => {
    let x = 0, y = 0;
    for (const c of cams) { const q = project(c, p); x += q[0]; y += q[1]; }
    return [Math.round(x / cams.length), Math.round(y / cams.length)];
  };
};
type SP = {f: number; pj: PJ3};
const fq2 = (f: number) => 2 * Math.floor(f / 2);
const vis = (f: number, a: number, b: number, din = 12, dout = 14) => Math.min(eo(prog(f, a, din)), 1 - prog(f, b - dout, dout));
const TW: React.FC<{pj: PJ3; p: V3; dx?: number; dy?: number} & Omit<React.ComponentProps<typeof TX>, 'x' | 'y'>> = ({pj, p, dx = 0, dy = 0, ...r}) => {
  const [x, y] = pj(p);
  return <TX x={x + dx} y={y + dy} {...r} />;
};
/** 照片卡下方的小字说明 + 来源（锚在卡片底边中点） */
const Credit: React.FC<{pj: PJ3; cd: {c: V3; h: number; ey: V3}; text?: string; src: string; o: number}> = ({pj, cd, text, src, o}) => {
  if (o <= 0.01) return null;
  const [x, y] = pj(add(cd.c, mul(cd.ey, -cd.h / 2)));
  return (
    <g opacity={o}>
      {text ? <TX x={x} y={y + 30} text={text} size={19} anchor="middle" color="rgba(240,228,206,0.82)" /> : null}
      <TX x={x} y={y + (text ? 52 : 26)} text={src} size={13} anchor="middle" color="rgba(220,210,190,0.5)" ls={0.3} />
    </g>
  );
};
/** 屏幕上的直线，按进度从左到右"写"出来（数轴等，不归笔头管） */
const WipeLine: React.FC<{x0: number; x1: number; y: number; t: number}> = ({x0, x1, y, t}) => (t > 0 ? <SoftGlow d={`M${x0},${y}L${(x0 + (x1 - x0) * t).toFixed(1)},${y}`} w={1.5} /> : null);

/* ---------------- S1 ---------------- */
const BZ = ZF + 0.62;
const HookS: React.FC<SP> = ({f, pj}) => {
  const o = vis(f, 0, SC.define - 20, 8, 22);
  if (o <= 0) return null;
  const ledO = eo(prog(f, ROLL0 - 12, 10));
  const ratio = (Math.PI * rollE(fq2(f))).toFixed(2);
  const dO = eo(prog(f, WHEEL_AT + WHEEL_DUR + 4, 12)) * (1 - prog(f, ROLL0 - 14, 12));
  return (
    <g opacity={o}>
      <TW pj={pj} p={[WX0 - WR - 0.22, WR, ZF]} dy={12} text="d" size={40} italic anchor="end" color="#c8d6ff" o={dO} />
      <TX x={140} y={150} text="QUÃNG ĐƯỜNG ÷ ĐƯỜNG KÍNH" size={22} ls={3} color="rgba(236,230,218,0.82)" o={ledO} />
      <LED value={ratio} x={140} y={176} size={72} o={ledO} />
      {BR.map((at, i) => <TW key={i} pj={pj} p={[WX0 + (2 * i + 1) * WR, 0, BZ + 0.5]} dy={12} text={String(i + 1)} size={34} anchor="middle" color="#d6e0ff" o={eo(prog(f, at, 8))} />)}
      <TW pj={pj} p={[WX0 + 6 * WR + 0.1, 0, BZ + 0.5]} dy={12} text="0,14…" size={30} color="#ff9a80" glow="#ff4a32" glowO={0.4} o={eo(prog(f, REM_AT + 4, 8))} />
      <GText id="h-rev" x={560} y={380} f={f} at={REVEAL} text="≈ 3,14" size={110} />
      <TX x={560} y={440} text="lần đường kính" size={32} anchor="middle" color="rgba(240,232,220,0.86)" o={eo(prog(f, REVEAL + 10, 10))} />
    </g>
  );
};

/* ---------------- S2 ---------------- */
const DefS: React.FC<SP> = ({f, pj}) => {
  const a = vis(f, D_CIRC - 6, OBJ_IN + 14, 10, 18), b = vis(f, OBJ_IN, Q_AT + 2, 8, 14), q = vis(f, Q_AT, SC.arch - 40, 8, 16);
  return (
    <g>
      {a > 0 ? (
        <g opacity={a}>
          <TW pj={pj} p={add(DC, [0, DR + 0.32, 0])} text="chu vi" size={30} anchor="middle" color="#ffe0b0" o={eo(prog(f, D_CIRC + 30, 10))} />
          <TW pj={pj} p={add(DC, [0, -0.5, 0])} text="đường kính" size={28} anchor="middle" color="#c8d6ff" o={eo(prog(f, D_DIAM + 10, 10))} />
          <GText id="d-pi" x={1430} y={500} f={f} at={PI_AT - 2} dur={12} text="π" size={230} italic />
          <GText id="d-form" x={1430} y={610} f={f} at={FORM_AT} dur={20} text="π = chu vi ÷ đường kính" size={46} color="#fff0d8" glowO={0.35} />
        </g>
      ) : null}
      {b > 0 ? (
        <g opacity={b}>
          <Credit pj={pj} cd={card3(OBJ[0].at + 10, add(OBJ3[0].c, [0, OBJ3[0].r + 1.05, -0.3]), 2.1, 1.15)} src="ảnh: BogTar201213 · CC BY-SA 4.0" o={eo(prog(f, OBJ[0].at + 12, 12)) * (1 - prog(f, Q_AT - 8, 16))} />
          <Credit pj={pj} cd={card3(OBJ[1].at + 10, add(OBJ3[1].c, [0, OBJ3[1].r + 1.15, -0.3]), 1.95, 1.83)} src="ảnh: Cjp24 · CC BY-SA 4.0" o={eo(prog(f, OBJ[1].at + 12, 12)) * (1 - prog(f, Q_AT - 8, 16))} />
          {OBJ.map((ob, i) => {
            const w = ledWidth('3.14', 44);
            const [x, y] = pj(add(OBJ3[i].c, [0, -OBJ3[i].r - 0.42, 0]));
            return (
              <g key={i}>
                <TX x={x} y={y + 10} text={ob.name} size={28} anchor="middle" color="rgba(240,234,222,0.9)" o={eo(prog(f, ob.at + ob.dur - 6, 10))} />
                <LED value="3.14" x={x - w / 2} y={y + 34} size={44} o={eo(prog(f, RATIO_AT[i], 6))} />
              </g>
            );
          })}
        </g>
      ) : null}
      {q > 0 ? (
        <g opacity={q}>
          <GText id="d-q" x={960} y={500} f={f} at={Q_AT} dur={16} text="π = 3,14…  ?" size={104} />
          <TX x={960} y={570} text="chính xác là bao nhiêu?" size={32} anchor="middle" color="rgba(240,232,220,0.8)" o={eo(prog(f, Q_AT + 14, 10))} />
        </g>
      ) : null}
    </g>
  );
};

/* ---------------- S3 ---------------- */
const NUM = {x0: 1150, x1: 1770, y: 640, v0: 2.9, v1: 3.6};
const numX = (v: number) => NUM.x0 + ((v - NUM.v0) / (NUM.v1 - NUM.v0)) * (NUM.x1 - NUM.x0);
const FINE = {x0: 1150, x1: 1770, y: 795, v0: 3.14, v1: 3.1435};
const fineX = (v: number) => FINE.x0 + ((v - FINE.v0) / (FINE.v1 - FINE.v0)) * (FINE.x1 - FINE.x0);
const stepIdx = (f: number) => STEP3.reduce((k, _s, i) => (f >= step3Done(i) ? i : k), -1);
const bounds = (f: number): [number, number] => {
  const i = stepIdx(f);
  if (i < 0) return [lowB(6), upB(6)];
  const t = eo(prog(f, step3Done(i), 12));
  const a = i > 0 ? STEP3[i - 1].n : 6, b = STEP3[i].n;
  return [lerp(lowB(a), lowB(b), t), lerp(upB(a), upB(b), t)];
};
const LEG: [string, string][] = [['#7fa6ff', 'đa giác trong'], ['#ff7a4a', 'đa giác ngoài']];
const ArchS: React.FC<SP> = ({f, pj}) => {
  const o = vis(f, SC.arch - 4, SC.irr - 34, 10, 18);
  if (o <= 0) return null;
  const si = stepIdx(f);
  const ledO = eo(prog(f, step3Done(0) + 2, 8)) * (1 - prog(f, EQ_AT - 10, 10));
  const s = STEP3[Math.max(0, si)];
  const flick = si >= 0 && f - step3Done(si) < 4 ? 0.55 : 1;
  const [lo, hi] = bounds(f);
  const numO = eo(prog(f, NUM_AT + 16, 12));
  const fineO = eo(prog(f, EQ2_AT + 18, 12));
  const af = AFRAME();
  const [fx, fy] = pj(af.c);
  const ins = clamp(prog(f, INSET_IN, 16)) * (1 - prog(f, INSET_OUT - 12, 16));
  const [ix, iy, iw, ih] = INSET_RECT;
  const [tx, ty] = pj(plane(0, AR3));
  return (
    <g opacity={o}>
      <Credit pj={pj} cd={CARDS().archimedes} text="tranh của Domenico Fetti, 1620" src="ảnh: Wikimedia Commons · phạm vi công cộng" o={eo(prog(f, L(9) + 60, 14)) * (1 - prog(f, NUM_AT - 16, 16))} />
      <TX x={fx} y={fy + 8} text="ARCHIMEDES" size={40} ls={10} anchor="middle" color="#ffe2b4" glow="#ff9a3a" glowO={0.35} o={eo(prog(f, L(9) + 70, 12))} />
      <TX x={fx} y={fy + 46} text="khoảng 287 – 212 TCN · Syracuse" size={22} anchor="middle" color="rgba(230,224,212,0.72)" o={eo(prog(f, L(9) + 78, 12))} />
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
      <WipeLine x0={NUM.x0 - 20} x1={NUM.x1 + 20} y={NUM.y} t={eo(prog(f, NUM_AT, 24))} />
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
      <WipeLine x0={FINE.x0 - 20} x1={FINE.x1 + 20} y={FINE.y} t={eo(prog(f, EQ2_AT + 2, 22))} />
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
      {ins > 0 ? (
        <g opacity={ins}>
          <path d={`M${tx},${ty}L${ix + iw / 2},${iy}`} stroke="rgba(255,214,150,0.5)" strokeWidth={1.2} strokeDasharray="5 6" fill="none" />
          <circle cx={tx} cy={ty} r={16} fill="none" stroke="rgba(255,214,150,0.7)" strokeWidth={1.4} />
          <SoftGlow d={`M${ix + 18},${iy}H${ix + iw - 18}Q${ix + iw},${iy} ${ix + iw},${iy + 18}V${iy + ih - 18}Q${ix + iw},${iy + ih} ${ix + iw - 18},${iy + ih}H${ix + 18}Q${ix},${iy + ih} ${ix},${iy + ih - 18}V${iy + 18}Q${ix},${iy} ${ix + 18},${iy}Z`} w={1.4} o={0.9} />
          <TX x={ix + 20} y={iy + 34} text="PHÓNG TO · 96 CẠNH" size={20} ls={3} color="rgba(255,226,180,0.9)" />
          <TX x={ix + iw - 20} y={iy + ih - 18} text="vẫn còn một khe rất nhỏ" size={20} anchor="end" color="rgba(236,228,214,0.8)" o={eo(prog(f, INSET_IN + 34, 12))} />
        </g>
      ) : null}
    </g>
  );
};

/* ---------------- S4 ---------------- */
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
const IrrS: React.FC<SP> = ({f, pj}) => {
  const o = vis(f, SC.irr - 4, SC.life - 22, 10, 18);
  if (o <= 0) return null;
  const rows = 1 - 0.0 * prog(f, VOTI_AT, 10);
  return (
    <g opacity={o}>
      {GLYPHS3.map((g, k) => {
        const a = eo(prog(f, g.t, 4));
        if (a <= 0) return null;
        const ripple = 0.8 + 0.2 * (0.5 + 0.5 * Math.sin(0.33 * k - f * 0.12));
        const fresh = 1 - prog(f, g.t, 14);
        const [x, y] = pj(g.p);
        return <TX key={k} x={x} y={y - Math.round(g.size * 0.35) - 6} text={g.ch} size={g.size} anchor="middle" color={fresh > 0 ? '#fff4dc' : '#f6d6a0'} glow="#ff9a3a" glowO={0.18 + 0.3 * fresh} o={a * ripple} />;
      })}
      <g opacity={rows}>
        <Row y={210} head="22/7 =" groups={['142857', '142857', '142857']} f={f} at={ROW_AT} color="rgba(214,224,255,0.92)" />
        {[0, 1, 2].map((g) => { const t = eo(prog(f, BOX_AT + g * 6, 8)); return t > 0 ? <rect key={g} x={GX(g) - 9} y={210 - 42} width={172} height={56} rx={10} fill="#3a5cff" fillOpacity={0.08} stroke="#8fb0ff" strokeWidth={1.6} opacity={t * 0.9} /> : null; })}
        <TX x={GX(3) + 70} y={210} text="lặp lại mãi" size={26} color="#a9c0ff" o={eo(prog(f, BOX_AT + 18, 10))} />
        <Row y={300} head="π =" groups={['141592', '653589', '793238']} f={f} at={PIROW_AT} color="#ffe6c0" />
        <TX x={GX(3) + 70} y={300} text="không lặp lại" size={26} color="#ffc070" glow="#ff9a3a" glowO={0.3} o={eo(prog(f, PIROW_AT + 18, 10))} />
      </g>
      <Backing x={560} y={380} w={800} h={150} o={eo(prog(f, VOTI_AT - 4, 10)) * 0.8} />
      <GText id="i-vt" x={960} y={445} f={f} at={VOTI_AT} dur={14} text="SỐ VÔ TỈ" size={72} ls={8} />
      <TX x={960} y={495} text="không phân số p/q nào viết đúng được π" size={26} anchor="middle" color="rgba(240,232,220,0.82)" o={eo(prog(f, VOTI_AT + 14, 10))} />
    </g>
  );
};

/* ---------------- S5 ---------------- */
const LifeS: React.FC<SP> = ({f, pj}) => {
  const o = vis(f, SC.life - 4, SC.end - 30, 10, 18);
  if (o <= 0) return null;
  const a = vis(f, LW_AT - 6, SINE_IN + 4, 8, 22), b = vis(f, SINE_IN + 10, ORB_IN + 4, 10, 22), c = vis(f, ORB_IN + 6, SC.end - 54, 10, 18);
  const x0 = -SXH + 0.75, x1 = x0 + (2 * Math.PI) / SK3;
  return (
    <g opacity={o}>
      <TX x={960} y={112} text="π  TRONG  ĐỜI  SỐNG" size={22} ls={6} anchor="middle" color="rgba(236,228,214,0.62)" o={eo(prog(f, SC.life + 10, 12))} />
      {a > 0 ? (
        <g opacity={a}>
          <GText id="l-f" x={960} y={300} f={f} at={LFORM_AT} dur={16} text="quãng đường  =  π × d" size={54} />
          {[0.5, 1].map((k, i) => <TW key={k} pj={pj} p={add(O5, [LX03 + LDIST3 * k, 0, 0.9])} dy={10} text={i ? '2π·d' : 'π·d'} size={30} italic anchor="middle" color="#ffe0b0" o={lrollE(f) >= k - 0.002 && f >= LROLL0 ? 1 : 0} />)}
          <TW pj={pj} p={add(O5, [LX03, 0, 0.9])} dy={10} text="0" size={28} anchor="middle" color="rgba(220,226,255,0.7)" o={eo(prog(f, LROLL0, 8))} />
        </g>
      ) : null}
      {b > 0 ? (
        <g opacity={b}>
          <GText id="l-s" x={960} y={215} f={f} at={SINE_IN + 20} dur={16} text="sóng âm:  y = sin x" size={48} />
          <TW pj={pj} p={add(O5B, [(x0 + x1) / 2, -SAMP - 0.55, 1.2])} dy={46} text="2π" size={36} italic anchor="middle" color="#ffe0b0" glow="#ff9a3a" glowO={0.35} o={eo(prog(f, PERIOD_AT + 6, 8))} />
          <TW pj={pj} p={add(O5B, [(x0 + x1) / 2, -SAMP - 0.55, 1.2])} dy={76} text="một chu kỳ" size={21} anchor="middle" color="rgba(236,228,214,0.72)" o={eo(prog(f, PERIOD_AT + 10, 8))} />
        </g>
      ) : null}
      {c > 0 ? (
        <g opacity={c}>
          <TX x={960} y={215} text="Vệ tinh GPS" size={42} anchor="middle" color="#ffe2b4" glow="#ff9a3a" glowO={0.3} o={eo(prog(f, ORB_IN + 6, 12))} />
          <TX x={1880} y={1040} text="vệ tinh GPS IIF: ảnh minh hoạ NASA · bản đồ Trái Đất: NASA Earth Observatory" size={13} anchor="end" color="rgba(220,210,190,0.45)" o={eo(prog(f, O_AT + 30, 12))} />
          <TX x={960} y={258} text="độ cao ≈ 20.200 km · gần 12 giờ bay một vòng" size={24} anchor="middle" color="rgba(236,228,214,0.75)" o={eo(prog(f, O_AT, 12))} />
          <GText id="l-g" x={960} y={850} f={f} at={GPSF_AT} dur={16} text="chu vi quỹ đạo  =  2π × r" size={46} />
        </g>
      ) : null}
    </g>
  );
};

/* ---------------- S6 ---------------- */
const NASA_DIGITS = '3.141592653589793';
const nasaShown = (f: number) => clamp(Math.floor((f - NASA_DIG0) / 2.5) + 1, 0, 16);
const EndS: React.FC<SP> = ({f, pj}) => {
  const q = vis(f, Q2_AT - 2, NASA_AT + 4, 8, 12), n = vis(f, NASA_AT - 4, L(28) - 6 + 14, 6, 14);
  const v = f >= CLIMAX ? 0 : vis(f, VOY_AT - 6, CLIMAX + 1, 8, 4);
  const why = vis(f, WHY_AT - 2, CHIP_AT[0] + 8, 6, 10), ch = vis(f, CHIP_AT[0] - 2, CURIOUS_AT - 2, 6, 12);
  const cu = vis(f, CURIOUS_AT - 6, FINAL_AT, 8, 12), cl = vis(f, CLIMAX, FINAL_AT - 12 + 12, 1, 12), fin = vis(f, FINAL_AT - 4, FRAMES + 40, 6, 10);
  const shown = nasaShown(f);
  const digits = NASA_DIGITS.replace('.', '');
  const ledStr = shown <= 0 ? '' : (digits[0] + '.' + digits.slice(1, shown)).padEnd(17, ' ');
  const lw = ledWidth(NASA_DIGITS, 66);
  const big = '314 000 000 000 000';
  const bw = ledWidth(big, 62);
  const flick = f - CLIMAX < 6 ? (Math.floor((f - CLIMAX) / 2) % 2 ? 0.5 : 1) : 1;
  const [nx, ny] = pj(NFRAME().c);
  const qm = QMARK();
  return (
    <g>
      {q > 0 ? (
        <g opacity={q}>
          <TX x={960} y={420} text="3,14159265358979323846264338327950288…" size={30} anchor="middle" color="rgba(240,220,190,0.4)" />
          <GText id="e-q" x={960} y={520} f={f} at={Q2_AT} dur={16} text="Cần bao nhiêu chữ số π?" size={64} />
        </g>
      ) : null}
      {n > 0 ? (
        <g opacity={n}>
          <Credit pj={pj} cd={CARDS().jpl} text="phòng điều hành bay của JPL" src="ảnh: NASA · phạm vi công cộng" o={eo(prog(f, NASA_AT + 24, 14))} />
          <TX x={nx} y={ny - 118} text="NASA · JPL" size={32} ls={8} anchor="middle" color="#ffe2b4" glow="#ff9a3a" glowO={0.3} o={eo(prog(f, NASA_AT + 26, 12))} />
          <TX x={nx} y={ny - 76} text="dẫn đường tàu vũ trụ liên hành tinh" size={24} anchor="middle" color="rgba(236,228,214,0.75)" o={eo(prog(f, NASA_AT + 34, 12))} />
          {shown > 0 ? <LED value={ledStr} x={nx - lw / 2} y={ny - 30} size={66} color="#ff4a32" /> : null}
          <TX x={nx} y={ny + 128} text="15 chữ số sau dấu phẩy" size={30} anchor="middle" color="#ffd28a" glow="#ff9a3a" glowO={0.3} o={eo(prog(f, NASA_DIG0 + 44, 10))} />
        </g>
      ) : null}
      {v > 0 ? (
        <g opacity={v}>
          <TW pj={pj} p={add(VOY_PROBE, [0, 3.05, 0])} dy={-8} text="Voyager 1" size={28} anchor="middle" color="#ffe2b4" o={eo(prog(f, VOY_LABEL, 10))} />
          <TW pj={pj} p={lerp3(VOY_PROBE, VOY_C, 0.5)} dx={24} text="bán kính ≈ 32 tỷ km" size={26} color="rgba(240,230,214,0.82)" o={eo(prog(f, VOY_AT + 40, 10)) * (1 - prog(f, ERR_AT - 6, 10))} />
          <TW pj={pj} p={add(VOY_PROBE, [0, -0.45, 0])} dy={16} text="ảnh minh hoạ: NASA/JPL" size={13} anchor="middle" color="rgba(220,210,190,0.5)" o={eo(prog(f, VOY_AT + 50, 12))} />
          <GText id="e-err" x={960} y={250} f={f} at={ERR_AT} dur={14} text="sai số chỉ ≈ 1,5 cm" size={62} />
        </g>
      ) : null}
      {cl > 0 ? (
        <g opacity={cl}>
          <Backing x={960 - bw / 2 - 60} y={320} w={bw + 120} h={200} o={0.9} />
          <g opacity={flick}><LED value={big} x={960 - bw / 2} y={360} size={62} color="#ff4a32" /></g>
          <TX x={960} y={492} text="chữ số π đã được tính · kỷ lục tháng 11/2025" size={26} anchor="middle" color="rgba(240,230,214,0.82)" o={eo(prog(f, CLIMAX + 10, 12))} />
        </g>
      ) : null}
      {why > 0 ? <g opacity={why}><GText id="e-why" x={960} y={660} f={f} at={WHY_AT} dur={10} text="Để làm gì?" size={58} /></g> : null}
      {ch > 0 ? (
        <g opacity={ch}>
          {CHIPS().map((c, i) => <TW key={i} pj={pj} p={c.c} dy={10} text={['siêu máy tính', 'thuật toán', 'phần cứng'][i]} size={30} anchor="middle" color="#ffe8c8" o={eo(prog(f, CHIP_AT[i] + 12, 8))} />)}
        </g>
      ) : null}
      {cu > 0 ? (
        <g opacity={cu}>
          <GText id="e-cur" x={960} y={640} f={f} at={CURIOUS_AT} dur={12} text="vì tò mò" size={56} />
          <TW pj={pj} p={qm[0]} dx={-24} dy={54} text="… 3,14159265358979323846" size={38} anchor="end" color="rgba(246,214,160,0.85)" o={eo(prog(f, CURIOUS_AT + 20, 12))} />
        </g>
      ) : null}
      {fin > 0 ? (
        <g opacity={fin}>
          <GText id="e-t" x={960} y={430} f={f} at={TITLE_AT} dur={20} text="Số π từ đâu ra?" size={82} />
          <TX x={960} y={492} text="3,14159265358979…" size={30} anchor="middle" color="rgba(246,220,180,0.6)" o={eo(prog(f, TITLE_AT + 20, 14))} />
        </g>
      ) : null}
    </g>
  );
};

export const ScreenText: React.FC<{f: number}> = ({f}) => {
  const pj = makePJ3(f);
  const p = {f, pj};
  return (
    <>
      <HookS {...p} />
      <DefS {...p} />
      <ArchS {...p} />
      <IrrS {...p} />
      <LifeS {...p} />
      <EndS {...p} />
    </>
  );
};
export {QMARK_AT};

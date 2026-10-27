// 3D 波浪图（1320–1440 帧 = 第 22–23 小节）：真透视投影的地面网格 + 背墙网格 + 小号衬线坐标标注；
// 30 条平行细金丝组成的波浪曲面（每条 = 一个平均利率 7%→9% 的「模拟」账户：逐年涨跌，但长期向上），
// 笔头星芒沿最前一条走，红色数码管显示当年的涨跌幅。镜头缓慢环绕 + 推近。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, GlowPath, Label, P, PenHead, SevenSeg, Svg, clamp, eio, eo, prog, pushOut} from './kit';

export const A3 = 1320, B3 = 1440;
const YRS = 20, VMAX = 7, NS = 28;
const XW = (yr: number) => (yr - 10) * 1.1; // 年 → 世界 X
const YW = (v: number) => v * 1.5; // 倍数 → 世界 Y
const ZNEAR = -4.6, ZWALL = 3.2;
const ZS = (u: number) => -2.0 + u * 4.0; // 第 u 条丝（0 = 最前 = 7%）
const RATE = (u: number) => 0.07 + 0.02 * u;
const wav = (t: number, u: number) => 0.2 * Math.sin(0.82 * t + 3.0 + 1.2 * u) + 0.04 * Math.sin(2.1 * t + 1 + 1.2 * u);
export const VAL = (t: number, u: number) => Math.pow(1 + RATE(u), t) * Math.exp(wav(t, u) - wav(0, u) * Math.exp(-t / 2));

type Cam = {th: number; ph: number; D: number};
const cam = (f: number): Cam => {
  const k = eio(prog(f, A3 - 10, B3 - A3 + 10));
  return {th: 0.36 - 0.1 * k, ph: 0.36 - 0.05 * k, D: 31.5 - 2.5 * k};
};
const F = 1250, CX = 990, CY = 470, TY = 3.4;
const proj = (c: Cam, x: number, y: number, z: number): P => {
  const yy = y - TY;
  const x1 = x * Math.cos(c.th) - z * Math.sin(c.th);
  const z1 = x * Math.sin(c.th) + z * Math.cos(c.th);
  const y2 = yy * Math.cos(c.ph) + z1 * Math.sin(c.ph);
  const z2 = -yy * Math.sin(c.ph) + z1 * Math.cos(c.ph);
  const d = c.D + z2;
  return [CX + (F * x1) / d, CY - (F * y2) / d];
};
const ln = (c: Cam, a: [number, number, number], b: [number, number, number]) => {
  const p = proj(c, ...a), q = proj(c, ...b);
  return `M${p[0].toFixed(1)},${p[1].toFixed(1)}L${q[0].toFixed(1)},${q[1].toFixed(1)}`;
};
const strandD = (c: Cam, u: number, tEnd: number) => {
  if (tEnd <= 0) return {d: '', end: proj(c, XW(0), YW(1), ZS(u))};
  let s = '';
  let end: P = [0, 0];
  const n = Math.max(2, Math.ceil(tEnd / 0.2));
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * tEnd;
    const p = proj(c, XW(t), YW(VAL(t, u)), ZS(u));
    s += (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1);
    end = p;
  }
  return {d: s, end};
};
export const LAND3D: P = proj(cam(A3), XW(0), YW(1), ZS(0));

export const S3D: React.FC<{f: number}> = ({f}) => {
  const c = cam(f);
  const lf = f - A3;
  const grid = eo(prog(lf, 2, 22));
  const wall = eo(prog(lf, 8, 22));
  const ax = eo(prog(lf, 4, 18));
  const lab = prog(lf, 16, 12);
  const T = YRS * eio(prog(lf, 12, 92));
  // 地面网格（按 sweep 从左往右长出）
  const floor: string[] = [], back: string[] = [];
  const xEnd = XW(0) - 1 + (XW(YRS) + 1 - (XW(0) - 1)) * grid;
  for (let yr = 0; yr <= YRS; yr += 1) {
    const x = XW(yr);
    if (x <= xEnd) floor.push(ln(c, [x, 0, ZNEAR], [x, 0, ZWALL]));
  }
  for (let z = ZNEAR; z <= ZWALL + 1e-6; z += (ZWALL - ZNEAR) / 10) floor.push(ln(c, [XW(0) - 1, 0, z], [xEnd, 0, z]));
  const yTop = YW(VAL(0, 0)) + (YW(VMAX + 0.6)) * wall;
  for (let yr = 0; yr <= YRS; yr += 1) back.push(ln(c, [XW(yr), 0, ZWALL], [XW(yr), Math.min(yTop, YW(VMAX + 0.6)), ZWALL]));
  for (let v = 0; v <= VMAX + 0.5; v += 0.5) if (YW(v) <= yTop) back.push(ln(c, [XW(0) - 1, YW(v), ZWALL], [XW(YRS) + 1, YW(v), ZWALL]));
  // 丝带
  const strands: {d: string; u: number}[] = [];
  let headP: P = LAND3D;
  for (let k = NS - 1; k >= 0; k--) {
    const u = k / (NS - 1);
    const tEnd = clamp(T * 1.08 - u * 1.6, 0, YRS);
    const {d, end} = strandD(c, u, tEnd);
    if (k === 0) headP = end;
    if (d) strands.push({d, u});
  }
  const tNow = clamp(T * 1.08, 0, YRS);
  const front = strandD(c, 0, tNow);
  const yrInt = Math.max(1, Math.ceil(tNow));
  const ret = (VAL(yrInt, 0) / VAL(yrInt - 1, 0) - 1) * 100;
  const foot = proj(c, XW(tNow), 0, ZS(0));
  const drawing = tNow > 0.05 && tNow < YRS - 0.01;
  const ro = eo(prog(lf, 16, 8));
  const flick = lf - 16 < 8 ? (Math.floor(f) % 2 ? 0.5 : 1) : 1;
  const retStr = tNow < 0.3 ? '  0.0' : (ret >= 0 ? ' ' : '-') + Math.abs(ret).toFixed(1);
  // 坐标轴端点
  const O = proj(c, XW(0) - 1, 0, ZWALL);
  const Xa = proj(c, XW(YRS) + 1.6, 0, ZWALL);
  const Ya = proj(c, XW(0) - 1, YW(VMAX + 1.1), ZWALL);
  const Za = proj(c, XW(0) - 1, 0, ZNEAR - 0.6);
  return (
    <AbsoluteFill style={pushOut(f, B3)}>
      <Svg>
        <defs>
          <radialGradient id="g3fade" cx="0.5" cy="0.55" r="0.6"><stop offset="0.55" stopColor="#fff" /><stop offset="1" stopColor="#000" /></radialGradient>
          <mask id="g3m"><rect width={1920} height={1080} fill="url(#g3fade)" /></mask>
          <linearGradient id="strandG" x1="0" x2="1"><stop offset="0" stopColor="#c58b4a" /><stop offset="0.5" stopColor="#f6cf92" /><stop offset="1" stopColor="#ffe9c6" /></linearGradient>
        </defs>
        <g mask="url(#g3m)" fill="none" strokeWidth={1}>
          <path d={back.join('')} stroke={C.gridFaint} opacity={wall} />
          <path d={floor.join('')} stroke={C.grid} opacity={0.9} />
        </g>
        {/* 坐标轴 */}
        <g stroke="rgba(225,228,255,0.8)" strokeWidth={1.5} fill="none" opacity={ax}>
          <path d={`M${O[0]},${O[1]}L${O[0] + (Xa[0] - O[0]) * ax},${O[1] + (Xa[1] - O[1]) * ax}`} />
          <path d={`M${O[0]},${O[1]}L${O[0] + (Ya[0] - O[0]) * ax},${O[1] + (Ya[1] - O[1]) * ax}`} />
          <path d={`M${O[0]},${O[1]}L${O[0] + (Za[0] - O[0]) * ax},${O[1] + (Za[1] - O[1]) * ax}`} />
        </g>
        <g opacity={lab}>
          {[0, 5, 10, 15, 20].map((yr) => {
            const p = proj(c, XW(yr), 0, ZWALL);
            return <Label key={yr} x={p[0]} y={p[1] - 10} text={String(yr)} size={16} color={C.dim} anchor="middle" />;
          })}
          {[1, 2, 3, 4, 5, 6, 7].map((v) => {
            const p = proj(c, XW(0) - 1, YW(v), ZWALL);
            return <Label key={v} x={p[0] - 14} y={p[1] + 5} text={String(v)} size={16} color={C.dim} anchor="end" />;
          })}
          {[[0, '7%'], [0.5, '8%'], [1, '9%']].map(([u, t]) => {
            const p = proj(c, XW(0) - 1, 0, ZS(u as number));
            return <Label key={t as string} x={p[0] - 16} y={p[1] + 6} text={t as string} size={16} color={C.dim} anchor="end" />;
          })}
          <Label x={Xa[0] + 12} y={Xa[1] + 6} text="năm" size={19} color={C.label} />
          <Label x={Ya[0] + 12} y={Ya[1] + 4} text="giá trị (lần)" size={19} color={C.label} />
          <Label x={Za[0] - 14} y={Za[1] + 22} text="lãi suất TB" size={19} color={C.label} anchor="end" />
        </g>
        {/* 曲面：先一层整体辉光，再细丝 */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" style={{mixBlendMode: 'screen'}}>
          <g opacity={0.55} filter="url(#b4)">
            {strands.map((s, i) => <path key={'g' + i} d={s.d} stroke={C.amber} strokeWidth={2.2} opacity={0.25 + 0.35 * (1 - s.u)} />)}
          </g>
          {strands.map((s, i) => <path key={'s' + i} d={s.d} stroke="url(#strandG)" strokeWidth={s.u === 1 || i === strands.length - 1 ? 1.4 : 0.9} opacity={0.45 + 0.5 * (1 - s.u)} />)}
        </g>
        <GlowPath d={front.d} w={1.8} halo={0.8} />
        {drawing ? (
          <g>
            <line x1={headP[0]} y1={headP[1]} x2={foot[0]} y2={foot[1]} stroke="#f3c27e" strokeWidth={1.2} strokeDasharray="5 6" opacity={0.7} />
            <circle cx={foot[0]} cy={foot[1]} r={3} fill={C.mid} opacity={0.8} />
            <PenHead p={headP} f={f} size={0.95} />
          </g>
        ) : null}
        {tNow >= YRS - 0.01 ? (
          <g>
            <circle cx={headP[0]} cy={headP[1]} r={6} fill={C.core} />
            <circle cx={headP[0]} cy={headP[1]} r={26} fill="url(#halo)" opacity={0.85} />
          </g>
        ) : null}
        {/* 红色数码管：当年涨跌 */}
        <g opacity={ro * flick}>
          <Label x={1490} y={184} text="NĂM" size={17} color={C.label} ls={2} />
          <SevenSeg value={String(Math.round(tNow)).padStart(2, ' ')} x={1700} y={152} size={44} />
          <Label x={1490} y={258} text="LÃI / LỖ NĂM %" size={17} color={C.label} ls={2} />
          <SevenSeg value={retStr} x={1700} y={226} size={44} color={ret < 0 ? C.orange : C.red} />
          <Label x={1490} y={306} text="đường 7%/năm · minh hoạ" size={15} color={C.dim} ls={1} italic />
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

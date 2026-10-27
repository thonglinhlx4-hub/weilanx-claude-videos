// 场景 4–5：3D 季节 × 天气 菜价波浪（示意）／ 硬切真人插入：AI 生成的原创菜贩「Chú bán rau」。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, Formula, GlowPath, Label, P, SevenSeg, Stroke, Svg, clamp, eio, eo, prog, pushOut, roundRectPts} from './fx';
import {Fade} from './common';
import {Flare, HotLine} from './grid54';
import {L, SC} from './timing';

/* ---------- S4 3D 波浪：x = 月份，z = 天气（nắng → bão），y = 菜价 ---------- */
const NS = 24;
const XW = (m: number) => (m - 6.5) * 1.75; // 月 1..12
const YW = (v: number) => (v - 5) * 0.42; // 价格（nghìn/kg）
const ZNEAR = -4.4, ZWALL = 3.4;
const ZS = (u: number) => -2.2 + u * 4.6; // u: 0 = nắng（最前）… 1 = bão
// 示意：基础价 + 季节（年初、年中低，雨季 9–11 月高）+ 天气越坏涨越多
export const PRICE = (m: number, u: number) => 14 + 4 * Math.sin(((m - 4) / 12) * Math.PI * 2) * 0.6 + 6 * Math.exp(-Math.pow((m - 10) / 1.6, 2)) * (0.4 + 1.4 * u) + 3 * u - 2 * Math.exp(-Math.pow((m - 2) / 1.5, 2));
type Cam = {th: number; ph: number; D: number};
const F = 1250, CX = 960, CY = 540, TY = 4.6;
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
const MONTHS = ['T1', 'T3', 'T5', 'T7', 'T9', 'T11'];
/** v3：波浪场景的相机（导出给分段函数场景，用来算 直线 → 波浪 的变形目标） */
export const waveCam = (f: number): Cam => {
  const k = eio(prog(f, SC.wave, SC.vendor - SC.wave));
  return {th: 0.5 - 0.18 * k, ph: 0.38 - 0.05 * k, D: 27 - 2.5 * k};
};
/** v3：最前一根（nắng）完整曲线的屏幕点，n 个采样（月份 1 → 12） */
export const waveFrontPts = (f: number, n = 120): P[] => {
  const c = waveCam(f);
  return Array.from({length: n}, (_, i) => {
    const m = 1 + (i / (n - 1)) * 11;
    return proj(c, XW(m), YW(PRICE(m, 0)), ZS(0));
  });
};
/** v3：一整根线（不再逐月画出），u = 天气层，spread = 从最前一根展开的程度 */
const strandFull = (c: Cam, u: number): string => {
  let s = '';
  for (let i = 0; i <= 74; i++) {
    const m = 1 + (i / 74) * 11;
    const p = proj(c, XW(m), YW(PRICE(m, u)), ZS(u));
    s += (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1);
  }
  return s;
};
export const SWave: React.FC<{f: number}> = ({f}) => {
  const a = SC.wave, end = SC.vendor;
  const c: Cam = waveCam(f);
  const lf = f - a;
  const grid = eo(prog(lf, 2, 22)), wall = eo(prog(lf, 8, 22)), ax = eo(prog(lf, 4, 18)), lab = prog(lf, 16, 12);
  const M = 1 + 11 * eio(prog(f, a + 14, L(16) - a - 20));
  // v2 修正：以前后排的线按 M 缩放，开头 2 秒只有最前一根；现在每根线按时间错开 0–16 帧起笔，并带一个起步量，开头就是一整片
  const floor: string[] = [], back: string[] = [];
  const xEnd = XW(0.5) + (XW(12.5) - XW(0.5)) * grid;
  for (let m = 1; m <= 12; m++) if (XW(m) <= xEnd) floor.push(ln(c, [XW(m), 0, ZNEAR], [XW(m), 0, ZWALL]));
  for (let i = 0; i <= 10; i++) { const z = ZNEAR + (i / 10) * (ZWALL - ZNEAR); floor.push(ln(c, [XW(0.5), 0, z], [xEnd, 0, z])); }
  const yTop = YW(30) * wall;
  for (let m = 1; m <= 12; m++) back.push(ln(c, [XW(m), 0, ZWALL], [XW(m), yTop, ZWALL]));
  for (let v = 5; v <= 30; v += 2.5) if (YW(v) <= yTop) back.push(ln(c, [XW(0.5), YW(v), ZWALL], [XW(12.5), YW(v), ZWALL]));
  // v3：直线在上一场末尾已经变形成最前一根完整曲线；这里其余 23 根从它身后"扇形展开"（天气层 u 从 0 张开到 1），
  // 光点沿最前一根滑动（M = 月份），读数跟着走。
  const spread = eio(prog(f, a + 2, 46));
  const strands: {d: string; u: number}[] = [];
  for (let i = NS - 1; i >= 1; i--) {
    const u = i / (NS - 1);
    strands.push({d: strandFull(c, u * spread), u});
  }
  const pf = proj(c, XW(M), YW(PRICE(M, 0)), ZS(0));
  const front = {d: strandFull(c, 0), end: pf};
  const backS = {d: strandFull(c, spread)};
  const O = proj(c, XW(0.5), 0, ZWALL), Xa = proj(c, XW(12.5) + 1, 0, ZWALL), Ya = proj(c, XW(0.5), YW(32), ZWALL), Za = proj(c, XW(0.5), 0, ZNEAR - 0.6);
  const stormHi = PRICE(Math.min(M, 12), 1);
  const ro = eo(prog(lf, 18, 8));
  const flick = lf - 18 < 8 ? (Math.floor(f) % 2 ? 0.5 : 1) : 1;
  const drawing = M < 11.98;
  const hand = eio(prog(f, a + 30, 40));
  return (
    <AbsoluteFill style={pushOut(f, end)}>
      <Svg>
        <defs>
          <radialGradient id="w3fade" cx="0.5" cy="0.55" r="0.6"><stop offset="0.55" stopColor="#fff" /><stop offset="1" stopColor="#000" /></radialGradient>
          <mask id="w3m"><rect width={1920} height={1080} fill="url(#w3fade)" /></mask>
          <linearGradient id="w3g" x1="0" x2="1"><stop offset="0" stopColor="#c58b4a" /><stop offset="0.5" stopColor="#f6cf92" /><stop offset="1" stopColor="#ffe9c6" /></linearGradient>
        </defs>
        <g mask="url(#w3m)" fill="none" strokeWidth={1}>
          <path d={back.join('')} stroke="rgba(80,112,235,0.34)" opacity={wall} />
          <path d={floor.join('')} stroke="#5a80ff" strokeWidth={5} opacity={0.22 * grid} filter="url(#b4)" />
          <path d={floor.join('')} stroke="rgba(110,140,255,0.62)" opacity={0.95} />
        </g>
        <g stroke="rgba(225,228,255,0.8)" strokeWidth={1.5} fill="none" opacity={ax}>
          <path d={`M${O[0]},${O[1]}L${O[0] + (Xa[0] - O[0]) * ax},${O[1] + (Xa[1] - O[1]) * ax}`} />
          <path d={`M${O[0]},${O[1]}L${O[0] + (Ya[0] - O[0]) * ax},${O[1] + (Ya[1] - O[1]) * ax}`} />
          <path d={`M${O[0]},${O[1]}L${O[0] + (Za[0] - O[0]) * ax},${O[1] + (Za[1] - O[1]) * ax}`} />
        </g>
        <g opacity={lab}>
          {MONTHS.map((t, i) => { const p = proj(c, XW(1 + i * 2), 0, ZWALL); return <Label key={t} x={p[0]} y={p[1] - 10} text={t} size={16} color={C.dim} anchor="middle" />; })}
          {[10, 15, 20, 25, 30].map((v) => { const p = proj(c, XW(0.5), YW(v), ZWALL); return <Label key={v} x={p[0] - 14} y={p[1] + 5} text={String(v)} size={16} color={C.dim} anchor="end" />; })}
          {([[0, 'nắng'], [0.5, 'mưa'], [1, 'bão']] as [number, string][]).map(([u, t]) => { const p = proj(c, XW(0.5), 0, ZS(u)); return <Label key={t} x={p[0] - 16} y={p[1] + 6} text={t} size={17} color={C.dim} anchor="end" />; })}
          <Label x={Xa[0] + 12} y={Xa[1] + 6} text="mùa (tháng)" size={19} color={C.label} />
          <Label x={Ya[0] + 12} y={Ya[1] + 4} text="giá rau (nghìn/kg)" size={19} color={C.label} />
          <Label x={Za[0] - 14} y={Za[1] + 24} text="thời tiết" size={19} color={C.label} anchor="end" />
        </g>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" style={{mixBlendMode: 'screen'}}>
          <g opacity={0.5 * clamp(spread * 1.6)} filter="url(#b4)">{strands.map((s, i) => <path key={'g' + i} d={s.d} stroke={C.amber} strokeWidth={2.2} opacity={0.2 + 0.35 * (1 - s.u)} />)}</g>
          <g opacity={clamp(spread * 1.6)}>{strands.map((s, i) => <path key={'s' + i} d={s.d} stroke="url(#w3g)" strokeWidth={0.9} opacity={0.4 + 0.5 * (1 - s.u)} />)}</g>
        </g>
        <GlowPath d={backS.d} w={1.6} color={C.orange} core="#ffd7c8" o={eo(prog(f, L(14), 12)) * 0.9} />
        {/* v3：开头接住上一场变形来的粗白热线，再慢慢收细成原来的金线 */}
        <GlowPath d={front.d} w={1.8} halo={0.8} o={hand} />
        <HotLine d={front.d} w={3.2 - 0.8 * hand} o={1 - hand} />
        {drawing ? <Flare p={front.end} f={f} size={1.35 - 0.4 * hand} ghost={false} o={1 - prog(M, 11.6, 0.38)} /> : null}
        <g opacity={ro * flick}>
          <Label x={1440} y={176} text="THÁNG" size={17} color={C.label} ls={2} />
          <SevenSeg value={String(Math.round(M)).padStart(2, ' ')} x={1690} y={146} size={44} />
          <Label x={1440} y={250} text="GIÁ · NẮNG" size={17} color={C.label} ls={2} />
          <SevenSeg value={PRICE(M, 0).toFixed(1).padStart(4, ' ')} x={1690} y={220} size={44} />
          <Label x={1440} y={324} text="GIÁ · BÃO" size={17} color={C.label} ls={2} />
          <SevenSeg value={stormHi.toFixed(1).padStart(4, ' ')} x={1690} y={294} size={44} color={C.orange} o={eo(prog(f, L(14), 10))} />
          <Label x={1440} y={372} text="số liệu minh hoạ" size={15} color={C.dim} ls={1} italic />
        </g>
        <Fade f={f} at={L(16)}>
          <Formula x={1440} y={450} size={40}>giá = f(mùa, thời tiết)</Formula>
        </Fade>
      </Svg>
    </AbsoluteFill>
  );
};

/* ---------- S5 真人插入（v2：半透明 3D 合成柔和溶入，见 figures.tsx）：左侧抠像菜贩 + 右侧光笔画的告示牌 ---------- */
const FR = {x: 860, y: 210, w: 900, h: 500, r: 42};
const BgGrid: React.FC<{o: number}> = ({o}) => (
  <g opacity={o} strokeWidth={1}>
    {Array.from({length: 33}).map((_, i) => <line key={'v' + i} x1={i * 60} x2={i * 60} y1={0} y2={1080} stroke={i % 2 ? C.gridFaint : C.grid} opacity={0.5} />)}
    {Array.from({length: 19}).map((_, i) => <line key={'h' + i} x1={0} x2={1920} y1={i * 60} y2={i * 60} stroke={i % 2 ? C.gridFaint : C.grid} opacity={0.5} />)}
  </g>
);
export const SVendor: React.FC<{f: number}> = ({f}) => {
  const a = SC.vendor;
  const lf = f - a;
  const rows: [string, string, number][] = [
    ['Thời tiết', 'mưa', L(18) + 30],
    ['Hàng về', 'ít', L(18) + 52],
    ['Mùa', 'cuối năm', L(18) + 74],
  ];
  const priceOn = prog(f, L(18) + 92, 8);
  return (
    <AbsoluteFill style={{opacity: eo(prog(f, a - 4, 16))}}>
      <Svg>
        <defs>
          <radialGradient id="vgm" cx="0.5" cy="0.48" r="0.62"><stop offset="0.35" stopColor="#fff" /><stop offset="1" stopColor="#000" /></radialGradient>
          <mask id="vgmask"><rect width={1920} height={1080} fill="url(#vgm)" /></mask>
          <radialGradient id="vwarm" cx="0.5" cy="0.45" r="0.5"><stop offset="0" stopColor="#ff9a3a" stopOpacity="0.15" /><stop offset="1" stopColor="#ff8a2a" stopOpacity="0" /></radialGradient>
        </defs>
        <g mask="url(#vgmask)"><BgGrid o={0.45} /></g>
        <rect x={40} y={80} width={800} height={820} fill="url(#vwarm)" />
      </Svg>
      {/* v2：人物改由根层 FigureLayer 以半透明 3D 合成叠入（figures.tsx），不再硬切 */}
      <Svg>
        <Label x={447} y={870} text="Chú bán rau ngoài chợ" size={30} color="rgba(240,234,222,0.9)" anchor="middle" ls={1.2} o={eo(prog(lf, 6, 12))} />
        <line x1={300} x2={594} y1={890} y2={890} stroke={C.gold} strokeWidth={1} opacity={0.45 * eo(prog(lf, 10, 14))} />
        <Label x={447} y={918} text="nhân vật minh hoạ · ảnh do AI tạo" size={16} color={C.dim} anchor="middle" italic o={eo(prog(lf, 14, 12))} />
        <Stroke pts={roundRectPts(FR.x, FR.y, FR.w, FR.h, FR.r)} f={lf} at={2} dur={30} w={2.6} />
        <Stroke pts={[[FR.x + FR.w / 2, FR.y + FR.h], [FR.x + FR.w / 2, FR.y + FR.h + 110]]} f={lf} at={30} dur={8} w={2.6} head={false} />
        <Label x={FR.x + 56} y={FR.y + 70} text="SÁNG NAY BÁN GIÁ NÀO?" size={20} color={C.dim} ls={4} o={eo(prog(lf, 24, 10))} />
        <Fade f={f} at={a + 34}>
          <Label x={FR.x + 56} y={FR.y + 128} text="Không công thức. Không giấy bút." size={30} color="#c9cbd6" />
        </Fade>
        {rows.map(([k, v, at], i) => (
          <Fade key={k} f={f} at={at}>
            <Label x={FR.x + 56} y={FR.y + 200 + i * 54} text={k} size={30} color={C.label} />
            <Label x={FR.x + 260} y={FR.y + 200 + i * 54} text="→" size={30} color={C.dim} />
            <Label x={FR.x + 320} y={FR.y + 200 + i * 54} text={v} size={30} color={C.white} />
          </Fade>
        ))}
        {priceOn > 0 ? (
          <g opacity={eo(priceOn) * (f - (L(18) + 92) < 8 ? (f % 2 ? 0.5 : 1) : 1)}>
            <Label x={FR.x + 600} y={FR.y + 220} text="GIÁ" size={18} color={C.label} ls={3} />
            <SevenSeg value="22" x={FR.x + 600} y={FR.y + 238} size={96} />
            <Label x={FR.x + 600} y={FR.y + 372} text="nghìn/kg" size={20} color={C.dim} />
          </g>
        ) : null}
        <Fade f={f} at={L(19) + 6}>
          <Formula x={FR.x + 56} y={FR.y + 440} size={40}>giá = f(thời tiết, hàng về, mùa)</Formula>
        </Fade>
      </Svg>
    </AbsoluteFill>
  );
};

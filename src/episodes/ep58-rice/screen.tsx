// ep58 · 屏幕文字层（竖屏 1080×1920）：所有文字 / 数字都在这里——整数像素、固定字号、不旋转、等宽数字（LED）。
// 世界锚点经 makePJ3：前后 7 帧相机投影取平均再取整。安全区：重要内容在 y 200–1300；字幕顶在 y 1362。
import React from 'react';
import {Backing, GText, LED, TX, ledWidth} from '../ep55-pi/kit55';
import {
  CARDS, CLIMAX, CURVE_PTS, EARTH0, EARTHC0, FINALT, FRAMES, HALF_TXT0, HOP0, KING_OK, L, LE, MCARD0, ORBIT0, ORBIT1, PROOF0, PROOF1, RULE0, Rect3, SC,
  SQ1_0, SQ2_1, TAGS, TITLE0, TOT0, VNC0, WEIGHT_T, X2, X63, add, camAt, clamp, curSq, eo, headOf, prog, rectPt, sAt, sq, ss, top, wd,
} from './scene3';
import {V3, project} from './gl';
void headOf;
import {HALF, HALF_T, SQ10_G, SQ20_KG, SQ40_T, SQ50_MT, SQ64_TT, TOTAL_TXT, TOTAL_TT, TOTAL_TYT, VN_T, WORLD_T, YEARS_VN, YEARS_WORLD, dec, grains, vn, weightTxt} from './facts';
import {earthA, vnA, curveA} from './world';

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
const vis = (f: number, a: number, b: number, din = 12, dout = 14) => Math.min(eo(prog(f, a, din)), 1 - prog(f, b - dout, dout));
const GOLD_T = '#ffe2b0', SOFT = 'rgba(240,232,220,0.88)', DIM = 'rgba(236,228,214,0.68)', LEDC = '#ffb04a';

/** 卡片下方的说明（锚在卡片底边中点） */
const Caption: React.FC<{pj: PJ3; cd: Rect3; lines: [string, number, string?][]; src?: string; o: number; w?: number; dy?: number}> = ({pj, cd, lines, src, o, w = 600, dy = 0}) => {
  if (o <= 0.01) return null;
  const [x, y0] = pj(rectPt(cd, 0, cd.h / cd.k / 2));
  const y = y0 + dy;
  let yy = y + 8;
  const hh = lines.reduce((s, l) => s + l[1] * 1.25, 0) + (src ? 44 : 16);
  return (
    <g opacity={o}>
      <Backing x={x - w / 2} y={y + 2} w={w} h={hh} o={0.9} />
      {lines.map(([t, s, c], i) => { yy += s * 1.25; return <TX key={i} x={x} y={yy} text={t} size={s} anchor="middle" color={c ?? SOFT} ls={i === 0 ? 3 : 0.5} />; })}
      {src ? <TX x={x} y={yy + 32} text={src} size={24} anchor="middle" color="rgba(220,210,190,0.6)" ls={0.3} /> : null}
    </g>
  );
};
/** LED 数字 + 右侧标签，整体居中在 cx；放不下 maxW 就缩小 */
const Counter: React.FC<{cx: number; y: number; value: string; label: string; size?: number; o: number; maxW?: number; pre?: string}> = ({cx, y, value, label, size = 56, o, maxW = 940, pre}) => {
  if (o <= 0.01) return null;
  const lw0 = label.length * 0.36;
  const sz = Math.floor(Math.min(size, maxW / (ledWidth(value, 1) + 0.33 + lw0)));
  const w = ledWidth(value, sz), lw = label.length * sz * 0.36;
  const x0 = Math.round(cx - (w + 18 + lw) / 2);
  return (
    <g opacity={o}>
      {pre ? <TX x={x0 - 14} y={y + Math.round(sz * 0.86)} text={pre} size={Math.round(sz * 0.7)} anchor="end" color={GOLD_T} /> : null}
      <LED value={value} x={x0} y={y} size={sz} color={LEDC} ghostO={0.018} />
      <TX x={x0 + w + 18} y={y + Math.round(sz * 0.86)} text={label} size={Math.max(24, Math.round(sz * 0.56))} color={SOFT} />
    </g>
  );
};
const Label: React.FC<{x: number; y: number; t: string; o: number; size?: number; c?: string}> = ({x, y, t, o, size = 30, c = '#fff0d8'}) =>
  o > 0.01 ? <TX x={x} y={y} text={t} size={size} anchor="middle" color={c} glow="#000" glowO={0.75} o={o} /> : null;

/* ---------------- hook ---------------- */
const HookS: React.FC<SP> = ({f, pj}) => {
  if (f > SC.legend + 40) return null;
  const g1 = vis(f, wd(0, 'hạt') - 2, X2 + 4, 10, 12);
  const x2 = vis(f, X2, L(1) + 6, 8, 16), t = vis(f, TITLE0, SC.legend + 30, 14, 24);
  const [gx, gy] = pj(add(sq(1), [0, 0.2, 0]));
  return (
    <g>
      <Label x={gx} y={gy - 30} t="1 hạt" o={g1} size={44} />
      {x2 > 0 ? (
        <g opacity={x2}>
          <GText id="h-x2" x={540} y={320} f={f} at={X2} dur={10} text="× 2" size={120} />
          <TX x={540} y={400} text="63 lần" size={50} anchor="middle" color={SOFT} o={eo(prog(f, X63, 8))} />
        </g>
      ) : null}
      {t > 0 ? (
        <g opacity={t}>
          <GText id="h-t1" x={540} y={312} f={f} at={TITLE0} dur={18} text="HẠT GẠO" size={92} ls={6} />
          <TX x={540} y={392} text="TRÊN BÀN CỜ" size={52} ls={8} anchor="middle" color={SOFT} o={eo(prog(f, TITLE0 + 10, 14))} />
        </g>
      ) : null}
    </g>
  );
};

/* ---------------- legend ---------------- */
const LegendS: React.FC<SP> = ({f, pj}) => {
  if (f < SC.legend - 10 || f > SC.half1 + 20) return null;
  const cap = vis(f, MCARD0 + 30, L(4) + 14, 14, 24);
  const r1 = vis(f, SQ1_0 + 6, LE(5) + 10, 10, 16), r2 = vis(f, SQ2_1 - 10, LE(5) + 10, 10, 16), r3 = vis(f, wd(4, 'sáu') - 2, LE(5) + 10, 10, 16);
  const [x1, y1] = pj(add(sq(1), [0, 0.05, 0.62])), [x2, y2] = pj(add(sq(2), [0, 0.05, 0.62])), [x64, y64] = pj(add(sq(64), [0, 0.05, -0.62]));
  return (
    <g>
      <Caption pj={pj} cd={CARDS().chess} o={cap} w={600} lines={[['SHAHNAMA · BA TƯ · ~1530', 28, GOLD_T], ['cờ vua đến triều đình nhà vua', 26]]} src="tranh: The Met · CC0 · Wikimedia Commons" />
      {r1 > 0 ? (
        <g>
          <TX x={540} y={262} text="ô 1  →  1 hạt" size={44} anchor="middle" color={GOLD_T} o={r1} />
          <TX x={540} y={326} text="ô 2  →  2 hạt" size={44} anchor="middle" color={GOLD_T} o={r2} />
          <TX x={540} y={390} text="…  ô 64  →  ?" size={44} anchor="middle" color={SOFT} o={r3} />
          <Label x={x1} y={y1 + 34} t="1" o={r1} size={34} />
          <Label x={x2} y={y2 + 34} t="2" o={r2} size={34} />
          <Label x={x64} y={y64 - 8} t="64" o={r3} size={34} />
        </g>
      ) : null}
    </g>
  );
};

/* ---------------- half1 / half2：计数器 ---------------- */
const NOTE: Record<number, string> = {10: `≈ ${SQ10_G} g · chưa đầy nắm tay`, 20: `≈ ${SQ20_KG} kg`, 40: `≈ ${SQ40_T} tấn`, 50: `≈ ${SQ50_MT} triệu tấn`, 64: `= 2⁶³ ≈ ${SQ64_TT} tỷ tỷ hạt`};
const BoardS: React.FC<SP> = ({f, pj}) => {
  if (f < HOP0 - 40 || f > L(16) + 10) return null;
  const n = curSq(f);
  const half = vis(f, HALF_TXT0, L(11) - 2, 10, 16);
  const ns = vis(f, L(11) - 4, L(12) + 4, 10, 14);
  // one window over "32 Ô ĐẦU" → "NỬA SAU": the per-square counter must not flash back in the gap between the two (was visible ~f1320–1345)
  const gap = vis(f, HALF_TXT0, L(12) + 4, 10, 14);
  const cnt = vis(f, L(6) - 2, L(16) - 2, 10, 16) * (1 - gap);
  const rule = vis(f, RULE0, L(13) - 4, 12, 14);
  const king = vis(f, KING_OK, L(11) - 2, 10, 16);
  const landed = Math.abs(sAt(f) - Math.round(sAt(f))) < 0.08;
  const note = NOTE[n] && landed ? NOTE[n] : `≈ ${weightTxt(grains(n))}`;
  const lbl = (k: number) => { const o = Math.min(eo(prog(sAt(f), k - 0.05, 0.1)), 1 - ss(prog(f, SC.half2 - 20, 30))); const [x, y] = pj(add(top(k), [0, 0.22, 0])); return <Label key={k} x={x} y={y} t={String(k)} o={o} size={30} />; };
  return (
    <g>
      {cnt > 0 ? (
        <g opacity={cnt}>
          <Backing x={90} y={196} w={900} h={262} o={0.7} />
          <TX x={540} y={252} text={`Ô ${n}`} size={50} ls={3} anchor="middle" color={GOLD_T} glow="#ff9a3a" glowO={0.3} />
          <Counter cx={540} y={282} value={vn(grains(n))} label="hạt" size={76} o={1} />
          <TX x={540} y={430} text={note} size={36} anchor="middle" color={NOTE[n] && landed ? GOLD_T : SOFT} />
        </g>
      ) : null}
      {half > 0 ? (
        <g opacity={half}>
          <Backing x={90} y={196} w={900} h={262} o={0.7} />
          <TX x={540} y={250} text="32 Ô ĐẦU" size={36} ls={6} anchor="middle" color={DIM} />
          <Counter cx={540} y={282} value={HALF} label="hạt" size={76} o={1} />
          <GText id="b-half" x={540} y={420} f={f} at={HALF_TXT0 + 30} dur={12} text={`≈ ${HALF_T} tấn · 4–5 xe tải`} size={44} />
          {king > 0 ? <TX x={540} y={492} text="vua vẫn trả được ✓" size={36} anchor="middle" color={SOFT} o={king} /> : null}
        </g>
      ) : null}
      {ns > 0 ? <g opacity={ns}><GText id="b-ns" x={540} y={330} f={f} at={L(11) - 2} dur={14} text="NỬA SAU" size={96} ls={8} /></g> : null}
      {rule > 0 ? (
        <g opacity={rule}>
          <Backing x={150} y={452} w={780} h={128} o={0.75} />
          <TX x={540} y={500} text="ô mới = tổng các ô trước + 1" size={38} anchor="middle" color={GOLD_T} />
          <TX x={540} y={560} text="2³² = (1 + 2 + … + 2³¹) + 1" size={36} anchor="middle" color={SOFT} o={eo(prog(f, RULE0 + 30, 12))} />
        </g>
      ) : null}
      {[10, 20, 32].map(lbl)}
    </g>
  );
};

/* ---------------- total：证明 + 高潮 ---------------- */
const PROOF = ['1 + 1 = 2', '2 + 2 = 4', '4 + 4 = 8', '8 + 8 = 16', '…', '2⁶³ + 2⁶³ = 2⁶⁴'];
const TotalS: React.FC<SP> = ({f}) => {
  if (f < TOT0 - 10 || f > L(18) + 10) return null;
  const head = vis(f, TOT0, CLIMAX - 4, 10, 10);
  const eq = eo(prog(f, wd(16, 'hai') - 2, 10));
  const pr = vis(f, PROOF0, CLIMAX - 4, 8, 10);
  const step = (PROOF1 - PROOF0 - 24) / (PROOF.length - 1);
  const cl = vis(f, CLIMAX, L(18) - 6, 6, 20);
  const w = eo(prog(f, WEIGHT_T - 2, 10));
  return (
    <g>
      {head > 0 ? (
        <g opacity={head}>
          <TX x={540} y={244} text="CẢ BÀN CỜ" size={32} ls={7} anchor="middle" color={DIM} />
          <TX x={540} y={320} text="1 + 2 + 4 + … + 2⁶³" size={56} anchor="middle" color={GOLD_T} />
          {eq > 0 ? <GText id="t-eq" x={540} y={420} f={f} at={wd(16, 'hai') - 2} dur={10} text="= 2⁶⁴ − 1" size={74} /> : null}
        </g>
      ) : null}
      {pr > 0 ? (
        <g opacity={pr}>
          <Backing x={250} y={458} w={580} h={400} o={0.7} />
          <TX x={540} y={500} text="thêm 1 hạt:" size={32} anchor="middle" color={DIM} />
          {PROOF.map((t, i) => {
            const a = eo(prog(f, PROOF0 + 8 + i * step, 8));
            const latest = i === PROOF.length - 1 || f < PROOF0 + 8 + (i + 1) * step;
            return a > 0 ? <TX key={i} x={540} y={558 + i * 52} text={t} size={i === PROOF.length - 1 ? 46 : 42} anchor="middle" color={latest ? GOLD_T : 'rgba(236,228,214,0.45)'} o={a} /> : null;
          })}
        </g>
      ) : null}
      {cl > 0 ? (
        <g opacity={cl}>
          <GText id="t-cl" x={540} y={330} f={f} at={CLIMAX} dur={6} text={`≈ ${TOTAL_TT.split(',')[0]} tỷ tỷ hạt`} size={84} />
          <Counter cx={540} y={386} value={TOTAL_TXT} label="hạt" size={62} o={eo(prog(f, CLIMAX + 4, 10))} />
          {w > 0 ? <g opacity={w}><GText id="t-w" x={540} y={560} f={f} at={WEIGHT_T - 2} dur={10} text={`≈ ${TOTAL_TYT} tỷ tấn`} size={70} /><TX x={540} y={612} text="(25 mg / hạt)" size={26} anchor="middle" color={DIM} /></g> : null}
        </g>
      ) : null}
    </g>
  );
};

/* ---------------- earth ---------------- */
const EarthS: React.FC<SP> = ({f, pj}) => {
  if (f < EARTH0 || f > L(21) + 10) return null;
  const ea = earthA(f);
  const a18 = vis(f, wd(18, 'giới') - 2, ORBIT0, 10, 12) * ea;
  const a19 = vis(f, ORBIT0, VNC0 + 8, 10, 12) * ea;
  const a20 = vis(f, VNC0 + 8, L(21) - 4, 10, 16) * ea;
  const yrs = Math.round(YEARS_WORLD * ss(prog(f, ORBIT0 + 4, ORBIT1 - ORBIT0 - 10)));
  const yvn = Math.round(YEARS_VN * ss(prog(f, VNC0 + 14, 34)) / 100) * 100;
  const capE = Math.min(ea * eo(prog(f, EARTHC0 + 20, 14)), 1 - ss(prog(f, VNC0 - 6, 14)));
  return (
    <g>
      {a18 > 0 ? (
        <g opacity={a18}>
          <TX x={540} y={240} text="CẢ THẾ GIỚI · MỖI NĂM" size={30} ls={5} anchor="middle" color={DIM} />
          <GText id="e-w" x={540} y={312} f={f} at={wd(18, 'khoảng')} dur={12} text={`${dec(WORLD_T / 1e6, 1)} triệu tấn gạo`} size={58} />
        </g>
      ) : null}
      {a19 > 0 ? (
        <g opacity={a19}>
          <TX x={540} y={240} text={`${TOTAL_TYT} tỷ tấn  ÷  ${dec(WORLD_T / 1e6, 1)} triệu tấn / năm`} size={30} anchor="middle" color={DIM} />
          <Counter cx={540} y={262} value={vn(yrs)} pre="≈" label="năm" size={66} o={1} />
        </g>
      ) : null}
      {a20 > 0 ? (
        <g opacity={a20}>
          <TX x={540} y={240} text={`VIỆT NAM · ${dec(VN_T / 1e6, 1)} triệu tấn / năm`} size={30} ls={2} anchor="middle" color={DIM} />
          <Counter cx={540} y={262} value={vn(yvn)} pre="≈" label="năm" size={66} o={1} />
        </g>
      ) : null}
      <Caption pj={pj} cd={CARDS().earth} o={capE} w={560} dy={14} lines={[['TRÁI ĐẤT · APOLLO 17 · 1972', 26, GOLD_T]]} src="ảnh: NASA · phạm vi công cộng" />
      <Caption pj={pj} cd={CARDS().vn} o={vnA(f) * eo(prog(f, VNC0 + 24, 14))} w={560} lines={[['RUỘNG BẬC THANG · HÀ GIANG', 26, GOLD_T]]} src="ảnh: minhphuc_99kdd · phạm vi công cộng" />
    </g>
  );
};

/* ---------------- end ---------------- */
const EndS: React.FC<SP> = ({f, pj}) => {
  if (f < L(21) - 20) return null;
  const ca = curveA(f);
  const t21 = vis(f, L(21), FINALT, 12, 16) * ca;
  const P = (u: number) => pj(CURVE_PTS[Math.round(u * (CURVE_PTS.length - 1))]);
  const a = vis(f, wd(21, 'lúc'), L(22) - 2, 10, 14), b = vis(f, wd(21, 'vượt') - 2, L(22) - 2, 10, 14);
  const [ax, ay] = P(0.3), [bx, by] = P(0.86);
  const tags: [string, number][] = [['lãi kép', 0.8], ['dịch bệnh', 0.88], ['sức mạnh máy tính', 0.95]];
  const fin = vis(f, FINALT, FRAMES + 40, 16, 10);
  return (
    <g>
      {t21 > 0 ? <g opacity={t21}><GText id="e-hm" x={540} y={290} f={f} at={L(21)} dur={14} text="HÀM MŨ" size={86} ls={8} /><TX x={540} y={350} text="y = 2ˣ" size={40} anchor="middle" color={SOFT} o={eo(prog(f, L(21) + 16, 12))} /></g> : null}
      <Label x={ax} y={ay - 44} t="lúc đầu: vô hại" o={a} size={32} />
      <Label x={bx - 252} y={by + 10} t="rồi: vượt mọi tưởng tượng" o={b} size={32} />{/* ep58: was bx − 200 → the text end touched the curve */}
      {tags.map(([t, u], i) => {
        const o = vis(f, TAGS[i] - 2, FINALT + 10, 10, 16) * ca;
        if (o <= 0.01) return null;
        const [x, y] = P(u);
        return (
          <g key={i} opacity={o}>
            <circle cx={x} cy={y} r={7} fill="#ffd9a0" />
            <TX x={x - 26} y={y + 11} text={t} size={34} anchor="end" color={GOLD_T} glow="#000" glowO={0.75} />
          </g>
        );
      })}
      {fin > 0 ? (
        <g opacity={fin}>
          <GText id="e-f1" x={540} y={290} f={f} at={FINALT} dur={20} text="HẠT GẠO" size={92} ls={6} />
          <TX x={540} y={366} text="TRÊN BÀN CỜ" size={50} ls={8} anchor="middle" color={SOFT} o={eo(prog(f, FINALT + 14, 14))} />
        </g>
      ) : null}
    </g>
  );
};
void clamp; void LE;

export const ScreenText: React.FC<{f: number}> = ({f}) => {
  const pj = makePJ3(f);
  const p = {f, pj};
  return (
    <>
      <HookS {...p} />
      <LegendS {...p} />
      <BoardS {...p} />
      <TotalS {...p} />
      <EarthS {...p} />
      <EndS {...p} />
    </>
  );
};

// ep56 · 屏幕文字层（竖屏 1080×1920）：所有文字 / 数字 / 公式都在这里——整数像素、固定字号、不旋转、等宽数字。
// 世界锚点经 makePJ3：前后 7 帧相机投影取平均再取整；门牌号的字号按每段的参考机位定好、整段不变（段与段之间交叉淡化）。
// 安全区：重要内容在 y 192–1536 之间（上 10%、下 20% 留给平台 UI）；字幕在 ~72% 高度。
import React from 'react';
import {Backing, GText, TX} from '../ep55-pi/kit55';
import {
  CARDS, CH2_0, CH2_1, CH3_0, CH3_1, CH5_0, CH5_1, CH7_0, CH7_1, CLIMAX, CURB0, DIAG_LIST, DIAG_NEW, DIAG_T, DOOR_H, EQ1, EQ2, FINAL0, FRAMES, HCARD, GCARD, CCARD0,
  HC2_0, HW, L, LE, PASS0, PASS1, ROWS0, Rect3, SC, TAB, TFRAME0, Y1891, ZIG0, ZIG_N, ZIG_RUNG_T, ARC1, ARC2, ARC3, ALEPH, beadL, beadR, camAt, camBasis, clamp, eo,
  fogK, prog, progOf, rectPt, roomZ, side, S3ID, wd, add, mul, roomPos, cellPt,
} from './scene3';
import {V3, project} from './gl';
import {EMPTY_MARK, PRIME_ROW} from './facts';
import {hotelA} from './world';

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
const GOLD_T = '#ffe2b0', SOFT = 'rgba(240,232,220,0.86)', DIM = 'rgba(236,228,214,0.7)';
const EQ3 = wd(21, 'xe');

/** 照片卡下方的说明（锚在卡片底边中点） */
const Caption: React.FC<{pj: PJ3; cd: Rect3; lines: [string, number, string?][]; src: string; o: number}> = ({pj, cd, lines, src, o}) => {
  if (o <= 0.01) return null;
  const [x, y] = pj(add(cd.c, mul(cd.ey, -cd.h / 2)));
  let yy = y + 14;
  const hh = lines.reduce((s, l) => s + l[1] * 1.25, 0) + 44;
  return (
    <g opacity={o}>
      <Backing x={x - 330} y={y + 4} w={660} h={hh} o={0.9} />
      {lines.map(([t, s, c], i) => { yy += s * 1.25; return <TX key={i} x={x} y={yy} text={t} size={s} anchor="middle" color={c ?? SOFT} ls={i === 0 ? 5 : 0.5} />; })}
      <TX x={x} y={yy + 26} text={src} size={15} anchor="middle" color="rgba(220,210,190,0.55)" ls={0.3} />
    </g>
  );
};

/* ---------------- 门牌号：每段一个参考机位定字号 ---------------- */
type Seg = {a: number; b: number; ref: number; rooms: number[]};
const SEGS: Seg[] = [
  {a: 30, b: L(4) + 6, ref: 200, rooms: range(1, 18)},
  {a: L(5) + 150, b: L(13) + 10, ref: wd(11, 'Một'), rooms: range(1, 18)},
  {a: CH2_0 - 30, b: L(17) + 60, ref: CH5_0, rooms: range(1, 32)},
  {a: PASS0, b: CLIMAX + 40, ref: PASS0 + 70, rooms: range(1, 14)},
];
function range(a: number, b: number) { return Array.from({length: b - a + 1}, (_, i) => a + i); }
const sizeOf = (ref: number, p: V3) => {
  const c = camAt(ref); const b = camBasis(c);
  const v = [p[0] - c.pos[0], p[1] - c.pos[1], p[2] - c.pos[2]];
  const d = -(v[0] * b.back[0] + v[1] * b.back[1] + v[2] * b.back[2]);
  return Math.round(clamp(0.24 / (d * b.pxK), 15, 46));
};
const SEG_SIZES = SEGS.map((s) => s.rooms.map((m) => sizeOf(s.ref, plaqueP(m))));
function plaqueP(m: number): V3 { return [side(m) * (HW - 0.02), DOOR_H + 0.16, roomZ(m)]; }
const DoorNums: React.FC<SP> = ({f, pj}) => {
  const c = camAt(f);
  return (
    <g>
      {SEGS.map((s, si) => {
        const o = vis(f, s.a, s.b, 16, 18) * hotelA(f);
        if (o <= 0.01) return null;
        return s.rooms.map((m, k) => {
          const p = plaqueP(m);
          const q = project(c, p);
          if (q[2] < 1) return null;
          const sz0 = SEG_SIZES[si][k];
          const a = o * fogK(f, q[2]) * eo(prog(f, si === 0 ? doorApp(m) + 6 : s.a, 12)) * clamp((sz0 - (si === 2 ? 16 : 19)) / 5);
          if (a < 0.03) return null;
          const [x, y] = pj(p);
          const sz = SEG_SIZES[si][k];
          return <TX key={si + '-' + m} x={x} y={y + Math.round(sz * 0.36)} text={String(m)} size={sz} anchor="middle" color="#fff0d6" glow="#ff9a3a" glowO={0.3} o={a} />;
        });
      })}
    </g>
  );
};
import {doorAppear as doorApp} from './scene3';

/* ---------------- hook ---------------- */
const HookS: React.FC<SP> = ({f, pj}) => {
  if (f > SC.one + 20) return null;
  const k1 = vis(f, wd(1, 'kín') - 4, L(2) + 40, 10, 16);
  const q = vis(f, wd(2, 'Liệu'), L(3) + 40, 8, 14);
  const v = vis(f, wd(3, 'vẫn'), L(4) + 4, 6, 14);
  const cards = CARDS();
  const co = 1 - prog(f, LE(5) + 6, 22);
  return (
    <g>
      {k1 > 0 ? <g opacity={k1}><TX x={540} y={262} text="ĐÊM NAY" size={28} ls={8} anchor="middle" color={DIM} /><GText id="h-kin" x={540} y={350} f={f} at={wd(1, 'kín') - 4} dur={14} text="KÍN PHÒNG" size={86} ls={6} /></g> : null}
      {v > 0 ? <g opacity={v}><GText id="h-v" x={540} y={340} f={f} at={wd(3, 'vẫn')} dur={10} text="vẫn còn." size={96} /></g> : null}
      <Caption pj={pj} cd={cards.hilbert} o={eo(prog(f, HCARD + 14, 14)) * co}
        lines={[['DAVID HILBERT', 34, GOLD_T], ['1862–1943 · nhà toán học Đức', 24], ['kể chuyện này ở Göttingen · 1924–1925', 23, DIM]]} src="ảnh: Wikimedia Commons · phạm vi công cộng" />
      <Caption pj={pj} cd={cards.gamow} o={eo(prog(f, GCARD + 12, 14)) * co}
        lines={[['GEORGE GAMOW', 30, GOLD_T], ['nhà vật lý · sách 1947: One Two Three… Infinity', 22]]} src="ảnh: Wikimedia Commons · PD-Art" />
      <GText id="h-1947" x={540} y={258} f={f} at={wd(5, 'một')} dur={12} text="1947" size={92} o={co} />
    </g>
  );
};

/* ---------------- one：n → n+1 ---------------- */
const OneS: React.FC<SP> = ({f, pj}) => {
  if (f < SC.one - 10 || f > SC.bus + 10) return null;
  const a = vis(f, L(6), L(7) + 4, 10, 14), b = vis(f, L(7), L(8) + 2, 10, 12), c = vis(f, L(8), L(9) + 2, 8, 12), d = vis(f, L(9), SC.bus, 8, 16);
  const [x1, y1] = pj([side(1) * (HW - 0.02), DOOR_H + 0.62, roomZ(1)]);
  return (
    <g>
      {a > 0 ? <g opacity={a}><TX x={540} y={262} text="CÁCH CỦA HILBERT" size={26} ls={8} anchor="middle" color={DIM} /><GText id="o-1" x={540} y={340} f={f} at={L(6) + 26} dur={16} text="phòng n  →  phòng n + 1" size={66} /></g> : null}
      {b > 0 ? <g opacity={b}><GText id="o-2" x={540} y={330} f={f} at={L(7)} dur={16} text="không có phòng cuối cùng" size={56} /></g> : null}
      {c > 0 ? <g opacity={c}><GText id="o-3" x={540} y={330} f={f} at={L(8)} dur={12} text="Phòng 1 trống" size={70} /><TX x={x1} y={y1} text="trống" size={30} anchor="middle" color="#ffd28a" o={1 - prog(f, wd(8, 'vào') + 10, 12)} /></g> : null}
      {d > 0 ? (
        <g opacity={d}>
          <GText id="o-4" x={540} y={300} f={f} at={wd(9, 'kín')} dur={12} text="“kín phòng”" size={70} />
          <GText id="o-5" x={540} y={392} f={f} at={wd(9, 'không')} dur={12} text="≠  “hết chỗ”" size={70} color="#fff0d8" />
        </g>
      ) : null}
    </g>
  );
};

/* ---------------- bus ---------------- */
const BusS: React.FC<SP> = ({f, pj}) => {
  if (f < SC.bus - 10 || f > SC.cantor + 20) return null;
  const a = vis(f, L(10), L(11) - 2, 10, 12), b = vis(f, L(11), L(12) + 4, 10, 12), c = vis(f, L(12), L(13), 10, 12), d = vis(f, L(13), L(14) + 2, 10, 12);
  const leg = vis(f, L(14), L(17) - 2, 10, 14), e16 = vis(f, wd(16, 'nên'), L(17), 10, 12), p17 = vis(f, L(17), SC.cantor + 10, 8, 16);
  const arcLab = (from: number, to: number, at: number) => {
    const pa = roomPos(from), pb = roomPos(to);
    const [x, y] = pj([(pa[0] + pb[0]) / 2, 1.45 + 0.1 * Math.abs(to - from), (pa[2] + pb[2]) / 2]);
    return <TX key={from} x={x} y={y} text={`${from} → ${to}`} size={36} anchor="middle" color="#fff0d8" glow="#ff9a3a" glowO={0.35} o={eo(prog(f, at + 8, 8)) * (1 - prog(f, L(12) + 10, 14))} />;
  };
  const chainLeg: [string, string, number, string][] = [
    ['2ⁿ', '2, 4, 8, 16, …', CH2_0 + 10, '#ffe0b0'], ['3ⁿ', '3, 9, 27, …', CH3_0 + 6, '#ffc27a'], ['5ⁿ', '5, 25, …', CH5_0 + 4, '#f0a060'], ['7ⁿ', '7, 49, …', CH7_0 + 4, '#ffd9a6'],
  ];
  const legHead = ['khách cũ', 'xe 1', 'xe 2', 'xe 3'];
  return (
    <g>
      {a > 0 ? <g opacity={a}><GText id="b-1" x={540} y={330} f={f} at={L(10)} dur={14} text="xe buýt: 1, 2, 3, …" size={60} /></g> : null}
      {b > 0 ? <g opacity={b}><GText id="b-2" x={540} y={330} f={f} at={L(11) + 10} dur={12} text="n  →  2n" size={92} /></g> : null}
      {arcLab(1, 2, ARC1)}{arcLab(2, 4, ARC2)}{arcLab(3, 6, ARC3)}
      {c > 0 ? <g opacity={c}><GText id="b-3" x={540} y={300} f={f} at={wd(12, 'lẻ') - 4} dur={12} text="phòng lẻ trống" size={62} /><TX x={540} y={372} text="1, 3, 5, 7, …  đủ cho cả xe" size={36} anchor="middle" color={SOFT} o={eo(prog(f, wd(12, 'đủ'), 10))} /></g> : null}
      {d > 0 ? <g opacity={d}><GText id="b-4" x={540} y={340} f={f} at={L(13) + 14} dur={14} text="∞ xe  ×  ∞ khách ?" size={74} /></g> : null}
      {leg > 0 ? (
        <g opacity={leg}>
          <GText id="b-5" x={540} y={262} f={f} at={L(14)} dur={12} text="Vẫn xếp được — nhờ số nguyên tố" size={40} />
          {chainLeg.map(([p, list, at, col], i) => (
            <g key={p} opacity={eo(prog(f, at, 10))}>
              <TX x={300} y={330 + i * 58} text={legHead[i]} size={28} anchor="end" color={DIM} />
              <TX x={330} y={330 + i * 58} text={p} size={40} color={col} glow="#ff9a3a" glowO={0.3} />
              <TX x={410} y={330 + i * 58} text={list} size={34} color={col} />
            </g>
          ))}
        </g>
      ) : null}
      {EMPTY_MARK.map((m) => {
        const o = vis(f, CH7_1 - 40, L(17) + 10, 14, 14);
        if (o <= 0) return null;
        const [x, y] = pj([side(m) * (HW - 0.05), 0.95, roomZ(m)]);
        return <TX key={m} x={x} y={y} text="trống" size={28} anchor="middle" color="#fff0d0" glow="#000000" glowO={0.8} o={o} />;
      })}
      {e16 > 0 ? <g opacity={e16}><GText id="b-6" x={540} y={600} f={f} at={wd(16, 'nên')} dur={12} text="không ai trùng phòng" size={50} /></g> : null}
      {p17 > 0 ? (
        <g opacity={p17}>
          <GText id="b-7" x={540} y={300} f={f} at={L(17) + 4} dur={12} text="Số nguyên tố: vô tận" size={60} />
          <TX x={540} y={372} text={PRIME_ROW} size={34} anchor="middle" color={SOFT} o={eo(prog(f, wd(17, 'không'), 12))} />
        </g>
      ) : null}
    </g>
  );
};

/* ---------------- cantor ---------------- */
const BEAD_REF = ZIG0 + 50;
const CantorS: React.FC<SP> = ({f, pj}) => {
  if (f < SC.cantor - 30 || f > SC.twist + 20) return null;
  const card = vis(f, CCARD0 + 10, ZIG0 - 4, 12, 20);
  const z = vis(f, L(19), L(21) - 6, 10, 14), al = vis(f, ALEPH - 30, L(22) + 70, 10, 16), eq = vis(f, EQ1, L(22) + 90, 8, 16), cv = vis(f, L(22) + 6, SC.twist, 10, 16);
  const zt = progOf(S3ID.zig, f);
  const cb = camBasis(camAt(BEAD_REF));
  const bsize = (p: V3) => { const cc = camAt(BEAD_REF); const v = [p[0] - cc.pos[0], p[1] - cc.pos[1], p[2] - cc.pos[2]]; const d = -(v[0] * cb.back[0] + v[1] * cb.back[1] + v[2] * cb.back[2]); return Math.round(clamp(0.3 / (d * cb.pxK), 16, 44)); };
  return (
    <g>
      <Caption pj={pj} cd={CARDS().cantor} o={card} lines={[['GEORG CANTOR', 36, GOLD_T], ['1845–1918 · người sáng lập lý thuyết tập hợp', 23]]} src="ảnh: Wikimedia Commons · phạm vi công cộng" />
      {z > 0 ? (
        <g opacity={z}>
          <GText id="c-1" x={540} y={290} f={f} at={L(19) + 6} dur={14} text="lớn bằng nhau ⇔ ghép một đổi một" size={46} />
          {Array.from({length: ZIG_N}, (_, i) => {
            const lit = eo(prog(zt, ZIG_RUNG_T[i] - 0.03, 0.03));
            if (lit <= 0) return null;
            const pl = add(beadL(i + 1), [0, 0.42, 0]), pr = add(beadR(i + 1), [0, 0.42, 0]);
            const [xl, yl] = pj(pl), [xr, yr] = pj(pr);
            const sz = bsize(pl);
            return (
              <g key={i} opacity={lit * fogK(f, project(camAt(f), pl)[2])}>
                <TX x={xl} y={yl} text={String(i + 1)} size={sz} anchor="middle" color="#ffe8c8" />
                <TX x={xr} y={yr} text={String(2 * (i + 1))} size={sz} anchor="middle" color="#ffc890" />
              </g>
            );
          })}
          <TX x={540} y={1250} text="1, 2, 3, …   ↔   2, 4, 6, …" size={40} anchor="middle" color={SOFT} o={eo(prog(f, ZIG0 + 50, 12))} />
        </g>
      ) : null}
      {al > 0 ? (
        <g opacity={al}>
          <Backing x={140} y={360} w={800} h={420} o={0.85} />
          <GText id="c-al" x={540} y={560} f={f} at={ALEPH - 2} dur={12} text="ℵ₀" size={190} />
          <TX x={540} y={660} text="|{1, 2, 3, …}|  =  ℵ₀" size={50} anchor="middle" color="#fff0d8" o={eo(prog(f, ALEPH + 8, 12))} />
          <TX x={540} y={730} text="vô hạn đếm được" size={36} anchor="middle" color={SOFT} o={eo(prog(f, wd(20, 'vô') - 2, 12))} />
        </g>
      ) : null}
      {eq > 0 ? (
        <g opacity={eq}>
          <Backing x={170} y={820} w={740} h={330} o={0.85} />
          <GText id="c-e1" x={540} y={900} f={f} at={EQ1} dur={12} text="ℵ₀ + 1 = ℵ₀" size={64} />
          <GText id="c-e2" x={540} y={995} f={f} at={EQ2} dur={12} text="ℵ₀ + ℵ₀ = ℵ₀" size={64} />
          <GText id="c-e3" x={540} y={1090} f={f} at={EQ3} dur={12} text="ℵ₀ · ℵ₀ = ℵ₀" size={64} />
        </g>
      ) : null}
      {cv > 0 ? (
        <g opacity={cv}>
          <TX x={540} y={1210} text="phép tính trên kích thước tập hợp" size={34} anchor="middle" color={SOFT} />
          <TX x={540} y={1260} text="∞ không phải một số thông thường" size={34} anchor="middle" color="#ffd28a" o={eo(prog(f, wd(22, 'vô'), 10))} />
        </g>
      ) : null}
    </g>
  );
};

/* ---------------- twist：对角线 ---------------- */
const TwistS: React.FC<SP> = ({f, pj}) => {
  if (f < SC.twist - 20 || f > CLIMAX + 130) return null;
  const q = vis(f, L(23) + 4, L(24) + 26, 10, 12), no = vis(f, L(24), Y1891 + 4, 4, 8), y91 = vis(f, Y1891, L(26) - 4, 10, 16);
  const tab = vis(f, ROWS0 - 30, L(27) + 12, 10, 18); // ep56 fix: table digits gone before the 'Không phòng nào chứa nó' title
  const head2 = vis(f, L(26) - 6, L(27) + 4, 10, 12);
  const nr = vis(f, L(27) + 36, PASS1 - 4, 10, 14), cl = vis(f, CLIMAX, CLIMAX + 120, 1, 20);
  const cell = (k: number, j: number) => pj(cellPt(k, j));
  const pass = progOf(S3ID.pass, f);
  return (
    <g>
      {q > 0 ? <g opacity={q}><GText id="t-q" x={540} y={300} f={f} at={L(23) + 4} dur={14} text="chứa được mọi thứ vô hạn?" size={52} /></g> : null}
      {no > 0 ? <g opacity={no}><GText id="t-no" x={540} y={320} f={f} at={L(24)} dur={6} text="Không." size={88} /></g> : null}
      {y91 > 0 ? <g opacity={y91}><GText id="t-91" x={540} y={300} f={f} at={Y1891} dur={12} text="1891" size={104} /><TX x={540} y={366} text="Cantor · lập luận đường chéo" size={34} anchor="middle" color={SOFT} o={eo(prog(f, wd(24, 'lập'), 10))} /></g> : null}
      {head2 > 0 ? <g opacity={head2}><TX x={540} y={330} text="chữ số thứ k  ≠  phòng k" size={48} anchor="middle" color={GOLD_T} glow="#ff9a3a" glowO={0.3} /></g> : null}
      {tab > 0 ? (
        <g opacity={tab}>
          {(() => { const [x, y] = pj(rectPt(CARDS_T(), 0, 470 - TAB.cy)); return <TX x={x} y={y} text="mỗi số thực giữa 0 và 1 · một phòng" size={28} anchor="middle" color={DIM} o={eo(prog(f, ROWS0, 12))} />; })()}
          {DIAG_LIST.map((digits, i) => {
            const k = i + 1, o = eo(prog(f, ROWS0 + i * 7, 10));
            if (o <= 0) return null;
            const [lx, ly] = pj(rectPt(CARDS_T(), 96 - TAB.cx, TAB.rowY0 + i * TAB.rowDY - TAB.cy));
            const [zx, zy] = pj(rectPt(CARDS_T(), TAB.col0 - 22 - TAB.cx, TAB.rowY0 + i * TAB.rowDY - TAB.cy));
            const hit = eo(prog(f, DIAG_T[i] - 2, 6));
            return (
              <g key={k} opacity={o}>
                <TX x={lx} y={ly} text={`phòng ${k}`} size={28} color={DIM} />
                <TX x={zx} y={zy} text="0," size={46} color={SOFT} anchor="end" />
                {[...digits].map((d, j) => { const [x, y] = cell(k, j + 1); const dg = j === i; return <TX key={j} x={x} y={y + 14} text={d} size={46} anchor="middle" color={dg && hit > 0 ? '#fff4dc' : 'rgba(240,232,220,0.8)'} glow={dg && hit > 0 ? '#ff9a3a' : undefined} glowO={0.5 * hit} />; })}
                {(() => { const [x, y] = cell(k, 8); return <TX x={x} y={y + 14} text="…" size={46} anchor="middle" color={DIM} />; })()}
                {hit > 0 ? (() => { const [x, y] = cell(k, k); return <rect x={x - 26} y={y - 30} width={52} height={60} rx={10} fill="#ff9a3a" fillOpacity={0.1} stroke="#ffd28a" strokeWidth={2} opacity={hit} />; })() : null}
              </g>
            );
          })}
          {(() => {
            const o = eo(prog(f, DIAG_T[0] - 8, 10));
            if (o <= 0) return null;
            const [lx, ly] = pj(rectPt(CARDS_T(), 96 - TAB.cx, TAB.newY - TAB.cy));
            const [zx, zy] = pj(rectPt(CARDS_T(), TAB.col0 - 22 - TAB.cx, TAB.newY - TAB.cy));
            return (
              <g opacity={o}>
                <TX x={lx} y={ly} text="số mới" size={30} color="#ffd28a" />
                <TX x={zx} y={zy} text="0," size={50} color={GOLD_T} anchor="end" />
                {[...DIAG_NEW].map((d, j) => { const a = eo(prog(f, DIAG_T[j] + 3, 6)); const [x, y] = cell(8, j + 1); return a > 0 ? <TX key={j} x={x} y={y + 14} text={d} size={50} anchor="middle" color="#fff0d8" glow="#ff9a3a" glowO={0.45} o={a} /> : null; })}
                {(() => { const [x, y] = cell(8, 8); return <TX x={x} y={y + 14} text="…" size={50} anchor="middle" color={GOLD_T} o={eo(prog(f, DIAG_T[6] + 8, 8))} />; })()}
              </g>
            );
          })()}
        </g>
      ) : null}
      {nr > 0 ? (
        <g opacity={nr}>
          <GText id="t-nr" x={540} y={290} f={f} at={L(27) + 36} dur={14} text="Không phòng nào chứa nó." size={54} />
          <TX x={540} y={360} text={`0,${DIAG_NEW}…`} size={46} anchor="middle" color="#fff0d8" glow="#ff9a3a" glowO={0.4} o={eo(prog(f, L(27) + 46, 10))} />
          {range(1, 7).map((m) => {
            const zz = roomZ(m);
            const pz = 3.0 + (-24 - 3.0) * pass;
            const a = eo(clamp((zz + 0.3 - pz) / 0.8));
            if (a <= 0) return null;
            const [x, y] = pj([side(m) * (HW - 0.25), DOOR_H + 0.62, zz]);
            return <TX key={m} x={x} y={y} text="≠" size={52} anchor="middle" color="#ffd28a" glow="#ff9a3a" glowO={0.4} o={a} />;
          })}
        </g>
      ) : null}
      {cl > 0 ? (
        <g opacity={cl}>
          <Backing x={90} y={660} w={900} h={260} o={0.9} />
          <TX x={540} y={740} text="Số thực: không đếm được" size={48} anchor="middle" color="#fff0d8" o={eo(prog(f, CLIMAX - 70, 12))} />
          <GText id="t-cl" x={540} y={850} f={f} at={CLIMAX} dur={10} text="một vô hạn lớn hơn ℵ₀" size={70} />
        </g>
      ) : null}
    </g>
  );
};
import {TABLE as CARDS_T} from './scene3';

/* ---------------- end ---------------- */
const EndS: React.FC<SP> = ({f, pj}) => {
  if (f < SC.end - 20) return null;
  const card = vis(f, HC2_0 + 12, L(31) - 10, 12, 24);
  const qt = vis(f, L(30) + 10, L(31) - 4, 10, 20), fin = vis(f, FINAL0 + 30, FRAMES + 40, 16, 10);
  return (
    <g>
      <Caption pj={pj} cd={CARDS().hilbert2} o={card} lines={[['DAVID HILBERT', 32, GOLD_T]]} src="ảnh: Wikimedia Commons · phạm vi công cộng" />
      <TX x={540} y={860} text="“vô hạn không hề có trong thực tế”" size={34} anchor="middle" color={SOFT} o={vis(f, L(29) + 10, L(30) + 6, 12, 14)} />
      {qt > 0 ? (
        <g opacity={qt}>
          <GText id="e-q1" x={540} y={940} f={f} at={wd(30, 'không')} dur={14} text="“Không ai đuổi được chúng ta" size={50} />
          <GText id="e-q2" x={540} y={1010} f={f} at={wd(30, 'khỏi')} dur={14} text="khỏi thiên đường" size={50} />
          <GText id="e-q3" x={540} y={1080} f={f} at={wd(30, 'mà')} dur={14} text="mà Cantor đã tạo ra.”" size={50} />
          <TX x={540} y={1150} text="— Hilbert, 1925" size={30} anchor="middle" color={DIM} o={eo(prog(f, wd(30, 'tạo'), 12))} />
        </g>
      ) : null}
      {fin > 0 ? (
        <g opacity={fin}>
          <GText id="e-t1" x={540} y={330} f={f} at={FINAL0 + 30} dur={20} text="KHÁCH SẠN VÔ CỰC" size={70} ls={4} />
          <TX x={540} y={402} text="của Hilbert" size={44} anchor="middle" color={SOFT} o={eo(prog(f, FINAL0 + 50, 14))} />
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
      <DoorNums {...p} />
      <HookS {...p} />
      <OneS {...p} />
      <BusS {...p} />
      <CantorS {...p} />
      <TwistS {...p} />
      <EndS {...p} />
    </>
  );
};
void TFRAME0; void CH2_1; void CH3_1; void CH5_1; void DOOR_H;

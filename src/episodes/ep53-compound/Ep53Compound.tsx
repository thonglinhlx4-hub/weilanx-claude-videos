// ep53-compound「Lãi kép: vì sao 1% mỗi ngày lại đáng sợ」— 金线一笔风 v3。
// 82 秒（41 小节），120 BPM（一小节 60 帧），所有字幕 / 硬切落在小节线上；高潮重拍 = 1920 帧（64.0 s，第 32 小节）。
// v3：钩子改用真实字形；840–960 真人插入（硬切）；1320–1440 3D 波浪图。旧场景内部仍用 v2 时间，合成时按偏移映射。
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {S1} from './hook';
import {SPerson} from './person';
import {LAND3D, S3D} from './wave3d';
import {
  C, Formula, GlowPath, GrainVignette, H, Label, P, PenHead, PenWord, Ribbon, SevenSeg, Space, Stroke, Sub, Svg, W,
  circlePts, clamp, eio, eo, partial, prog, pushOut, rand, roundRectPts, segWidth, smooth,
} from './kit';

export const EP53_FRAMES = 2460;
export const EP53_W = W, EP53_H = H;
export const BAR = 60;
export const CLIMAX = 1920;
/** 旧场景（S4–S7）内部的高潮帧（v2 时间轴） */
const OLD_CLIMAX = 1680;

export const CUES: [number, number, string][] = [
  [0, 120, 'Nếu mỗi ngày bạn giỏi hơn 1%…'],
  [120, 240, '…một năm sau, bạn giỏi hơn bao nhiêu?'],
  [240, 360, 'Cộng thêm 1% mỗi ngày, cuối năm gấp 4,65 lần.'],
  [360, 480, 'Nhưng 1% hôm nay được tính trên cả phần hôm qua.'],
  [480, 600, 'Đó là phép nhân, không phải phép cộng.'],
  [600, 720, 'Trong chuyện tiền bạc, nó có tên: LÃI KÉP.'],
  [720, 840, 'Lãi sinh ra lãi, rồi lãi lại sinh lãi.'],
  [840, 960, 'Cô Lan bỏ heo đất 20 năm: 10 triệu vẫn là 10 triệu.'],
  [960, 1080, 'Còn gửi 10 triệu, lãi suất 8% mỗi năm?'],
  [1080, 1200, 'Quy tắc 72: 72 chia 8, khoảng 9 năm tiền gấp đôi.'],
  [1200, 1320, 'Sau 27 năm: lãi đơn 31,6 triệu, lãi kép gần 80.'],
  [1320, 1440, 'Thị trường năm lên năm xuống, nhưng đường dài vẫn đi lên.'],
  [1440, 1560, 'Năm 1683, Jacob Bernoulli đặt một câu hỏi:'],
  [1560, 1680, 'nếu lãi được nhập vốn liên tục, tiền có tăng mãi?'],
  [1680, 1800, 'Không. Nó tiến tới một hằng số: e ≈ 2,71828.'],
  [1800, 1920, 'Quay lại 1% mỗi ngày. Đến ngày thứ 365…'],
  [1920, 2040, '…bạn giỏi gấp 37,8 lần.'],
  [2040, 2160, 'Còn mỗi ngày kém đi 1%? Chỉ còn 0,026.'],
  [2160, 2280, 'LÃI KÉP không chỉ là chuyện tiền.'],
  [2280, 2340, 'Thói quen, kiến thức cũng vậy.'],
  [2340, 2454, 'Mỗi ngày, bạn đang nhân lên điều gì?'],
];

/* ---------------- 坐标图 ---------------- */
type Cfg = {ox: number; oy: number; w: number; h: number; xMax: number; yMax: number; xTicks: number[]; yTicks: number[]; yName: string};
const px = (c: Cfg, x: number, y: number): P => [c.ox + (x / c.xMax) * c.w, c.oy - (y / c.yMax) * c.h];

const Chart: React.FC<{c: Cfg; f: number; at: number}> = ({c, f, at}) => {
  const g = eo(prog(f, at, 22));
  const step = 52;
  const x0 = c.ox - 80, x1 = c.ox + c.w + 110, y0 = c.oy - c.h - 110, y1 = c.oy + 60;
  const sweep = x0 + (x1 - x0) * g;
  const ax = eo(prog(f, at + 2, 20)), ay = eo(prog(f, at + 8, 20));
  const lab = prog(f, at + 14, 12);
  return (
    <g>
      <mask id={`gm${at}`}>
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="url(#gridFade)" />
      </mask>
      <defs>
        <radialGradient id="gridFade" cx="0.5" cy="0.5" r="0.62"><stop offset="0.6" stopColor="#fff" /><stop offset="1" stopColor="#000" /></radialGradient>
      </defs>
      <g mask={`url(#gm${at})`} strokeWidth={1}>
        {Array.from({length: Math.floor((x1 - x0) / step) + 1}).map((_, i) => {
          const x = x0 + i * step;
          return x <= sweep ? <line key={'v' + i} x1={x} x2={x} y1={y0} y2={y1} stroke={i % 2 ? C.gridFaint : C.grid} /> : null;
        })}
        {Array.from({length: Math.floor((y1 - y0) / step) + 1}).map((_, i) => (
          <line key={'h' + i} x1={x0} x2={sweep} y1={y1 - i * step} y2={y1 - i * step} stroke={i % 2 ? C.gridFaint : C.grid} />
        ))}
      </g>
      {/* 坐标轴：细白线，stroke-dashoffset 描出 */}
      <g stroke="rgba(225,228,255,0.78)" strokeWidth={1.6} fill="none">
        <path d={`M${c.ox - 20},${c.oy} L${c.ox + c.w + 70},${c.oy}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ax} />
        <path d={`M${c.ox},${c.oy + 20} L${c.ox},${c.oy - c.h - 70}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ay} />
        {ax > 0.98 ? <path d={`M${c.ox + c.w + 58},${c.oy - 6} L${c.ox + c.w + 70},${c.oy} L${c.ox + c.w + 58},${c.oy + 6}`} /> : null}
        {ay > 0.98 ? <path d={`M${c.ox - 6},${c.oy - c.h - 58} L${c.ox},${c.oy - c.h - 70} L${c.ox + 6},${c.oy - c.h - 58}`} /> : null}
      </g>
      <g opacity={lab}>
        {c.xTicks.map((t) => {
          const [x] = px(c, t, 0);
          return (
            <g key={'xt' + t}>
              <line x1={x} x2={x} y1={c.oy - 5} y2={c.oy + 5} stroke="rgba(225,228,255,0.6)" />
              <Label x={x} y={c.oy + 32} text={String(t)} size={17} color={C.dim} anchor="middle" />
            </g>
          );
        })}
        {c.yTicks.map((t) => {
          const [, y] = px(c, 0, t);
          return (
            <g key={'yt' + t}>
              <line x1={c.ox - 5} x2={c.ox + 5} y1={y} y2={y} stroke="rgba(225,228,255,0.6)" />
              <Label x={c.ox - 16} y={y + 6} text={String(t)} size={17} color={C.dim} anchor="end" />
            </g>
          );
        })}
        <Label x={c.ox + c.w + 84} y={c.oy + 7} text="ngày" size={19} color={C.label} />
        <Label x={c.ox + 14} y={c.oy - c.h - 76} text={c.yName} size={19} color={C.label} />
      </g>
    </g>
  );
};

/** 函数曲线：按自变量从左往右画（笔头在当前点） */
const fnPts = (c: Cfg, fn: (x: number) => number, D: number, yClip = 60): P[] => {
  const pts: P[] = [];
  for (let d = 0; d <= D; d += 1) {
    const p = px(c, d, fn(d));
    if (p[1] < yClip) break;
    pts.push(p);
  }
  const e = px(c, D, fn(D));
  if (e[1] >= yClip) pts.push(e);
  return pts;
};
const Curve: React.FC<{c: Cfg; fn: (x: number) => number; D: number; f: number; color?: string; w?: number; head?: boolean; o?: number}> = ({c, fn, D, f, color, w = 2.6, head = true, o = 1}) => {
  if (D <= 0) return null;
  const pts = fnPts(c, fn, D);
  if (pts.length < 2) return null;
  const {d, head: h} = partial(pts, 1);
  return (
    <g>
      <GlowPath d={d} color={color} w={w} o={o} />
      {head ? <PenHead p={h} f={f} size={0.95} /> : null}
    </g>
  );
};

/** 数码管读数面板：小衬线标签 + LED */
const Readout: React.FC<{x: number; y: number; rows: {label: string; value: string; color?: string}[]; f: number; at: number; size?: number}> = ({x, y, rows, f, at, size = 44}) => {
  const o = eo(prog(f, at, 8));
  if (o <= 0) return null;
  const flick = f - at < 8 ? (Math.floor(f) % 2 ? 0.45 : 1) : 1;
  return (
    <g opacity={o * flick}>
      {rows.map((r, i) => (
        <g key={i}>
          <Label x={x} y={y + i * (size + 30) + size * 0.72} text={r.label} size={18} color={C.label} ls={2} />
          <SevenSeg value={r.value} x={x + 120} y={y + i * (size + 30)} size={size} color={r.color ?? C.red} />
        </g>
      ))}
    </g>
  );
};

/* ---------------- S2 240–600 网格：线性 vs 1.01^x ---------------- */
const CF1: Cfg = {ox: 300, oy: 840, w: 1300, h: 600, xMax: 365, yMax: 6, xTicks: [60, 120, 180, 240, 300, 360], yTicks: [1, 2, 3, 4, 5, 6], yName: 'giá trị (lần)'};
const lin = (d: number) => 1 + 0.01 * d;
const ex = (d: number) => Math.pow(1.01, d);

const S2: React.FC<{f: number}> = ({f}) => {
  const dl = 365 * eio(prog(f, 272, 78));
  const de = 200 * prog(f, 400, 186);
  const usingExp = f >= 400;
  const day = usingExp ? de : dl;
  const val = usingExp ? ex(de) : lin(dl);
  return (
    <AbsoluteFill style={pushOut(f, 600)}>
      <Svg>
        <Chart c={CF1} f={f} at={244} />
        <Curve c={CF1} fn={lin} D={dl} f={f} color="#cfd3e6" w={1.8} head={f < 352} o={usingExp ? 0.55 : 1} />
        <Formula x={1420} y={346} size={30} color="#c9cbd6" o={prog(f, 338, 12) * (usingExp ? 0.6 : 1)}>y = 1 + 0,01x</Formula>
        <Label x={960} y={190} text="hôm nay = hôm qua × 1,01" size={28} color={C.label} anchor="middle" italic o={prog(f, 372, 12)} />
        <Curve c={CF1} fn={ex} D={de} f={f} head={f < 590} />
        <Formula x={1000} y={390} size={46} o={prog(f, 488, 14)}>
          y = 1,01<tspan dy={-20} fontSize={30}>x</tspan>
        </Formula>
        <Readout x={380} y={290} f={f} at={268} rows={[{label: 'NGÀY', value: String(Math.round(day)).padStart(3, ' ')}, {label: 'GIÁ TRỊ', value: val.toFixed(2).padStart(5, ' ')}]} />
      </Svg>
    </AbsoluteFill>
  );
};

/* ---------------- S3 600–840 锚词 LÃI KÉP + 利滚利 ---------------- */
const RADII = [16, 20, 25, 31, 39, 49];
const CHAIN: {pts: P[]; centers: [number, number, number][]} = (() => {
  const gap = 38, cy = 730;
  const total = RADII.reduce((a, r) => a + 2 * r, 0) + gap * (RADII.length - 1);
  let x = 960 - total / 2;
  const pts: P[] = [[x - 140, cy + 40], [x - 60, cy + 10]];
  const centers: [number, number, number][] = [];
  RADII.forEach((r) => {
    pts.push([x, cy]);
    pts.push(...circlePts(x + r, cy, r, Math.PI, 1, 40));
    centers.push([x + r, cy, r]);
    x += 2 * r + gap;
  });
  pts.push([x - gap + 60, cy - 30]);
  return {pts, centers};
})();
const S3: React.FC<{f: number}> = ({f}) => {
  const lift = eio(prog(f, 712, 20));
  return (
    <AbsoluteFill>
      <Svg>
        <g transform={`translate(0,${-lift * 60})`}>
          <PenWord text="LÃI KÉP" f={f} at={612} dur={64} x={960} y={500} size={168} ls={16} />
          <Label x={960} y={566} text="compound interest" size={24} color={C.dim} anchor="middle" ls={6} italic o={prog(f, 676, 14)} />
        </g>
        <Stroke pts={CHAIN.pts} f={f} at={724} dur={92} w={2.2} ease={(t) => t} />
        {CHAIN.centers.map(([cx, cy, r], i) => (
          <Label key={i} x={cx} y={cy - r - 14} text={i === 0 ? 'vốn' : '+lãi'} size={18} color={C.dim} anchor="middle" o={prog(f, 736 + i * 14, 10)} />
        ))}
      </Svg>
    </AbsoluteFill>
  );
};

/* ---------------- S4 840–1200 发光圆角表：存钱 ---------------- */
const TB = {x: 300, y: 214, w: 720, h: 600, r: 46};
const FRAME_PTS = roundRectPts(TB.x, TB.y, TB.w, TB.h, TB.r);
const ROWS: {year: string; simple: string; comp: string; at: number}[] = [
  {year: '0', simple: '10,0', comp: '10,0', at: 892},
  {year: '9', simple: '17,2', comp: '20,0', at: 975},
  {year: '18', simple: '24,4', comp: '40,0', at: 1032},
  {year: '27', simple: '31,6', comp: '79,9', at: 1092},
];
const COLX = [410, 640, 890];
const rowY = (i: number) => 400 + i * 108;
const S4: React.FC<{f: number}> = ({f}) => {
  const cur = ROWS.reduce((k, r, i) => (f >= r.at ? i : k), -1);
  const hy = cur >= 0 ? rowY(cur) : rowY(0);
  const prevY = cur > 0 ? rowY(cur - 1) : hy;
  const mv = cur >= 0 ? eo(prog(f, ROWS[cur].at, 10)) : 0;
  const boxY = prevY + (hy - prevY) * mv;
  const lines = eo(prog(f, 884, 16));
  return (
    <AbsoluteFill style={pushOut(f, 1200)}>
      <Svg>
        <Stroke pts={FRAME_PTS} f={f} at={841} dur={46} w={2.6} />
        <Label x={TB.x + TB.w / 2} y={TB.y - 26} text="Gửi 10 triệu · lãi suất 8%/năm" size={24} color={C.label} anchor="middle" o={prog(f, 872, 12)} ls={1} />
        <Label x={TB.x + TB.w / 2} y={TB.y + TB.h + 44} text="đơn vị: triệu đồng" size={19} color={C.dim} anchor="middle" o={prog(f, 900, 12)} ls={1} />
        {/* 表格细线 */}
        <g stroke={C.gold} strokeWidth={1.2} opacity={0.7}>
          <path d={`M${TB.x + 26},320 L${TB.x + TB.w - 26},320`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - lines} />
          {[1, 2, 3].map((i) => (
            <path key={i} d={`M${TB.x + 26},${rowY(i) - 54} L${TB.x + TB.w - 26},${rowY(i) - 54}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - lines} opacity={0.45} />
          ))}
          <path d={`M520,${TB.y + 30} L520,${TB.y + TB.h - 30}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - lines} />
          <path d={`M770,${TB.y + 30} L770,${TB.y + TB.h - 30}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - lines} />
        </g>
        {['Năm', 'Lãi đơn', 'Lãi kép'].map((t, i) => (
          <Label key={t} x={COLX[i]} y={290} text={t} size={26} color={i === 2 ? C.mid : C.label} anchor="middle" o={prog(f, 888 + i * 3, 10)} ls={1} />
        ))}
        {cur >= 0 ? (
          <g opacity={0.9}>
            <rect x={TB.x + 18} y={boxY - 44} width={TB.w - 36} height={78} rx={18} fill="none" stroke={C.gold} strokeWidth={6} opacity={0.35} filter="url(#b10)" />
            <rect x={TB.x + 18} y={boxY - 44} width={TB.w - 36} height={78} rx={18} fill="rgba(255,190,110,0.05)" stroke={C.mid} strokeWidth={1.4} />
          </g>
        ) : null}
        {ROWS.map((r, i) => {
          const o = eo(prog(f, r.at, 8));
          if (o <= 0) return null;
          const hot = i === cur ? 1 - prog(f, r.at + 6, 30) * 0.4 : 0.6;
          const y = rowY(i) + 12;
          return (
            <g key={i} opacity={o}>
              <Label x={COLX[0]} y={y} text={r.year} size={38} color={C.white} anchor="middle" o={0.6 + hot * 0.4} />
              <Label x={COLX[1]} y={y} text={r.simple} size={38} color="#c9cbd6" anchor="middle" o={0.55 + hot * 0.4} />
              <Formula x={COLX[2]} y={y} size={40} anchor="middle" o={0.7 + hot * 0.3} color={i === 3 ? '#ffd9a0' : C.mid}>{r.comp}</Formula>
            </g>
          );
        })}
        {/* 右侧：公式 + 72 法则 + 读数 */}
        <Formula x={1160} y={340} size={54} o={prog(f, 904, 14)}>
          A = P(1 + r)<tspan dy={-24} fontSize={34}>n</tspan>
        </Formula>
        <Formula x={1160} y={480} size={46} color="#f1e6d2" o={prog(f, 968, 14)}>72 ÷ 8 ≈ 9</Formula>
        <Label x={1160} y={528} text="năm là tiền gấp đôi" size={24} color={C.label} o={prog(f, 978, 12)} ls={1} />
        {f >= 1094 ? (
          <g>
            <Label x={1160} y={636} text="LÃI KÉP · NĂM 27" size={18} color={C.label} ls={3} o={eo(prog(f, 1094, 8))} />
            <SevenSeg value={(10 * Math.pow(1.08, 27 * eo(prog(f, 1094, 30)))).toFixed(1).padStart(4, ' ')} x={1160} y={660} size={84} o={eo(prog(f, 1094, 8))} />
            <Label x={1160 + segWidth('79.9', 84) + 30} y={738} text="triệu" size={26} color={C.label} o={eo(prog(f, 1100, 10))} />
          </g>
        ) : null}
      </Svg>
    </AbsoluteFill>
  );
};

/* ---------------- S5 1200–1560 竖向时间轴：Bernoulli 与 e ---------------- */
const TLX = 620;
const yrY = (yr: number) => 140 + (yr - 1600) * 3.6;
const S5: React.FC<{f: number}> = ({f}) => {
  const year = Math.round(1600 + 83 * eo(prog(f, 1228, 34)));
  const rest = eio(prog(f, 1240, 26));
  const pen: P = [TLX, 930 + (yrY(1683) - 930) * rest];
  const fr = {x: 820, y: 420, w: 840, h: 390};
  const nRows: [string, string, number][] = [
    ['n = 1', '2', 1372],
    ['n = 12', '2,61304', 1396],
    ['n = 365', '2,71457', 1420],
  ];
  return (
    <AbsoluteFill style={pushOut(f, 1560)}>
      <Svg>
        <Stroke pts={[[TLX, -30], [TLX, 930]]} f={f} at={1200} dur={36} w={2.4} ease={eio} />
        {f >= 1236 && f < 1320 ? <PenHead p={pen} f={f} size={0.85} /> : null}
        {[1650, 1700].map((yr) => (
          <g key={yr} opacity={prog(f, 1222, 12)}>
            <line x1={TLX - 8} x2={TLX + 8} y1={yrY(yr)} y2={yrY(yr)} stroke="rgba(240,220,190,0.6)" strokeWidth={1.4} />
            <Label x={TLX + 22} y={yrY(yr) + 6} text={String(yr)} size={17} color={C.dim} />
          </g>
        ))}
        {(
          [
            [1614, 'John Napier · logarit', 1226, 0.62],
            [1683, 'Jacob Bernoulli · lãi kép', 1244, 1],
            [1748, 'Leonhard Euler', 1452, 0.75],
          ] as [number, string, number, number][]
        ).map(([yr, name, at, br]) => (
          <g key={yr} opacity={eo(prog(f, at, 12))}>
            <line x1={TLX - 22} x2={TLX + 22} y1={yrY(yr)} y2={yrY(yr)} stroke={C.mid} strokeWidth={2} />
            <Label x={TLX - 40} y={yrY(yr) + 8} text={`${yr}`} size={26} color={C.white} anchor="end" o={br} weight={400} />
            <Label x={TLX - 120} y={yrY(yr) + 8} text={name} size={24} color={C.label} anchor="end" o={br} />
          </g>
        ))}
        {f >= 1240 ? <GlowPath d={`M${TLX - 26},${yrY(1683)} L${TLX + 26},${yrY(1683)}`} w={2.4} o={eo(prog(f, 1240, 10))} /> : null}
        {/* 年份读数 */}
        <Readout x={820} y={250} f={f} at={1226} size={62} rows={[{label: 'NĂM', value: String(year)}]} />
        {/* 从 1683 拉出一笔，画出圆角框 */}
        <Stroke pts={smooth([[TLX + 26, yrY(1683)], [700, 440], [780, 424], [fr.x + 46, fr.y]], 10)} f={f} at={1318} dur={10} w={2.2} head={f < 1328} />
        <Stroke pts={roundRectPts(fr.x, fr.y, fr.w, fr.h, 40)} f={f} at={1326} dur={40} w={2.4} />
        <Formula x={fr.x + 50} y={fr.y + 84} size={50} o={prog(f, 1352, 14)}>
          (1 + 1/n)<tspan dy={-22} fontSize={32}>n</tspan>
        </Formula>
        <Label x={fr.x + 340} y={fr.y + 80} text="lãi 100%/năm, chia n lần nhập vốn" size={22} color={C.dim} o={prog(f, 1360, 12)} />
        {nRows.map(([n, v, at], i) => (
          <g key={n} opacity={eo(prog(f, at, 10))}>
            <Formula x={fr.x + 60} y={fr.y + 160 + i * 58} size={32} color="#e9e2d4">{n}</Formula>
            <Label x={fr.x + 330} y={fr.y + 160 + i * 58} text="→" size={30} color={C.dim} />
            <Label x={fr.x + 420} y={fr.y + 160 + i * 58} text={v} size={32} color={C.white} />
          </g>
        ))}
        <g opacity={eo(prog(f, 1446, 10))}>
          <Formula x={fr.x + 60} y={fr.y + 334} size={34}>n → ∞</Formula>
          <Label x={fr.x + 330} y={fr.y + 334} text="→" size={30} color={C.dim} />
          <Formula x={fr.x + 420} y={fr.y + 336} size={44}>e</Formula>
        </g>
        {f >= 1446 ? (
          <g>
            <Label x={1250} y={300} text="e ≈" size={30} color={C.label} italic o={eo(prog(f, 1446, 8))} />
            <SevenSeg value="2.71828" x={1320} y={256} size={62} o={eo(prog(f, 1446, 8)) * (f - 1446 < 8 ? (f % 2 ? 0.4 : 1) : 1)} />
          </g>
        ) : null}
      </Svg>
    </AbsoluteFill>
  );
};

/* ---------------- S6 1560–1920 高潮：曲线冲出图表 + 光丝爆炸 ---------------- */
const CF2: Cfg = {ox: 280, oy: 870, w: 1160, h: 510, xMax: 365, yMax: 30, xTicks: [60, 120, 180, 240, 300, 360], yTicks: [5, 10, 15, 20, 25, 30], yName: 'giá trị (lần)'};
const BURST = px(CF2, 365, ex(365));
const FIL = Array.from({length: 230}).map((_, i) => {
  const a = rand(i * 3 + 1) * Math.PI * 2;
  const L = 120 + Math.pow(rand(i * 3 + 2), 0.8) * 620;
  const bend = (rand(i * 7 + 5) - 0.5) * 0.35;
  const r = rand(i * 11 + 9);
  const col = r < 0.12 ? '#ff5a3c' : r < 0.2 ? '#a9bcff' : r < 0.55 ? '#fff3dc' : C.mid;
  return {a, L, bend, col, w: 0.45 + rand(i * 13) * 0.9, delay: rand(i * 17) * 5, dot: 1.2 + rand(i * 19) * 2.4};
});
const Burst: React.FC<{f: number}> = ({f}) => {
  if (f < OLD_CLIMAX) return null;
  const lf = f - OLD_CLIMAX;
  const fade = 1 - prog(lf, 80, 60) * 0.8;
  const lines: React.ReactNode[] = [], dots: React.ReactNode[] = [];
  FIL.forEach((fl, i) => {
    const t = clamp((lf - fl.delay) / 30);
    if (t <= 0) return;
    const ca = Math.cos(fl.a), sa = Math.sin(fl.a);
    const drift = Math.max(0, lf - fl.delay - 30) * 0.6;
    const hd = fl.L * eo(t) + drift;
    const td = hd * (0.15 + 0.75 * eo(t));
    const pt = (d: number): P => {
      const k = d / fl.L;
      return [BURST[0] + ca * d - sa * fl.L * fl.bend * k * k, BURST[1] + sa * d + ca * fl.L * fl.bend * k * k];
    };
    const h = pt(hd), tl = pt(td), m = pt((hd + td) / 2);
    if (t < 1) lines.push(<path key={i} d={`M${tl[0].toFixed(1)},${tl[1].toFixed(1)} Q${m[0].toFixed(1)},${m[1].toFixed(1)} ${h[0].toFixed(1)},${h[1].toFixed(1)}`} stroke={fl.col} strokeWidth={fl.w} opacity={1 - t * 0.6} fill="none" strokeLinecap="round" />);
    const tw = 0.55 + 0.45 * Math.sin(lf * 0.3 + i);
    dots.push(<circle key={'d' + i} cx={h[0]} cy={h[1]} r={fl.dot * (t < 1 ? 0.8 : 1)} fill={fl.col} opacity={tw} />);
  });
  const flash = 1 - prog(lf, 0, 10);
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={fade}>
      <g opacity={0.9} filter="url(#b4)">{dots}</g>
      <g opacity={0.9}>{lines}</g>
      <g>{dots}</g>
      <circle cx={BURST[0]} cy={BURST[1]} r={60 + flash * 240} fill="url(#halo)" opacity={0.35 + flash * 0.6} />
      <PenHead p={BURST} f={f} size={1.3 + flash * 1.8} o={1 - prog(lf, 20, 40) * 0.6} />
    </g>
  );
};
const S6: React.FC<{f: number}> = ({f}) => {
  const dl = 365 * eio(prog(f, 1574, 18));
  const de = 365 * prog(f, 1590, 86);
  const val = ex(de);
  const climax = f >= OLD_CLIMAX;
  const down = 365 * prog(f, 1806, 54);
  const big = f >= OLD_CLIMAX && f < 1820 ? eo(prog(f, OLD_CLIMAX, 6)) * (1 - prog(f, 1800, 16)) : 0;
  const zoom = 1 + 0.035 * eio(prog(f, 1590, 86));
  return (
    <AbsoluteFill style={pushOut(f, 1920)}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `${BURST[0]}px ${BURST[1] + 300}px`}}>
        <Svg>
          <Chart c={CF2} f={f} at={1562} />
          <Curve c={CF2} fn={lin} D={dl} f={f} color="#cfd3e6" w={1.6} head={false} o={0.55} />
          <Formula x={1250} y={768} size={26} color="#c9cbd6" o={prog(f, 1590, 12) * 0.6}>cộng thêm: 4,65</Formula>
          <Curve c={CF2} fn={ex} D={de} f={f} head={!climax && de < 365} o={f >= 1806 ? 0.55 : 1} />
          {down > 0 ? <Curve c={CF2} fn={(d) => Math.pow(0.99, d)} D={down} f={f} color={C.orange} w={2.2} head={down < 365} /> : null}
          <Formula x={1200} y={846} size={30} color="#ff9a76" o={prog(f, 1850, 12)}>
            y = 0,99<tspan dy={-14} fontSize={20}>x</tspan>
          </Formula>
          <Readout
            x={380}
            y={330}
            f={f}
            at={1580}
            rows={[
              {label: 'NGÀY', value: String(Math.round(f >= 1806 ? down || 365 : de)).padStart(3, ' ')},
              f >= 1806
                ? {label: 'GIÁ TRỊ', value: Math.pow(0.99, down).toFixed(3).padStart(5, ' '), color: C.orange}
                : {label: 'GIÁ TRỊ', value: val.toFixed(1).padStart(4, ' ')},
            ]}
          />
          {big > 0 ? (
            <g opacity={big}>
              <SevenSeg value="37.8" x={680} y={400} size={150} />
              <Label x={680 + segWidth('37.8', 150) + 36} y={540} text="lần" size={40} color={C.label} />
            </g>
          ) : null}
          <Burst f={f} />
        </Svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------- S7 1920–2220 结尾：重新定义 LÃI KÉP + 开放问题 ---------------- */
const END_CURVE = smooth([[-40, 880], [380, 820], [780, 720], [1150, 590], [1460, 470], [1720, 410], [1990, 372]], 20);
const S7: React.FC<{f: number}> = ({f}) => {
  const wordO = 1 - prog(f, 2100, 30) * 0.55;
  const marks: [number, string, number][] = [
    [0.2, 'tiền bạc', 2040],
    [0.4, 'thói quen', 2050],
    [0.58, 'kiến thức', 2060],
  ];
  return (
    <AbsoluteFill style={{opacity: 1 - prog(f, 2192, 26)}}>
      <Svg>
        <Stroke pts={END_CURVE} f={f} at={1922} dur={330} w={2.6} ease={(t) => t} headSize={1} />
        <PenWord text="LÃI KÉP" f={f} at={1930} dur={44} x={960} y={300} size={120} ls={12} o={wordO} />
        <Formula x={960} y={378} size={36} anchor="middle" color="#f1e6d2" o={prog(f, 1980, 14) * wordO}>= nhân lên theo thời gian</Formula>
        {marks.map(([t, txt, at]) => {
          const {head} = partial(END_CURVE, t);
          return (
            <g key={txt} opacity={eo(prog(f, at, 12))}>
              <circle cx={head[0]} cy={head[1]} r={5} fill={C.core} />
              <circle cx={head[0]} cy={head[1]} r={16} fill="url(#halo)" opacity={0.8} />
              <Label x={head[0] - 8} y={head[1] + 46} text={txt} size={24} color={C.label} anchor="middle" ls={1} />
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

/* ---------------- 合成 ---------------- */
export const Ep53Compound: React.FC = () => {
  const raw = useCurrentFrame();
  const freeze = raw >= CLIMAX - 3 && raw < CLIMAX;
  const f = freeze ? CLIMAX - 4 : raw;
  const dark = raw < CLIMAX ? (freeze ? 0.62 : clamp((raw - (CLIMAX - 24)) / 20) * 0.3) : 0;
  // 新时间轴 → 场景：S4 旧时间 = f − 120；S5–S7 旧时间 = f − 240
  const scene =
    f < 240 ? <S1 f={f} /> : f < 600 ? <S2 f={f} /> : f < 840 ? <S3 f={f} /> : f < 960 ? <SPerson f={f} /> : f < 1320 ? <S4 f={f - 120} /> : f < 1440 ? <S3D f={f} /> : f < 1800 ? <S5 f={f - 240} /> : f < 2160 ? <S6 f={f - 240} /> : <S7 f={f - 240} />;
  const ribbons: [number, P][] = [
    [240, [300, 840]],
    [600, [560, 400]],
    [1320, LAND3D],
    [1800, [280, 870]],
    [2160, [-20, 880]],
  ];
  const warm = f >= CLIMAX && f < CLIMAX + 120 ? 1.6 : f < 240 ? 1.35 : 1;
  const person = f >= 840 && f < 960;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      {person ? null : <Space f={f} warm={warm} />}
      {scene}
      <Svg>{ribbons.map(([end, land]) => <Ribbon key={end} f={f} end={end} land={land} />)}</Svg>
      <Sub f={raw} cues={CUES} />
      <AbsoluteFill style={{background: '#000', opacity: dark, pointerEvents: 'none'}} />
      {raw >= CLIMAX && raw < CLIMAX + 6 ? <AbsoluteFill style={{background: '#fff4e0', opacity: 0.45 * (1 - (raw - CLIMAX) / 6), mixBlendMode: 'screen'}} /> : null}
      <GrainVignette f={raw} />
      <Audio src={staticFile('audio/ep53-compound/bgm.wav')} />
    </AbsoluteFill>
  );
};

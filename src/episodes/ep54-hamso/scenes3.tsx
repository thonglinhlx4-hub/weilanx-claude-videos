// 场景 6–7：函数简史（竖向时间轴 + LED 年份 + 泥板数表 + 笛卡尔坐标 + function / f(x) / 定义）／ 一个输入一个输出。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, Formula, GlowPath, Label, P, PenHead, PenWord, SevenSeg, Stroke, Svg, clamp, eio, eo, partial, prog, pushOut, roundRectPts, smooth} from './fx';
import {Check, Cross, Fade, PenText} from './common';
import {L, L_BERNOULLI, L_FERMAT, SC} from './timing';

const TLX = 190;
// v2：7 个节点（加 Fermat 1636、Johann Bernoulli 1718），按年份排；LED 年份逐级跳
const MARKS: {y: number; year: string; name: string; at: number; led: string; bc?: boolean}[] = [
  {y: 150, year: '~1800 TCN', name: 'Babylon', at: L(21), led: '1800', bc: true},
  {y: 280, year: '1636', name: 'Fermat', at: L(L_FERMAT), led: '1636'},
  {y: 410, year: '1637', name: 'Descartes', at: L(24), led: '1637'},
  {y: 540, year: '1673', name: 'Leibniz', at: L(26), led: '1673'},
  {y: 670, year: '1718', name: 'Joh. Bernoulli', at: L(L_BERNOULLI), led: '1718'},
  {y: 800, year: '1734', name: 'Euler', at: L(27), led: '1734'},
  {y: 930, year: '1837', name: 'Dirichlet', at: L(28), led: '1837'},
];
/** 当前面板：0 泥板 1 Fermat 2 坐标 3 function 4 Bernoulli 5 f(x) 6 定义 */
const panelAt = (f: number) => MARKS.reduce((k, m, i) => (f >= m.at - 6 ? i : k), -1);
const pOp = (f: number, i: number) => {
  const m = MARKS[i];
  const nx = MARKS[i + 1];
  const inn = eo(prog(f, m.at - 6, 12));
  const out = nx ? 1 - prog(f, nx.at - 12, 8) : 1;
  return Math.max(0, Math.min(inn, out));
};

/* 楔形数字（示意）：竖楔 = 1，角楔 = 10 */
const Wedge: React.FC<{x: number; y: number; s?: number; o?: number}> = ({x, y, s = 1, o = 1}) => (
  <path d={`M${x - 7 * s},${y} L${x + 7 * s},${y} L${x},${y + 8 * s} Z M${x},${y + 6 * s} L${x},${y + 30 * s}`} stroke="#ffd9a0" strokeWidth={2.2 * s} fill="#ffd9a0" opacity={o} />
);
const Corner: React.FC<{x: number; y: number; s?: number; o?: number}> = ({x, y, s = 1, o = 1}) => (
  <path d={`M${x + 12 * s},${y} L${x - 10 * s},${y + 14 * s} L${x + 12 * s},${y + 28 * s}`} stroke="#ffd9a0" strokeWidth={2.4 * s} fill="none" opacity={o} />
);
const Cune: React.FC<{n: number; x: number; y: number; o?: number}> = ({n, x, y, o = 1}) => {
  const tens = Math.floor(n / 10), ones = n % 10;
  const out: React.ReactNode[] = [];
  let cx = x;
  for (let i = 0; i < tens; i++) { out.push(<Corner key={'t' + i} x={cx} y={y} o={o} />); cx += 22; }
  for (let i = 0; i < ones; i++) {
    const row = ones > 4 && i >= Math.ceil(ones / 2) ? 1 : 0;
    const col = row ? i - Math.ceil(ones / 2) : i;
    out.push(<Wedge key={'o' + i} x={cx + col * 16} y={y + (ones > 4 ? row * 18 - 6 : 0)} s={ones > 4 ? 0.62 : 0.9} o={o} />);
  }
  return <g>{out}</g>;
};

const TAB = {x: 700, y: 210, w: 520, h: 660};
const SQ = [1, 2, 3, 4, 5, 6, 7];
const ClayPanel: React.FC<{f: number}> = ({f}) => {
  const rowAt = (i: number) => L(22) + 10 + i * 8;
  const hi = f >= L(23) + 10;
  const hy = TAB.y + 120 + 2 * 74;
  return (
    <g>
      <defs><radialGradient id="clay" cx="0.45" cy="0.4" r="0.8"><stop offset="0" stopColor="#6a4c33" stopOpacity="0.55" /><stop offset="1" stopColor="#2a1c12" stopOpacity="0.35" /></radialGradient></defs>
      <rect x={TAB.x} y={TAB.y} width={TAB.w} height={TAB.h} rx={60} fill="url(#clay)" opacity={eo(prog(f, L(21) + 30, 20))} />
      <Stroke pts={roundRectPts(TAB.x, TAB.y, TAB.w, TAB.h, 60)} f={f} at={L(21) - 4} dur={36} w={2.6} />
      <Label x={TAB.x + TAB.w / 2} y={TAB.y - 26} text="Khoảng 1800 TCN · bảng số Babylon (minh hoạ)" size={21} color={C.label} anchor="middle" o={prog(f, L(21) + 26, 12)} />
      <g opacity={eo(prog(f, L(21) + 36, 14))} stroke={C.gold} strokeWidth={1.2}>
        <line x1={TAB.x + TAB.w / 2} x2={TAB.x + TAB.w / 2} y1={TAB.y + 40} y2={TAB.y + TAB.h - 40} opacity={0.7} />
        <line x1={TAB.x + 30} x2={TAB.x + TAB.w - 30} y1={TAB.y + 96} y2={TAB.y + 96} opacity={0.7} />
      </g>
      {SQ.map((n, i) => (
        <g key={n} opacity={eo(prog(f, rowAt(i), 8))}>
          <Cune n={n} x={TAB.x + 70} y={TAB.y + 116 + i * 74} />
          <Cune n={n * n} x={TAB.x + TAB.w / 2 + 50} y={TAB.y + 116 + i * 74} />
        </g>
      ))}
      {hi ? (
        <g opacity={eo(prog(f, L(23) + 10, 10))}>
          <rect x={TAB.x + 20} y={hy - 14} width={TAB.w - 40} height={60} rx={14} fill="rgba(255,190,110,0.06)" stroke={C.mid} strokeWidth={1.6} />
          <rect x={TAB.x + 20} y={hy - 14} width={TAB.w - 40} height={60} rx={14} fill="none" stroke={C.gold} strokeWidth={6} opacity={0.3} filter="url(#b10)" />
        </g>
      ) : null}
      {/* 右侧阿拉伯数字对照 */}
      <Label x={1340} y={TAB.y + 70} text="đầu vào" size={22} color={C.label} anchor="middle" o={prog(f, L(23), 10)} />
      <Label x={1600} y={TAB.y + 70} text="đầu ra" size={22} color={C.label} anchor="middle" o={prog(f, L(23), 10)} />
      <Label x={1340} y={TAB.y + 70} text="số" size={22} color={C.label} anchor="middle" o={prog(f, L(22) + 10, 10) * (1 - prog(f, L(23), 6))} />
      <Label x={1600} y={TAB.y + 70} text="bình phương" size={22} color={C.label} anchor="middle" o={prog(f, L(22) + 10, 10) * (1 - prog(f, L(23), 6))} />
      {SQ.map((n, i) => (
        <g key={'r' + n} opacity={eo(prog(f, rowAt(i) + 6, 8)) * (hi && i !== 2 ? 0.45 : 1)}>
          <Label x={1340} y={TAB.y + 142 + i * 74} text={String(n)} size={32} color={C.white} anchor="middle" />
          <Label x={1470} y={TAB.y + 142 + i * 74} text="↦" size={30} color={C.dim} anchor="middle" />
          <Label x={1600} y={TAB.y + 142 + i * 74} text={String(n * n)} size={32} color={i === 2 && hi ? C.mid : C.white} anchor="middle" />
        </g>
      ))}
    </g>
  );
};

const AX = {ox: 820, oy: 830, w: 820, h: 560};
const DPx = (x: number, y: number): P => [AX.ox + (x / 7.5) * AX.w, AX.oy - (y / 52) * AX.h];
const PARAB: P[] = Array.from({length: 73}, (_, i) => DPx(i / 10, (i / 10) ** 2));
const CoordPanel: React.FC<{f: number}> = ({f}) => {
  const a = L(24);
  const curve = eo(prog(f, L(25) + 20, 50));
  const {d, head} = partial(PARAB, curve);
  return (
    <g>
      <Stroke pts={[[AX.ox - 30, AX.oy], [AX.ox + AX.w + 60, AX.oy]]} f={f} at={a} dur={16} w={1.4} color="#cfd3e6" core="#ffffff" head={false} />
      <Stroke pts={[[AX.ox, AX.oy + 30], [AX.ox, AX.oy - AX.h - 50]]} f={f} at={a + 6} dur={16} w={1.4} color="#cfd3e6" core="#ffffff" head={false} />
      <Label x={AX.ox + AX.w + 70} y={AX.oy + 8} text="x" size={26} color={C.label} italic o={prog(f, a + 16, 10)} />
      <Label x={AX.ox - 10} y={AX.oy - AX.h - 64} text="y" size={26} color={C.label} italic o={prog(f, a + 16, 10)} />
      {SQ.map((n, i) => {
        const p = DPx(n, n * n);
        return (
          <Fade key={n} f={f} at={L(25) - 10 + i * 5} d={8}>
            <circle cx={p[0]} cy={p[1]} r={5} fill={C.core} />
            <circle cx={p[0]} cy={p[1]} r={18} fill="url(#halo)" opacity={0.6} />
            <Label x={p[0] - 14} y={p[1] - 16} text={`(${n}, ${n * n})`} size={16} color={C.dim} anchor="end" />
          </Fade>
        );
      })}
      {curve > 0 ? <GlowPath d={d} w={2.2} /> : null}
      {curve > 0 && curve < 1 ? <PenHead p={head} f={f} size={0.85} /> : null}
      <Fade f={f} at={L(24) + 30}><Label x={AX.ox + 40} y={AX.oy - AX.h - 30} text="Descartes · hệ trục tọa độ" size={24} color={C.label} /></Fade>
      <Fade f={f} at={L(25) + 60}><Formula x={1380} y={380} size={44}>y = x²</Formula></Fade>
    </g>
  );
};

/* Fermat：方程 ↔ 曲线（双曲线 xy = 6） */
const FX = {ox: 860, oy: 840, w: 720, h: 520};
const FPx = (x: number, y: number): P => [FX.ox + (x / 7) * FX.w, FX.oy - (y / 7) * FX.h];
const HYP: P[] = Array.from({length: 61}, (_, i) => { const x = 0.9 + (i / 60) * 5.9; return FPx(x, 6 / x); });
const FermatPanel: React.FC<{f: number}> = ({f}) => {
  const a = L(L_FERMAT);
  return (
    <g>
      <Stroke pts={[[FX.ox - 30, FX.oy], [FX.ox + FX.w + 50, FX.oy]]} f={f} at={a} dur={14} w={1.3} color="#cfd3e6" core="#ffffff" head={false} />
      <Stroke pts={[[FX.ox, FX.oy + 30], [FX.ox, FX.oy - FX.h - 40]]} f={f} at={a + 5} dur={14} w={1.3} color="#cfd3e6" core="#ffffff" head={false} />
      <PenText text="xy = 6" f={f} at={a + 18} dur={30} x={1240} y={420} size={110} anchor="middle" />
      <Stroke pts={HYP} f={f} at={a + 56} dur={50} w={2.4} />
      {[1, 2, 3, 6].map((x, i) => {
        const p = FPx(x, 6 / x);
        return (
          <Fade key={x} f={f} at={a + 70 + i * 10} d={8}>
            <circle cx={p[0]} cy={p[1]} r={5} fill={C.core} />
            <circle cx={p[0]} cy={p[1]} r={18} fill="url(#halo)" opacity={0.6} />
            <Label x={p[0] + 16} y={p[1] - 14} text={`(${x}, ${6 / x})`} size={16} color={C.dim} />
          </Fade>
        );
      })}
      <Fade f={f} at={a + 40}><Label x={1240} y={480} text="Fermat · phương trình  ↔  đường cong" size={24} color={C.label} anchor="middle" /></Fade>
    </g>
  );
};

/* Johann Bernoulli：第一个成文的定义 */
const BernoulliPanel: React.FC<{f: number}> = ({f}) => {
  const a = L(L_BERNOULLI);
  return (
    <g>
      <Stroke pts={roundRectPts(740, 300, 840, 420, 40)} f={f} at={a + 2} dur={34} w={2.4} />
      <Fade f={f} at={a + 24}><Label x={1160} y={370} text="Johann Bernoulli · 1718 · định nghĩa đầu tiên" size={24} color={C.dim} anchor="middle" ls={1} /></Fade>
      <Fade f={f} at={a + 70}><Label x={1160} y={450} text="hàm số = một đại lượng" size={40} color={C.white} anchor="middle" /></Fade>
      <Fade f={f} at={a + 92}><Label x={1160} y={505} text="tạo nên từ biến số x" size={40} color={C.white} anchor="middle" /></Fade>
      <PenText text="x² + 3x" f={f} at={a + 112} dur={36} x={1160} y={650} size={100} anchor="middle" />
    </g>
  );
};

export const SHistory: React.FC<{f: number}> = ({f}) => {
  const a = SC.history, end = SC.rule;
  const cur = panelAt(f);
  const target = cur >= 0 ? MARKS[cur].y : 120;
  const prevY = cur > 0 ? MARKS[cur - 1].y : 60;
  const mv = cur >= 0 ? eio(prog(f, MARKS[cur].at - 6, 18)) : eio(prog(f, a + 10, 20));
  const penY = cur >= 0 ? prevY + (target - prevY) * mv : 60 * mv;
  // LED 年份：跳到当前标记，前 10 帧滚动
  let led = '----';
  if (cur >= 0) {
    const m = MARKS[cur];
    const from = cur > 0 ? Number(MARKS[cur - 1].led) * (MARKS[cur - 1].bc ? -1 : 1) : -1800;
    const to = Number(m.led) * (m.bc ? -1 : 1);
    const v = Math.round(from + (to - from) * eo(prog(f, m.at - 6, 16)));
    led = String(Math.abs(v)).padStart(4, ' ');
  }
  const isBC = cur === 0 || (cur === 1 && prog(f, MARKS[1].at - 6, 16) < 0.6);
  return (
    <AbsoluteFill style={pushOut(f, end)}>
      <Svg>
        <Stroke pts={[[TLX, -30], [TLX, 1000]]} f={f} at={a} dur={30} w={2.2} ease={eio} head={false} />
        <PenHead p={[TLX, Math.max(20, penY)]} f={f} size={0.8} o={eo(prog(f, a + 6, 10))} />
        {MARKS.map((m, i) => (
          <g key={m.year} opacity={eo(prog(f, m.at - 4, 10)) * (cur === i ? 1 : 0.55)}>
            <line x1={TLX - 20} x2={TLX + 20} y1={m.y} y2={m.y} stroke={C.mid} strokeWidth={2} />
            <Label x={TLX - 36} y={m.y + 8} text={m.year} size={24} color={C.white} anchor="end" />
            <Label x={TLX + 36} y={m.y + 8} text={m.name} size={22} color={C.label} />
          </g>
        ))}
        {/* 开场问题 */}
        <Fade f={f} at={a + 8}>
          <g opacity={1 - prog(f, L(21) - 10, 10)}>
            <PenText text="f(x)" f={f} at={a + 8} dur={26} x={1100} y={560} size={200} anchor="middle" />
            <Label x={1100} y={650} text="từ đâu mà ra?" size={34} color={C.label} anchor="middle" italic />
          </g>
        </Fade>
        {/* LED 年份 */}
        <g opacity={eo(prog(f, L(21) - 6, 8))}>
          <Label x={1500} y={118} text={isBC ? 'NĂM (TCN)' : 'NĂM'} size={18} color={C.label} ls={3} />
          <SevenSeg value={led} x={1500} y={130} size={64} />
        </g>
        <g opacity={pOp(f, 0)}>{cur === 0 ? <ClayPanel f={f} /> : null}</g>
        <g opacity={pOp(f, 1)}>{cur === 1 ? <FermatPanel f={f} /> : null}</g>
        <g opacity={pOp(f, 2)}>{cur === 2 ? <CoordPanel f={f} /> : null}</g>
        <g opacity={pOp(f, 3)}>
          {cur === 3 ? (
            <g>
              <PenWord text="function" f={f} at={L(26) + 4} dur={50} x={1150} y={560} size={150} ls={4} widths={[0.38, 0.62, 0.62, 0.5, 0.36, 0.34, 0.6, 0.62]} />
              <Fade f={f} at={L(26) + 56}><Label x={1150} y={640} text="Leibniz · dùng chữ “function” (hàm)" size={26} color={C.label} anchor="middle" /></Fade>
            </g>
          ) : null}
        </g>
        <g opacity={pOp(f, 4)}>{cur === 4 ? <BernoulliPanel f={f} /> : null}</g>
        <g opacity={pOp(f, 5)}>
          {cur === 5 ? (
            <g>
              <PenText text="f(x)" f={f} at={L(27) + 4} dur={30} x={1150} y={580} size={240} anchor="middle" />
              <Fade f={f} at={L(27) + 40}><Label x={1150} y={680} text="Euler · ký hiệu f(x)" size={26} color={C.label} anchor="middle" /></Fade>
            </g>
          ) : null}
        </g>
        <g opacity={pOp(f, 6)}>
          {cur === 6 ? (
            <g>
              <Stroke pts={roundRectPts(760, 360, 780, 300, 40)} f={f} at={L(28)} dur={34} w={2.4} />
              <Fade f={f} at={L(28) + 26}><Label x={1150} y={430} text="Dirichlet · định nghĩa hiện đại" size={24} color={C.dim} anchor="middle" ls={1} /></Fade>
              <Fade f={f} at={L(28) + 50}><Formula x={1150} y={540} size={56} anchor="middle">mỗi x  →  đúng một y</Formula></Fade>
            </g>
          ) : null}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

/* ---------- S7 规则：波浪线是函数，圆不是 ---------- */
const WAVE: P[] = smooth([[150, 640], [300, 520], [430, 470], [560, 560], [690, 640], [820, 520], [950, 470]], 16);
const CIRC = {cx: 1430, cy: 560, r: 170};
export const SRule: React.FC<{f: number}> = ({f}) => {
  const a = SC.rule, end = SC.multi;
  const circPts: P[] = Array.from({length: 81}, (_, i) => { const t = -Math.PI / 2 + (i / 80) * Math.PI * 2; return [CIRC.cx + Math.cos(t) * CIRC.r, CIRC.cy + Math.sin(t) * CIRC.r] as P; });
  const scan = 160 + 780 * eio(prog(f, L(30), 40));
  // 波浪与竖线交点
  let hit: P | null = null;
  for (let i = 1; i < WAVE.length; i++) if ((WAVE[i - 1][0] - scan) * (WAVE[i][0] - scan) <= 0) { const t = (scan - WAVE[i - 1][0]) / (WAVE[i][0] - WAVE[i - 1][0] || 1); hit = [scan, WAVE[i - 1][1] + t * (WAVE[i][1] - WAVE[i - 1][1])]; break; }
  const vx = CIRC.cx + 90;
  const dy = Math.sqrt(CIRC.r ** 2 - 90 ** 2);
  const vl = eo(prog(f, L(31) + 20, 14));
  return (
    <AbsoluteFill style={pushOut(f, end)}>
      <Svg>
        <line x1={110} x2={1800} y1={800} y2={800} stroke="rgba(225,228,255,0.6)" strokeWidth={1.4} opacity={eo(prog(f, a, 16))} />
        <Label x={1810} y={830} text="x (đầu vào)" size={18} color={C.dim} anchor="end" o={prog(f, a + 10, 10)} />
        <Fade f={f} at={a + 6}><Formula x={960} y={200} size={46} anchor="middle">1 đầu vào  →  1 đầu ra</Formula></Fade>
        <Stroke pts={WAVE} f={f} at={a + 10} dur={46} w={2.4} />
        {f >= L(30) && hit ? (
          <g>
            <line x1={scan} x2={scan} y1={360} y2={800} stroke={C.blue} strokeWidth={1.4} strokeDasharray="6 6" opacity={0.8} />
            <circle cx={hit[0]} cy={hit[1]} r={7} fill={C.core} />
            <circle cx={hit[0]} cy={hit[1]} r={20} fill="url(#halo)" opacity={0.7} />
            <circle cx={scan} cy={800} r={5} fill={C.green} />
          </g>
        ) : null}
        <Check x={520} y={330} f={f} at={L(30) + 30} />
        <Fade f={f} at={L(30) + 34}><Label x={570} y={340} text="là hàm số" size={28} color={C.green} /></Fade>
        <Stroke pts={circPts} f={f} at={L(31)} dur={22} w={2.4} color={C.red} core="#ffd2c6" />
        {vl > 0 ? (
          <g>
            <line x1={vx} x2={vx} y1={360} y2={360 + (800 - 360) * vl} stroke={C.blue} strokeWidth={1.4} strokeDasharray="6 6" opacity={0.85} />
            {vl >= 1 ? (
              <g>
                {[CIRC.cy - dy, CIRC.cy + dy].map((y) => (
                  <g key={y}><circle cx={vx} cy={y} r={7} fill="#fff" /><circle cx={vx} cy={y} r={20} fill="url(#halo)" opacity={0.7} /></g>
                ))}
                <Label x={vx + 22} y={CIRC.cy + 6} text="2 đầu ra" size={22} color="#ff9a76" />
              </g>
            ) : null}
          </g>
        ) : null}
        <Cross x={1380} y={320} f={f} at={L(31) + 40} />
        <Fade f={f} at={L(31) + 44}><Label x={1420} y={330} text="không phải hàm số" size={28} color="#ff8a70" /></Fade>
      </Svg>
    </AbsoluteFill>
  );
};
export const _unused = clamp;

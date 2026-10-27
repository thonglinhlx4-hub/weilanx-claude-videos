// 场景 8–12：上学路（多元函数）／ 回到开头 ／ 一次分数只是一个点 ／ 收尾 ／ 高潮：一点炸成万千光丝。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, Formula, GlowPath, Label, P, PenHead, SevenSeg, Stroke, Svg, clamp, eio, eo, partial, prog, pushOut, rand, roundRectPts, smooth} from './fx';
import {Fade, PenText, Veggie} from './common';
import {HookInk} from './hook54';
import {CLIMAX, L, SC} from './timing';

/* ---------- S8 上学路：T = f(mưa, kẹt xe, giờ đi) ---------- */
const ROAD = smooth([[220, 620], [480, 560], [760, 650], [1040, 560], [1320, 640], [1640, 560]], 18);
const House: React.FC<{x: number; y: number; f: number; at: number}> = ({x, y, f, at}) => (
  <Stroke pts={[[x - 40, y + 30], [x - 40, y - 10], [x, y - 44], [x + 40, y - 10], [x + 40, y + 30], [x - 40, y + 30]]} f={f} at={at} dur={16} w={2} />
);
const School: React.FC<{x: number; y: number; f: number; at: number}> = ({x, y, f, at}) => (
  <g>
    <Stroke pts={[[x - 56, y + 30], [x - 56, y - 20], [x + 56, y - 20], [x + 56, y + 30], [x - 56, y + 30]]} f={f} at={at} dur={16} w={2} />
    <Stroke pts={[[x, y - 20], [x, y - 70], [x + 30, y - 60], [x, y - 50]]} f={f} at={at + 10} dur={10} w={1.6} head={false} />
  </g>
);
export const SMulti: React.FC<{f: number}> = ({f}) => {
  const a = SC.multi, end = SC.back;
  const rain = prog(f, L(34), 10);
  const jam = prog(f, L(34) + 40, 10);
  const early = prog(f, L(35), 10);
  // 分钟数：25 → 35（mưa）→ 50（kẹt xe）→ 早出门：30
  const mins = f < L(34) ? 25 : f < L(34) + 40 ? 25 + 10 * eo(prog(f, L(34), 20)) : f < L(35) ? 35 + 15 * eo(prog(f, L(34) + 40, 20)) : 50 - 20 * eo(prog(f, L(35) + 10, 30));
  const trip = (f - L(33)) / 70;
  const riderT = clamp(trip - Math.floor(Math.max(0, trip)));
  const {head: rider} = partial(ROAD, riderT);
  return (
    <AbsoluteFill style={pushOut(f, end)}>
      <Svg>
        <Fade f={f} at={a + 4}><Label x={960} y={150} text="hàm số ở khắp nơi" size={26} color={C.dim} anchor="middle" ls={6} /></Fade>
        <House x={170} y={600} f={f} at={a + 10} />
        <School x={1720} y={560} f={f} at={a + 30} />
        <Label x={170} y={680} text="nhà" size={20} color={C.label} anchor="middle" o={prog(f, a + 26, 10)} />
        <Label x={1720} y={640} text="trường" size={20} color={C.label} anchor="middle" o={prog(f, a + 46, 10)} />
        <Stroke pts={ROAD} f={f} at={a + 16} dur={40} w={2.4} />
        {f >= L(33) ? <g><circle cx={rider[0]} cy={rider[1]} r={8} fill={C.core} /><circle cx={rider[0]} cy={rider[1]} r={26} fill="url(#halo)" opacity={0.8} /></g> : null}
        {/* 雨 */}
        {rain > 0 ? (
          <g opacity={rain * 0.75} stroke={C.blue} strokeWidth={1.4}>
            {Array.from({length: 70}).map((_, i) => {
              const x = 240 + rand(i) * 1400;
              const y = 200 + (((rand(i + 9) * 400 + f * 9) % 400));
              return <line key={i} x1={x} x2={x - 6} y1={y} y2={y + 18} />;
            })}
          </g>
        ) : null}
        {/* 堵车：红点 */}
        {jam > 0 ? (
          <g opacity={jam}>
            {Array.from({length: 16}).map((_, i) => {
              const {head} = partial(ROAD, 0.42 + i * 0.012);
              return <circle key={i} cx={head[0]} cy={head[1] - 12} r={5} fill={C.red} opacity={0.85} filter="url(#b1)" />;
            })}
          </g>
        ) : null}
        <Fade f={f} at={L(34) + 4}><Label x={600} y={470} text="trời mưa  +10 phút" size={24} color={C.blue} /></Fade>
        <Fade f={f} at={L(34) + 44}><Label x={980} y={500} text="kẹt xe  +15 phút" size={24} color="#ff8a70" /></Fade>
        <Fade f={f} at={L(35) + 6}><Label x={260} y={500} text="đi sớm 10 phút" size={24} color={C.green} /></Fade>
        <Fade f={f} at={L(35) + 30}><Label x={1440} y={460} text="tới sớm 20 phút" size={24} color={C.green} /></Fade>
        {/* LED */}
        <g opacity={eo(prog(f, L(33), 8))}>
          <Label x={1380} y={250} text="THỜI GIAN ĐI HỌC" size={17} color={C.label} ls={2} />
          <SevenSeg value={String(Math.round(mins)).padStart(2, ' ')} x={1440} y={270} size={70} color={early > 0.5 && f >= L(35) + 10 ? C.green : C.red} />
          <Label x={1560} y={334} text="phút" size={20} color={C.dim} />
        </g>
        {/* 公式框 */}
        <Stroke pts={roundRectPts(470, 700, 980, 130, 34)} f={f} at={L(36) - 4} dur={26} w={2.4} />
        <Fade f={f} at={L(36) + 14}>
          <Formula x={960} y={780} size={44} anchor="middle">T = f(mưa, kẹt xe, giờ đi)</Formula>
        </Fade>
        <Fade f={f} at={L(36) + 50}>
          <Label x={960} y={890} text="HÀM NHIỀU BIẾN" size={26} color="#ff9a76" anchor="middle" ls={8} />
        </Fade>
        <Fade f={f} at={L(33) + 10}>
          <g opacity={1 - prog(f, L(34), 10)}>
            <Formula x={960} y={780} size={44} anchor="middle">T = 25 phút ?</Formula>
          </g>
        </Fade>
      </Svg>
    </AbsoluteFill>
  );
};

/* ---------- S9 回到开头：不是为了算菜钱，而是看「谁跟着谁变」 ---------- */
const LINK = smooth([[620, 640], [800, 520], [1000, 700], [1210, 560]], 16);
export const SBack: React.FC<{f: number}> = ({f}) => {
  const a = SC.back, end = SC.curve;
  const strike = eo(prog(f, L(38) + 30, 12));
  const fade1 = 1 - prog(f, L(39) - 6, 12);
  const xv = 0.5 + 0.4 * Math.sin((f - L(39)) / 16);
  const sl0 = 320, sl1 = 620, sx = sl0 + (sl1 - sl0) * xv;
  const barH = 60 + 220 * (0.3 + 0.7 * xv * xv);
  const on = eo(prog(f, L(39), 12));
  return (
    <AbsoluteFill style={pushOut(f, end)}>
      <Svg>
        <g opacity={fade1}>
          {/* v2：重写一遍开头的手写霓虹公式（同一组贝塞尔笔画，2.2 倍速） */}
          <g transform={`translate(${900 - 660 * 0.42},${470 - 590 * 0.42}) scale(0.42)`}><HookInk lf={Math.max(0, (f - a - 4) * 2.2)} scale={1.3} /></g>
          {strike > 0 ? <GlowPath d={`M560,${460 + 6} L${560 + 700 * strike},${440}`} color={C.red} core="#ffd2c6" w={2.4} /> : null}
          <Fade f={f} at={L(38) + 40}><Label x={960} y={640} text="không phải để tính tiền rau" size={30} color="#ff9a76" anchor="middle" /></Fade>
        </g>
        {on > 0 ? (
          <g opacity={on}>
            <line x1={sl0} x2={sl1} y1={640} y2={640} stroke="rgba(225,228,255,0.6)" strokeWidth={2} />
            <circle cx={sx} cy={640} r={12} fill={C.core} />
            <circle cx={sx} cy={640} r={32} fill="url(#halo)" opacity={0.8} />
            <Label x={(sl0 + sl1) / 2} y={700} text="cái gì đang thay đổi?" size={26} color={C.label} anchor="middle" italic />
            <Formula x={(sl0 + sl1) / 2} y={590} size={40} anchor="middle">x</Formula>
            <GlowPath d={'M' + LINK.map((p) => p.join(',')).join('L')} w={1.6} o={0.8} />
            <PenHead p={partial(LINK, (f / 40) % 1).head} f={f} size={0.6} />
            <rect x={1260} y={760 - barH} width={90} height={barH} rx={10} fill="rgba(255,190,110,0.12)" stroke={C.mid} strokeWidth={2} />
            <rect x={1260} y={760 - barH} width={90} height={barH} rx={10} fill="none" stroke={C.gold} strokeWidth={8} opacity={0.3} filter="url(#b10)" />
            <Formula x={1305} y={740 - barH} size={40} anchor="middle">y</Formula>
            <Label x={1305} y={810} text="nó kéo theo cái gì?" size={26} color={C.label} anchor="middle" italic />
          </g>
        ) : null}
      </Svg>
    </AbsoluteFill>
  );
};

/* ---------- S10 一次分数只是一个点：退远看见整条上升曲线 ---------- */
const SCORES = [5, 4, 6, 5.5, 7, 6.5, 8, 8.5];
const SPT = (i: number): P => [300 + i * 190, 820 - SCORES[i] * 68];
const SCURVE = smooth(SCORES.map((_, i) => SPT(i)), 14);
export const SCurve: React.FC<{f: number}> = ({f}) => {
  const a = SC.curve, end = SC.end;
  const zoom = 1 + 1.4 * (1 - eio(prog(f, L(41), 30)));
  const focus = SPT(1);
  const c = eo(prog(f, L(41) + 10, 50));
  const {d, head} = partial(SCURVE, c);
  const inputs: [string, number][] = [['đọc sách', 0.3], ['làm bài', 0.55], ['ngủ đủ', 0.8]];
  return (
    <AbsoluteFill style={pushOut(f, end)}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `${focus[0]}px ${focus[1]}px`}}>
        <Svg>
          {c > 0 ? <GlowPath d={d} w={2.4} /> : null}
          {c > 0 && c < 1 ? <PenHead p={head} f={f} /> : null}
          {SCORES.map((s, i) => {
            const p = SPT(i);
            const o = i === 1 ? eo(prog(f, a + 6, 10)) : eo(prog(f, L(41) + 10 + i * 6, 8));
            return (
              <g key={i} opacity={o}>
                <circle cx={p[0]} cy={p[1]} r={i === 1 ? 8 : 5} fill={i === 1 ? '#ffb3a0' : C.core} />
                <circle cx={p[0]} cy={p[1]} r={i === 1 ? 30 : 16} fill="url(#halo)" opacity={0.7} />
                {i > 1 || f >= L(41) + 20 ? <Label x={p[0]} y={p[1] - 22} text={String(s).replace('.', ',')} size={18} color={C.dim} anchor="middle" /> : null}
              </g>
            );
          })}
          <line x1={240} x2={1700} y1={850} y2={850} stroke="rgba(225,228,255,0.5)" strokeWidth={1.2} opacity={eo(prog(f, L(41), 20))} />
          <Label x={1700} y={884} text="thời gian" size={18} color={C.dim} anchor="end" o={eo(prog(f, L(41) + 20, 10))} />
        </Svg>
      </AbsoluteFill>
      <Svg>
        <g opacity={eo(prog(f, a + 10, 8)) * (1 - prog(f, L(41) + 10, 10))}>
          <Label x={1180} y={420} text="BÀI KIỂM TRA" size={18} color={C.label} ls={3} />
          <SevenSeg value="4.0" x={1180} y={440} size={96} />
          <Label x={1180} y={590} text="chỉ là một điểm" size={26} color={C.label} italic />
        </g>
        <Fade f={f} at={L(41) + 60}>
          <Formula x={1500} y={260} size={42} anchor="middle">xu hướng: đi lên ↗</Formula>
        </Fade>
        {inputs.map(([t, u], i) => (
          <Fade key={t} f={f} at={L(42) + 10 + i * 12}>
            <Label x={300 + u * 1330} y={960} text={t} size={22} color={C.mid} anchor="middle" />
            <line x1={300 + u * 1330} x2={300 + u * 1330} y1={930} y2={870} stroke={C.gold} strokeWidth={1} strokeDasharray="4 5" opacity={0.6} />
          </Fade>
        ))}
      </Svg>
    </AbsoluteFill>
  );
};

/* ---------- S11 收尾：f(cuộc đời) = ? → đổi đầu vào ---------- */
export const SEnd: React.FC<{f: number}> = ({f}) => {
  const a = SC.end;
  const curve = smooth([[-40, 860], [400, 780], [800, 820], [1200, 660], [1560, 600], [1980, 520]], 18);
  return (
    <AbsoluteFill>
      <Svg>
        <Stroke pts={curve} f={f} at={a} dur={CLIMAX - a - 30} w={2.2} ease={(t) => t} />
        <PenText text="f(cuộc đời) = ?" f={f} at={a + 6} dur={40} x={960} y={420} size={110} anchor="middle" o={1 - prog(f, L(44) - 6, 10) * 0.7} />
        <Fade f={f} at={L(44) + 4}>
          <Formula x={960} y={560} size={54} anchor="middle">đổi đầu vào  →  đầu ra đổi theo</Formula>
        </Fade>
      </Svg>
    </AbsoluteFill>
  );
};

/* ---------- S12 高潮：一点炸开成彩色光丝 + 大字 ---------- */
const ORIGIN: P = [760, 520];
const FIL = Array.from({length: 260}).map((_, i) => {
  const a = (rand(i * 3 + 1) - 0.5) * Math.PI * 1.25; // 主要向右扇形散开
  const L0 = 260 + Math.pow(rand(i * 3 + 2), 0.7) * 900;
  const bend = (rand(i * 7 + 5) - 0.5) * 0.9;
  const r = rand(i * 11 + 9);
  const col = r < 0.16 ? '#ff5a3c' : r < 0.3 ? '#a9bcff' : r < 0.42 ? '#7fe39a' : r < 0.52 ? '#d58bff' : r < 0.75 ? '#fff3dc' : C.mid;
  return {a, L: L0, bend, col, w: 0.5 + rand(i * 13) * 1.0, delay: rand(i * 17) * 8, dot: 1.4 + rand(i * 19) * 2.4};
});
export const SClimax: React.FC<{f: number}> = ({f}) => {
  const lf = f - CLIMAX;
  const fadeAll = 1 - prog(f, SC.climax + 225, 36);
  const lines: React.ReactNode[] = [], dots: React.ReactNode[] = [];
  FIL.forEach((fl, i) => {
    const t = clamp((lf - fl.delay) / 46);
    if (t <= 0) return;
    const ca = Math.cos(fl.a), sa = Math.sin(fl.a);
    const drift = Math.max(0, lf - fl.delay - 46) * 0.5;
    const hd = fl.L * eo(t) + drift;
    const pt = (d: number): P => { const k = d / fl.L; return [ORIGIN[0] + ca * d - sa * fl.L * fl.bend * k * k, ORIGIN[1] + sa * d + ca * fl.L * fl.bend * k * k]; };
    const steps = 10;
    let dd = '';
    for (let s = 0; s <= steps; s++) { const p = pt((hd * s) / steps); dd += (s ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); }
    lines.push(<path key={i} d={dd} stroke={fl.col} strokeWidth={fl.w} opacity={0.75} fill="none" strokeLinecap="round" />);
    const h = pt(hd);
    dots.push(<circle key={'d' + i} cx={h[0]} cy={h[1]} r={fl.dot} fill={fl.col} opacity={0.6 + 0.4 * Math.sin(lf * 0.3 + i)} />);
  });
  const flash = 1 - prog(lf, 0, 10);
  const title = eo(prog(lf, 30, 24));
  return (
    <AbsoluteFill style={{opacity: fadeAll}}>
      <Svg>
        <g style={{mixBlendMode: 'screen'}}>
          <g opacity={0.6} filter="url(#b4)">{lines}</g>
          <g>{lines}</g>
          <g>{dots}</g>
          <circle cx={ORIGIN[0]} cy={ORIGIN[1]} r={60 + flash * 260} fill="url(#halo)" opacity={0.35 + flash * 0.6} />
          <PenHead p={ORIGIN} f={f} size={1.3 + flash * 1.8} />
        </g>
        <g opacity={title}>
          <ellipse cx={560} cy={700} rx={340} ry={80} fill="#000" opacity={0.55} filter="url(#b24)" />
          <text x={560} y={720} fontFamily={FONT.serif} fontSize={84} fontWeight={500} fill="#fff8ea" textAnchor="middle" filter="url(#b10)" opacity={0.7}>vô số đầu vào</text>
          <text x={560} y={720} fontFamily={FONT.serif} fontSize={84} fontWeight={500} fill="#fff8ea" textAnchor="middle">vô số đầu vào</text>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

// Thánh Gióng vươn vai — test 10 s, 9:16. Tranh Đông Hồ (ảnh tạo sẵn, tách lớp) + chuyển động bằng code.
// Nhịp "rối giấy": chuyển động nhân vật lượng tử hoá ~12 fps, lệch màu in nhẹ, giấy dó sôi hạt.
import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, random, staticFile, useCurrentFrame, Easing} from 'remotion';
import {loadFont} from '@remotion/google-fonts/NotoSerif';

const {fontFamily} = loadFont('normal', {weights: ['700', '900'], subsets: ['vietnamese', 'latin']});

export const GIONG_W = 1080, GIONG_H = 1920, GIONG_FRAMES = 300;

const BEATS = [108, 126, 140, 152, 162, 170, 177, 183, 188, 193];
const REVEAL = 200;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const step = (f: number, s = 2.5) => Math.floor(f / s) * s; // nhịp rối giấy
const ease = Easing.bezier(0.2, 0.9, 0.3, 1);

// số bước nhảy đã qua, có nội suy ngắn 3 khung cho cú "bật"
const beatCount = (f: number) => {
  let k = 0;
  for (const b of BEATS) k += clamp((f - b) / 3);
  return k;
};
const shake = (f: number) => {
  let a = 0;
  for (const b of BEATS) if (f >= b) a += Math.exp(-(f - b) / 4) * 14;
  if (f >= REVEAL) a += Math.exp(-(f - REVEAL) / 6) * 26;
  const s = step(f, 1);
  return [(random(`sx${s}`) - 0.5) * a, (random(`sy${s}`) - 0.5) * a];
};

const PaperGrain: React.FC<{f: number}> = ({f}) => {
  const seed = Math.floor(f / 3) % 6; // hạt giấy "sôi" nhẹ
  return (
    <svg width={GIONG_W} height={GIONG_H} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: 0.32, pointerEvents: 'none'}}>
      <filter id={`g${seed}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed + 3} />
        <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.48  0 0 0 0 0.38  0 0 0 -1.6 1.25" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#g${seed})`} />
    </svg>
  );
};

// lớp ánh "điệp" lấp lánh: chấm sáng rải thưa, đổi chỗ theo nhịp
const Diep: React.FC<{f: number}> = ({f}) => {
  const s = Math.floor(f / 4);
  const dots = Array.from({length: 70}, (_, i) => ({
    x: random(`dx${i}`) * GIONG_W,
    y: random(`dy${i}`) * GIONG_H,
    o: 0.25 + 0.75 * Math.abs(Math.sin(s * 0.9 + i * 1.7)),
  }));
  return (
    <svg width={GIONG_W} height={GIONG_H} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', pointerEvents: 'none'}}>
      {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={1.6} fill="#fff6e0" opacity={d.o * 0.5} />)}
    </svg>
  );
};

const misreg = (f: number) => {
  const s = step(f, 5);
  const dx = 2.5 + random(`mx${s}`) * 2, dy = 1.5 + random(`my${s}`) * 2;
  return `drop-shadow(${dx.toFixed(1)}px ${dy.toFixed(1)}px 0 rgba(176,38,28,0.33))`;
};

// rơm mái nhà bay khi cậu bé lớn vụt
const Straw: React.FC<{f: number}> = ({f}) => {
  const t0 = BEATS[3];
  if (f < t0 || f > REVEAL + 10) return null;
  const items = Array.from({length: 36}, (_, i) => i);
  return (
    <svg width={GIONG_W} height={GIONG_H} style={{position: 'absolute', inset: 0}}>
      {items.map((i) => {
        const born = t0 + (i % 6) * 6;
        const t = (step(f, 2) - born) / 30;
        if (t < 0 || t > 1.4) return null;
        const ang = -Math.PI / 2 + (random(`sa${i}`) - 0.5) * 2.6;
        const sp = 500 + random(`sp${i}`) * 700;
        const x = 540 + Math.cos(ang) * sp * t;
        const y = 1380 + Math.sin(ang) * sp * t + 520 * t * t;
        const rot = random(`sr${i}`) * 360 + t * 400;
        return (
          <g key={i} transform={`translate(${x},${y}) rotate(${rot})`} opacity={clamp(1.4 - t)}>
            <rect x={-26} y={-3} width={52} height={6} rx={3} fill="#d9a83a" stroke="#1d1712" strokeWidth={2.5} />
          </g>
        );
      })}
    </svg>
  );
};

// vòng bụi kiểu mây Đông Hồ ở chân mỗi nhịp lớn lên
const Dust: React.FC<{f: number; footY: number}> = ({f, footY}) => {
  const last = [...BEATS].reverse().find((b) => f >= b);
  if (last === undefined || f - last > 14) return null;
  const t = (f - last) / 14;
  return (
    <svg width={GIONG_W} height={GIONG_H} style={{position: 'absolute', inset: 0}}>
      {[-1, 1].map((d) =>
        [0, 1, 2].map((j) => {
          const x = 540 + d * (90 + j * 70) * (0.4 + t * 1.4);
          const r = (26 + j * 10) * (0.6 + t);
          return (
            <g key={`${d}${j}`} opacity={1 - t}>
              <circle cx={x} cy={footY - 10 - j * 6} r={r} fill="#efe4c8" stroke="#1d1712" strokeWidth={4} />
              <path d={`M${x - r * 0.5},${footY - 10 - j * 6} a${r * 0.5},${r * 0.5} 0 1,1 ${r * 0.5},${r * 0.45}`} fill="none" stroke="#1d1712" strokeWidth={3} />
            </g>
          );
        }),
      )}
    </svg>
  );
};

const Rays: React.FC<{f: number}> = ({f}) => {
  const o = clamp((f - REVEAL) / 12);
  const rot = step(f, 2.5) * 0.25;
  return (
    <svg width={GIONG_W} height={GIONG_H} style={{position: 'absolute', inset: 0, opacity: o}}>
      <g transform={`translate(540,560) rotate(${rot})`}>
        {Array.from({length: 18}, (_, i) => (
          <path key={i} d="M0,0 L-70,-1400 L70,-1400 Z" transform={`rotate(${i * 20})`} fill={i % 2 ? '#e2b33c' : '#c9432f'} opacity={0.38} />
        ))}
        <circle r={210} fill="#e8b93a" stroke="#1d1712" strokeWidth={8} />
        <circle r={170} fill="none" stroke="#c9432f" strokeWidth={6} strokeDasharray="22 16" />
      </g>
    </svg>
  );
};

const Title: React.FC<{f: number}> = ({f}) => {
  const t = clamp((f - 232) / 10);
  if (t <= 0) return null;
  const s = 0.7 + 0.3 * ease(t);
  return (
    <div style={{position: 'absolute', top: 120, left: 0, width: GIONG_W, display: 'flex', justifyContent: 'center', opacity: t}}>
      <div style={{transform: `scale(${s}) rotate(-2deg)`, background: '#b8321f', border: '7px solid #1d1712', padding: '18px 44px', boxShadow: '6px 6px 0 #1d1712', fontFamily, fontWeight: 900, fontSize: 104, color: '#f3e7c9', letterSpacing: 6, lineHeight: 1}}>
        THÁNH GIÓNG
      </div>
    </div>
  );
};

const SUBS: [number, number, string][] = [
  [18, 92, 'Nghe tiếng sứ giả, cậu bé làng Gióng'],
  [92, 196, 'vươn vai một cái, bỗng hoá thành tráng sĩ.'],
];
const Sub: React.FC<{f: number}> = ({f}) => {
  const c = SUBS.find(([a, b]) => f >= a && f < b);
  if (!c) return null;
  const o = Math.min(clamp((f - c[0]) / 5), clamp((c[1] - f) / 5));
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1640, textAlign: 'center', fontFamily, fontWeight: 700, fontSize: 46, lineHeight: 1.25, color: '#f6ecd2', opacity: o, WebkitTextStroke: '10px #1d1712', paintOrder: 'stroke fill'}}>{c[2]}</div>
  );
};

const FOOT_Y = 1488; // bậc cửa nhà trong nền

const SceneA: React.FC<{f: number}> = ({f}) => {
  const fs = step(f);
  // cậu bé: đứng nhún, rồi vươn vai, rồi lớn vụt theo nhịp trống
  const bob = f < 60 ? Math.sin(fs * 0.35) * 0.03 : 0;
  const squash = interpolate(f, [58, 68, 72, 84, 96], [0, -0.16, -0.16, 0.22, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const grow = Math.pow(1.235, beatCount(f));
  const baseH = 180;
  const h = baseH * grow * (1 + squash + bob);
  const w = (h / 1063) * 568 * (1 - squash * 0.5);
  const cam = interpolate(f, [0, 100, 196], [1.0, 1.08, 1.0], {extrapolateRight: 'clamp'});
  const tilt = 0;
  return (
    <AbsoluteFill style={{transformOrigin: '540px 1480px', transform: `scale(${cam}) translateY(${tilt}px)`}}>
      <Img src={staticFile('giong/bg.png')} style={{position: 'absolute', left: 0, top: -8, width: 1080, height: 1935}} />
      <Img src={staticFile('giong/boy.png')} style={{position: 'absolute', left: 540 - w / 2, top: FOOT_Y - h, width: w, height: h, filter: misreg(f)}} />
      <Dust f={f} footY={FOOT_Y} />
      <Straw f={f} />
    </AbsoluteFill>
  );
};

const SceneB: React.FC<{f: number}> = ({f}) => {
  const fs = step(f);
  const cam = interpolate(f, [REVEAL, 300], [1.12, 1.0], {extrapolateLeft: 'clamp', easing: ease});
  const sway = Math.sin(fs * 0.18) * 1.6;
  const breathe = 1 + Math.sin(fs * 0.12) * 0.008;
  const h = 1520 * breathe, w = (h / 1156) * 644;
  return (
    <AbsoluteFill style={{transformOrigin: '540px 1700px', transform: `scale(${cam})`}}>
      <Img src={staticFile('giong/bg.png')} style={{position: 'absolute', left: 0, top: -8, width: 1080, height: 1935, filter: 'saturate(1.15) sepia(0.15)'}} />
      <Rays f={f} />
      <div style={{position: 'absolute', left: 540 - w / 2 + 40, top: 1860 - h, width: w, height: h, transformOrigin: '50% 100%', transform: `skewX(${sway}deg)`}}>
        <Img src={staticFile('giong/warrior.png')} style={{width: '100%', height: '100%', filter: misreg(f)}} />
      </div>
    </AbsoluteFill>
  );
};

// chuyển cảnh mực loang: vết mực đen lan từ ngực cậu bé (in), rồi mực mở lỗ để lộ tráng sĩ (out)
const Ink: React.FC<{r: number; hole?: boolean}> = ({r, hole}) => (
  <svg width={GIONG_W} height={GIONG_H} style={{position: 'absolute', inset: 0}}>
    <defs>
      <filter id="inkf" x="-50%" y="-50%" width="200%" height="200%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={3} seed={11} />
        <feDisplacementMap in="SourceGraphic" scale={170} />
      </filter>
      <mask id="inkm" maskUnits="userSpaceOnUse" x={0} y={0} width={GIONG_W} height={GIONG_H}>
        <rect width={GIONG_W} height={GIONG_H} fill="white" />
        <circle cx={540} cy={900} r={r} fill="black" filter="url(#inkf)" />
      </mask>
    </defs>
    {hole ? <rect width={GIONG_W} height={GIONG_H} fill="#1d1712" mask="url(#inkm)" /> : <circle cx={540} cy={900} r={r} fill="#1d1712" filter="url(#inkf)" />}
  </svg>
);

export const Giong: React.FC = () => {
  const f = useCurrentFrame();
  const [sx, sy] = shake(f);
  const inkR = interpolate(f, [184, REVEAL], [0, 1500], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  const openR = interpolate(f, [REVEAL, REVEAL + 14], [0, 1500], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  return (
    <AbsoluteFill style={{background: '#efe4c8', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${sx}px,${sy}px)`}}>
        {f < REVEAL && <SceneA f={f} />}
        {f >= 184 && f < REVEAL && <Ink r={inkR} />}
        {f >= REVEAL && <SceneB f={f} />}
        {f >= REVEAL && f < REVEAL + 14 && <Ink r={openR} hole />}
      </AbsoluteFill>
      <Title f={f} />
      <Sub f={f} />
      <Diep f={f} />
      <PaperGrain f={f} />
      <AbsoluteFill style={{boxShadow: 'inset 0 0 160px rgba(60,35,10,0.45)', pointerEvents: 'none'}} />
      <Audio src={staticFile('audio/giong/mix.wav')} />
    </AbsoluteFill>
  );
};

// ep55 场景 5–6：π 在生活里（车轮、声波、GPS 轨道）／ NASA 只用 15 位 → 高潮 314 nghìn tỷ → 为什么 → 收尾。
import React from 'react';
import {C, GText, Ink, LED, SoftGlow, TX, eo, ledWidth, prog, vis} from './kit55';
import {SP} from './scenesA';
import {
  CHIP_AT, CHIP_CX, CHIP_NAMES, CURIOUS_AT, E_AT, EARTH, END_OUT, ER, ERR_AT, FINAL_AT, FINAL_DUR, FINAL_PATH, GPSF_AT, LDIST, LFLOOR, LFORM_AT,
  LIFE_A_OUT, LIFE_B_OUT, LROLL0, LW_AT, LWR, LX0, NASA_AT, NASA_DIGITS, NASA_LABEL, NASA_OUT, NF, O_AT, ORB, ORB_IN, PERIOD_AT, Q2_AT, QMARK_AT,
  SAT_GO, SINE_DRAW, SINE_IN, SK, SN, STROKE, TITLE_AT, VC, VOY_AT, VOY_LABEL, VOY_P, WHY_AT, lrollE, nasaShown, sinePts, sproj,
} from './ink55';
import {CLIMAX, FRAMES, SC} from './timing';
import {partial, ptsD, rand} from './geo55x';

/* ---------------- S5 生活 ---------------- */
const lifeVis = (f: number) => vis(f, SC.life - 4, SC.end, 10, 16);
const aVis = (f: number) => vis(f, LW_AT - 6, LIFE_A_OUT + 12, 8, 12);
const bVis = (f: number) => vis(f, SINE_IN, LIFE_B_OUT + 12, 10, 12);
const cVis = (f: number) => vis(f, ORB_IN, SC.end, 10, 16);
const orbP = (t: number): [number, number] => {
  const x = Math.cos(t) * ORB.a, y = Math.sin(t) * ORB.b, c = Math.cos(ORB.rot), s = Math.sin(ORB.rot);
  return [EARTH[0] + x * c - y * s, EARTH[1] + x * s + y * c];
};
export const LifeWorld: React.FC<SP> = ({f}) => {
  const o = lifeVis(f);
  if (o <= 0) return null;
  const a = aVis(f), b = bVis(f), c = cVis(f);
  const dist = LDIST * lrollE(f), wx = LX0 + dist, wy = LFLOOR - LWR, rot = dist / LWR;
  const spokes = Array.from({length: 6}, (_, i) => { const t = rot + (i * Math.PI) / 3; return `M${wx + Math.cos(t) * 10},${wy + Math.sin(t) * 10}L${wx + Math.cos(t) * (LWR - 6)},${wy + Math.sin(t) * (LWR - 6)}`; }).join('');
  const satT = Math.PI / 2 + (2 * Math.PI * Math.max(0, f - SAT_GO)) / 160;
  const sp = orbP(satT);
  const satO = eo(prog(f, SAT_GO - 6, 10));
  return (
    <g opacity={o}>
      {a > 0 ? (
        <g opacity={a}>
          <path d={`M120,${LFLOOR}H1320`} stroke="rgba(200,212,255,0.26)" strokeWidth={1.4} />
          <Ink s={STROKE.lwheel} f={f} />
          <g opacity={eo(prog(f, LW_AT + 22, 10))} fill="none" stroke={C.gold}>
            <path d={spokes} strokeWidth={1.2} opacity={0.42} />
            <circle cx={wx} cy={wy} r={9} strokeWidth={1.3} opacity={0.6} />
          </g>
          <Ink s={STROKE.lunroll} f={f} />
          {[0.5, 1].map((k) => (lrollE(f) >= k - 0.002 ? <path key={k} d={`M${LX0 + LDIST * k},${LFLOOR - 12}V${LFLOOR + 12}`} stroke={C.mid} strokeWidth={2} /> : null))}
          {f >= LROLL0 ? <path d={`M${LX0},${LFLOOR - 12}V${LFLOOR + 12}`} stroke={C.mid} strokeWidth={2} /> : null}
        </g>
      ) : null}
      {b > 0 ? (
        <g opacity={b}>
          <path d={ptsD([sproj(-7.6, 0, -1.8), sproj(7.6, 0, -1.8)])} stroke="rgba(200,212,255,0.3)" strokeWidth={1.2} />
          <g fill="none" style={{mixBlendMode: 'screen'}}>
            {Array.from({length: SN - 1}, (_, j) => {
              const i = SN - 1 - j, u = i / (SN - 1);
              const so = eo(prog(f, SINE_DRAW + 26 + j * 2, 14));
              if (so <= 0) return null;
              const d = ptsD(sinePts(u, f, 110));
              return (
                <g key={i} opacity={so * (0.25 + 0.55 * (1 - u))}>
                  <path d={d} stroke={C.amber} strokeWidth={2.2} opacity={0.22} filter="url(#b4)" />
                  <path d={d} stroke="#f3c27e" strokeWidth={0.9} />
                </g>
              );
            })}
          </g>
          <Ink s={STROKE.sine} f={f} />
          {f >= PERIOD_AT ? (() => {
            const t = eo(prog(f, PERIOD_AT, 10));
            const x0 = -6.4, x1 = x0 + (2 * Math.PI) / SK;
            const A = sproj(x0, -2.2, -1.8), B = sproj(x0 + (x1 - x0) * t, -2.2, -1.8);
            return (
              <g opacity={t} stroke="#ffd28a" strokeWidth={2} strokeLinecap="round" fill="none">
                <path d={ptsD([A, B])} />
                <path d={ptsD([[A[0], A[1] - 10], [A[0], A[1] + 10]])} />
                {t > 0.95 ? <path d={ptsD([[B[0], B[1] - 10], [B[0], B[1] + 10]])} /> : null}
              </g>
            );
          })() : null}
        </g>
      ) : null}
      {c > 0 ? (
        <g opacity={c}>
          <g opacity={eo(prog(f, E_AT + 24, 14))} fill="none" stroke="#8fb0ff">
            <circle cx={EARTH[0]} cy={EARTH[1]} r={ER} fill="#2a4cb0" fillOpacity={0.16} stroke="none" />
            {[0.35, 0.7].map((k) => <ellipse key={k} cx={EARTH[0]} cy={EARTH[1]} rx={ER * k} ry={ER} strokeWidth={1} opacity={0.3} />)}
            {[-0.6, -0.3, 0, 0.3, 0.6].map((k) => { const y = EARTH[1] + ER * k, hw = ER * Math.sqrt(1 - k * k); return <path key={k} d={`M${EARTH[0] - hw},${y}H${EARTH[0] + hw}`} strokeWidth={1} opacity={0.26} />; })}
          </g>
          <Ink s={STROKE.earth} f={f} />
          <Ink s={STROKE.orbit} f={f} />
          {satO > 0 ? (
            <g transform={`translate(${sp[0].toFixed(1)},${sp[1].toFixed(1)}) rotate(-10)`} opacity={satO}>
              <circle r={26} fill="url(#halo2)" opacity={0.35} />
              <rect x={-26} y={-5} width={16} height={10} fill="#6f98ff" opacity={0.85} />
              <rect x={10} y={-5} width={16} height={10} fill="#6f98ff" opacity={0.85} />
              <rect x={-7} y={-7} width={14} height={14} rx={2} fill="#ffe2b0" />
            </g>
          ) : null}
        </g>
      ) : null}
    </g>
  );
};
export const LifeScreen: React.FC<SP> = ({f}) => {
  const o = lifeVis(f);
  if (o <= 0) return null;
  const a = aVis(f), b = bVis(f), c = cVis(f);
  const P2 = sproj(-6.4 + Math.PI / SK, -2.2, -1.8);
  return (
    <g opacity={o}>
      <TX x={960} y={112} text="π  TRONG  ĐỜI  SỐNG" size={22} ls={6} anchor="middle" color="rgba(236,228,214,0.62)" o={eo(prog(f, SC.life + 10, 12))} />
      {a > 0 ? (
        <g opacity={a}>
          <GText id="l-f" x={960} y={300} f={f} at={LFORM_AT} dur={16} text="quãng đường  =  π × d" size={54} />
          {[0.5, 1].map((k, i) => <TX key={k} x={LX0 + LDIST * k} y={LFLOOR + 50} text={i ? '2π·d' : 'π·d'} size={30} italic anchor="middle" color="#ffe0b0" o={eo(prog(f, LROLL0, 1) * (lrollE(f) >= k - 0.002 ? 1 : 0))} />)}
          <TX x={LX0} y={LFLOOR + 50} text="0" size={28} anchor="middle" color="rgba(220,226,255,0.7)" o={eo(prog(f, LROLL0, 8))} />
        </g>
      ) : null}
      {b > 0 ? (
        <g opacity={b}>
          <GText id="l-s" x={960} y={215} f={f} at={SINE_IN + 20} dur={16} text="sóng âm:  y = sin x" size={48} />
          <TX x={P2[0]} y={P2[1] + 44} text="2π" size={36} italic anchor="middle" color="#ffe0b0" glow="#ff9a3a" glowO={0.35} o={eo(prog(f, PERIOD_AT + 6, 8))} />
          <TX x={P2[0]} y={P2[1] + 74} text="một chu kỳ" size={21} anchor="middle" color="rgba(236,228,214,0.72)" o={eo(prog(f, PERIOD_AT + 10, 8))} />
        </g>
      ) : null}
      {c > 0 ? (
        <g opacity={c}>
          <TX x={960} y={215} text="Vệ tinh GPS" size={42} anchor="middle" color="#ffe2b4" glow="#ff9a3a" glowO={0.3} o={eo(prog(f, ORB_IN + 6, 12))} />
          <TX x={960} y={258} text="độ cao ≈ 20.200 km · gần 12 giờ bay một vòng" size={24} anchor="middle" color="rgba(236,228,214,0.75)" o={eo(prog(f, O_AT, 12))} />
          <GText id="l-g" x={960} y={850} f={f} at={GPSF_AT} dur={16} text="chu vi quỹ đạo  =  2π × r" size={46} />
        </g>
      ) : null}
    </g>
  );
};

/* ---------------- S6 结尾 ---------------- */
const qVis = (f: number) => vis(f, Q2_AT - 2, NASA_AT + 4, 8, 12);
const nVis = (f: number) => vis(f, NASA_AT - 4, NASA_OUT + 14, 6, 14);
const vVis = (f: number) => (f >= CLIMAX ? 0 : vis(f, VOY_AT - 6, CLIMAX + 1, 8, 4));
const whyVis = (f: number) => vis(f, WHY_AT - 2, CHIP_AT[0] + 8, 6, 10);
const chipVis = (f: number) => vis(f, CHIP_AT[0] - 2, CURIOUS_AT - 2, 6, 12);
const curVis = (f: number) => vis(f, CURIOUS_AT - 6, END_OUT + 12, 8, 12);
const climaxVis = (f: number) => vis(f, CLIMAX, END_OUT + 12, 1, 12);
const finVis = (f: number) => vis(f, FINAL_AT - 4, FRAMES + 40, 6, 10);
const FIL = Array.from({length: 56}, (_, i) => ({a: (i / 56) * Math.PI * 2 + (rand(i * 3 + 1) - 0.5) * 0.08, L: 0.6 + 0.4 * rand(i * 3 + 2), curl: (rand(i * 3 + 3) - 0.5) * 0.7}));
export const EndWorld: React.FC<SP> = ({f}) => {
  const v = vVis(f), fin = finVis(f);
  const bt = f - CLIMAX;
  const burstO = bt >= 0 ? (1 - prog(f, CLIMAX + 24, 60)) : 0;
  let wheel: React.ReactNode = null;
  if (fin > 0 && f >= FINAL_AT) {
    const t = eo(prog(f, FINAL_AT, FINAL_DUR)) ;
    const tt = STROKE.final.ease ? STROKE.final.ease(prog(f, FINAL_AT, FINAL_DUR)) : t;
    const {head, total} = partial(FINAL_PATH, tt);
    const ah = partial(FINAL_PATH, Math.min(1, tt + 0.004)).head, bh = partial(FINAL_PATH, Math.max(0, tt - 0.004)).head;
    const dx = ah[0] - bh[0], dy = ah[1] - bh[1], n = Math.hypot(dx, dy) || 1;
    const r = 46 * (1 - 0.72 * tt);
    const cx = head[0] + (dy / n) * r, cy = head[1] - (dx / n) * r;
    const rot = (tt * total) / 30;
    const wo = 1 - prog(tt, 0.88, 0.12);
    wheel = (
      <g opacity={wo}>
        <SoftGlow d={ptsD(Array.from({length: 49}, (_, i) => [cx + Math.cos(rot + (i / 48) * Math.PI * 2) * r, cy + Math.sin(rot + (i / 48) * Math.PI * 2) * r] as [number, number]))} w={1.8} />
        <path d={[0, 1, 2].map((i) => { const a = rot + (i * Math.PI) / 3; return `M${cx - Math.cos(a) * r},${cy - Math.sin(a) * r}L${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`; }).join('')} stroke={C.gold} strokeWidth={1} opacity={0.4} />
      </g>
    );
  }
  const star = eo(prog(f, FINAL_AT + FINAL_DUR - 6, 16));
  return (
    <g>
      {v > 0 ? (
        <g opacity={v}>
          <Ink s={STROKE.voy} f={f} />
          <path d={`M${VC[0]},${VC[1] - 2300}V1100`} stroke="rgba(255,214,150,0.4)" strokeWidth={1.4} strokeDasharray="6 8" opacity={eo(prog(f, VOY_AT + 34, 14)) * (1 - prog(f, ERR_AT - 6, 10) * 0.6)} />
          <g transform={`translate(${VOY_P[0].toFixed(1)},${VOY_P[1].toFixed(1)})`} opacity={eo(prog(f, VOY_AT + 46, 10))}>
            <circle r={30} fill="url(#halo2)" opacity={0.3} />
            <path d="M-14,4 Q0,-14 14,4 Z" fill="#ffe2b0" opacity={0.9} />
            <path d="M0,4 V16 M-18,16 H18" stroke="#ffe2b0" strokeWidth={1.6} />
          </g>
        </g>
      ) : null}
      {burstO > 0 ? (
        <g opacity={burstO} fill="none" strokeLinecap="round" style={{mixBlendMode: 'screen'}}>
          {FIL.map((q, i) => {
            const R = 40 + 1150 * q.L * eo(prog(f, CLIMAX, 46));
            const pts: [number, number][] = Array.from({length: 24}, (_, k) => { const rr = 6 + (R - 6) * (k / 23); const a = q.a + q.curl * (rr / 1000); return [960 + Math.cos(a) * rr, 540 + Math.sin(a) * rr]; });
            return <path key={i} d={ptsD(pts)} stroke={i % 3 ? C.gold : '#ffd9a0'} strokeWidth={1.1} opacity={0.55} />;
          })}
          <circle cx={960} cy={540} r={60 + 900 * eo(prog(f, CLIMAX, 36))} stroke="#ffd9a0" strokeWidth={2} opacity={0.35 * (1 - prog(f, CLIMAX, 36))} />
          <circle cx={960} cy={540} r={160} fill="url(#halo2)" opacity={0.5 * (1 - prog(f, CLIMAX, 30))} />
        </g>
      ) : null}
      {fin > 0 ? (
        <g opacity={fin}>
          <Ink s={STROKE.final} f={f} />
          {wheel}
          {star > 0 ? <g transform={`translate(${FINAL_PATH[FINAL_PATH.length - 1].join(',')})`} opacity={star * (0.75 + 0.25 * Math.sin(f * 0.2))}><circle r={60} fill="url(#halo2)" opacity={0.45} /><circle r={4} fill="#fff8ec" /></g> : null}
        </g>
      ) : null}
    </g>
  );
};
export const EndScreen: React.FC<SP> = ({f}) => {
  const q = qVis(f), n = nVis(f), v = vVis(f), why = whyVis(f), ch = chipVis(f), cu = curVis(f), cl = climaxVis(f), fin = finVis(f);
  const shown = nasaShown(f);
  const digits = NASA_DIGITS.replace('.', '');
  const ledStr = shown <= 0 ? '' : (digits[0] + '.' + digits.slice(1, shown)).padEnd(17, ' ');
  const lw = ledWidth(NASA_DIGITS, 66);
  const big = '314 000 000 000 000';
  const bw = ledWidth(big, 62);
  const flick = f - CLIMAX < 6 ? (Math.floor((f - CLIMAX) / 2) % 2 ? 0.5 : 1) : 1;
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
          <Ink s={STROKE.nframe} f={f} />
          <TX x={960} y={NF.y + 72} text="NASA · JPL" size={32} ls={8} anchor="middle" color="#ffe2b4" glow="#ff9a3a" glowO={0.3} o={eo(prog(f, NASA_AT + 26, 12))} />
          <TX x={960} y={NF.y + 114} text="dẫn đường tàu vũ trụ liên hành tinh" size={24} anchor="middle" color="rgba(236,228,214,0.75)" o={eo(prog(f, NASA_AT + 34, 12))} />
          {shown > 0 ? <LED value={ledStr} x={960 - lw / 2} y={NF.y + 160} size={66} color="#ff4a32" /> : null}
          <TX x={960} y={NF.y + 318} text="15 chữ số sau dấu phẩy" size={30} anchor="middle" color="#ffd28a" glow="#ff9a3a" glowO={0.3} o={eo(prog(f, NASA_LABEL, 10))} />
        </g>
      ) : null}
      {v > 0 ? (
        <g opacity={v}>
          <TX x={VOY_P[0]} y={VOY_P[1] - 44} text="Voyager 1" size={28} anchor="middle" color="#ffe2b4" o={eo(prog(f, VOY_LABEL, 10))} />
          <TX x={984} y={560} text="bán kính ≈ 32 tỷ km" size={26} color="rgba(240,230,214,0.82)" o={eo(prog(f, VOY_AT + 40, 10)) * (1 - prog(f, ERR_AT - 6, 10))} />
          <GText id="e-err" x={960} y={760} f={f} at={ERR_AT} dur={14} text="sai số chỉ ≈ 1,5 cm" size={62} />
        </g>
      ) : null}
      {cl > 0 ? (
        <g opacity={cl}>
          <g opacity={flick}><LED value={big} x={960 - bw / 2} y={360} size={62} color="#ff4a32" /></g>
          <TX x={960} y={492} text="chữ số π đã được tính · kỷ lục tháng 11/2025" size={26} anchor="middle" color="rgba(240,230,214,0.82)" o={eo(prog(f, CLIMAX + 10, 12))} />
        </g>
      ) : null}
      {why > 0 ? <g opacity={why}><GText id="e-why" x={960} y={660} f={f} at={WHY_AT} dur={10} text="Để làm gì?" size={58} /></g> : null}
      {ch > 0 ? (
        <g opacity={ch}>
          {CHIP_CX.map((cx, i) => (
            <g key={i}>
              <Ink s={STROKE['chip' + i]} f={f} />
              <TX x={cx} y={702} text={CHIP_NAMES[i]} size={30} anchor="middle" color="#ffe8c8" o={eo(prog(f, CHIP_AT[i] + 12, 8))} />
            </g>
          ))}
        </g>
      ) : null}
      {cu > 0 ? (
        <g opacity={cu}>
          <GText id="e-cur" x={960} y={640} f={f} at={CURIOUS_AT} dur={12} text="vì tò mò" size={56} />
          <TX x={1396} y={742} text="… 3,14159265358979323846" size={38} anchor="end" color="rgba(246,214,160,0.85)" o={eo(prog(f, CURIOUS_AT + 20, 12))} />
          <Ink s={STROKE.qmark} f={f} />
          <circle cx={1455} cy={762} r={4.5} fill="#ffe2b0" opacity={eo(prog(f, QMARK_AT + 22, 6))} />
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

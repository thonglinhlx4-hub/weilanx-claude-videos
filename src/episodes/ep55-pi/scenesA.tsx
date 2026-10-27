// ep55 场景 1–2：钩子（一圈滚出 3,14 个直径）／ π 的定义（任何圆都一样）。
// 每个场景导出 World（随相机）和 Screen（屏幕文字层，整数像素）两部分。
import React from 'react';
import {Backing, C, GText, Ink, LED, TX, TXw, eo, ledWidth, prog, vis} from './kit55';
import {PJ} from './cam55';
import {
  BR, CIRC, D_CIRC, D_DIAM, DC, DR, FLOOR, FORM_AT, OBJ, OBJ_IN, PI_AT, Q_AT, RATIO_AT, REM_AT, REVEAL, ROLL0, ROLL_DUR, STROKE,
  WHEEL_AT, WHEEL_DUR, WR, WX0, rollE, wheelRot, wheelX,
} from './ink55';
import {SC} from './timing';
import {clamp} from './geo55';

export type SP = {f: number; pj: PJ};
const fq2 = (f: number) => 2 * Math.floor(f / 2);

/** 淡蓝背景网格（世界层，径向遮罩） */
export const FaintGrid: React.FC<{o: number; id: string; cx?: number; cy?: number}> = ({o, id, cx = 960, cy = 520}) => {
  if (o <= 0) return null;
  const v: string[] = [], h: string[] = [];
  for (let x = -240; x <= 2160; x += 60) v.push(`M${x},-200V1280`);
  for (let y = -200; y <= 1280; y += 60) h.push(`M-240,${y}H2160`);
  return (
    <g opacity={o}>
      <defs>
        <radialGradient id={'fg' + id} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={1000}><stop offset="0.25" stopColor="#fff" /><stop offset="1" stopColor="#000" /></radialGradient>
        <mask id={'fgm' + id} maskUnits="userSpaceOnUse" x={-240} y={-200} width={2400} height={1480}><rect x={-240} y={-200} width={2400} height={1480} fill={`url(#fg${id})`} /></mask>
      </defs>
      <g mask={`url(#fgm${id})`} fill="none">
        <path d={v.join('') + h.join('')} stroke="#4a68d8" strokeWidth={1.4} opacity={0.22} />
      </g>
    </g>
  );
};

/* ---------------- S1 钩子 ---------------- */
const hookVis = (f: number) => vis(f, 0, SC.define, 8, 16);
export const HookWorld: React.FC<SP> = ({f}) => {
  const o = hookVis(f);
  if (o <= 0) return null;
  const cx = wheelX(f), cy = FLOOR - WR, rot = wheelRot(f);
  const done = prog(f, WHEEL_AT + WHEEL_DUR - 4, 12);
  const spokes = Array.from({length: 6}, (_, i) => {
    const a = rot + (i * Math.PI) / 3;
    return `M${(cx + Math.cos(a) * 14).toFixed(1)},${(cy + Math.sin(a) * 14).toFixed(1)}L${(cx + Math.cos(a) * (WR - 8)).toFixed(1)},${(cy + Math.sin(a) * (WR - 8)).toFixed(1)}`;
  }).join('');
  const da = rot + Math.PI / 2;
  const diam = `M${(cx + Math.cos(da) * WR).toFixed(1)},${(cy + Math.sin(da) * WR).toFixed(1)}L${(cx - Math.cos(da) * WR).toFixed(1)},${(cy - Math.sin(da) * WR).toFixed(1)}`;
  const mk = [cx + Math.cos(Math.PI / 2 + rot) * WR, cy + Math.sin(Math.PI / 2 + rot) * WR];
  return (
    <g opacity={o}>
      <FaintGrid o={0.9 * eo(prog(f, 4, 30))} id="h" cy={600} />
      <path d={`M180,${FLOOR}H1740`} stroke="rgba(200,212,255,0.28)" strokeWidth={1.4} opacity={eo(prog(f, 6, 20))} />
      <Ink s={STROKE.wheel} f={f} />
      <g opacity={done} fill="none" strokeLinecap="round">
        <path d={spokes} stroke={C.gold} strokeWidth={1.3} opacity={0.42} />
        <circle cx={cx} cy={cy} r={12} stroke={C.gold} strokeWidth={1.4} opacity={0.6} />
        <circle cx={cx} cy={cy} r={WR - 8} stroke={C.gold} strokeWidth={0.8} opacity={0.22} />
      </g>
      <path d={diam} stroke="#9fb4ff" strokeWidth={1.8} strokeDasharray="8 7" opacity={0.75 * eo(prog(f, WHEEL_AT + WHEEL_DUR + 2, 14))} />
      {done > 0 ? (
        <g opacity={done}>
          <circle cx={mk[0]} cy={mk[1]} r={14} fill="#ff5a3c" opacity={0.3} filter="url(#b4)" />
          <circle cx={mk[0]} cy={mk[1]} r={5.5} fill="#ff7a5a" />
        </g>
      ) : null}
      <Ink s={STROKE.unroll} f={f} />
      {f >= ROLL0 ? <path d={`M${WX0},${FLOOR - 12}V${FLOOR + 12}`} stroke={C.mid} strokeWidth={2} opacity={0.8} /> : null}
      {f >= ROLL0 + ROLL_DUR - 2 ? <path d={`M${WX0 + CIRC},${FLOOR - 12}V${FLOOR + 12}`} stroke={C.mid} strokeWidth={2} opacity={0.8 * eo(prog(f, ROLL0 + ROLL_DUR - 2, 8))} /> : null}
      {BR.map((at, i) => {
        const t = eo(prog(f, at, 9));
        if (t <= 0) return null;
        const x0 = WX0 + i * 2 * WR + 5, x1 = x0 + (2 * WR - 10) * t, y = FLOOR + 30;
        return (
          <g key={i} stroke="#a9bfff" strokeWidth={2.4} strokeLinecap="round" fill="none">
            <path d={`M${x0},${y}H${x1}`} />
            <path d={`M${x0},${y - 9}V${y + 9}`} />
            {t > 0.95 ? <path d={`M${x1},${y - 9}V${y + 9}`} /> : null}
            <path d={`M${x0},${y}H${x1}`} strokeWidth={8} opacity={0.18} filter="url(#b4)" />
          </g>
        );
      })}
      {f >= REM_AT ? (
        <g opacity={eo(prog(f, REM_AT, 8))} strokeLinecap="round">
          <path d={`M${WX0 + 6 * WR + 3},${FLOOR + 30}H${WX0 + CIRC}`} stroke="#ff5a3c" strokeWidth={12} opacity={0.3} filter="url(#b4)" />
          <path d={`M${WX0 + 6 * WR + 3},${FLOOR + 30}H${WX0 + CIRC}`} stroke="#ff7a5a" strokeWidth={3.2} />
        </g>
      ) : null}
    </g>
  );
};
export const HookScreen: React.FC<SP> = ({f, pj}) => {
  const o = hookVis(f);
  if (o <= 0) return null;
  const ledO = eo(prog(f, ROLL0 - 12, 10));
  const ratio = (Math.PI * rollE(fq2(f))).toFixed(2);
  const dO = eo(prog(f, WHEEL_AT + WHEEL_DUR + 4, 12)) * (1 - prog(f, ROLL0 - 14, 12));
  return (
    <g opacity={o}>
      <TXw pj={pj} p={[WX0 - WR - 24, FLOOR - WR + 10]} text="d" size={40} italic anchor="end" color="#c8d6ff" o={dO} />
      <TX x={140} y={150} text="QUÃNG ĐƯỜNG ÷ ĐƯỜNG KÍNH" size={22} ls={3} color="rgba(236,230,218,0.82)" o={ledO} />
      <LED value={ratio} x={140} y={176} size={72} o={ledO} />
      {BR.map((at, i) => (
        <TXw key={i} pj={pj} p={[WX0 + (2 * i + 1) * WR, FLOOR + 80]} text={String(i + 1)} size={34} anchor="middle" color="#d6e0ff" o={eo(prog(f, at, 8))} />
      ))}
      <TXw pj={pj} p={[WX0 + 6 * WR + (CIRC - 6 * WR) / 2 + 6, FLOOR + 80]} text="0,14…" size={30} anchor="start" color="#ff9a80" glow="#ff4a32" glowO={0.4} o={eo(prog(f, REM_AT + 4, 8))} />
      <GText id="h-rev" x={560} y={380} f={f} at={REVEAL} text="≈ 3,14" size={110} />
      <TX x={560} y={440} text="lần đường kính" size={32} anchor="middle" color="rgba(240,232,220,0.86)" o={eo(prog(f, REVEAL + 10, 10))} />
    </g>
  );
};

/* ---------------- S2 定义 ---------------- */
const defA = (f: number) => vis(f, D_CIRC - 6, OBJ_IN + 14, 10, 14);
const defB = (f: number) => vis(f, OBJ_IN, Q_AT + 2, 8, 14);
const defQ = (f: number) => vis(f, Q_AT, SC.arch, 8, 16);
export const DefWorld: React.FC<SP> = ({f}) => {
  const a = defA(f), b = defB(f);
  return (
    <g>
      {a > 0 ? (
        <g opacity={a}>
          <Ink s={STROKE.dcirc} f={f} />
          <Ink s={STROKE.ddiam} f={f} />
          <circle cx={DC[0]} cy={DC[1]} r={4} fill={C.mid} opacity={eo(prog(f, D_DIAM, 10))} />
        </g>
      ) : null}
      {b > 0 ? (
        <g opacity={b}>
          {OBJ.map((ob, i) => {
            const d = eo(prog(f, ob.at + ob.dur - 4, 14));
            const [cx, cy] = ob.c, r = ob.r;
            return (
              <g key={i}>
                <Ink s={STROKE["obj" + i]} f={f} />
                {i === 0 && d > 0 ? (
                  <g opacity={d} fill="none" stroke={C.gold} strokeLinecap="round">
                    <circle cx={cx} cy={cy} r={r * 0.78} strokeWidth={1} opacity={0.35} strokeDasharray="5 6" />
                    <path d={`M${cx - 26},${cy - r - 2}Q${cx - 24},${cy - r - 24} ${cx},${cy - r - 24}Q${cx + 24},${cy - r - 24} ${cx + 26},${cy - r - 2}`} strokeWidth={1.6} opacity={0.6} />
                  </g>
                ) : null}
                {i === 1 && d > 0 ? (
                  <g opacity={d} fill="none" stroke={C.gold} strokeLinecap="round">
                    <circle cx={cx} cy={cy} r={r * 0.86} strokeWidth={1} opacity={0.35} />
                    <circle cx={cx} cy={cy} r={10} strokeWidth={1.4} opacity={0.6} />
                    <path d={Array.from({length: 16}, (_, k) => { const t = (k * Math.PI) / 8 + f * 0.01; return `M${cx + Math.cos(t) * 10},${cy + Math.sin(t) * 10}L${cx + Math.cos(t) * r * 0.86},${cy + Math.sin(t) * r * 0.86}`; }).join('')} strokeWidth={0.9} opacity={0.32} />
                  </g>
                ) : null}
                {i === 2 && d > 0 ? (
                  <g opacity={d} fill="none" stroke="#8fb0ff" strokeLinecap="round">
                    <circle cx={cx} cy={cy} r={r} fill="#2a4cb0" fillOpacity={0.14} stroke="none" />
                    {[0.35, 0.7].map((k) => <ellipse key={k} cx={cx} cy={cy} rx={r * k} ry={r} strokeWidth={1} opacity={0.3} />)}
                    {[-0.6, -0.3, 0, 0.3, 0.6].map((k) => { const y = cy + r * k, hw = r * Math.sqrt(1 - k * k); return <path key={k} d={`M${cx - hw},${y}H${cx + hw}`} strokeWidth={1} opacity={0.26} />; })}
                  </g>
                ) : null}
              </g>
            );
          })}
        </g>
      ) : null}
      {defQ(f) > 0 ? null : null}
    </g>
  );
};
export const DefScreen: React.FC<SP> = ({f}) => {
  const a = defA(f), b = defB(f), q = defQ(f);
  return (
    <g>
      {a > 0 ? (
        <g opacity={a}>
          <TX x={DC[0]} y={DC[1] - DR - 26} text="chu vi" size={30} anchor="middle" color="#ffe0b0" o={eo(prog(f, D_CIRC + 30, 10))} />
          <TX x={DC[0]} y={DC[1] + 40} text="đường kính" size={28} anchor="middle" color="#c8d6ff" o={eo(prog(f, D_DIAM + 10, 10))} />
          <GText id="d-pi" x={1430} y={500} f={f} at={PI_AT - 2} dur={12} text="π" size={230} italic />
          <GText id="d-form" x={1430} y={610} f={f} at={FORM_AT} dur={20} text="π = chu vi ÷ đường kính" size={46} color="#fff0d8" glowO={0.35} />
        </g>
      ) : null}
      {b > 0 ? (
        <g opacity={b}>
          {OBJ.map((ob, i) => {
            const at = RATIO_AT[i];
            const w = ledWidth('3.14', 44);
            return (
              <g key={i}>
                <TX x={ob.c[0]} y={772} text={ob.name} size={28} anchor="middle" color="rgba(240,234,222,0.9)" o={eo(prog(f, ob.at + ob.dur - 6, 10))} />
                <LED value="3.14" x={ob.c[0] - w / 2} y={800} size={44} o={eo(prog(f, at, 6))} />
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
export {Backing, clamp};

// ep57 · 屏幕文字层（竖屏 1080×1920）：所有文字 / 数字都在这里——整数像素、固定字号、不旋转（只有"BÀ SAI!"印章是固定角度）、等宽数字。
// 世界锚点经 makePJ3：前后 7 帧相机投影取平均再取整；门牌号字号按每段参考机位定好、整段不变。
// 安全区：重要内容在 y 192–1536；字幕顶在 y 1362。
import React from 'react';
import {Backing, GText, LED, TX, ledWidth} from '../ep55-pi/kit55';
import {
  ASK0, CARDS, CLIMAX, COLH, COLX, COLZ, COUNT0, DH, DOOR_SPAN, DOTS0, FAR, FAR1, FINAL0, FRAMES, L, LE, MCARD0, MH, MINE, MINE1, M_TXT, ECARD0, MON0,
  OPEN2, PHD0, PHD1, LET0, LET1, POUR0, POUR1, RING1_C, RING2_C, Rect3, SAI, SC, STAY_LBL, STRIKE0, STRIKE_Y, T_CAR, T_RES, TITLE0, WAVE0, WAVE1, KEEP_Q,
  camAt, camBasis, clamp, doorPt, eo, fogK, mDoor, prog, progOf, rates, rectPt, S3ID, ss, tierDoor, tierY, wd, add, lerp, gamesAt, TXS, OC, TIER_TO,
} from './scene3';
import {V3, project} from './gl';
import {CASES, GAMES, OPENED, OPENED_TXT, MILLION_TXT, vn, pct, LETTERS, PHDS, SIM_N} from './facts';
import {stageA, fightDim, casesA, milA} from './world';

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
const GOLD_T = '#ffe2b0', SOFT = 'rgba(240,232,220,0.86)', DIM = 'rgba(236,228,214,0.68)', LEDC = '#ffb04a';
const sizeAt = (ref: number, p: V3, k: number, lo: number, hi: number) => {
  const c = camAt(ref); const b = camBasis(c);
  const v = [p[0] - c.pos[0], p[1] - c.pos[1], p[2] - c.pos[2]];
  const d = -(v[0] * b.back[0] + v[1] * b.back[1] + v[2] * b.back[2]);
  return Math.round(clamp(k / (d * b.pxK), lo, hi));
};

/** 卡片下方的说明（锚在卡片底边中点） */
const Caption: React.FC<{pj: PJ3; cd: Rect3; lines: [string, number, string?][]; src?: string; o: number; w?: number}> = ({pj, cd, lines, src, o, w = 560}) => {
  if (o <= 0.01) return null;
  const [x, y] = pj(rectPt(cd, 0, cd.h / cd.k / 2));
  let yy = y + 10;
  const hh = lines.reduce((s, l) => s + l[1] * 1.25, 0) + (src ? 46 : 18);
  return (
    <g opacity={o}>
      <Backing x={x - w / 2} y={y + 2} w={w} h={hh} o={0.9} />
      {lines.map(([t, s, c], i) => { yy += s * 1.25; return <TX key={i} x={x} y={yy} text={t} size={s} anchor="middle" color={c ?? SOFT} ls={i === 0 ? 4 : 0.5} />; })}
      {src ? <TX x={x} y={yy + 32} text={src} size={24} anchor="middle" color="rgba(220,210,190,0.55)" ls={0.3} /> : null}
    </g>
  );
};
/** LED 数字 + 右侧标签，整体居中在 cx */
const Counter: React.FC<{cx: number; y: number; value: string; label: string; size?: number; o: number; pre?: string}> = ({cx, y, value, label, size = 54, o, pre}) => {
  if (o <= 0.01) return null;
  const w = ledWidth(value, size), lw = label.length * size * 0.36;
  const x0 = Math.round(cx - (w + 18 + lw) / 2);
  return (
    <g opacity={o}>
      {pre ? <TX x={x0 - 16} y={y + size * 0.86} text={pre} size={size * 0.7} anchor="end" color={GOLD_T} /> : null}
      <LED value={value} x={x0} y={y} size={size} color={LEDC} />
      <TX x={x0 + w + 18} y={y + size * 0.86} text={label} size={Math.round(size * 0.56)} color={SOFT} />
    </g>
  );
};

/* ---------------- 门牌号（主舞台）：字号按段落参考机位固定 ---------------- */
type Seg = {a: number; b: number; ref: number};
const SEGS: Seg[] = [{a: 40, b: SC.fight + 20, ref: L(3)}, {a: SC.why + 30, b: LE(11) + 40, ref: L(10)}, {a: L(20) - 10, b: FINAL0 + 40, ref: L(20) + 30}];
const plq = (k: number): V3 => doorPt(k, 0, DH + 0.3, 0.05);
const SEG_SZ = SEGS.map((s) => [1, 2, 3].map((k) => sizeAt(s.ref, plq(k), 0.36, 22, 48)));
const DoorNums: React.FC<SP> = ({f, pj}) => {
  const sp = progOf(S3ID.doors, f);
  return (
    <g>
      {SEGS.map((s, si) => {
        const o = vis(f, s.a, s.b, 16, 18) * stageA(f);
        if (o <= 0.01) return null;
        return [1, 2, 3].map((k) => {
          const app = si === 0 ? eo(clamp((sp - DOOR_SPAN[k - 1][1] + 0.05) / 0.05)) : 1;
          // 结尾：标签留给光柱，门牌号在光柱期间收起
          const colHide = si === 2 ? 1 - Math.min(ss(prog(f, L(20) + 6, 14)), 1 - ss(prog(f, L(21), 20))) : 1;
          const [x, y] = pj(plq(k));
          const sz = SEG_SZ[si][k - 1];
          return <TX key={si + '-' + k} x={x} y={y} text={String(k)} size={sz} anchor="middle" color="#fff0d6" glow="#ff9a3a" glowO={0.3} o={o * app * colHide} />;
        });
      })}
    </g>
  );
};

/* ---------------- hook ---------------- */
const HookS: React.FC<SP> = ({f, pj}) => {
  if (f > SC.fight + 30) return null;
  const a = vis(f, wd(0, 'ô'), LE(0) + 12, 10, 14), b = vis(f, wd(1, 'chọn'), L(2) + 10, 10, 12), c = vis(f, L(2) + 14, L(3) + 4, 12, 18);
  const t = vis(f, ASK0 + 2, SC.fight + 24, 10, 20);
  return (
    <g>
      {a > 0 ? <g opacity={a}><TX x={540} y={300} text="1 ô tô  ·  2 con dê" size={46} anchor="middle" color={GOLD_T} glow="#ff9a3a" glowO={0.3} /></g> : null}
      {b > 0 ? <g opacity={b}><GText id="h-b" x={540} y={310} f={f} at={wd(1, 'chọn')} dur={12} text="Bạn chọn cửa 1" size={60} /></g> : null}
      <Caption pj={pj} cd={CARDS().monty} o={c} w={540} lines={[['MONTY HALL', 28, GOLD_T], ['người dẫn “Let’s Make a Deal”', 24]]} src="ảnh: ABC Television · phạm vi công cộng" />
      {t > 0 ? (
        <g opacity={t}>
          <GText id="h-t1" x={330} y={330} f={f} at={wd(3, 'giữ') - 2} dur={10} text="GIỮ" size={96} ls={6} />
          <TX x={540} y={318} text="hay" size={40} anchor="middle" color={SOFT} o={eo(prog(f, wd(3, 'hay'), 8))} />
          <GText id="h-t2" x={760} y={330} f={f} at={wd(3, 'đổi') - 2} dur={10} text="ĐỔI?" size={96} ls={6} />
        </g>
      ) : null}
    </g>
  );
};

/* ---------------- fight ---------------- */
const FightS: React.FC<SP> = ({f, pj}) => {
  if (f < SC.fight - 10 || f > SC.why + 20) return null;
  const cs = CARDS();
  const k5 = vis(f, wd(4, 'năm'), L(5) + 6, 10, 14);
  const struck = ss(prog(f, STRIKE0 + 6, 10));
  const mc = vis(f, MCARD0 + 14, SC.why - 10, 14, 24);
  const cnt = vis(f, LET0, L(7) + 14, 10, 16);
  const ec = vis(f, ECARD0 + 16, SC.why - 10, 14, 24);
  const mon = vis(f, MON0 + 8, SC.why - 10, 12, 24);
  const P = (r: Rect3, x: number, y: number) => pj(rectPt(r, x, y));
  const letters = Math.round(LETTERS * eo(prog(f, LET0, LET1 - LET0)));
  const phds = Math.round(PHDS * eo(prog(f, PHD0, PHD1 - PHD0)));
  const stamp = prog(f, SAI, 6);
  // 模拟点阵：前 60 局（固定种子，与结尾同一份数据）
  const nDots = Math.round(60 * eo(prog(f, DOTS0, 46)));
  const dots = GAMES.slice(0, nDots);
  const swN = dots.filter((g) => g.switchWin).length;
  return (
    <g>
      {k5 > 0 ? (
        <g opacity={k5}>
          <TX x={540} y={STRIKE_Y - 110} text="ĐA SỐ NGHĨ" size={26} ls={7} anchor="middle" color={DIM} />
          <TX x={540} y={STRIKE_Y} text="50%  ·  50%" size={92} anchor="middle" color={GOLD_T} glow="#ff9a3a" glowO={0.3} o={1 - 0.55 * struck} />
        </g>
      ) : null}
      {mc > 0 ? (() => {
        const r = cs.marilyn;
        const [x1, y1] = P(r, 0, -112), [x2, y2] = P(r, 0, -42), [x3, y3] = P(r, 0, 6), [x4, y4] = P(r, 0, 104);
        const [sx, sy] = P(r, 175, 150);
        return (
          <g opacity={mc}>
            <TX x={x1} y={y1} text="PARADE  ·  9/1990" size={24} ls={6} anchor="middle" color={DIM} />
            <TX x={x2} y={y2} text="MARILYN vos SAVANT" size={46} ls={2} anchor="middle" color={GOLD_T} glow="#ff9a3a" glowO={0.25} />
            <TX x={x3} y={y3} text="chuyên mục “Ask Marilyn”" size={26} anchor="middle" color={SOFT} />
            <GText id="f-doi" x={x4} y={y4} f={f} at={wd(5, 'hãy')} dur={12} text="HÃY ĐỔI  ·  2/3" size={60} />
            {stamp > 0 ? (
              <g transform={`translate(${sx},${sy}) rotate(-9) scale(${(1 + 0.35 * (1 - eo(stamp))).toFixed(3)})`} opacity={eo(stamp) * 0.92}>
                <rect x={-150} y={-52} width={300} height={92} rx={10} fill="rgba(120,20,10,0.25)" stroke="#e0503a" strokeWidth={5} />
                <text x={0} y={18} textAnchor="middle" fontFamily="'Noto Serif', serif" fontWeight={700} fontSize={56} letterSpacing={4} fill="#ef6a4a">BÀ SAI!</text>
              </g>
            ) : null}
          </g>
        );
      })() : null}
      {cnt > 0 ? (
        <g opacity={cnt}>
          <Counter cx={540} y={700} value={vn(letters)} label="lá thư" pre="≈" o={eo(prog(f, LET0, 8))} />
          <Counter cx={540} y={800} value={vn(phds)} label="tiến sĩ" pre="≈" size={46} o={eo(prog(f, PHD0, 8))} />
        </g>
      ) : null}
      <Caption pj={pj} cd={cs.erdos} o={ec} w={580} lines={[['PAUL ERDŐS', 30, GOLD_T], ['1913–1996 · nhà toán học Hungary', 24]]} src="ảnh: Kmhkmh · CC BY 3.0 · Wikimedia Commons" />
      {mon > 0 ? (() => {
        const r = cs.monitor;
        const [tx, ty] = P(r, 0, -96);
        return (
          <g opacity={mon}>
            <TX x={tx} y={ty} text="MÔ PHỎNG" size={24} ls={6} anchor="middle" color={DIM} />
            {dots.map((g, i) => {
              const [x, y] = P(r, -126 + (i % 10) * 28, -58 + Math.floor(i / 10) * 24);
              return <circle key={i} cx={x} cy={y} r={g.switchWin ? 7 : 6} fill={g.switchWin ? '#ffcf7a' : 'rgba(200,170,130,0.35)'} />;
            })}
            {nDots > 0 ? (() => { const [x, y] = P(r, 0, 104); return <TX x={x} y={y} text={`đổi thắng ${swN} / ${nDots}`} size={24} anchor="middle" color={GOLD_T} />; })() : null}
          </g>
        );
      })() : null}
    </g>
  );
};

/* ---------------- why ---------------- */
const WhyS: React.FC<SP> = ({f, pj}) => {
  if (f < SC.why - 10 || f > SC.cases + 20) return null;
  const a = vis(f, L(8), L(9) + 6, 10, 14);
  const l1 = vis(f, wd(9, 'một', 1) + 2, LE(11) + 40, 10, 20);
  const l2 = vis(f, wd(9, 'hai', 1), LE(11) + 40, 10, 20);
  const t10 = vis(f, wd(10, 'Ông'), L(11) + 4, 10, 14);
  const t11 = vis(f, wd(11, 'dồn') - 2, LE(11) + 40, 10, 20);
  const mv = ss(prog(f, POUR0 + 14, POUR1 - POUR0));
  const sz = sizeAt(L(10), RING1_C, 0.4, 30, 60);
  const [x1, y1] = pj(add(RING1_C, [0, 1.98, 0]));
  const [xa, ya] = pj(add(RING2_C, [0, 2.15, 0])), [xb, yb] = pj(doorPt(2, 0, DH + 0.62, 0.1));
  return (
    <g>
      {a > 0 ? <g opacity={a}><TX x={540} y={262} text="BÍ MẬT NẰM Ở" size={26} ls={7} anchor="middle" color={DIM} /><GText id="w-a" x={540} y={336} f={f} at={L(8) + 4} dur={14} text="lần chọn đầu tiên" size={62} /></g> : null}
      {l1 > 0 ? <TX x={x1} y={y1} text="1/3" size={sz} anchor="middle" color="#fff0d8" glow="#ff9a3a" glowO={0.4} o={l1} /> : null}
      {l2 > 0 ? <TX x={Math.round(lerp(xa, xb, mv))} y={Math.round(lerp(ya, yb, mv))} text="2/3" size={Math.round(sz * (1 + 0.15 * mv))} anchor="middle" color="#fff0d8" glow="#ff9a3a" glowO={0.45} o={l2} /> : null}
      {t10 > 0 ? <g opacity={t10}><GText id="w-10" x={540} y={320} f={f} at={wd(10, 'Ông')} dur={14} text="Người dẫn luôn mở cửa có dê" size={48} /></g> : null}
      {t11 > 0 ? <g opacity={t11}><GText id="w-11" x={540} y={326} f={f} at={wd(11, 'dồn') - 2} dur={12} text="2/3  →  cửa 2" size={64} /></g> : null}
    </g>
  );
};

/* ---------------- cases ---------------- */
const CasesS: React.FC<SP> = ({f, pj}) => {
  if (f < SC.cases - 30 || f > SC.million + 20) return null;
  const ca = casesA(f);
  const t12 = vis(f, L(12), L(16) + 2, 10, 14) * ca, t16 = vis(f, L(16) + 2, SC.million, 10, 20) * ca;
  const merge = ss(prog(f, L(16), 24));
  const nsz = sizeAt(L(14), tierDoor(2, 1), 0.2, 18, 30);
  return (
    <g>
      {t12 > 0 ? <g opacity={t12}><GText id="c-12" x={540} y={240} f={f} at={L(12)} dur={14} text="3 TRƯỜNG HỢP" size={50} ls={4} /><TX x={540} y={282} text="bạn luôn chọn cửa 1" size={26} anchor="middle" color={DIM} /></g> : null}
      {t16 > 0 ? <g opacity={t16}><GText id="c-16" x={540} y={262} f={f} at={L(16) + 2} dur={14} text="Đổi cửa: thắng 2/3" size={58} /></g> : null}
      {[1, 2, 3].map((k) => {
        const cs = CASES[k - 1];
        const o = vis(f, T_CAR[k] - 6, SC.million, 10, 20) * ca;
        if (o <= 0.01) return null;
        const [lx, ly] = pj([OC[0] + TXS + 1.85, tierY(k) + 0.95, OC[2] + 0.3]);
        const res = eo(prog(f, T_RES[k], 8));
        const dim = k === 1 ? 1 - 0.6 * merge : 1;
        return (
          <g key={k} opacity={o * dim}>
            <TX x={Math.max(lx + 30, 860)} y={ly - 30} text={`xe ở cửa ${k}`} size={26} anchor="middle" color={SOFT} />
            <TX x={Math.max(lx + 30, 860)} y={ly - 2} text={`mở ${cs.open} · đổi → ${TIER_TO[k]}`} size={24} anchor="middle" color={DIM} o={eo(prog(f, T_CAR[k] + 20, 10))} />
            {res > 0 ? <GText id={'c-r' + k} x={Math.max(lx + 30, 860)} y={ly + 52} f={f} at={T_RES[k]} dur={8} text={cs.switchWins ? 'THẮNG' : 'THUA'} size={46} ls={3} color={cs.switchWins ? '#ffe2b0' : 'rgba(225,200,170,0.75)'} glowO={cs.switchWins ? 0.5 : 0.1} /> : null}
            {[1, 2, 3].map((j) => { const [x, y] = pj(tierDoor(k, j, 0, -0.22, 0.75)); return <TX key={j} x={x} y={y} text={String(j)} size={nsz} anchor="middle" color={DIM} />; })}
          </g>
        );
      })}
    </g>
  );
};

/* ---------------- million ---------------- */
const MillionS: React.FC<SP> = ({f, pj}) => {
  if (f < SC.million - 30 || f > SC.end + 10) return null;
  const ma = milA(f);
  const t17 = vis(f, M_TXT - 4, L(19) - 4, 12, 16) * ma;
  const cnt = vis(f, WAVE0 - 4, L(19) - 4, 8, 16) * ma;
  const opened = Math.round(OPENED * ss(prog(f, WAVE0, WAVE1 - WAVE0)));
  const mine = vis(f, MINE1 - 4, LE(19) + 10, 10, 16) * ma, far = vis(f, FAR1 - 6, LE(19) + 10, 10, 16) * ma;
  const q = vis(f, KEEP_Q - 2, LE(19) + 20, 8, 16) * ma;
  const [mx, my] = pj(add(mDoor(MINE.r, MINE.c), [0, MH + 0.32, 0]));
  const fp = add(mDoor(FAR.r, FAR.c), [0, -1.4, 0.5]);
  const [fx, fy] = pj(fp);
  return (
    <g>
      {t17 > 0 ? <g opacity={t17}><Backing x={190} y={560} w={700} h={cnt > 0 ? 200 : 110} o={0.8} /><GText id="m-17" x={540} y={636} f={f} at={M_TXT - 4} dur={16} text={`${MILLION_TXT} cửa`} size={66} /></g> : null}
      {cnt > 0 ? (
        <g opacity={cnt}>
          <Counter cx={540} y={680} value={vn(opened)} label="cửa dê đã mở" size={50} o={1} />
        </g>
      ) : null}
      {mine > 0 ? <TX x={mx} y={my} text="cửa của bạn" size={30} anchor="middle" color="#fff0d8" glow="#000" glowO={0.7} o={mine} /> : null}
      {far > 0 ? <TX x={fx} y={fy} text="cửa còn lại" size={26} anchor="middle" color="#fff0d8" glow="#000" glowO={0.7} o={far * fogK(f, project(camAt(f), fp)[2]) ** 0.3} /> : null}
      {q > 0 ? <g opacity={q}><GText id="m-q" x={540} y={680} f={f} at={KEEP_Q - 2} dur={10} text="giữ?" size={110} /></g> : null}
    </g>
  );
};
void OPENED_TXT;

/* ---------------- end ---------------- */
const EndS: React.FC<SP> = ({f, pj}) => {
  if (f < SC.end - 20) return null;
  const cv = vis(f, COUNT0 - 6, L(21) + 6, 10, 20);
  const r = rates(f);
  const g = gamesAt(f);
  const lbl = (i: number) => pj([COLX[i], COLH + 0.38, COLZ]);
  const [gx, gy] = lbl(0), [dx, dy] = lbl(1);
  const s1 = eo(prog(f, STAY_LBL - 2, 10)), s2 = eo(prog(f, CLIMAX, 6));
  const t21 = vis(f, L(21) + 6, L(22) - 4, 12, 16);
  const fin = vis(f, TITLE0, FRAMES + 40, 16, 10);
  return (
    <g>
      {cv > 0 ? (
        <g opacity={cv}>
          <Counter cx={540} y={250} value={vn(g)} label="ván" size={54} o={1} />
          <TX x={gx} y={gy - 70} text="GIỮ" size={44} ls={4} anchor="middle" color={SOFT} />
          <TX x={gx} y={gy - 26} text={g ? pct(r.stayWins, g) : '—'} size={34} anchor="middle" color={SOFT} />
          <TX x={dx} y={dy - 70} text="ĐỔI" size={44} ls={4} anchor="middle" color={GOLD_T} glow="#ff9a3a" glowO={0.3} />
          <TX x={dx} y={dy - 26} text={g ? pct(r.switchWins, g) : '—'} size={34} anchor="middle" color={GOLD_T} />
          {s1 > 0 ? <TX x={gx} y={gy - 124} text="≈ 1/3" size={42} anchor="middle" color={SOFT} o={s1} /> : null}
          {s2 > 0 ? <GText id="e-23" x={dx} y={dy - 124} f={f} at={CLIMAX} dur={6} text="≈ 2/3" size={58} /> : null}
        </g>
      ) : null}
      {t21 > 0 ? (
        <g opacity={t21}>
          <TX x={540} y={262} text="TRỰC GIÁC: 50 / 50" size={30} ls={5} anchor="middle" color={DIM} />
          <GText id="e-21" x={540} y={336} f={f} at={wd(21, 'Nhưng')} dur={14} text="thông tin làm lệch cán cân" size={50} />
        </g>
      ) : null}
      {fin > 0 ? (
        <g opacity={fin}>
          <GText id="e-t1" x={540} y={300} f={f} at={TITLE0} dur={20} text="BA CÁNH CỬA" size={76} ls={5} />
          <TX x={540} y={366} text="Monty Hall" size={44} anchor="middle" color={SOFT} o={eo(prog(f, TITLE0 + 18, 14))} />
        </g>
      ) : null}
    </g>
  );
};
void OPEN2; void SIM_N; void fightDim;

export const ScreenText: React.FC<{f: number}> = ({f}) => {
  const pj = makePJ3(f);
  const p = {f, pj};
  return (
    <>
      <DoorNums {...p} />
      <HookS {...p} />
      <FightS {...p} />
      <WhyS {...p} />
      <CasesS {...p} />
      <MillionS {...p} />
      <EndS {...p} />
    </>
  );
};

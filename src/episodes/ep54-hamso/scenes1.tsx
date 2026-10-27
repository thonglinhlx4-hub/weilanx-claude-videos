// 场景 1–3：钩子 f(卷心菜) = ? ／ 一次函数网格 + 数码管 ／ 满 200 减 30 的分段函数。
// v3（对标参考片 4–11 s）：满屏深蓝发光网格（GridStage，根层）、透视跟拍相机 cam54（慢推 + 漂移 + 节拍推近）、
// 大号红色数码管、大光斑点 + 投影虚线 + 轴上发光数值、发光写出的公式与斜写标签、分段处红光柱 + 火花 + 红印章，
// 结尾直线连续变形为 3D 波浪最前一根（waveFrontPts），网格倾倒成地面（根层 floorRx）。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, Label, P, Stroke, Svg, eio, eo, prog, pushOut, roundRectPts} from './fx';
import {Fade} from './common';
import {L, SC} from './timing';
import {HAND_END, handPts} from './hook54';
import {waveFrontPts} from './scenes2';
import {At, Axes, AxesLabels, Flare, GlowText, HotLine, LedPanel, Marker, ProjText, Projection, RedStamp, Sparks, TAB, camCss, camG, lerpP, ptsD} from './grid54';
import {BRACE, CL, CP, JUMP, MORPH0, MORPH1, STAMP, cam54, fq2, hotness, linX, makePJ, pay, pieceX, px} from './cam54';

/* ---------- S1 钩子：见 hook54.tsx（SHook2，手写霓虹书法 + 跟拍相机） ---------- */

/* ---------- 光点走法 + 相机：见 cam54.ts（v4 平滑相机，纯函数） ---------- */
export {cam54, linX, pieceX} from './cam54';

/** 根层网格状态：浮现、整体不透明度、倒成地面的倾角 */
export const gridState = (f: number) => {
  const reveal = prog(f, SC.linear + 2, 64);
  const tilt = eio(prog(f, MORPH0 + 6, 44));
  return {reveal, o: 1 - eo(prog(f, SC.wave + 8, 26)), floorRx: 64 * tilt, cx: HAND_END[0], cy: HAND_END[1]};
};

/* ---------- S2 一次函数 222–665：y = 15x ---------- */
export const SLinear: React.FC<{f: number}> = ({f}) => {
  const a = SC.linear, end = SC.piece;
  const cam = cam54(f);
  const x = linX(f);
  const p0 = px(CL, 0, 0), p1 = px(CL, x, 15 * x);
  const pEnd = px(CL, 5, 75); // = HAND_END
  // 交棒：钩子里拉出的弯笔迹在这里被拉直成整条 y = 15x，下端伸到原点
  const morph = eio(prog(f, a, 34));
  const handD = ptsD(handPts(morph, p0, pEnd));
  const marks: [number, number][] = [[2, L(5) + 30], [3, L(5) + 92]];
  const moving = x > 0 && x < 5;
  const xq = linX(fq2(f));
  const hot = hotness(linX, f, 0.08);
  const ang = (Math.atan2(pEnd[1] - p0[1], pEnd[0] - p0[0]) * 180) / Math.PI;
  const lab = px(CL, 3.55, 15 * 3.55);
  const pj = makePJ(f); // v5：文字锚点投影器（8 帧平均 + 整像素）
  return (
    <AbsoluteFill style={{...pushOut(f, end)}}>
      <AbsoluteFill style={camCss(cam)}>
        <Svg>
          <g transform={camG(cam)}>
            <Axes c={CL} f={f} at={a + 18} labels={false} />
            {marks.map(([kg, at]) => {
              const p = px(CL, kg, 15 * kg);
              const t = eo(prog(f, at, 10));
              return t > 0 ? (
                <g key={kg} opacity={t}>
                  <g stroke="#ffd28a" strokeDasharray="4 7" strokeWidth={1.2} opacity={0.45}>
                    <line x1={p[0]} x2={p[0]} y1={p[1]} y2={CL.oy} /><line x1={CL.ox} x2={p[0]} y1={p[1]} y2={p[1]} />
                  </g>
                  <Marker p={p} r={7} />
                </g>
              ) : null;
            })}
            <HotLine d={handD} w={3.3} />
            {moving ? <Projection c={CL} p={p1} xv={xq.toFixed(1)} yv={String(Math.round(15 * xq))} text={false} /> : null}
            {f < L(4) + 6 ? <Flare p={HAND_END} f={f} size={1.25} o={1 - prog(f, a + 40, 20)} /> : null}
            {moving ? <Flare p={p1} f={f} size={1.3} /> : null}
            {x >= 5 ? <Marker p={pEnd} r={8} o={eo(prog(f, L(6) + 60, 10))} /> : null}
          </g>
        </Svg>
      </AbsoluteFill>
      {/* v5：图上所有文字（刻度、轴名、投影数值、坐标标注、公式、斜写标签）在屏幕空间，锚点投影取整，字形不随相机缩放/旋转 */}
      <Svg>
        <g style={TAB}>
          <AxesLabels c={CL} f={f} at={a + 18} pj={pj} />
          {marks.map(([kg, at]) => {
            const p = px(CL, kg, 15 * kg);
            const t = eo(prog(f, at, 10));
            return t > 0 ? (
              <g key={kg} opacity={t}>
                <At pj={pj} p={[p[0] + 26, p[1] + 44]}>
                  <GlowText x={p[0] + 26} y={p[1] + 44} text={`(${kg} kg; ${15 * kg} nghìn)`} size={26} f={f} at={at} dur={12} color="#ffe2b0" />
                </At>
              </g>
            ) : null;
          })}
          {moving ? <ProjText c={CL} p={p1} xv={xq.toFixed(1)} yv={String(Math.round(15 * xq))} pj={pj} /> : null}
          <At pj={pj} p={[1150, 262]}>
            <GlowText x={1150} y={262} text="y = 15x" size={96} f={f} at={L(6) + 34} dur={26} />
          </At>
          {/* 斜写标签：倾角是常数（直线的世界角度），只平移锚点 */}
          <At pj={pj} p={lab}>
            <g transform={`translate(${lab[0]},${lab[1]}) rotate(${ang.toFixed(2)})`}>
              <GlowText x={-150} y={-30} text="hàm số bậc nhất" size={40} f={f} at={L(7) + 2} dur={22} color="#ffc2a0" glow="#ff4a2a" italic={false} weight={500} ls={1} />
              {f >= L(7) + 14 ? <path d={`M-150,-14 L${-150 + 320 * eo(prog(f, L(7) + 14, 12))},-14`} stroke="#ff7a5a" strokeWidth={2} filter="url(#b1)" /> : null}
            </g>
          </At>
        </g>
      </Svg>
      {/* v4：HUD 在屏幕空间（不随相机），整像素、读数每 2 帧量化 */}
      <Svg>
        <LedPanel x={470} y={238} f={f} at={L(4) - 4} size={80} lw={250} rows={[
          {label: 'CÂN NẶNG', value: xq.toFixed(2), unit: 'kg', hot},
          {label: 'ĐƠN GIÁ', value: '15.00', unit: 'nghìn/kg'},
          {label: 'THÀNH TIỀN', value: (15 * xq).toFixed(1).padStart(5, ' '), unit: 'nghìn', hot},
        ]} digits={4} />
      </Svg>
    </AbsoluteFill>
  );
};

/* ---------- S3 分段函数 665–1163：mua từ 200 nghìn, giảm 30 nghìn ---------- */
const SIGN = {x: 1220, y: 46, w: 540, h: 136};
const linePts = (n = 160): P[] => {
  const out: P[] = [];
  for (let i = 0; i < n; i++) {
    const xv = (i / (n - 1)) * 400;
    out.push(px(CP, xv, pay(xv)));
  }
  return out;
};
const LINE_PTS = linePts();
const SIGN_PTS = roundRectPts(SIGN.x, SIGN.y, SIGN.w, SIGN.h, 30);
export const SPiece: React.FC<{f: number}> = ({f}) => {
  const a = SC.piece;
  const cam = cam54(f);
  const x = pieceX(f);
  const seg1E = Math.min(x, 199.99);
  const q0 = px(CP, 0, 0), q1 = px(CP, seg1E, seg1E);
  const jT = eo(prog(f, JUMP, 9));
  const B1 = px(CP, 200, 200), B2 = px(CP, 200, 170);
  const r1 = px(CP, Math.max(200, x), pay(Math.max(200, x)));
  const jumped = f >= JUMP;
  const head: P = !jumped ? q1 : x <= 200.01 ? lerpP(B1, B2, jT) : r1;
  const gap = prog(f, L(12), 12);
  const morph = eio(prog(f, MORPH0, MORPH1 - MORPH0));
  const fadeUi = 1 - eo(prog(f, MORPH0 - 6, 20));
  const beamFlash = jumped ? 1 - eo(prog(f, JUMP, 22)) : 0;
  const beamOn = jumped ? eo(prog(f, JUMP, 6)) : 0;
  const bx = B1[0];
  const tickHot = jumped ? 1 : 0;
  // 变形：整条（含断口）的折线 → 波浪最前一根
  const target = morph > 0 ? waveFrontPts(SC.wave, LINE_PTS.length) : null;
  const morphD = target ? ptsD(LINE_PTS.map((p, i) => lerpP(p, target[i], morph))) : '';
  const moving = x > 0 && x < 399.5;
  const xq = pieceX(fq2(f));
  const hot = hotness(pieceX, f, 6);
  const pj = makePJ(f);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={camCss(cam)}>
        <Svg>
          <g transform={camG(cam)}>
            <g opacity={fadeUi}>
              <Axes c={CP} f={f} at={a + 4} hide={tickHot ? [200] : []} labels={false} />
              {/* 红光柱 + x 轴红色虚线标记 */}
              {jumped ? (
                <g>
                  <rect x={bx - 40 * beamFlash - 6} y={CP.oy - CP.h - 60} width={80 * beamFlash + 12} height={CP.h + 60} fill="#ff2a1a" opacity={0.55 * beamFlash + 0.12} filter="url(#b16)" />
                  <line x1={bx} x2={bx} y1={CP.oy - CP.h - 60} y2={CP.oy} stroke="#ff6a50" strokeWidth={3 + 6 * beamFlash} opacity={0.9 * beamFlash} filter="url(#b2)" />
                  <line x1={bx} x2={bx} y1={CP.oy} y2={CP.oy - (CP.oy - (CP.oy - CP.h - 60)) * beamOn} stroke="#ff4030" strokeWidth={2.2} strokeDasharray="9 7" opacity={0.95} />
                  <line x1={bx} x2={bx} y1={CP.oy} y2={CP.oy - CP.h - 60} stroke="#ff2a1a" strokeWidth={8} opacity={0.35} filter="url(#b7)" />
                  <circle cx={bx} cy={CP.oy} r={6} fill="#ff6a50" />
                  {/* y 轴上 170：红色虚线 */}
                  <line x1={CP.ox} x2={bx} y1={B2[1]} y2={B2[1]} stroke="#ff5a40" strokeWidth={1.8} strokeDasharray="7 7" opacity={0.85 * jT} />
                  <circle cx={B1[0]} cy={B1[1]} r={10} fill={C.bg} stroke="#ffe2b0" strokeWidth={3} />
                  <circle cx={B1[0]} cy={B1[1]} r={16} fill="none" stroke="#ffb04e" strokeWidth={5} opacity={0.5} filter="url(#b4)" />
                  <line x1={B1[0]} x2={B1[0]} y1={B1[1] + 10} y2={lerpP(B1, B2, jT)[1]} stroke="#fff0d0" strokeWidth={4} opacity={(1 - prog(f, JUMP + 8, 16)) * 0.9} filter="url(#b2)" />
                  {jT >= 1 ? <Marker p={B2} r={8} /> : null}
                </g>
              ) : null}
            </g>
            {/* 线：变形前两段；变形中整条折线向波浪变形 */}
            {morph <= 0 ? (
              <g>
                {x > 0 ? <HotLine d={`M${q0[0]},${q0[1]} L${q1[0]},${q1[1]}`} w={3.3} /> : null}
                {x > 200.5 ? <HotLine d={`M${B2[0]},${B2[1]} L${r1[0]},${r1[1]}`} w={3.3} /> : null}
              </g>
            ) : (
              <HotLine d={morphD} w={3.3} />
            )}
            <g opacity={fadeUi}>
              {moving && !(jumped && x <= 200.01 && jT < 1) ? <Projection c={CP} p={head} xv={String(Math.round(xq))} yv={String(Math.round(xq < 200 ? xq : pay(xq)))} o={jumped && x < 205 ? 0 : 1} text={false} /> : null}
              <Sparks p={B1} f={f} at={JUMP} n={80} scale={1.2} />
              {jumped && beamFlash > 0 ? <circle cx={B1[0]} cy={B1[1]} r={30 + 140 * (1 - beamFlash)} fill="none" stroke="#ffd0a0" strokeWidth={6 * beamFlash} opacity={beamFlash} filter="url(#b2)" /> : null}
              {jumped && beamFlash > 0 ? <circle cx={B1[0]} cy={B1[1]} r={70} fill="url(#halo2)" opacity={beamFlash} /> : null}
              {/* 买多反而付少 */}
              {gap > 0 ? (
                <g opacity={eo(gap)}>
                  <circle cx={px(CP, 195, 195)[0]} cy={px(CP, 195, 195)[1]} r={18} fill="none" stroke={C.orange} strokeWidth={2.4} filter="url(#b1)" />
                  <circle cx={B2[0]} cy={B2[1]} r={22} fill="none" stroke={C.green} strokeWidth={2.4} filter="url(#b1)" />
                </g>
              ) : null}
            </g>
            {moving || (x >= 399.5 && f < MORPH0) ? <Flare p={head} f={f} size={jumped && f < JUMP + 30 ? 1.6 : 1.3} /> : null}
            {morph > 0 && target ? <Flare p={lerpP(head, target[0], morph)} f={f} size={1.3} ghost={false} /> : null}
          </g>
        </Svg>
      </AbsoluteFill>
      {/* v5：图上文字在屏幕空间（锚点投影取整，字形固定缩放、不旋转） */}
      <Svg>
        <g opacity={fadeUi} style={TAB}>
          <AxesLabels c={CP} f={f} at={a + 4} pj={pj} hide={tickHot ? [200] : []} />
          {jumped ? (
            <g>
              <At pj={pj} p={[bx, CP.oy + 39]}>
                <g fontFamily="serif">
                  <rect x={bx - 42} y={CP.oy + 12} width={84} height={36} rx={5} fill="#ff2a1a" opacity={0.25} />
                  <Label x={bx} y={CP.oy + 39} text="200" size={26} color="#ff8a70" anchor="middle" weight={600} />
                </g>
              </At>
              <At pj={pj} p={[CP.ox - 18, B2[1] + 8]}>
                <Label x={CP.ox - 18} y={B2[1] + 8} text="170" size={24} color="#ff8a70" anchor="end" weight={600} o={jT} />
              </At>
            </g>
          ) : null}
          {moving && !(jumped && x <= 200.01 && jT < 1) ? <ProjText c={CP} p={head} xv={String(Math.round(xq))} yv={String(Math.round(xq < 200 ? xq : pay(xq)))} o={jumped && x < 205 ? 0 : 1} pj={pj} /> : null}
              {/* 分段公式（发光衬线写出） */}
              {f >= BRACE ? (
                <At pj={pj} p={[1290, 752]}>
                  <GlowText x={1290} y={752} text="y =" size={58} f={f} at={BRACE} dur={14} />
                  <path d="M1418,668 q-22,0 -22,26 v28 q0,16 -16,19 q16,3 16,19 v28 q0,26 22,26" fill="none" stroke="#ffd99a" strokeWidth={3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - eo(prog(f, BRACE + 8, 12))} filter="url(#b1)" />
                  <path d="M1418,668 q-22,0 -22,26 v28 q0,16 -16,19 q16,3 16,19 v28 q0,26 22,26" fill="none" stroke="#ff9a3a" strokeWidth={9} opacity={0.4} filter="url(#b7)" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - eo(prog(f, BRACE + 8, 12))} />
                  <GlowText x={1438} y={712} text="x," size={46} f={f} at={BRACE + 14} dur={12} />
                  <GlowText x={1600} y={712} text="x < 200" size={40} f={f} at={BRACE + 20} dur={14} />
                  <GlowText x={1438} y={800} text="x − 30," size={46} f={f} at={BRACE + 26} dur={14} />
                  <GlowText x={1600} y={800} text="x ≥ 200" size={40} f={f} at={BRACE + 32} dur={14} />
                </At>
              ) : null}
          {gap > 0 ? (
            <g opacity={eo(gap)}>
              <At pj={pj} p={[bx + 40, 660]}>
                <GlowText x={bx + 40} y={660} text="195 → trả 195" size={34} f={f} at={L(12)} dur={12} color="#ffb09a" glow="#ff5a3a" italic={false} />
              </At>
              <At pj={pj} p={[bx + 40, 712]}>
                <GlowText x={bx + 40} y={712} text="200 → trả 170" size={34} f={f} at={L(12) + 8} dur={12} color="#b8ffcc" glow="#3fd06a" italic={false} />
              </At>
            </g>
          ) : null}
        </g>
      </Svg>
      {/* v4：HUD（招牌、数码管、印章）在屏幕空间，整像素，不随相机晃动 */}
      <Svg>
        <g opacity={fadeUi}>
          <Stroke pts={SIGN_PTS} f={f} at={a + 6} dur={30} w={2.6} />
          <Fade f={f} at={a + 30}>
            <Label x={SIGN.x + SIGN.w / 2} y={SIGN.y + 52} text="KHUYẾN MÃI" size={22} color="rgba(255,226,180,0.8)" anchor="middle" ls={8} />
            <Label x={SIGN.x + SIGN.w / 2} y={SIGN.y + 102} text="Mua từ 200 nghìn · giảm 30 nghìn" size={32} color={C.white} anchor="middle" />
          </Fade>
          <LedPanel x={360} y={150} f={f} at={a + 26} size={76} lw={200} gapY={30} digits={3} rows={[
            {label: 'TIỀN HÀNG', value: String(Math.round(xq)).padStart(3, ' '), unit: 'nghìn', hot},
            {label: 'GIẢM', value: jumped ? '-30' : '  0', unit: 'nghìn', hot: beamFlash},
            {label: 'PHẢI TRẢ', value: String(Math.round(pay(xq))).padStart(3, ' '), unit: 'nghìn', hot},
          ]} />
          <RedStamp x={Math.round(bx) + 30} y={120} words={['HÀM', 'SỐ', 'TỪNG', 'KHÚC']} f={f} at={STAMP} size={48} />
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

// ep57 · 3D 世界（竖屏）：一次建好所有物体，update(f) 纯函数地设置可见度 / 进度 / 变换 / uniform，返回相机。
// 共享世界 = 暗色无尽舞台 + 玻璃地面（倒影：Stage 里 y 取反再画一遍，只画 REFL 里的物体）+ 暖色雾。
// 门 = 金框 + 玻璃门板（门板就是"液体光容器"：液面高度 = 概率）；车 / 羊 = 透明玻璃雕塑（菲涅尔边缘光）。
import * as THREE from 'three';
import {staticFile} from 'remotion';
import {GOLD, Tube, U, V3, project, glassA, imgA, makeDoorField, makeGlass, makeGrid, makeHaze, makeImage, makePoints, makeTube, makeVessel, texReady, vesA} from './gl';
import {World} from './Stage';
import {
  ASK0, CARDS, CAR_IN, CAR_OUT0, CAR_OUT1, CLIMAX, CLOSE3, COLH, COLR, COLS_OUT, COLX, COLZ, COUNT0, DH, DOOR_SPAN, DW, ECARD0, FAR, FAR0, FAR1, FIELD0, FILL0,
  FINAL0, FLOCK0, FLOCK1, FRAMES, GOAT_IN, L, LE, MCARD0, MDX, MDZ, MH, MINE, MON0, MROWS, MCOLS, MW, OC, OM, OPEN2, OPEN3, OPEN3B, PICK1, POUR0, POUR1,
  POUR_PTS, PRIZE_OUT, Rect3, S3, SC, STROKES3, S3ID, TDX, TH, TIER_TO, TW, T_CAR, T_OPEN, T_RES, WAVE0, WAVE1, add, camAt, clamp, doorPt, eo, fogAt, headOf,
  len3, lerp, lerp3, mDoor, mul, prog, progOf, rand, rates, ss, sub, tierDoor, tierY, TXS, YAW,
} from './scene3';
import {CASES} from './facts';

const rng = (s: number) => rand(s * 7.13 + 0.37);
const WARM = ['#ffe6c0', '#ffd2a0', '#fff1dc', '#ffcf9a', '#ffdcb4'];
const win = (f: number, a: number, b: number, din = 30, dout = 30) => Math.min(ss(prog(f, a, din)), 1 - ss(prog(f, b, dout)));

/** 主舞台的可见度：飞去三层台时淡出，结尾飞回来时淡入 */
export const stageA = (f: number) => Math.max(1 - ss(prog(f, LE(11) + 26, 56)), ss(prog(f, LE(19) + 20, 50)));
/** fight 场景：门变小在下方，稍暗 */
export const fightDim = (f: number) => 1 - 0.45 * win(f, SC.fight + 10, SC.why + 10, 40, 40);
export const casesA = (f: number) => win(f, LE(11) + 50, LE(16) + 50, 60, 60);
export const milA = (f: number) => win(f, FIELD0, LE(19) + 14, 70, 40);
/** 门 3 / 门 2 的开门量 */
export const open3 = (f: number) => (f > LE(16) ? 0 : Math.max(ss(prog(f, OPEN3, 30)) * (1 - ss(prog(f, CLOSE3, 24))), ss(prog(f, OPEN3B, 30))));
export const open2 = (f: number) => ss(prog(f, OPEN2, 42));
/** 门 k 的液面（门板高度的比例） */
export const fillOf = (k: number, f: number) => {
  if (f > LE(16)) return 0;
  const base = ss(prog(f, FILL0, 30)) / 3;
  const pour = ss(prog(f, POUR0 + 14, POUR1 - POUR0));
  if (k === 3) return base * (1 - pour);
  if (k === 2) return base * (1 + pour);
  return base;
};

/* ---------------- 玻璃雕塑的几何 ---------------- */
const carGeo = () => {
  const s = new THREE.Shape();
  const P: [number, number][] = [[-0.58, 0.15], [-0.6, 0.27], [-0.52, 0.32], [-0.3, 0.35], [-0.15, 0.5], [0.13, 0.51], [0.3, 0.36], [0.52, 0.33], [0.6, 0.26], [0.59, 0.15]];
  s.moveTo(P[0][0], P[0][1]);
  for (const [x, y] of P.slice(1)) s.lineTo(x, y);
  s.lineTo(0.52, 0.15); s.absarc(0.36, 0.15, 0.155, 0, Math.PI, false);
  s.lineTo(-0.205, 0.15); s.absarc(-0.36, 0.15, 0.155, 0, Math.PI, false);
  s.lineTo(-0.58, 0.15);
  const w = new THREE.Path();
  w.moveTo(-0.13, 0.37); w.lineTo(0.2, 0.37); w.lineTo(0.09, 0.47); w.lineTo(-0.08, 0.47); w.lineTo(-0.13, 0.37);
  s.holes.push(w);
  const g = new THREE.ExtrudeGeometry(s, {depth: 0.34, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.025, bevelSegments: 3, curveSegments: 18});
  g.translate(0, 0, -0.17);
  return g;
};
const goatGeo = () => {
  const mk = (pts: [number, number][]) => { const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts.slice(1)) s.lineTo(x, y); s.closePath(); return s; };
  const body = mk([[-0.36, 0.48], [-0.25, 0.53], [0.1, 0.52], [0.18, 0.56], [0.24, 0.66], [0.3, 0.72], [0.38, 0.7], [0.45, 0.6], [0.43, 0.56], [0.36, 0.56], [0.34, 0.47], [0.31, 0.52], [0.24, 0.47], [0.2, 0.4], [0.2, 0.31],
    [0.19, 0.02], [0.14, 0.02], [0.13, 0.27], [0.05, 0.26], [-0.12, 0.26], [-0.19, 0.27], [-0.2, 0.02], [-0.25, 0.02], [-0.28, 0.3], [-0.34, 0.36], [-0.37, 0.44], [-0.41, 0.53]]);
  const horn = mk([[0.27, 0.7], [0.22, 0.81], [0.13, 0.86], [0.1, 0.82], [0.19, 0.78], [0.24, 0.69]]);
  const ear = mk([[0.27, 0.65], [0.16, 0.62], [0.26, 0.6]]);
  const g = new THREE.ExtrudeGeometry([body, horn, ear], {depth: 0.16, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.018, bevelSegments: 3, curveSegments: 8});
  g.translate(-0.02, 0, -0.08);
  return g;
};

export const buildWorld = (): World => {
  const scene = new THREE.Scene();
  const ups: ((f: number) => void)[] = [];
  const on = (fn: (f: number) => void) => ups.push(fn);
  const grp = (parent: THREE.Object3D = scene) => { const g = new THREE.Group(); parent.add(g); return g; };
  const tube = (parent: THREE.Object3D, pts: V3[] | V3[][], o: Parameters<typeof makeTube>[1] = {}) => { const t = makeTube(pts, o); parent.add(t.group); return t; };
  const glass = (parent: THREE.Object3D, geo: THREE.BufferGeometry, o: Parameters<typeof makeGlass>[1] = {}) => { const g = makeGlass(geo, o); parent.add(g); return g; };
  const IMG = (n: string) => staticFile('ep57/' + n + '.jpg');
  const REFL = new Set<THREE.Object3D>();
  const faceTo = (obj: THREE.Object3D, r: Rect3) => {
    const ez = new THREE.Vector3().crossVectors(new THREE.Vector3(...r.ex), new THREE.Vector3(...r.ey));
    obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(...r.ex), new THREE.Vector3(...r.ey), ez));
    obj.position.set(...r.c);
  };
  /** 卡片：不透明暗底 + （可选）照片；框由金线笔画画出 */
  const card = (parent: THREE.Object3D, r: Rect3, url: string | null, o: Parameters<typeof makeImage>[2] = {}) => {
    const back = makeImage(new THREE.PlaneGeometry(r.w * 0.99, r.h * 0.99), url ?? IMG('erdos'), {warm: 0, gain: 0, feather: 0.02});
    faceTo(back, r); back.renderOrder = 20; parent.add(back);
    const img = url ? makeImage(new THREE.PlaneGeometry(r.w * 0.93, r.h * 0.93), url, {warm: 0.42, gain: 0.82, feather: 0.05, ...o}) : null;
    if (img) { faceTo(img, r); img.renderOrder = 21; parent.add(img); }
    return (a: number) => { imgA(back, a * 0.9); if (img) imgA(img, a * 0.95); };
  };

  /* ======== 全局：暖色星空 + 远处金丝 + 浮尘（景深） + 暖色雾幕 ======== */
  let dustRef: THREE.Object3D, starsRef: THREE.Object3D;
  {
    const pos: V3[] = [], sz: number[] = [], col: string[] = [];
    for (let i = 0; i < 2200; i++) {
      const u = rng(i) * 2 - 1, th = rng(i + 0.5) * Math.PI * 2, r = 260 + 200 * rng(i + 0.9);
      const s = Math.sqrt(1 - u * u);
      pos.push([r * s * Math.cos(th), Math.abs(u) * r * 0.85 + 4, -60 + r * s * Math.sin(th)]);
      sz.push(0.3 + 0.5 * Math.pow(rng(i + 0.2), 3));
      col.push(WARM[i % WARM.length]);
    }
    const stars = makePoints(pos, sz, col, {cocPx: 0, maxPx: 5, soft: 0, minPx: 2.5});
    scene.add(stars); starsRef = stars;
    const dp: V3[] = [], ds: number[] = [], dc: string[] = [];
    for (let i = 0; i < 520; i++) {
      const c = camAt(Math.floor(rng(i + 3.3) * FRAMES)).tgt;
      dp.push([c[0] + (rng(i + 1.1) - 0.5) * 26, c[1] + (rng(i + 1.7) - 0.4) * 14, c[2] + (rng(i + 2.3) - 0.5) * 30]);
      ds.push(0.008 + 0.014 * rng(i + 4.4));
      dc.push(['#ffb060', '#ff9a50', '#ffd8a0', '#ffe8d0', '#ffc27a'][i % 5]);
    }
    for (let i = 0; i < 160; i++) {
      const c = camAt(Math.floor(rng(i + 7.7) * FRAMES));
      const fw = mul(sub(c.tgt, c.pos), 1 / (len3(sub(c.tgt, c.pos)) || 1));
      const p0 = add(c.pos, mul(fw, 3 + 6 * rng(i + 8.1)));
      dp.push([p0[0] + (rng(i + 8.5) - 0.5) * 5, p0[1] + (rng(i + 8.9) - 0.5) * 8, p0[2] + (rng(i + 9.3) - 0.5) * 9]);
      ds.push(0.004 + 0.006 * rng(i + 9.7));
      dc.push(['#ffb060', '#ffc890', '#ffd8a0', '#ffe8d0'][i % 4]);
    }
    const dust = makePoints(dp, ds, dc, {drift: 0.3, cocPx: 22, maxPx: 34, soft: 0.8, minPx: 2.5, near0: 1.2, near1: 4.0});
    scene.add(dust); dustRef = dust;
    on((f) => {
      const calm = 1 - 0.6 * Math.min(ss((f - CLIMAX + 10) / 10), 1 - ss((f - CLIMAX - 100) / 40));
      const ca = camAt(f).pos, cb = camAt(f + 1).pos;
      const fly = ss(clamp((len3(sub(cb, ca)) - 0.15) / 0.25));
      dust.mat.uniforms.uA.value = 0.42 * calm * (1 - 0.8 * fly);
      stars.mat.uniforms.uA.value = 0.85;
    });
    const strands = (c: V3, n: number, seed: number, a = 0.2) => {
      for (let k = 0; k < n; k++) {
        const x = c[0] + (k % 2 ? 1 : -1) * (16 + 6 * k);
        const ph = rng(seed + k + 0.8) * 6;
        const pts: V3[] = Array.from({length: 160}, (_, i) => { const t = i / 159; return [x + 4 * Math.sin(t * 4 + ph), c[1] + (k % 2 ? 12 + 3 * k : 9 + 2 * k) + 1.6 * Math.sin(t * 6 + ph), c[2] + 30 - 160 * t]; });
        const t = tube(scene, pts, {r: 0.03, minPx: 0.8});
        t.set({a: a * (0.6 + 0.4 * rng(seed + k + 0.2))});
        t.uni('uWave', 0.6); t.uni('uHot', 0);
      }
    };
    strands([0, 2, -10], 6, 11);
    strands(OC, 4, 23, 0.2);
    strands(OM, 4, 37, 0.18);
    // 暖色雾幕（每个场景背后一块，很淡）
    const haze = (c: V3, w: number, h: number, a: number, fa: (f: number) => number) => { const m = makeHaze(w, h, '#3a2008'); m.position.set(...c); scene.add(m); on((f) => { m.mat.uniforms.uA.value = a * fa(f); m.visible = a * fa(f) > 0.003; }); return m; };
    haze([0, 5, -34], 90, 46, 0.55, (f) => stageA(f));
    haze(add(OC, [0, 4, -30]), 80, 46, 0.5, casesA);
    haze(add(OM, [0, 8, -170]), 260, 90, 0.5, milA);
  }

  /* ======== 笔画：每一笔一个发光管 ======== */
  const tubes: Record<string, Tube> = {};
  const strokeA: Record<string, (f: number) => number> = {};
  for (const s of STROKES3) {
    if (s.kind === 'trace' || !s.pts.length) continue;
    tubes[s.id] = tube(scene, s.pts, {r: s.r ?? (s.kind === 'link' ? 0.01 : 0.016), color: s.color ?? GOLD, core: s.core});
  }
  for (const id of ['mcard', 'ecard', 'mon']) if (tubes[id]) { tubes[id].core.renderOrder = 22; tubes[id].halo.renderOrder = 22; }
  for (const id of ['doors', 'host', 'ask', 'ring1', 'ring2', 'host2', 'pour', 'rise', 'door2', 'final']) if (tubes[id]) REFL.add(tubes[id].group);
  const linkA = (s: S3) => (f: number) => (s.bridge ? 0.6 * (1 - ss(prog(f, s.at + s.dur + (s.id === 'bridge-base' ? 10 : 120), s.id === 'bridge-base' ? 40 : 80))) : 0.4 * (1 - prog(f, s.at + s.dur + 6, 36)));
  on((f) => {
    for (const s of STROKES3) {
      const t = tubes[s.id];
      if (!t) continue;
      if (f < s.at - 1) { t.set({a: 0}); continue; }
      const p1 = progOf(s, f);
      const a = (strokeA[s.id] ?? (s.kind === 'link' ? linkA(s) : () => 1))(f);
      t.set({p1: Math.max(p1, 0), a: p1 > 0 ? a : 0});
    }
  });
  // 各笔画什么时候退场
  strokeA.enter = (f) => 0.8 * (1 - ss(prog(f, PICK1, 40)));
  strokeA.doors = (f) => stageA(f) * fightDim(f) * (f > CLIMAX + 60 ? 1 - 0.3 * ss(prog(f, CLIMAX + 60, 60)) : 1);
  strokeA.pick = (f) => (1 - ss(prog(f, LE(3) + 20, 40))) * 0.9;
  strokeA.host = (f) => 0.6 * (1 - ss(prog(f, OPEN3 + 6, 30)));
  strokeA.ask = (f) => 1 - ss(prog(f, SC.fight + 10, 30));
  strokeA.strike = (f) => 1 - ss(prog(f, L(5) - 4, 20));
  strokeA.mcard = (f) => 1 - ss(prog(f, SC.why - 30, 30));
  strokeA.flock = (f) => 0.7 * (1 - ss(prog(f, FLOCK1 + 10, 50)));
  strokeA.ecard = strokeA.mcard; strokeA.mon = strokeA.mcard;
  strokeA.ring1 = (f) => 1 - ss(prog(f, POUR1 + 10, 40));
  strokeA.ring2 = (f) => (1 - 0.5 * ss(prog(f, POUR0 + 10, 30))) * (1 - ss(prog(f, POUR1 + 10, 40)));
  strokeA.host2 = (f) => 0.6 * (1 - ss(prog(f, OPEN3B + 6, 30)));
  strokeA.pour = (f) => 0.8 * (1 - ss(prog(f, POUR1 + 4, 30)));
  for (const k of [1, 2, 3]) strokeA['tier' + k] = (f) => casesA(f) * (k === 1 ? 1 - 0.75 * ss(prog(f, L(16), 20)) : 1);
  strokeA.brace = casesA;
  strokeA.mine = milA;
  strokeA.far = (f) => milA(f);
  strokeA.base = (f) => 1 - ss(prog(f, COLS_OUT, 24));
  strokeA.rise = strokeA.base;
  strokeA.door2 = (f) => 1;

  /* ======== 主舞台：地面 + 三扇门（门板 = 液体光容器）+ 车 / 羊 + 结尾光柱 ======== */
  const gS = grp(); REFL.add(gS);
  const gFloor = grp();
  {
    const floor = makeGrid([0, 0, 1], 9, 1.0, '#5a3a16');
    gFloor.add(floor.group);
    const pool = makeHaze(18, 14, '#2a1608'); pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.003, 1); gFloor.add(pool);
    on((f) => { const a = stageA(f) * fightDim(f); gFloor.visible = a > 0.003; floor.set({a: 0.28 * a}); pool.mat.uniforms.uA.value = 0.8 * a; });

    // 门板：铰链在左边；门板本身是容器
    const leafGeo = new THREE.PlaneGeometry(DW * 0.92, DH * 0.95).translate(DW * 0.46, DH * 0.475, 0);
    const leaves = [1, 2, 3].map((k) => {
      const hinge = grp(gS);
      hinge.position.set(...doorPt(k, -DW / 2 + 0.04, 0.02, 0));
      const v = makeVessel(leafGeo, {liq: '#ff9a3a', glass: '#ffcf8a'});
      hinge.add(v);
      // 门把手（小玻璃球）
      const knob = glass(hinge, new THREE.SphereGeometry(0.045, 14, 10), {color: '#ffc27a', rim: '#ffe2b4', body: 0.4, spec: 0.3});
      knob.position.set(DW * 0.82, DH * 0.46, 0.04);
      return {k, hinge, v, knob};
    });
    // 门背后的暖光（结尾门 2 打开时）+ 地面溢光
    const light2 = glass(gS, new THREE.PlaneGeometry(DW * 0.96, DH * 0.97), {color: '#ff9a40', rim: '#fff0d0', body: 0, spec: 0});
    light2.position.set(...doorPt(2, 0, DH * 0.485, -0.08));
    const spill2 = glass(gS, new THREE.PlaneGeometry(DW * 1.1, 2.2).rotateX(-Math.PI / 2).translate(0, 0.01, 1.1), {color: '#ffb060', rim: '#ffb060', body: 0, spec: 0});
    spill2.position.set(...doorPt(2, 0, 0, 0));
    // 车 / 羊
    const CG = carGeo(), GG = goatGeo();
    const carT = {color: '#ffe6c0', rim: '#fff0d8', body: 0.07, spec: 0.4};
    const goatT = {color: '#ffc27a', rim: '#ffd9a6', body: 0.09, spec: 0.35};
    const car0 = glass(gS, CG, carT), goatA = glass(gS, GG, goatT), goatB = glass(gS, GG, goatT), goat3 = glass(gS, GG, goatT), car2 = glass(gS, CG, carT);
    const wheelGeo = new THREE.TorusGeometry(0.11, 0.032, 10, 28);
    const wheels = (car: THREE.Object3D) => [[-0.36, 0.2], [0.36, 0.2], [-0.36, -0.2], [0.36, -0.2]].map(([x, z]) => { const w = glass(car, wheelGeo, {color: '#ffd09a', rim: '#ffe2b4', body: 0.12, spec: 0.3}); w.position.set(x, 0.15, z); return w; });
    const w0 = wheels(car0), w2 = wheels(car2);
    goatB.scale.x = -1;
    // 两根光柱（结尾）
    const colGeo = new THREE.CylinderGeometry(COLR, COLR, COLH, 48, 1, true).translate(0, COLH / 2, 0);
    const cols = COLX.map((x, i) => {
      const v = makeVessel(colGeo, {liq: i ? '#ffa040' : '#e88a3a', glass: '#ffcf8a', side: false, glassA: 0.8});
      v.mat.uniforms.uLiqA.value = 0.62;
      v.position.set(x, 0, COLZ); gS.add(v);
      const rims = [0.01, COLH].map((y) => { const t = glass(gS, new THREE.TorusGeometry(COLR, 0.012, 8, 48).rotateX(Math.PI / 2), {color: '#ffc27a', rim: '#ffd9a6', body: 0.3, spec: 0.2}); t.position.set(x, y, COLZ); return t; });
      return {v, rims};
    });
    on((f) => {
      const sa = stageA(f);
      gS.visible = sa > 0.003;
      if (!gS.visible) return;
      const fd = fightDim(f);
      const sp = progOf(S3ID.doors, f);
      for (const L1 of leaves) {
        const [a0, a1] = DOOR_SPAN[L1.k - 1];
        const app = f < 200 ? eo(clamp((sp - a0) / (a1 - a0 + 0.02))) : 1;
        const op = L1.k === 3 ? open3(f) : L1.k === 2 ? open2(f) : 0;
        L1.hinge.rotation.y = YAW[L1.k] + 1.45 * op;
        const chosen = L1.k === 1 ? ss(prog(f, PICK1 - 10, 20)) * (1 - ss(prog(f, SC.fight, 30))) : 0;
        vesA(L1.v, app * sa * fd * (1 - 0.35 * op));
        L1.v.fill(fillOf(L1.k, f));
        L1.v.mat.uniforms.uGlassA.value = 0.9 + 1.4 * chosen;
        glassA(L1.knob, app * sa * fd * 0.8);
      }
      // 车 / 羊的"惊鸿一瞥"（hook）：浮在门前，然后退回门后消失
      const back = ss(prog(f, PRIZE_OUT, 24));
      const pa = (t0: number) => eo(prog(f, t0, 14)) * (1 - back) * sa;
      car0.position.set(0, 0.04, lerp(2.2, -1.2, back)); car0.scale.setScalar(1.15); car0.rotation.y = 0.12 * Math.sin(f * 0.03);
      glassA(car0, pa(CAR_IN)); w0.forEach((w) => glassA(w, pa(CAR_IN)));
      goatA.position.set(lerp(-1.55, -0.9, back), 0.02, lerp(1.9, -1.2, back)); glassA(goatA, pa(GOAT_IN));
      goatB.position.set(lerp(1.55, 0.9, back), 0.02, lerp(1.9, -1.2, back)); glassA(goatB, pa(GOAT_IN + 4));
      // 门 3 后面的羊（门开多少，就看见多少）
      goat3.position.set(...doorPt(3, 0.05, 0.02, -0.7)); goat3.rotation.y = YAW[3] + Math.PI;
      glassA(goat3, open3(f) * sa * fd);
      // 结尾：门 2 的光 + 玻璃车开出来
      const o2 = open2(f);
      const glow = ss(prog(f, OPEN2 - 10, 30)) * (1 + 0.05 * Math.sin(f * 0.05));
      glassA(light2, 0.6 * glow * sa); light2.mat.uniforms.uBody.value = 0.24;
      glassA(spill2, 0.4 * o2 * sa); spill2.mat.uniforms.uBody.value = 0.14;
      const ro = ss(prog(f, CAR_OUT0, CAR_OUT1 - CAR_OUT0));
      const cp = lerp3(doorPt(2, 0, 0.03, -0.75), [0.05, 0.03, 0.4], ro);
      car2.position.set(...cp); car2.rotation.y = lerp(0, -0.5, ro); car2.scale.setScalar(0.95);
      glassA(car2, 0.55 * o2 * sa); w2.forEach((w) => { glassA(w, 0.55 * o2 * sa); w.rotation.z = -ro * 9; });
      // 光柱
      const ca = Math.min(eo(prog(f, L(20) - 12, 20)), 1 - ss(prog(f, COLS_OUT, 24)));
      const r = rates(f);
      cols.forEach((c, i) => {
        vesA(c.v, ca * sa); c.v.fill(i ? r.sw : r.stay);
        c.rims.forEach((t) => glassA(t, 0.7 * ca * sa));
      });
    });
    void COUNT0;
  }

  /* ======== fight：Marilyn（文字卡）、信封群、Erdős 照片卡 + 老电脑 ======== */
  {
    const g = grp();
    const cs = CARDS();
    const mc = card(g, cs.marilyn, null);
    const ec = card(g, cs.erdos, IMG('erdos'), {warm: 0.4, gain: 0.85, feather: 0.06});
    const mon = cs.monitor;
    const monBody = glass(g, new THREE.BoxGeometry(mon.w * 1.06, mon.h * 1.08, mon.w * 0.55), {color: '#2a1608', rim: '#ffcf8a', body: 0.12, spec: 0.15});
    faceTo(monBody, mon);
    monBody.position.set(...add(mon.c, mul(new THREE.Vector3().crossVectors(new THREE.Vector3(...mon.ex), new THREE.Vector3(...mon.ey)).toArray() as V3, -mon.w * 0.3)));
    const monScr = card(g, mon, null);
    // 信封：金色玻璃薄片，沿螺旋上升
    const envGeo = new THREE.BoxGeometry(0.44, 0.29, 0.014);
    const flock = S3ID.flock.pts;
    const envs = Array.from({length: 70}, (_, i) => {
      const e = glass(g, envGeo, {color: '#ffb46a', rim: '#ffe2b4', body: 0.2, spec: 0.4});
      const t0 = FLOCK0 + Math.round(rng(i + 40) * (FLOCK1 - FLOCK0 + 20)) - 6;
      const off: V3 = [(rng(i + 41) - 0.5) * 2.6, (rng(i + 42) - 0.5) * 1.6, (rng(i + 43) - 0.5) * 2.4];
      return {e, t0, off, sp: 0.6 + 0.6 * rng(i + 44), rx: rng(i + 45) * 6};
    });
    on((f) => {
      const vis = win(f, SC.fight - 10, SC.why - 20, 20, 30);
      g.visible = vis > 0.003;
      if (!g.visible) return;
      mc(eo(prog(f, MCARD0 + 4, 16)) * vis);
      ec(eo(prog(f, ECARD0 + 6, 16)) * vis);
      const ma = eo(prog(f, MON0 + 4, 14)) * vis;
      glassA(monBody, 0.6 * ma); monScr(ma);
      const c = camAt(f);
      for (const v of envs) {
        const u = clamp((f - v.t0) / (70 / v.sp));
        if (u <= 0 || u >= 1 || f > L(7) + 30) { v.e.visible = false; continue; }
        const p = add(headOf(flock, u), mul(v.off, 1 + 0.8 * u));
        v.e.position.set(...p);
        v.e.rotation.set(v.rx + f * 0.05 * v.sp, f * 0.03, 0.3 * Math.sin(f * 0.04 + v.rx));
        const d = len3(sub(p, c.pos));
        const fall = 1 / (1 + Math.max(0, d - 16) / 8);
        glassA(v.e, Math.min(eo(u / 0.15), 1 - ss((u - 0.75) / 0.25)) * 0.85 * fall * vis * (1 - ss(prog(f, L(7), 30))));
      }
    });
  }

  /* ======== why：液体光从门 3 流进门 2 ======== */
  {
    const stream = tube(scene, POUR_PTS, {r: 0.05, minPx: 2.0, color: '#ff9a3a', core: '#ffd08a'});
    stream.uni('uHot', 0); stream.uni('uFlow', 7);
    REFL.add(stream.group);
    on((f) => {
      const s0 = ss(prog(f, POUR0 + 6, 30)), s1 = 1 - ss(prog(f, POUR1 + 8, 22));
      const a = Math.min(s0, s1) * stageA(f);
      // 液体前沿紧跟笔头（不超过笔头）；尾巴在门 3 倒空时离开
      stream.set({p1: progOf(S3ID.pour, f), p0: ss(prog(f, POUR1 - 6, 24)), a: 0.55 * a});
    });
  }

  /* ======== cases：三层玻璃台，每层三扇小门 ======== */
  {
    const g = grp();
    const slabGeo = new THREE.BoxGeometry(3.4, 0.05, 1.3);
    const tierObjs = [1, 2, 3].map((k) => {
      const slab = glass(g, slabGeo, {color: '#3a2410', rim: '#ffcf8a', body: 0.18, spec: 0.25});
      slab.position.set(OC[0] + TXS, tierY(k) - 0.03, OC[2] + 0.1);
      const edge = tube(g, [[OC[0] + TXS - 1.7, tierY(k) + 0.0, OC[2] + 0.75], [OC[0] + TXS + 1.7, tierY(k) + 0.0, OC[2] + 0.75]], {r: 0.006, minPx: 0.8, halo: false});
      edge.uni('uHot', 0);
      const cs = CASES[k - 1];
      const doors = [1, 2, 3].map((j) => {
        const b = tierDoor(k, j);
        const fr = tube(g, [[b[0] - TW / 2, b[1], b[2] + 0.02], [b[0] - TW / 2, b[1] + TH, b[2] + 0.02], [b[0] + TW / 2, b[1] + TH, b[2] + 0.02], [b[0] + TW / 2, b[1], b[2] + 0.02]] as V3[], {r: 0.01, minPx: 0.9, halo: true});
        fr.uni('uHot', 0);
        const hinge = grp(g); hinge.position.set(b[0] - TW / 2 + 0.02, b[1] + 0.01, b[2]);
        const leaf = makeVessel(new THREE.PlaneGeometry(TW * 0.92, TH * 0.95).translate(TW * 0.46, TH * 0.475, 0), {liq: '#ff9a3a', glass: '#ffcf8a'});
        hinge.add(leaf);
        const isCar = cs.car === j;
        const prize = glass(g, isCar ? carGeo() : goatGeo(), isCar ? {color: '#ffe6c0', rim: '#fff0d8', body: 0.1, spec: 0.45} : {color: '#ffc27a', rim: '#ffd9a6', body: 0.09, spec: 0.35});
        prize.scale.setScalar(isCar ? 0.52 : 0.6);
        prize.position.set(b[0], b[1] + 0.01, b[2] - 0.35);
        return {j, fr, hinge, leaf, prize, isCar};
      });
      return {k, slab, edge, doors, cs};
    });
    on((f) => {
      const a = casesA(f);
      g.visible = a > 0.003;
      if (!g.visible) return;
      const merge = ss(prog(f, L(16), 24));
      for (const t of tierObjs) {
        const tin = eo(prog(f, LE(11) + 60 + (t.k - 1) * 10, 30));
        const res = ss(prog(f, T_RES[t.k] - 2, 12));
        const win2 = t.cs.switchWins;
        const lvl = a * tin * (t.k === 1 ? 1 - 0.6 * merge : 1);
        glassA(t.slab, 0.55 * lvl * (1 + (win2 ? 0.6 : -0.3) * res));
        t.edge.set({a: 0.45 * lvl});
        for (const d of t.doors) {
          const op = d.j === t.cs.open ? ss(prog(f, T_OPEN[t.k], 20)) : 0;
          const carShow = d.isCar ? eo(prog(f, T_CAR[t.k], 12)) : 0;
          d.hinge.rotation.y = 1.4 * op;
          const sw = d.j === TIER_TO[t.k] ? res : 0;
          d.fr.set({a: lvl * (0.55 + 0.45 * (d.j === 1 ? 1 : sw))});
          vesA(d.leaf, lvl * 0.9);
          // 换门后的那扇：赢 = 液体光灌满；输 = 门 1 的车被留下，换去的门是空羊
          d.leaf.fill(d.j === TIER_TO[t.k] ? res * (win2 ? 0.95 : 0.12) : 0);
          glassA(d.prize, lvl * Math.max(carShow * 0.85, op) * (d.isCar && !win2 && d.j === 1 ? 1 - 0.5 * res : 1));
        }
      }
    });
    void TDX;
  }

  /* ======== million：门阵（一份几何），熄灯波 ======== */
  {
    const g = grp();
    const doors = [];
    const mine = mDoor(MINE.r, MINE.c);
    for (let r = 0; r < MROWS; r++) for (let c = -MCOLS; c <= MCOLS; c++) {
      const b = mDoor(r, c);
      const keep = (r === MINE.r && c === MINE.c) || (r === FAR.r && c === FAR.c);
      doors.push({base: b, w: MW, h: MH, dist: Math.hypot(b[0] - mine[0], b[2] - mine[2]), keep});
    }
    const field = makeDoorField(doors, {r: 0.014, minPx: 1.0, farK: 16});
    g.add(field);
    const floor = makeGrid(add(OM, [0, 0, -40]), 60, MDZ, '#4a3014');
    g.add(floor.group);
    const maxD = Math.hypot(MCOLS * MDX * 2, MROWS * MDZ);
    on((f) => {
      const a = milA(f);
      g.visible = a > 0.003;
      if (!g.visible) return;
      // 门阵从近处往远处依次亮起（"拉远"时露出来）
      const reveal = ss(prog(f, FIELD0 + 20, 110));
      field.mat.uniforms.uA.value = a;
      const wv = ss(prog(f, WAVE0, WAVE1 - WAVE0));
      field.mat.uniforms.uWave.value = f < WAVE0 ? -10 : lerp(0, maxD + 10, wv);
      field.mat.uniforms.uWaveW.value = 10;
      field.mat.uniforms.uKeepB.value = 1 + 0.6 * ss(prog(f, FAR1 - 10, 20));
      field.mat.uniforms.uFarK.value = lerp(4, 16, reveal);
      floor.set({a: 0.22 * a});
    });
    void FAR0; void MDX;
  }

  /* ======== 高潮：从笔头炸开成细光丝 ======== */
  {
    const g = grp();
    const P0: V3 = [COLX[1], COLH * rates(CLIMAX).sw, COLZ + COLR + 0.06];
    // ep57: roots start on a small sphere (0.15–0.35) so 60 additive roots don't pile into one white blob at the pen
    // ep57 fix: keep filaments off the "≈ 2/3" label (screen-space box around the label, checked at several frames of the burst)
    const LBL: V3 = [COLX[1], COLH + 0.38, COLZ];
    const clear = (pts: V3[]) => [CLIMAX, CLIMAX + 15, CLIMAX + 30, CLIMAX + 50, CLIMAX + 75].every((fr) => {
      const c = camAt(fr); const [lx, ly] = project(c, LBL); const cy = ly - 124 - 20;
      return pts.every((q) => { const [x, y] = project(c, q); return Math.abs(x - lx) > 150 || Math.abs(y - cy) > 62; });
    });
    const fils: Tube[] = [];
    for (let i = 0; fils.length < 60 && i < 2000; i++) {
      const u = rng(i + 500) * 2 - 1, th = rng(i + 501) * Math.PI * 2, s = Math.sqrt(1 - u * u);
      const dir: V3 = [s * Math.cos(th) * 0.85, Math.abs(u) * 0.8 + 0.1, s * Math.sin(th) * 0.4 + 0.3];
      const Ln = 2.5 + 5.5 * rng(i + 502), curl = (rng(i + 503) - 0.5) * 0.6, r0 = 0.15 + 0.2 * rng(i + 505);
      const sideV: V3 = [-dir[2], 0.3 * (rng(i + 504) - 0.5), dir[0]];
      const pts: V3[] = Array.from({length: 40}, (_, k) => { const t = k / 39; return add(P0, add(mul(dir, r0 + Ln * t), mul(sideV, curl * Ln * t * t))); });
      if (!clear(pts)) continue;
      fils.push(tube(g, pts, {r: 0.009, minPx: 0.8, color: fils.length % 3 ? GOLD : '#ffd9a0'}));
    }
    fils.forEach((t) => t.uni('uHot', 0));
    on((f) => {
      g.visible = f >= CLIMAX && f < CLIMAX + 120;
      if (!g.visible) return;
      const gr = eo(prog(f, CLIMAX, 46)), fo = 0.3 * (1 - prog(f, CLIMAX + 24, 80));
      fils.forEach((t) => t.set({p1: Math.max(0.01, gr), p0: 0.6 * eo(prog(f, CLIMAX + 10, 80)), a: fo}));
    });
  }

  /* ======== 结尾：Monty Hall 照片卡（小） ======== */
  {
    const g = grp();
    const mc = card(g, CARDS().monty, IMG('monty'), {warm: 0.45, gain: 0.8, lift: 0.08, feather: 0.06});
    const fr = tube(g, CARDS().monty.pts, {r: 0.006, minPx: 0.9});
    fr.uni('uHot', 0); fr.core.renderOrder = 22; fr.halo.renderOrder = 22;
    on((f) => {
      const a = win(f, L(2) + 2, L(3) + 6, 16, 22);
      g.visible = a > 0.003;
      mc(a); fr.set({a: 0.7 * a});
    });
  }

  /* ======== 每帧：相机、雾、景深 ======== */
  const update = (f: number) => {
    U.uTime.value = f / 30;
    for (const fn of ups) fn(f);
    const c = camAt(f);
    U.uFocus.value = len3(sub(c.tgt, c.pos));
    U.uCoc.value = 0.035;
    const fg = fogAt(f);
    U.uFog.value = fg.fog; U.uFogNear.value = fg.near;
    U.uDim.value = 1;
    return c;
  };
  // 倒影：只有主舞台的东西（REFL）留下；亮度很低，结尾稍亮一点
  const saved = new Map<THREE.Object3D, boolean>();
  const refl = (f: number, onP: boolean) => {
    if (onP) {
      const k = 0.12 * stageA(f) * fightDim(f);
      if (k < 0.003) return 0;
      saved.clear();
      for (const o of scene.children) { saved.set(o, o.visible); if (!REFL.has(o)) o.visible = false; }
      void dustRef; void starsRef;
      return k;
    }
    for (const [o, v] of saved) o.visible = v;
    saved.clear();
    return 0;
  };
  void FINAL0; void ASK0;
  return {scene, update, refl, ready: texReady()};
};

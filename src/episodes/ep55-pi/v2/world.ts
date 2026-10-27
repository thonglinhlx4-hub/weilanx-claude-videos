// ep55 v2 · 3D 世界：一次建好所有物体，update(f) 每帧纯函数地设置可见度 / 进度 / 变换 / uniform，返回相机。
// 层次：星空（远）→ 每场自己的环境（网格地面、玻璃环、柱子、远处金丝）→ 主体（玻璃物件 + 金线）→ 浮尘散景（前景，景深）。
import * as THREE from 'three';
import {
  GOLD, Tube, U, V3, glassA, imgA, makeGlass, makeGrid, makeImage, makePoints, makeTube, texReady,
} from './gl';
import {World} from './Stage';
import {staticFile} from 'remotion';
import {
  AC3, AFRAME, AR3, BR, BURST, CHIPS, CHIP_AT, CLIMAX, CURIOUS_AT, D_CIRC, DC, DR, E_AT, ER3, FINAL_AT, FINAL_DUR, FIN3, FRAMES, INSET_IN, INSET_OUT,
  L, LDIST3, LROLL0, LROLL_DUR3, LW_AT, LWR3, LX03, NASA_AT, NFRAME, O1, O2, O3, O4, O5, O5B, O5C, O6, OBJ, OBJ3, OBJ_IN, ORB_IN, ORB_R, O_AT, PEX, PEY, PEZ,
  PERIOD_AT, Q_AT, QMARK, QMARK_AT, REM_AT, RIVER, ROLL0, ROLL_DUR, S3, S3ID, SC, SINE_IN, SK3, SAMP, SN, STEP3, STROKES3, SXH, TILT, TRACK_END, VOY_AT,
  VOY_C, VOY_PROBE, CARDS, card3, NUM_AT, NASA_AT as NASA_AT2, WHEEL_AT, WHEEL_DUR, WHEEL_LOCAL, WR, WX0, ZF, add, bez, camAt, circ3, clamp, cr3, densify, eo, headOf, lerp, lerp3, len3, lrollE,
  lwheelM, morphUV, mul, orbP, plane, prog, progOf, ptsOf, rand, satAng, sine3, ss, sub, tracePen, wheelM, BREATH0, WHY_AT, ERR_AT, LFORM_AT,
} from './scene3';

const rng = (s: number) => rand(s * 7.13 + 0.37);
const glassMat = (o: Parameters<typeof makeGlass>[1]) => o;

export const buildWorld = (): World => {
  const scene = new THREE.Scene();
  const ups: ((f: number) => void)[] = [];
  const on = (fn: (f: number) => void) => ups.push(fn);
  const grp = (parent: THREE.Object3D = scene) => { const g = new THREE.Group(); parent.add(g); return g; };
  const tube = (parent: THREE.Object3D, pts: V3[] | V3[][], o: Parameters<typeof makeTube>[1] = {}) => { const t = makeTube(pts, o); parent.add(t.group); return t; };
  const glass = (parent: THREE.Object3D, geo: THREE.BufferGeometry, o: Parameters<typeof makeGlass>[1] = {}) => { const g = makeGlass(geo, o); parent.add(g); return g; };
  const win = (g: THREE.Object3D, a: number, b: number) => on((f) => { g.visible = f >= a && f <= b; });
  const IMG = (n: string) => staticFile('ep55/' + n + '.jpg');
  /** 金框照片卡：照片（柔光、羽化）+ 自己描出来的金框（无笔头，不抢唯一光点） */
  const photoCard = (parent: THREE.Object3D, cd: {c: V3; w: number; h: number; ex: V3; ey: V3; pts: V3[]}, url: string, o: Parameters<typeof makeImage>[2] = {}) => {
    const img = makeImage(new THREE.PlaneGeometry(cd.w * 0.94, cd.h * 0.94), url, {warm: 0.3, gain: 0.78, feather: 0.06, ...o});
    const ez = new THREE.Vector3().crossVectors(new THREE.Vector3(...cd.ex), new THREE.Vector3(...cd.ey));
    img.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(...cd.ex), new THREE.Vector3(...cd.ey), ez));
    img.position.set(...cd.c);
    parent.add(img);
    const fr = tube(parent, cd.pts, {r: 0.008, minPx: 0.9});
    fr.uni('uHot', 0);
    const set = (a: number, draw: number) => { imgA(img, a * 0.92); fr.set({p1: draw, a: draw > 0 ? a : 0}); };
    return {img, fr, set};
  };

  /* ======== 全局：星空 + 浮尘散景 ======== */
  {
    const pos: V3[] = [], sz: number[] = [], col: string[] = [];
    for (let i = 0; i < 2600; i++) {
      const u = rng(i) * 2 - 1, th = rng(i + 0.5) * Math.PI * 2, r = 260 + 220 * rng(i + 0.9);
      const s = Math.sqrt(1 - u * u);
      pos.push([60 + r * s * Math.cos(th), Math.abs(u) * r * 0.8 - 40, -90 + r * s * Math.sin(th)]);
      sz.push(0.25 + 0.55 * Math.pow(rng(i + 0.2), 3));
      col.push(['#ffffff', '#ffe6c0', '#cfdcff', '#ffd2a0'][i % 4]);
    }
    const stars = makePoints(pos, sz, col, {cocPx: 0, maxPx: 4, soft: 0});
    scene.add(stars);
    const dp: V3[] = [], ds: number[] = [], dc: string[] = [];
    for (let i = 0; i < 620; i++) {
      const c = camAt(Math.floor(rng(i + 3.3) * FRAMES)).tgt;
      dp.push([c[0] + (rng(i + 1.1) - 0.5) * 30, c[1] + (rng(i + 1.7) - 0.4) * 14, c[2] + (rng(i + 2.3) - 0.5) * 30]);
      ds.push(0.02 + 0.05 * rng(i + 4.4));
      dc.push(['#ffb060', '#ff7a40', '#ffd8a0', '#8fb0ff', '#ffe8d0', '#ff9a50'][i % 6]);
    }
    for (let i = 0; i < 260; i++) {
      const c = camAt(Math.floor(rng(i + 7.7) * FRAMES));
      const fw = mul(sub(c.tgt, c.pos), 1 / (len3(sub(c.tgt, c.pos)) || 1));
      const p0 = add(c.pos, mul(fw, 2.5 + 6 * rng(i + 8.1)));
      dp.push([p0[0] + (rng(i + 8.5) - 0.5) * 9, p0[1] + (rng(i + 8.9) - 0.5) * 5, p0[2] + (rng(i + 9.3) - 0.5) * 9]);
      ds.push(0.008 + 0.014 * rng(i + 9.7));
      dc.push(['#ffb060', '#ff8a50', '#ffd8a0', '#8fb0ff', '#ffe8d0'][i % 5]);
    }
    const dust = makePoints(dp, ds, dc, {drift: 0.35, cocPx: 34, maxPx: 70, soft: 0.8});
    scene.add(dust);
    on((f) => {
      const calm = 1 - 0.65 * Math.min(ss((f - CLIMAX + 10) / 10), 1 - ss((f - CLIMAX - 110) / 40));
      dust.mat.uniforms.uA.value = 0.62 * calm;
      stars.mat.uniforms.uA.value = 0.85 * (1 - 0.4 * (1 - calm));
    });
  }
  /** 远处缓慢起伏的金丝（背景层，景深自动变软） */
  const strands = (parent: THREE.Object3D, c: V3, n: number, seed: number, spread = 1, a = 0.32) => {
    for (let k = 0; k < n; k++) {
      const z = c[2] - 14 - k * 6 * spread - 6 * rng(seed + k);
      const y0 = c[1] + (rng(seed + k + 0.4) - 0.3) * 8;
      const ph = rng(seed + k + 0.8) * 6;
      const pts: V3[] = Array.from({length: 160}, (_, i) => { const t = i / 159; return [c[0] - 34 + 68 * t, y0 + 1.6 * Math.sin(t * 5 + ph) + 0.7 * Math.sin(t * 11 + ph * 2), z + 4 * Math.cos(t * 3 + ph)]; });
      const t = tube(parent, pts, {r: 0.025, minPx: 0.8});
      t.set({a: a * (0.6 + 0.4 * rng(seed + k + 0.2))});
      t.uni('uWave', 0.6);
    }
  };

  /* ======== 笔画：每一笔一个发光管 ======== */
  const tubes: Record<string, Tube> = {};
  const strokeA: Record<string, (f: number) => number> = {};
  const WHEEL_G = grp(), LWHEEL_G = grp();
  for (const s of STROKES3) {
    if (s.kind === 'trace') continue;
    if (s.id === 'wheel') { tubes[s.id] = tube(WHEEL_G, WHEEL_LOCAL, {r: 0.02}); continue; }
    if (s.id === 'lwheel') { tubes[s.id] = tube(LWHEEL_G, circ3([0, 0, 0.16], LWR3, -Math.PI / 2, -1, 110), {r: 0.016}); continue; }
    const pts = ptsOf(s, s.at);
    tubes[s.id] = tube(scene, pts, {r: s.r ?? (s.kind === 'link' ? 0.01 : 0.018), color: s.color ?? GOLD, core: s.core});
  }
  const linkA = (s: S3) => (f: number) => (s.bridge ? 0.62 - 0.22 * prog(f, s.at + s.dur + 200, 120) : 0.42 * (1 - prog(f, s.at + s.dur + 6, 36)));
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

  /* ======== S1 钩子 ======== */
  const g1 = grp();
  win(g1, 0, SC.define + 170); win(WHEEL_G, 0, SC.define + 170);
  {
    const floor = makeGrid([0, 0, -8], 46, 1.0, '#3a5ad0');
    g1.add(floor.group);
    on((f) => floor.set({a: 0.6 * eo(prog(f, 4, 40))}));
    strands(g1, O1, 5, 11);
    // 玻璃轮
    const body = glass(WHEEL_G, new THREE.CylinderGeometry(WR, WR, ZF * 2, 96, 1, true).rotateX(Math.PI / 2), {color: '#2a1a08', rim: '#ffc880', body: 0.1, spec: 0.3});
    const back = tube(WHEEL_G, circ3([0, 0, -ZF], WR, -Math.PI / 2, -1, 120), {r: 0.012});
    const spokes = Array.from({length: 6}, (_, i) => { const a = (i * Math.PI) / 3; return tube(WHEEL_G, densify([[Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0], [Math.cos(a) * (WR - 0.06), Math.sin(a) * (WR - 0.06), 0]], 0.1), {r: 0.008, minPx: 0.7}); });
    const hub = glass(WHEEL_G, new THREE.TorusGeometry(0.15, 0.035, 12, 40), {rim: '#ffd9a0', body: 0.3});
    const diam = tube(WHEEL_G, densify([[0, WR, ZF + 0.02], [0, -WR, ZF + 0.02]], 0.05), {r: 0.01, color: '#9fb4ff', core: '#e8eeff', halo: false});
    diam.uni('uDash', 16);
    const mark = glass(WHEEL_G, new THREE.SphereGeometry(0.08, 20, 12), {color: '#ff3020', rim: '#ff8a6a', body: 1.4, spec: 0.2});
    mark.position.set(0, -WR, ZF);
    const tick0 = tube(g1, [[WX0, 0, ZF], [WX0, 0.3, ZF]], {r: 0.012}), tick1 = tube(g1, [TRACK_END, add(TRACK_END, [0, 0.3, 0])], {r: 0.012});
    const BZ = ZF + 0.62;
    const bars = [0, 1, 2].map((i) => {
      const x0 = WX0 + i * 2 * WR + 0.05, x1 = x0 + 2 * WR - 0.1;
      return {
        t: tube(g1, densify([[x0, 0.02, BZ], [x1, 0.02, BZ]], 0.1), {r: 0.014, color: '#9fb4ff', core: '#eef2ff'}),
        c0: tube(g1, [[x0, 0.02, BZ - 0.12], [x0, 0.02, BZ + 0.12]], {r: 0.01, color: '#9fb4ff', core: '#eef2ff'}),
        c1: tube(g1, [[x1, 0.02, BZ - 0.12], [x1, 0.02, BZ + 0.12]], {r: 0.01, color: '#9fb4ff', core: '#eef2ff'}),
      };
    });
    const rem = tube(g1, densify([[WX0 + 6 * WR + 0.03, 0.02, BZ], [TRACK_END[0], 0.02, BZ]], 0.05), {r: 0.02, color: '#ff6a4a', core: '#fff0e6'});
    on((f) => {
      WHEEL_G.matrixAutoUpdate = false; WHEEL_G.matrix.copy(wheelM(f)); WHEEL_G.matrixWorldNeedsUpdate = true;
      const done = prog(f, WHEEL_AT + WHEEL_DUR - 6, 16);
      glassA(body, 0.8 * done); back.set({a: 0.55 * done}); for (const s of spokes) s.set({a: 0.5 * done}); glassA(hub, done);
      diam.set({a: 0.8 * eo(prog(f, WHEEL_AT + WHEEL_DUR + 2, 14)) * (1 - prog(f, ROLL0 - 14, 12))});
      glassA(mark, done);
      tick0.set({a: f >= ROLL0 ? 0.85 : 0}); tick1.set({a: 0.85 * eo(prog(f, ROLL0 + ROLL_DUR - 2, 8))});
      bars.forEach((b, i) => { const t = eo(prog(f, BR[i], 9)); b.t.set({p1: t, a: t > 0 ? 1 : 0}); b.c0.set({a: t > 0 ? 0.9 : 0}); b.c1.set({a: t > 0.95 ? 0.9 : 0}); });
      const r = eo(prog(f, REM_AT, 8)); rem.set({p1: r, a: r > 0 ? 1 : 0});
    });
  }

  /* ======== S2 定义 ======== */
  const g2 = grp();
  win(g2, SC.define - 160, SC.arch + 170);
  {
    strands(g2, O2, 4, 23, 1.2, 0.26);
    // 背景：巨大的玻璃环，像一道道门
    const rings = Array.from({length: 6}, (_, k) => {
      const r = glass(g2, new THREE.TorusGeometry(8 + 3 * k, 0.05 + 0.02 * k, 10, 180), {rim: k % 2 ? '#ffc070' : '#9fb4ff', color: '#000000', body: 0, spec: 0.15});
      r.position.copy(new THREE.Vector3(...add(O2, [(rng(k + 40) - 0.5) * 10, (rng(k + 41) - 0.5) * 4, -18 - 7 * k])));
      r.rotation.set(0.3 * (rng(k + 42) - 0.5), 0.8 * (rng(k + 43) - 0.5), 0);
      return r;
    });
    const drum = glass(g2, new THREE.CylinderGeometry(DR, DR, 0.7, 128, 1, true).rotateX(Math.PI / 2), {color: '#24170a', rim: '#ffc880', body: 0.08, spec: 0.25});
    drum.position.set(DC[0], DC[1], DC[2] - 0.35);
    const back = tube(g2, circ3(add(DC, [0, 0, -0.7]), DR, Math.PI, -1, 160), {r: 0.012});
    const dot = glass(g2, new THREE.SphereGeometry(0.06, 16, 10), {rim: '#ffe0b0', body: 1.2});
    dot.position.set(DC[0], DC[1], DC[2]);
    // 三个物件
    const lid = grp(g2), bike = grp(g2), earth = grp(g2);
    [lid, bike, earth].forEach((g, i) => g.position.set(...OBJ3[i].c));
    const r0 = OBJ3[0].r, r1 = OBJ3[1].r, r2 = OBJ3[2].r;
    const lidDisc = glass(lid, new THREE.CylinderGeometry(r0, r0, 0.12, 80, 1, true).rotateX(Math.PI / 2), {color: '#2a1a08', body: 0.15});
    const lidDome = glass(lid, new THREE.SphereGeometry(r0 * 0.98, 48, 16, 0, Math.PI * 2, 0, 0.62).rotateX(Math.PI / 2).scale(1, 1, 0.42), {color: '#2a1a08', body: 0.14, spec: 0.5});
    const knob = glass(lid, new THREE.TorusGeometry(0.14, 0.04, 10, 30, Math.PI).translate(0, 0, 0).rotateX(Math.PI / 2).translate(0, 0, r0 * 0.4), {rim: '#ffd9a0', body: 0.4});
    const tire = glass(bike, new THREE.TorusGeometry(r1, 0.09, 20, 120), {color: '#2a1a08', body: 0.12, spec: 0.45});
    const spokeG = grp(bike);
    const bspokes = Array.from({length: 18}, (_, k) => { const a = (k * Math.PI) / 9; return tube(spokeG, [[Math.cos(a) * 0.1, Math.sin(a) * 0.1, (k % 2 ? 0.05 : -0.05)], [Math.cos(a) * (r1 - 0.08), Math.sin(a) * (r1 - 0.08), 0]], {r: 0.005, minPx: 0.6, halo: false}); });
    const bhub = glass(bike, new THREE.CylinderGeometry(0.1, 0.1, 0.2, 24).rotateX(Math.PI / 2), {rim: '#ffd9a0', body: 0.3});
    const globe = glass(earth, new THREE.SphereGeometry(r2, 64, 40), {color: '#0c2a80', rim: '#5a7cd0', body: 0.03, spec: 0.2});
    const eTex = makeImage(new THREE.SphereGeometry(r2 * 0.985, 64, 40), IMG('earthmap'), {mode: 2, warm: 0.15, gain: 0.85});
    earth.add(eTex);
    const lidCard = photoCard(g2, card3(OBJ[0].at + 10, add(OBJ3[0].c, [0, OBJ3[0].r + 1.05, -0.3]), 2.1, 1.15), IMG('potlid'), {warm: 0.35});
    const bikeCard = photoCard(g2, card3(OBJ[1].at + 10, add(OBJ3[1].c, [0, OBJ3[1].r + 1.15, -0.3]), 1.95, 1.83), IMG('bike'), {warm: 0.3});
    const merG = grp(earth);
    const mers = [0, 1, 2, 3].map((k) => { const a = (k * Math.PI) / 4; return tube(merG, circ3([0, 0, 0], r2 * 1.003, 0, -1, 120, [Math.cos(a), 0, Math.sin(a)], [0, 1, 0]), {r: 0.007, color: '#8fb0ff', core: '#dfe8ff', halo: false}); });
    const pars = [-0.6, -0.3, 0, 0.3, 0.6].map((k) => tube(earth, circ3([0, r2 * k, 0], r2 * Math.sqrt(1 - k * k) * 1.003, 0, -1, 120, [1, 0, 0], [0, 0, 1]), {r: 0.007, color: '#8fb0ff', core: '#dfe8ff', halo: false}));
    const A = (f: number) => Math.min(eo(prog(f, D_CIRC - 6, 12)), 1 - prog(f, OBJ_IN, 18));
    strokeA.dcirc = A; strokeA.ddiam = A;
    const qd = (f: number) => 1 - 0.55 * ss(prog(f, Q_AT - 6, 20));
    OBJ.forEach((_o, i) => { strokeA['obj' + i] = (f) => qd(f) * (1 - prog(f, SC.arch + 30, 60) * 0.4); });
    on((f) => {
      const a = A(f), dn = prog(f, D_CIRC + 40, 16);
      glassA(drum, 0.85 * a * dn); back.set({a: 0.45 * a * dn}); glassA(dot, a * eo(prog(f, D_CIRC + 50, 10)));
      rings.forEach((r, k) => { r.rotation.z = 0.0012 * f * (k % 2 ? 1 : -1) + k; glassA(r, 0.55 * eo(prog(f, SC.define - 40, 60))); });
      const q = qd(f);
      const d0 = eo(prog(f, OBJ[0].at + OBJ[0].dur, 14)), d1 = eo(prog(f, OBJ[1].at + OBJ[1].dur, 14)), d2 = eo(prog(f, OBJ[2].at + OBJ[2].dur, 14));
      glassA(lidDisc, 0.8 * d0 * q); glassA(lidDome, 0.8 * d0 * q); glassA(knob, d0 * q);
      glassA(tire, 0.85 * d1 * q); glassA(bhub, d1 * q); for (const s of bspokes) s.set({a: 0.5 * d1 * q});
      spokeG.rotation.z = -0.012 * f;
      glassA(globe, 0.75 * d2 * q); for (const m of mers) m.set({a: 0.22 * d2 * q}); for (const p of pars) p.set({a: 0.18 * d2 * q});
      merG.rotation.y = 0.006 * f;
      imgA(eTex, 0.9 * d2 * q); eTex.rotation.y = 0.006 * f - 1.2;
      const cq = 1 - prog(f, Q_AT - 8, 16);
      lidCard.set(eo(prog(f, OBJ[0].at + 4, 14)) * cq, eo(prog(f, OBJ[0].at, 20)));
      bikeCard.set(eo(prog(f, OBJ[1].at + 4, 14)) * cq, eo(prog(f, OBJ[1].at, 20)));
      lid.rotation.y = 0.18 * Math.sin(f * 0.01); lid.rotation.x = 0.1;
    });
  }

  /* ======== S3 阿基米德 ======== */
  const g3 = grp();
  win(g3, SC.arch - 160, SC.irr + 170);
  // 放大镜（96 边）：单独的小场景
  const inset = new THREE.Scene();
  {
    const floor = makeGrid(add(O3, [0, -3.6, -10]), 42, 1.2, '#8a5c2a');
    g3.add(floor.group);
    strands(g3, O3, 4, 37, 1, 0.24);
    const cols = Array.from({length: 9}, (_, k) => {
      const c = glass(g3, new THREE.CylinderGeometry(0.42, 0.48, 11, 40, 1, true), {color: '#1a1006', rim: '#e8b070', body: 0.06, spec: 0.25});
      c.position.set(O3[0] - 20 + 5 * k, O3[1] + 1.9, O3[2] - 15 - 5 * Math.abs(k - 4) * 0.8 - 2 * rng(k + 70));
      return c;
    });
    const lintel = glass(g3, new THREE.BoxGeometry(44, 0.6, 1.2), {color: '#1a1006', rim: '#e8b070', body: 0.05, spec: 0.2});
    lintel.position.set(O3[0], O3[1] + 7.6, O3[2] - 19);
    const slab = glass(g3, new THREE.PlaneGeometry(7.6, 5.8), {color: '#24160a', rim: '#ffcf8a', body: 0.05, spec: 0.12});
    slab.position.set(...plane(0, 0, -0.04)); slab.rotation.x = -TILT;
    const edge = tube(g3, densify([plane(-3.8, 2.9, -0.04), plane(3.8, 2.9, -0.04), plane(3.8, -2.9, -0.04), plane(-3.8, -2.9, -0.04), plane(-3.8, 2.9, -0.04)], 0.2), {r: 0.008, minPx: 0.7});
    const seg: V3[][] = [];
    for (let u = -3.6; u <= 3.61; u += 0.45) seg.push(densify([plane(u, -2.8, -0.01), plane(u, 2.8, -0.01)], 0.5));
    for (let v = -2.7; v <= 2.71; v += 0.45) seg.push(densify([plane(-3.7, v, -0.01), plane(3.7, v, -0.01)], 0.5));
    const tgrid = tube(g3, seg, {r: 0.003, minPx: 0.5, color: '#3a58c8', core: '#5a78e8', halo: false});
    const dot = glass(g3, new THREE.SphereGeometry(0.05, 16, 10), {rim: '#ffe0b0', body: 1.2});
    dot.position.set(...AC3);
    // 加倍：内（蓝）/ 外（红）多边形
    const toW = (uv: [number, number][]) => uv.map(([u, v]) => plane(u, v));
    const morph = STEP3.slice(1).map((s, j) => {
      const m = morphUV(s.n / 2, 0, AR3);
      return {
        i: j + 1, inner: tube(g3, toW(m.inner), {r: 0.011, color: '#9fb4ff', core: '#eef2ff', minPx: 0.9}), outer: tube(g3, toW(m.outer), {r: 0.011, color: '#ff8a5a', core: '#fff0e6', minPx: 0.9}),
        last: -1,
      };
    });
    const archA = (f: number) => eo(prog(f, SC.arch - 10, 30)) * (1 - ss(prog(f, SC.irr - 40, 40)));
    const archCard = photoCard(g3, CARDS().archimedes, IMG('archimedes'), {warm: 0.25, gain: 0.82});
    const AIN = L(9) + 44;
    strokeA.aframe = (f) => 1 - ss(prog(f, SC.irr - 42, 24));
    strokeA.in6 = (f) => (f < STEP3[1].at ? 1 : 0);
    strokeA.out6 = (f) => (f < STEP3[1].at ? 1 : 0);
    on((f) => {
      const a = archA(f);
      floor.set({a: 0.5 * a}); tgrid.set({a: 0.4 * a});
      archCard.set(eo(prog(f, AIN, 16)) * (1 - prog(f, NUM_AT - 16, 16)), eo(prog(f, AIN - 4, 24)));
      for (const c of cols) glassA(c, 0.6 * a);
      glassA(lintel, 0.5 * a); glassA(slab, 0.8 * a); edge.set({a: 0.45 * a}); glassA(dot, eo(prog(f, SC.arch + 40, 10)));
      for (const m of morph) {
        const s = STEP3[m.i], nx = STEP3[m.i + 1];
        const vis = f >= s.at && (!nx || f < nx.at);
        if (!vis) { m.inner.set({a: 0}); m.outer.set({a: 0}); continue; }
        const t = tracePen(m.i, f);
        const key = Math.round(t * 2000);
        if (key !== m.last) { const uv = morphUV(s.n / 2, t, AR3); m.inner.update(toW(uv.inner)); m.outer.update(toW(uv.outer)); m.last = key; }
        const zk = clamp(prog(f, INSET_IN, 20)) * (1 - prog(f, INSET_OUT, 20));
        m.inner.set({a: 1 - 0.25 * zk, p1: 1}); m.outer.set({a: 1 - 0.25 * zk, p1: 1});
      }
    });
    // 放大镜场景：顶点附近，纵向放大更多（看得见内外多边形与圆之间的缝）
    const MX = 30, MY = 520;
    const mp = (u: number, v: number): V3 => [MX * u, MY * (v - AR3), 0];
    const n = 96, Ro = AR3 / Math.cos(Math.PI / n);
    const arc: V3[] = Array.from({length: 241}, (_, i) => { const a = Math.PI / 2 + 0.135 - (i / 240) * 0.27; return mp(Math.cos(a) * AR3, Math.sin(a) * AR3); });
    const innerP: V3[] = [-2, -1, 0, 1, 2].map((k) => { const a = Math.PI / 2 - (k * 2 * Math.PI) / n; return mp(Math.cos(a) * AR3, Math.sin(a) * AR3); });
    const outerP: V3[] = [-2, -1, 0, 1, 2].map((k) => { const a = Math.PI / 2 - (k * 2 * Math.PI) / n; return mp(Math.cos(a) * Ro, Math.sin(a) * Ro); });
    const iA = tube(inset, cr3(arc, 1), {r: 0.016, minPx: 1.1});
    const iI = tube(inset, densify(innerP, 0.05), {r: 0.014, minPx: 1.0, color: '#9fb4ff', core: '#eef2ff'});
    const iO = tube(inset, densify(outerP, 0.05), {r: 0.014, minPx: 1.0, color: '#ff8a5a', core: '#fff0e6'});
    on((f) => {
            iA.set({a: 1, p1: 1}); iI.set({a: 1, p1: eo(prog(f, INSET_IN + 8, 20))}); iO.set({a: 1, p1: eo(prog(f, INSET_IN + 18, 20))});
    });
  }

  /* ======== S4 无理数：数字之河 ======== */
  const g4 = grp();
  win(g4, SC.irr - 170, SC.life + 170);
  {
    strands(g4, O4, 4, 53, 1, 0.24);
    const rings = Array.from({length: 11}, (_, k) => {
      const s = 0.04 + k * 0.095;
      const p = RIVER(s), q = RIVER(Math.min(1, s + 0.01));
      const r = glass(g4, new THREE.TorusGeometry(2.3 + 0.4 * k, 0.018, 8, 140), {rim: k % 3 ? '#e8b070' : '#8fb0ff', color: '#000', body: 0, spec: 0.1});
      r.position.set(...p);
      r.lookAt(new THREE.Vector3(...q));
      return r;
    });
    const N = 420;
    const seeds = Array.from({length: N}, (_, i) => ({s: rng(i + 300), r: 0.5 + 2.4 * rng(i + 301), a: rng(i + 302) * Math.PI * 2, v: 0.0009 + 0.0012 * rng(i + 303)}));
    const stream = makePoints(seeds.map(() => [0, 0, 0] as V3), seeds.map((_, i) => 0.018 + 0.03 * rng(i + 304)), seeds.map((_, i) => ['#ffcf8a', '#ff9a50', '#ffe8c8', '#9fb4ff'][i % 4]), {cocPx: 18, maxPx: 40});
    g4.add(stream);
    const pa = stream.geometry.attributes.position as THREE.BufferAttribute;
    on((f) => {
      if (!g4.visible) return;
      const a = eo(prog(f, SC.irr - 20, 40));
      rings.forEach((r) => { glassA(r, 0.45 * a); r.rotateZ(0); });
      rings.forEach((r, k) => { r.rotation.z = 0; r.lookAt(new THREE.Vector3(...RIVER(Math.min(1, 0.05 + k * 0.095)))); r.rotateZ(0.004 * f * (k % 2 ? 1 : -1)); });
      stream.mat.uniforms.uA.value = 0.9 * a;
      seeds.forEach((sd, i) => {
        const s = (sd.s + f * sd.v) % 1;
        const p = RIVER(s);
        const th = sd.a + f * 0.004;
        pa.setXYZ(i, p[0] + Math.cos(th) * sd.r * 0.6, p[1] + Math.sin(th) * sd.r * 0.5, p[2] + Math.sin(th * 0.7) * sd.r * 0.3);
      });
      pa.needsUpdate = true;
    });
  }

  /* ======== S5 生活：路面车轮 / 正弦丝带 / 地球与 GPS ======== */
  const g5a = grp(), g5b = grp(), g5c = grp();
  win(g5a, SC.life - 170, ORB_IN + 60); win(LWHEEL_G, SC.life - 170, ORB_IN + 60);
  win(g5b, LROLL0 - 40, SC.end + 60);
  win(g5c, SINE_IN - 40, SC.end + 180);
  {
    const road = makeGrid(add(O5, [0, 0, -5]), 30, 0.8, '#3a5ad0');
    g5a.add(road.group);
    strands(g5a, O5, 3, 61, 1, 0.24);
    const body = glass(LWHEEL_G, new THREE.CylinderGeometry(LWR3, LWR3, 0.32, 80, 1, true).rotateX(Math.PI / 2), {color: '#2a1a08', body: 0.1});
    const back = tube(LWHEEL_G, circ3([0, 0, -0.16], LWR3, 0, -1, 90), {r: 0.01});
    const spokes = Array.from({length: 6}, (_, i) => { const a = (i * Math.PI) / 3; return tube(LWHEEL_G, [[Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0], [Math.cos(a) * (LWR3 - 0.05), Math.sin(a) * (LWR3 - 0.05), 0]], {r: 0.007, minPx: 0.7}); });
    const ticks = [0, 0.5, 1].map((k) => tube(g5a, [add(O5, [LX03 + LDIST3 * k, 0, 0.16]), add(O5, [LX03 + LDIST3 * k, 0.3, 0.16])], {r: 0.012}));
    on((f) => {
      LWHEEL_G.matrixAutoUpdate = false; LWHEEL_G.matrix.copy(lwheelM(f)); LWHEEL_G.matrixWorldNeedsUpdate = true;
      const d = prog(f, LW_AT + 24, 12), a = eo(prog(f, SC.life - 30, 40));
      road.set({a: 0.55 * a});
      glassA(body, 0.8 * d); back.set({a: 0.5 * d}); for (const s of spokes) s.set({a: 0.5 * d});
      const r = lrollE(f);
      ticks.forEach((t, i) => t.set({a: f >= LROLL0 && r >= [0, 0.5, 1][i] - 0.002 ? 0.9 : 0}));
    });
  }
  {
    strands(g5b, O5B, 3, 71, 1, 0.22);
    const back = Array.from({length: SN - 1}, (_, j) => tube(g5b, sine3((j + 1) / (SN - 1), 0, 110), {r: 0.009, minPx: 0.8, halo: j < 4}));
    // 半透明丝带面：前 7 条之间
    const NX = 110, NU = 8;
    const rg = new THREE.BufferGeometry();
    const rp = new Float32Array((NX + 1) * NU * 3);
    rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
    const ri: number[] = [];
    for (let u = 0; u < NU - 1; u++) for (let x = 0; x < NX; x++) { const a = u * (NX + 1) + x, b = a + NX + 1; ri.push(a, b, a + 1, b, b + 1, a + 1); }
    rg.setIndex(ri);
    const ribbon = glass(g5b, rg, {color: '#3a2008', rim: '#ffc070', body: 0.1, spec: 0.2});
    const axis = tube(g5b, densify([add(O5B, [-SXH - 0.3, 0, 1.2]), add(O5B, [SXH + 0.3, 0, 1.2])], 0.2), {r: 0.007, color: '#c8d4ff', halo: false});
    const x0 = -SXH + 0.75, x1 = x0 + (2 * Math.PI) / SK3;
    const per = tube(g5b, densify([add(O5B, [x0, -SAMP - 0.55, 1.2]), add(O5B, [x1, -SAMP - 0.55, 1.2])], 0.05), {r: 0.012, color: '#ffd28a'});
    const perC = [x0, x1].map((x) => tube(g5b, [add(O5B, [x, -SAMP - 0.72, 1.2]), add(O5B, [x, -SAMP - 0.38, 1.2])], {r: 0.01, color: '#ffd28a'}));
    const src = [0.35, 0.7, 1.05].map((r) => { const t = glass(g5b, new THREE.TorusGeometry(r, 0.02, 8, 80).rotateY(Math.PI / 2), {rim: '#ffcf8a', color: '#000', body: 0}); t.position.set(...add(O5B, [-SXH - 0.6, 0, 1.2])); return t; });
    let lastK = -1;
    on((f) => {
      if (!g5b.visible) return;
      const a = eo(prog(f, SINE_IN - 10, 30));
      axis.set({a: 0.4 * a});
      const key = Math.round(f);
      if (key !== lastK) {
        back.forEach((t, j) => t.update(sine3((j + 1) / (SN - 1), f, 110)));
        for (let u = 0; u < NU; u++) { const row = sine3(u / (SN - 1), f, NX); row.forEach((p, x) => rp.set(p, (u * (NX + 1) + x) * 3)); }
        (rg.attributes.position as THREE.BufferAttribute).needsUpdate = true; rg.computeVertexNormals();
        if (tubes.sine) tubes.sine.update(sine3(0, f));
        lastK = key;
      }
      back.forEach((t, j) => { const so = eo(prog(f, SINE_IN + 32 + j * 2, 14)); const u = (j + 1) / (SN - 1); t.set({a: so * (0.25 + 0.6 * (1 - u))}); });
      glassA(ribbon, 0.6 * eo(prog(f, SINE_IN + 40, 30)));
      const pt = eo(prog(f, PERIOD_AT, 10));
      per.set({p1: pt, a: pt > 0 ? 1 : 0}); perC[0].set({a: pt > 0 ? 1 : 0}); perC[1].set({a: pt > 0.95 ? 1 : 0});
      src.forEach((t, i) => { const ph = ((f * 0.02 + i / 3) % 1); t.scale.setScalar(0.6 + 0.8 * ph); glassA(t, 0.5 * a * (1 - ph)); });
    });
  }
  {
    strands(g5c, O5C, 4, 83, 1.2, 0.2);
    const globe = glass(g5c, new THREE.SphereGeometry(ER3, 64, 40), {color: '#0c2a80', rim: '#5a7cd0', body: 0.03, spec: 0.22});
    globe.position.set(...O5C);
    const eTex = makeImage(new THREE.SphereGeometry(ER3 * 0.985, 72, 48), IMG('earthmap'), {mode: 2, warm: 0.12, gain: 0.9});
    eTex.position.set(...O5C); eTex.rotation.z = 0.41; g5c.add(eTex);
    const gpsImg = makeImage(new THREE.PlaneGeometry(1.15, 1.3), IMG('gps'), {add: true, warm: 0.1, gain: 0.95, feather: 0.12, lift: 0.04});
    const atmo = glass(g5c, new THREE.SphereGeometry(ER3 * 1.12, 48, 32), {color: '#000', rim: '#3f60c0', body: 0, spec: 0.05});
    atmo.position.set(...O5C);
    const merG = grp(g5c); merG.position.set(...O5C); merG.rotation.z = 0.41;
    const mers = [0, 1, 2, 3, 4, 5].map((k) => { const a = (k * Math.PI) / 6; return tube(merG, circ3([0, 0, 0], ER3 * 1.004, 0, -1, 120, [Math.cos(a), 0, Math.sin(a)], [0, 1, 0]), {r: 0.006, color: '#8fb0ff', core: '#dfe8ff', halo: false}); });
    const pars = [-0.7, -0.4, 0.4, 0.7].map((k) => tube(merG, circ3([0, ER3 * k, 0], ER3 * Math.sqrt(1 - k * k) * 1.004, 0, -1, 120, [1, 0, 0], [0, 0, 1]), {r: 0.006, color: '#8fb0ff', core: '#dfe8ff', halo: false}));
    const sat = grp(g5c);
    const sb = glass(sat, new THREE.BoxGeometry(0.2, 0.2, 0.2), {color: '#4a3008', rim: '#ffe2b0', body: 0.6});
    const sp1 = glass(sat, new THREE.BoxGeometry(0.42, 0.02, 0.16).translate(0.34, 0, 0), {color: '#0c2a80', rim: '#8fb0ff', body: 0.8});
    const sp2 = glass(sat, new THREE.BoxGeometry(0.42, 0.02, 0.16).translate(-0.34, 0, 0), {color: '#0c2a80', rim: '#8fb0ff', body: 0.8});
    const satGlow = makePoints([[0, 0, 0]], [0.6], ['#ffd8a0'], {cocPx: 0, maxPx: 60, soft: 0});
    sat.add(satGlow);
    g5c.add(gpsImg);
    on((f) => {
      if (!g5c.visible) return;
      const d = eo(prog(f, E_AT + 22, 16));
      glassA(globe, 0.75 * d); glassA(atmo, 0.3 * d);
      for (const m of mers) m.set({a: 0.2 * d}); for (const p of pars) p.set({a: 0.16 * d});
      merG.rotation.y = 0.005 * f;
      imgA(eTex, 0.92 * d); eTex.rotation.y = 0.005 * f;
      const so = eo(prog(f, O_AT + 34, 10));
      const p = orbP(satAng(f)), q = orbP(satAng(f) - 0.05);
      sat.position.set(...p); sat.lookAt(new THREE.Vector3(...q));
      glassA(sb, 0); glassA(sp1, 0); glassA(sp2, 0); satGlow.mat.uniforms.uA.value = 0.35 * so; satGlow.visible = so > 0;
      const cp = camAt(f).pos;
      gpsImg.position.set(...p); gpsImg.lookAt(new THREE.Vector3(...cp)); imgA(gpsImg, so);
    });
  }

  /* ======== S6 结尾 ======== */
  const g6 = grp();
  win(g6, SC.end - 170, FRAMES);
  {
    strands(g6, O6, 5, 97, 1.3, 0.2);
    const nf = NFRAME();
    const panel = glass(g6, new THREE.PlaneGeometry(nf.w, nf.h), {color: '#1a0e04', rim: '#ffcf8a', body: 0.25, spec: 0});
    const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(...nf.ex), new THREE.Vector3(...nf.ey), new THREE.Vector3().crossVectors(new THREE.Vector3(...nf.ex), new THREE.Vector3(...nf.ey)));
    panel.quaternion.setFromRotationMatrix(m); panel.position.set(...nf.c);
    const jpl = photoCard(g6, CARDS().jpl, IMG('jpl'), {warm: 0.45, gain: 0.8});
    const voyImg = makeImage(new THREE.PlaneGeometry(4.2, 3.23), IMG('voyager'), {add: true, warm: 0.45, gain: 1.0, feather: 0.2, lift: 0.2});
    g6.add(voyImg);
    const sun = glass(g6, new THREE.SphereGeometry(1.4, 40, 24), {color: '#ffa040', rim: '#ffe0a0', body: 0.7, spec: 0.1});
    sun.position.set(...VOY_C);
    const sunGlow = makePoints([VOY_C], [14], ['#ffb050'], {cocPx: 0, maxPx: 500, soft: 0});
    g6.add(sunGlow);
    const rad = tube(g6, densify([VOY_C, VOY_PROBE], 0.4), {r: 0.03, color: '#ffd28a', halo: false});
    rad.uni('uDash', 60);
    const probe = grp(g6); probe.position.set(...VOY_PROBE);
    const dish = glass(probe, new THREE.SphereGeometry(0.5, 24, 10, 0, Math.PI * 2, 0, 0.9), {rim: '#ffe2b0', body: 0.5});
    const boom = tube(probe, [[0, 0, 0], [0, -0.9, 0]], {r: 0.02});
    // 高潮：一点炸开成上百条细光丝（3D，向四面八方、也朝镜头飞来）
    const fils = Array.from({length: 72}, (_, i) => {
      const u = rng(i + 500) * 2 - 1, th = rng(i + 501) * Math.PI * 2, s = Math.sqrt(1 - u * u);
      const dir: V3 = [s * Math.cos(th), u * 0.75, s * Math.sin(th) * 0.8 + 0.35];
      const Ln = 7 + 12 * rng(i + 502), curl = (rng(i + 503) - 0.5) * 0.5;
      const side: V3 = [-dir[2], 0.3 * (rng(i + 504) - 0.5), dir[0]];
      const pts: V3[] = Array.from({length: 40}, (_, k) => { const t = k / 39; return add(BURST, add(mul(dir, Ln * t), mul(side, curl * Ln * t * t))); });
      return tube(g6, pts, {r: 0.012, minPx: 0.8, color: i % 3 ? GOLD : '#ffd9a0'});
    });
    const chips = CHIPS().map((c) => {
      const p = glass(g6, new THREE.PlaneGeometry(c.w, c.h), {color: '#1a0e04', rim: '#ffcf8a', body: 0.3, spec: 0});
      const mm = new THREE.Matrix4().makeBasis(new THREE.Vector3(...c.ex), new THREE.Vector3(...c.ey), new THREE.Vector3().crossVectors(new THREE.Vector3(...c.ex), new THREE.Vector3(...c.ey)));
      p.quaternion.setFromRotationMatrix(mm); p.position.set(...c.c);
      return p;
    });
    const qm = QMARK();
    const qdot = glass(g6, new THREE.SphereGeometry(0.045, 16, 10), {rim: '#ffe2b0', body: 1.4});
    qdot.position.set(...add(qm[qm.length - 1], [0, -0.2, 0]));
    // 收尾：小轮沿金线滚上星空
    const fw = grp(g6);
    const fwRim = tube(fw, circ3([0, 0, 0], 1, 0, -1, 60), {r: 0.025, minPx: 1});
    const fwSp = tube(fw, [[-1, 0, 0], [1, 0, 0]], {r: 0.012, halo: false}), fwSp2 = tube(fw, [[0, -1, 0], [0, 1, 0]], {r: 0.012, halo: false});
    const star = makePoints([FIN3[FIN3.length - 1]], [1.2], ['#ffe8c8'], {cocPx: 0, maxPx: 200, soft: 0});
    g6.add(star);
    strokeA.nframe = (f) => 1 - prog(f, L(28) - 10, 20);
    strokeA.voy = (f) => (f >= CLIMAX ? 0 : 1 - 0.4 * prog(f, BREATH0, 60));
    for (let i = 0; i < 3; i++) strokeA['chip' + i] = (f) => 1 - prog(f, CURIOUS_AT - 14, 12);
    strokeA.qmark = (f) => 1 - prog(f, FINAL_AT - 12, 14);
    on((f) => {
      if (!g6.visible) return;
      glassA(panel, 0.6 * eo(prog(f, NASA_AT + 24, 14)) * (1 - prog(f, L(28) - 10, 20)));
      const v = f >= CLIMAX ? 0 : eo(prog(f, VOY_AT, 30));
      glassA(sun, 0.7 * v); sunGlow.mat.uniforms.uA.value = 0.35 * v; sunGlow.visible = v > 0;
      rad.set({a: 0.5 * eo(prog(f, VOY_AT + 34, 14)) * (1 - 0.6 * prog(f, ERR_AT - 6, 10)) * (f >= CLIMAX ? 0 : 1)});
      const pv = eo(prog(f, VOY_AT + 46, 10)) * (f >= CLIMAX ? 0 : 1);
      glassA(dish, 0); boom.set({a: 0});
      voyImg.position.set(...add(VOY_PROBE, [0, 1.3, 0])); voyImg.lookAt(new THREE.Vector3(...camAt(f).pos)); imgA(voyImg, pv);
      jpl.set(eo(prog(f, NASA_AT2 + 14, 16)) * (1 - prog(f, L(28) - 10, 20)), eo(prog(f, NASA_AT2 + 6, 26)));
      probe.lookAt(new THREE.Vector3(...VOY_C)); probe.rotateX(-Math.PI / 2);
      const gr = eo(prog(f, CLIMAX, 50)), fo = 0.5 * (1 - prog(f, CLIMAX + 20, 70));
      fils.forEach((t) => t.set({p1: f >= CLIMAX ? Math.max(0.01, gr) : 0, p0: 0.55 * eo(prog(f, CLIMAX + 10, 70)), a: f >= CLIMAX ? fo : 0}));
      chips.forEach((p, i) => glassA(p, 0.5 * eo(prog(f, CHIP_AT[i] + 10, 10)) * (1 - prog(f, CURIOUS_AT - 14, 12))));
      glassA(qdot, eo(prog(f, QMARK_AT + 22, 6)) * (1 - prog(f, FINAL_AT - 12, 14)));
      // 小轮
      const fs = S3ID.final;
      const tt = progOf(fs, f);
      const fwO = f >= FINAL_AT ? 1 - prog(tt, 0.86, 0.14) : 0;
      if (fwO > 0) {
        const hd = headOf(FIN3, tt), ah = headOf(FIN3, Math.min(1, tt + 0.004)), bh = headOf(FIN3, Math.max(0, tt - 0.004));
        const d = sub(ah, bh), l = len3(d) || 1, tdir = mul(d, 1 / l);
        const r = 0.5 * (1 - 0.7 * tt);
        const nrm: V3 = [-tdir[1], tdir[0], 0];
        fw.position.set(...add(hd, mul(nrm, r))); fw.scale.setScalar(r);
        fw.rotation.set(0, 0, -(tt * 30) / Math.max(0.2, r) * 0.05);
      }
      fwRim.set({a: fwO}); fwSp.set({a: 0.5 * fwO}); fwSp2.set({a: 0.5 * fwO}); fw.visible = fwO > 0;
      const st = eo(prog(f, FINAL_AT + FINAL_DUR - 6, 16));
      star.mat.uniforms.uA.value = st * (0.75 + 0.25 * Math.sin(f * 0.2)); star.visible = st > 0;
    });
  }

  /* ======== 每帧：相机、雾、景深 ======== */
  const update = (f: number) => {
    U.uTime.value = f / 30;
    for (const fn of ups) fn(f);
    const c = camAt(f);
    U.uFocus.value = len3(sub(c.tgt, c.pos));
    U.uCoc.value = 0.045;
    const voy = Math.min(ss((f - VOY_AT + 40) / 30), 1 - ss((f - CLIMAX + 30) / 30));
    U.uFog.value = lerp(0.032, 0.011, voy);
    U.uFogNear.value = lerp(13, 30, voy);
    return c;
  };
  const insetFn = (f: number) => {
    if (f < INSET_IN || f > INSET_OUT + 4) return null;
    const k = f - INSET_IN;
    const yaw = 0.18 * Math.sin(k * 0.012) - 0.08, pitch = 0.22 + 0.05 * Math.sin(k * 0.01);
    const D = 10.5;
    return {
      cam: {pos: [D * Math.sin(yaw), -1.2 + D * Math.sin(pitch), D * Math.cos(yaw) * Math.cos(pitch)] as V3, tgt: [0, -1.25, 0] as V3, fov: 34},
      rect: INSET_RECT, scene: inset,
    };
  };
  return {scene, update, inset: insetFn, ready: texReady()};
};
/** 放大镜在屏幕上的位置（x, y, w, h，左上角为原点） */
export const INSET_RECT: [number, number, number, number] = [130, 590, 600, 300];
export {lerp3, bez, cr3, glassMat, LFORM_AT, WHY_AT, LROLL_DUR3, ROLL0, PEX, PEY, PEZ, AR3, AFRAME, DR, DC, ORB_R, SAMP, LX03};

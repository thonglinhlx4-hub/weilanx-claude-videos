// ep56 · 3D 世界（竖屏）：一次建好所有物体，update(f) 纯函数地设置可见度 / 进度 / 变换 / uniform，返回相机。
// 层次：暖色星空（远）→ 远处金丝 → 走廊（门框、门板灯光、墙线、地面网格、玻璃小人 = 客人、车、车道）/ Cantor 双轨 /
// 对角线表格 / 结尾的门 → 金线笔画 → 近景暖色浮尘（景深，按距离平滑淡出）。
import * as THREE from 'three';
import {staticFile} from 'remotion';
import {GOLD, Tube, U, V3, glassA, imgA, makeGlass, makeGrid, makeImage, makePoints, makeTube, texReady} from './gl';
import {World} from './Stage';
import {
  BUS0, CARDS, CLIMAX, CURB_ARR, CURB_X1, CURB_Z, DIAG_T, DOOR0, DOOR1, DOOR_H, DOOR_H2, DOOR_W, DOOR_W2, DS, FINAL0, FRAMES, GUESTS, HW, L, LE, NDOOR, NLANE,
  OC, OE, PASS0, Rect3, S3, SC, STROKES3, THREAD_Z0, THREAD_Z1, T_DRAW0, T_DRAW1, ZIG_N, ZIG_RUNG_T, beadL, beadR, busFront, camAt, clamp, curbX,
  doorAppear, eo, fogAt, guestPos, laneX, len3, lerp, mul, occupied, prog, progOf, rand, roomPos, roomZ, side, ss, sub, tpt, HCARD, GCARD, CCARD0,
  ZIG0, HC2_0, RAIL_X, NBEAD, BEAD_DZ, TABLE, TAB, TFRAME0, PASS1, S3ID, add, CH2_0, OT, ROWS0,
} from './scene3';

const rng = (s: number) => rand(s * 7.13 + 0.37);
const WARM = ['#ffe6c0', '#ffd2a0', '#fff1dc', '#ffcf9a', '#ffdcb4'];
/** 走廊揭开的深度：笔头画到哪，门 / 墙线就亮到哪；画完之后沿走廊接力亮进雾里 */
export const revealZ = (f: number) => {
  if (f <= T_DRAW1) { let z = THREAD_Z0; for (let m = 1; m < 400; m++) { if (doorAppear(m) <= f) z = roomZ(m); else break; } return Math.min(z, THREAD_Z0); }
  return THREAD_Z1 - (f - T_DRAW1) / 0.9;
};
/** 走廊整体的可见度：Cantor 场景时淡出，对角线 / 穿行时回来，结尾门出现时淡出 */
export const hotelA = (f: number) => Math.max(
  1 - ss(prog(f, L(17) + 70, 50)),
  Math.min(ss(prog(f, PASS0 - 60, 50)), 1 - ss(prog(f, CLIMAX + 60, 60))),
);
/** 对角线场景里：每间都住着一个"实数"（门全亮、小人隐藏） */
export const twistFull = (f: number) => ss(prog(f, SC.twist + 10, 40));
/** 照片卡出现时走廊的门稍微暗下去 */
const cardDim = (f: number) => 1 - 0.45 * Math.min(ss(prog(f, HCARD - 4, 20)), 1 - ss(prog(f, LE(5) + 6, 24)));

export const buildWorld = (): World => {
  const scene = new THREE.Scene();
  const ups: ((f: number) => void)[] = [];
  const on = (fn: (f: number) => void) => ups.push(fn);
  const grp = (parent: THREE.Object3D = scene) => { const g = new THREE.Group(); parent.add(g); return g; };
  const tube = (parent: THREE.Object3D, pts: V3[] | V3[][], o: Parameters<typeof makeTube>[1] = {}) => { const t = makeTube(pts, o); parent.add(t.group); return t; };
  const glass = (parent: THREE.Object3D, geo: THREE.BufferGeometry, o: Parameters<typeof makeGlass>[1] = {}) => { const g = makeGlass(geo, o); parent.add(g); return g; };
  const IMG = (n: string) => staticFile('ep56/' + n + '.jpg');
  const faceTo = (obj: THREE.Object3D, r: Rect3) => {
    const ez = new THREE.Vector3().crossVectors(new THREE.Vector3(...r.ex), new THREE.Vector3(...r.ey));
    obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(...r.ex), new THREE.Vector3(...r.ey), ez));
    obj.position.set(...r.c);
  };
  /** 金框照片卡（frame=true：框由这里无笔头地描出；false：框是金线笔画，由笔头画） */
  const photoCard = (parent: THREE.Object3D, r: Rect3, url: string, frame: boolean, o: Parameters<typeof makeImage>[2] = {}) => {
    // 卡片后面一块不透明的暗底（照片不被后面发光的门透过），并且最后画
    const back = makeImage(new THREE.PlaneGeometry(r.w * 0.99, r.h * 0.99), url, {warm: 0, gain: 0, feather: 0.02});
    faceTo(back, r); back.renderOrder = 20; parent.add(back);
    const img = makeImage(new THREE.PlaneGeometry(r.w * 0.94, r.h * 0.94), url, {warm: 0.42, gain: 0.82, feather: 0.05, ...o});
    faceTo(img, r); img.renderOrder = 21; parent.add(img);
    const fr = frame ? tube(parent, r.pts, {r: 0.006, minPx: 0.9}) : null;
    fr?.uni('uHot', 0);
    if (fr) { fr.core.renderOrder = 22; fr.halo.renderOrder = 22; }
    const set = (a: number, draw: number) => { imgA(img, a * 0.95); imgA(back, a * 0.9); fr?.set({p1: draw, a: draw > 0 ? a : 0}); };
    return {img, fr, set};
  };

  /* ======== 全局：暖色星空 + 远处金丝 + 浮尘（景深） ======== */
  {
    const pos: V3[] = [], sz: number[] = [], col: string[] = [];
    for (let i = 0; i < 2200; i++) {
      const u = rng(i) * 2 - 1, th = rng(i + 0.5) * Math.PI * 2, r = 260 + 200 * rng(i + 0.9);
      const s = Math.sqrt(1 - u * u);
      pos.push([r * s * Math.cos(th), Math.abs(u) * r * 0.85 - 30, -60 + r * s * Math.sin(th)]);
      sz.push(0.3 + 0.5 * Math.pow(rng(i + 0.2), 3));
      col.push(WARM[i % WARM.length]);
    }
    const stars = makePoints(pos, sz, col, {cocPx: 0, maxPx: 5, soft: 0, minPx: 2.5});
    scene.add(stars);
    const dp: V3[] = [], ds: number[] = [], dc: string[] = [];
    for (let i = 0; i < 520; i++) {
      const c = camAt(Math.floor(rng(i + 3.3) * FRAMES)).tgt;
      dp.push([c[0] + (rng(i + 1.1) - 0.5) * 26, c[1] + (rng(i + 1.7) - 0.4) * 14, c[2] + (rng(i + 2.3) - 0.5) * 30]);
      ds.push(0.008 + 0.014 * rng(i + 4.4));
      dc.push(['#ffb060', '#ff9a50', '#ffd8a0', '#ffe8d0', '#ffc27a'][i % 5]);
    }
    for (let i = 0; i < 200; i++) {
      const c = camAt(Math.floor(rng(i + 7.7) * FRAMES));
      const fw = mul(sub(c.tgt, c.pos), 1 / (len3(sub(c.tgt, c.pos)) || 1));
      const p0 = add(c.pos, mul(fw, 3 + 6 * rng(i + 8.1)));
      dp.push([p0[0] + (rng(i + 8.5) - 0.5) * 5, p0[1] + (rng(i + 8.9) - 0.5) * 8, p0[2] + (rng(i + 9.3) - 0.5) * 9]);
      ds.push(0.004 + 0.006 * rng(i + 9.7));
      dc.push(['#ffb060', '#ffc890', '#ffd8a0', '#ffe8d0'][i % 4]);
    }
    const dust = makePoints(dp, ds, dc, {drift: 0.3, cocPx: 22, maxPx: 34, soft: 0.8, minPx: 2.5, near0: 1.2, near1: 4.0});
    scene.add(dust); dust.name = 'dust';
    on((f) => {
      const calm = 1 - 0.6 * Math.min(ss((f - CLIMAX + 10) / 10), 1 - ss((f - CLIMAX - 100) / 40));
      // ep56 fix: during fast camera flights near-camera dust sweeps many px per frame and pops; dim it with camera speed
      const ca = camAt(f).pos, cb = camAt(f + 1).pos;
      const fly = ss(clamp((len3(sub(cb, ca)) - 0.15) / 0.25));
      dust.mat.uniforms.uA.value = 0.42 * calm * (1 - 0.75 * fly);
      stars.mat.uniforms.uA.value = 0.85;
    });
    // 远处缓慢起伏的金丝（各场背景）
    const strands = (c: V3, n: number, seed: number, a = 0.2) => {
      for (let k = 0; k < n; k++) {
        const x = c[0] + (k % 2 ? 1 : -1) * (16 + 6 * k);
        const ph = rng(seed + k + 0.8) * 6;
        const pts: V3[] = Array.from({length: 160}, (_, i) => { const t = i / 159; return [x + 4 * Math.sin(t * 4 + ph), c[1] + (k % 2 ? 12 + 3 * k : -8 - 2 * k) + 1.6 * Math.sin(t * 6 + ph), c[2] + 30 - 160 * t]; });
        const t = tube(scene, pts, {r: 0.03, minPx: 0.8});
        t.set({a: a * (0.6 + 0.4 * rng(seed + k + 0.2))});
        t.uni('uWave', 0.6);
      }
    };
    strands([0, 2, -10], 6, 11);
    strands(OC, 4, 23, 0.22);
    strands(OE, 4, 37, 0.2);
  }

  /* ======== 笔画：每一笔一个发光管 ======== */
  const tubes: Record<string, Tube> = {};
  const strokeA: Record<string, (f: number) => number> = {};
  for (const s of STROKES3) {
    if (s.kind === 'trace' || !s.pts.length) continue;
    tubes[s.id] = tube(scene, s.pts, {r: s.r ?? (s.kind === 'link' ? 0.01 : 0.016), color: s.color ?? GOLD, core: s.core});
  }
  for (const id of ['ccard', 'hcard2']) if (tubes[id]) { tubes[id].core.renderOrder = 22; tubes[id].halo.renderOrder = 22; }
  const linkA = (s: S3) => (f: number) => (s.bridge ? 0.6 * (1 - ss(prog(f, s.at + s.dur + 160, 90))) : 0.4 * (1 - prog(f, s.at + s.dur + 6, 36)));
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

  /* ======== 走廊 ======== */
  const gH = grp();
  const gpos: V3[] = [];
  {
    // 地面网格只铺在走廊和两侧一小段（大网格在地平线处会叠成亮条）
    const fpolys: V3[][] = [];
    const seg = (a: V3, b: V3, n: number) => Array.from({length: n + 1}, (_, i) => [lerp(a[0], b[0], i / n), 0, lerp(a[2], b[2], i / n)] as V3);
    for (let x = -5; x <= 5.01; x += 1.25) fpolys.push(seg([x, 0, 8], [x, 0, -70], 60));
    for (let z = 8; z >= -70; z -= 1.25) fpolys.push(seg([-5, 0, z], [5, 0, z], 8));
    const floor = makeTube(fpolys, {r: 0.004, minPx: 0.55, color: '#6a4418', core: '#6a4418', halo: false});
    floor.core.material instanceof THREE.ShaderMaterial && (floor.core.material.uniforms.uGraze.value = 1);
    gH.add(floor.group); floor.group.name = 'floor';
    // 墙线：墙脚 / 腰线 / 檐线（无笔头，跟着揭开深度往里亮）
    const ZF = -118;
    const wl = [-1, 1].flatMap((sd) => [0.0, 1.02, DOOR_H + 0.32].map((y) => tube(gH, Array.from({length: 240}, (_, i) => [sd * HW, y, lerp(THREAD_Z0, ZF, i / 239)] as V3), {r: 0.006, minPx: 0.8, halo: y > 2})));
    wl.forEach((t) => { t.uni('uHot', 0); t.group.name = 'wall'; });
    const farThread = tube(gH, Array.from({length: 200}, (_, i) => tpt(lerp(THREAD_Z1, ZF, i / 199))), {r: 0.02});
    farThread.uni('uHot', 0);
    // 门：门框（细管）+ 门板（玻璃，亮 = 有人住）
    const doors = Array.from({length: NDOOR}, (_, i) => {
      const m = i + 1, sd = side(m), z = roomZ(m), x = sd * HW;
      const hw = DOOR_W / 2;
      // 只用 4 个角点（不细分）：远处的门框几乎沿视线方向时，细分的小段会在几个像素里层层叠加成白点
      const fr = tube(gH, [[x, 0, z + hw], [x, DOOR_H, z + hw], [x, DOOR_H, z - hw], [x, 0, z - hw]] as V3[], {r: 0.012, minPx: 0.9, halo: m < 10});
      fr.uni('uHot', 0); fr.group.name = 'fr' + Math.floor(m / 10);
      const pn = glass(gH, new THREE.PlaneGeometry(DOOR_W * 0.9, DOOR_H * 0.94), {color: '#ff8a2a', rim: '#ffcf8a', body: 0.0, spec: 0.0});
      pn.position.set(x + sd * 0.01, DOOR_H * 0.48, z); pn.rotation.y = Math.PI / 2; pn.name = 'panel';
      const plaque = glass(gH, new THREE.PlaneGeometry(0.34, 0.2), {color: '#ffb060', rim: '#ffd9a0', body: 0.0, spec: 0});
      plaque.position.set(x - sd * 0.01, DOOR_H + 0.16, z); plaque.rotation.y = Math.PI / 2; plaque.name = 'plaque';
      // 远处的门框在画面上挤在一起，加法混合会叠成一团白光：按房号衰减
      return {m, fr, pn, plaque, app: doorAppear(m), fall: 1 / (1 + Math.max(0, m - 6) / 7)};
    });
    // 客人：玻璃小人（车床体：底座 + 身体 + 头），新客人更亮
    const prof: [number, number][] = [[0.001, 0], [0.15, 0], [0.155, 0.035], [0.09, 0.09], [0.065, 0.3], [0.115, 0.345], [0.06, 0.38], [0.1, 0.43], [0.11, 0.49], [0.09, 0.55], [0.05, 0.585], [0.001, 0.6]];
    const pawnGeo = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 22);
    const pawns = GUESTS.map((g) => {
      const tint = g.kind === 'new' ? {color: '#fff0d8', rim: '#fff4e2', body: 0.34} : g.kind === 'bus' ? {color: '#ffb46a', rim: '#ffd09a', body: 0.17} : g.kind === 'lane' ? {color: '#e8904a', rim: '#ffc890', body: 0.16} : {color: '#ffc27a', rim: '#ffd9a6', body: 0.16};
      const p = glass(gH, pawnGeo, {...tint, spec: 0.4}); p.name = 'pawn';
      return {g, p};
    });
    // 车：两条导轨 + 座位（玻璃小盒），跟着车头移动
    const busG = grp(gH);
    const rails = [-0.42, 0.42].map((x) => tube(busG, Array.from({length: 160}, (_, i) => [x, 0.5, -1.0 - i * 0.75] as V3), {r: 0.008, minPx: 0.8, halo: false}));
    rails.forEach((t) => t.uni('uHot', 0));
    const seatGeo = new THREE.BoxGeometry(0.62, 0.22, 0.5);
    const seats = Array.from({length: 40}, (_, j) => { const s = glass(busG, seatGeo, {color: '#5a3410', rim: '#ffcf8a', body: 0.2, spec: 0.2}); s.position.set(0, 0.11, -1.2 - 2 * j * DS); return s; });
    // 无数辆车：每条车道一根路线 + 一辆车（导轨 + 座位）
    const lanes = Array.from({length: NLANE}, (_, i) => {
      const c = i + 1, x = laneX(c);
      const road = tube(gH, Array.from({length: 160}, (_, k) => [x, 0.02, lerp(CURB_Z + 4, -150, k / 159)] as V3), {r: 0.016, minPx: 1.1, halo: true});
      road.uni('uHot', 0);
      const g = grp(gH);
      const lr = [-0.4, 0.4].map((dx) => tube(g, Array.from({length: 60}, (_, k) => [x + dx, 0.5, -0.6 - k * 0.4] as V3), {r: 0.007, minPx: 0.7, halo: false}));
      lr.forEach((t) => t.uni('uHot', 0));
      const st = Array.from({length: 6}, (_, n) => { const s = glass(g, seatGeo, {color: '#5a3410', rim: '#ffc27a', body: 0.18, spec: 0.2}); s.position.set(x, 0.11, -1.0 - n * 2.0); return s; });
      return {c, road, g, lr, st, arr: CURB_ARR[i]};
    });
    strokeA.thread = (f) => hotelA(f);
    strokeA.curb = (f) => hotelA(f) * (1 - ss(prog(f, CH2_0 - 60, 40)));
    for (const id of ['arc1', 'arc2', 'arc3']) strokeA[id] = (f) => hotelA(f) * (1 - ss(prog(f, L(13), 30)));
    for (const id of ['ch2', 'ch3', 'ch5', 'ch7']) strokeA[id] = (f) => hotelA(f) * (1 - ss(prog(f, L(17) + 50, 40)));
    on((f) => {
      const ha = hotelA(f);
      gH.visible = ha > 0.003;
      if (!gH.visible) return;
      const rz = revealZ(f);
      const tf = twistFull(f);
      floor.set({a: 0.42 * ha * eo(prog(f, 0, 30))});
      const wp = clamp((THREAD_Z0 - rz) / (THREAD_Z0 - ZF));
      wl.forEach((t) => t.set({p1: wp, a: 0.5 * ha}));
      farThread.set({p1: clamp((THREAD_Z1 - rz) / (THREAD_Z1 - ZF)), a: f > T_DRAW1 ? ha : 0});
      gpos.length = 0;
      for (const {g, p} of pawns) {
        const q = guestPos(g, f);
        gpos.push(q);
        const app = eo(prog(f, g.appear + 2, 12));
        const a = app * ha * (1 - tf) * clamp((q[2] + 75) / 25) * (1 - ss(prog(f, L(17) + 20, 40)));
        p.position.set(q[0], q[1], q[2]);
        glassA(p, a * (g.kind === 'new' ? 1 : 0.85));
      }
      for (const d of doors) {
        const a = eo(prog(f, d.app, 12)) * ha * cardDim(f);
        const occ = Math.max(occupied(d.m, f, gpos) * eo(prog(f, d.app + 6, 14)), tf);
        d.fr.set({a: a * (0.55 + 0.4 * occ) * d.fall});
        glassA(d.pn, a * (0.5 + 0.5 * d.fall));
        d.pn.mat.uniforms.uBody.value = 0.04 + 0.26 * occ;
        glassA(d.plaque, a * 0.8);
        d.plaque.mat.uniforms.uBody.value = 0.08 + 0.3 * occ;
      }
      // 车
      const bv = f >= BUS0 && f < L(13) + 40 ? ha * (1 - tf) * (1 - ss(prog(f, L(13), 30))) : 0;
      busG.visible = bv > 0.003;
      if (busG.visible) {
        busG.position.z = busFront(f) - 1.6 + 0.0;
        rails.forEach((t) => t.set({a: 0.5 * bv}));
        seats.forEach((s) => glassA(s, 0.7 * bv));
      }
      // 车道
      const cx = curbX(f);
      for (const ln of lanes) {
        const on2 = f >= ln.arr - 30 ? eo(prog(f, ln.arr - 12, 24)) : 0;
        ln.road.set({p1: on2, a: on2 > 0 ? 0.8 * ha * (1 - tf) * (1 - 0.5 * ss(prog(f, CH2_0, 40))) : 0});
        const v = (cx >= laneX(ln.c) - 0.1 || f > ln.arr + 20 ? 1 : 0) * ha * (1 - tf);
        ln.g.visible = v > 0.003 && f < L(17) + 120;
        if (!ln.g.visible) continue;
        const z = lerp(-90, 0, eo(prog(f, ln.arr, 40)));
        ln.g.position.z = z;
        ln.lr.forEach((t) => t.set({a: 0.45 * v}));
        ln.st.forEach((s) => glassA(s, 0.6 * v));
      }
    });
    void CURB_X1; void CH2_0;
  }

  /* ======== 照片卡（hook）：Hilbert 在上、Gamow 在下（竖着叠放） ======== */
  {
    const g = grp();
    const hil = photoCard(g, CARDS().hilbert, IMG('hilbert'), true, {warm: 0.45});
    const gam = photoCard(g, CARDS().gamow, IMG('gamow'), true, {warm: 0.4, gain: 0.78, feather: 0.1});
    on((f) => {
      const out = 1 - ss(prog(f, LE(5) + 6, 22));
      hil.set(eo(prog(f, HCARD + 4, 16)) * out, eo(prog(f, HCARD, 28)));
      gam.set(eo(prog(f, GCARD + 4, 16)) * out, eo(prog(f, GCARD, 24)));
      g.visible = f > HCARD - 2 && f < LE(5) + 40;
    });
  }

  /* ======== Cantor：两条轨道 + 珠子 + 远处拱门 ======== */
  {
    const g = grp();
    const zEnd = OC[2] + 1.5 - (NBEAD - 1) * BEAD_DZ - 8;
    const railL = tube(g, Array.from({length: 120}, (_, i) => add(OC, [-RAIL_X, 0, lerp(4, zEnd - OC[2], i / 119)])), {r: 0.008, minPx: 0.8});
    const railR = tube(g, Array.from({length: 120}, (_, i) => add(OC, [RAIL_X, 0, lerp(4, zEnd - OC[2], i / 119)])), {r: 0.008, minPx: 0.8});
    [railL, railR].forEach((t) => t.uni('uHot', 0));
    const beadGeo = new THREE.SphereGeometry(0.17, 24, 14);
    const bl = Array.from({length: NBEAD}, (_, i) => { const b = glass(g, beadGeo, {color: '#ffc27a', rim: '#ffe2b4', body: 0.3, spec: 0.4}); b.position.set(...beadL(i + 1)); return b; });
    const br = Array.from({length: NBEAD}, (_, i) => { const b = glass(g, beadGeo, {color: '#ff9a50', rim: '#ffd0a0', body: 0.3, spec: 0.4}); b.position.set(...beadR(i + 1)); return b; });
    const arches = Array.from({length: 8}, (_, k) => {
      const a = glass(g, new THREE.TorusGeometry(4.2 + 0.2 * k, 0.04, 8, 120, Math.PI), {rim: k % 2 ? '#ffc070' : '#e8a060', color: '#000', body: 0, spec: 0.12});
      a.position.set(OC[0], OC[1] - 2.2, OC[2] + 2 - k * 5.5);
      return a;
    });
    const floor = makeGrid(add(OC, [0, -2.2, -12]), 30, 1.0, '#5e3c16');
    g.add(floor.group);
    const card = photoCard(g, CARDS().cantor, IMG('cantor'), false, {warm: 0.45});
    strokeA.ccard = (f) => 1 - ss(prog(f, ZIG0 - 20, 24));
    strokeA.zig = (f) => 1 - ss(prog(f, L(22) + 70, 50));
    on((f) => {
      const a = Math.min(ss(prog(f, L(17) + 40, 50)), 1 - ss(prog(f, L(22) + 60, 60)));
      g.visible = a > 0.003;
      if (!g.visible) return;
      railL.set({a: 0.6 * a}); railR.set({a: 0.6 * a});
      floor.set({a: 0.35 * a});
      arches.forEach((ar) => glassA(ar, 0.5 * a));
      const zt = progOf(S3ID.zig, f);
      for (let i = 0; i < NBEAD; i++) {
        const lit = i < ZIG_N ? eo(prog(zt, ZIG_RUNG_T[i] - 0.02, 0.03)) : 0;
        glassA(bl[i], a * (0.5 + 0.5 * lit)); glassA(br[i], a * (0.5 + 0.5 * lit));
        bl[i].mat.uniforms.uBody.value = 0.1 + 0.22 * lit; br[i].mat.uniforms.uBody.value = 0.1 + 0.22 * lit;
      }
      card.set(eo(prog(f, CCARD0 + 6, 16)) * (1 - ss(prog(f, ZIG0 - 20, 24))), 1);
    });
  }

  /* ======== 对角线表格 ======== */
  {
    const g = grp();
    const t = TABLE();
    const panel = glass(g, new THREE.PlaneGeometry(t.w, t.h), {color: '#1c1006', rim: '#ffcf8a', body: 0.35, spec: 0});
    faceTo(panel, t);
    const rowLines = Array.from({length: 8}, (_, k) => {
      const y = TAB.rowY0 + (k - 0.5) * TAB.rowDY + 18 - TAB.cy;
      const yy = k === 7 ? TAB.newY - 64 - TAB.cy : y;
      const pts = Array.from({length: 40}, (_, i) => add(t.c, add(mul(t.ex, lerp(-TAB.w / 2 + 50, TAB.w / 2 - 50, i / 39) * t.k), mul(t.ey, -yy * t.k))));
      const tb = tube(g, pts, {r: 0.003, minPx: 0.7, halo: false});
      tb.uni('uHot', 0);
      return tb;
    });
    strokeA.tframe = (f) => 1 - ss(prog(f, PASS0 - 4, 26));
    strokeA.diag = (f) => 1 - ss(prog(f, PASS0 - 4, 26));
    on((f) => {
      const a = Math.min(eo(prog(f, TFRAME0 + 10, 30)), 1 - ss(prog(f, PASS0 - 4, 26)));
      g.visible = a > 0.003;
      if (!g.visible) return;
      glassA(panel, 0.55 * a);
      rowLines.forEach((tb, k) => tb.set({a: 0.25 * a * eo(prog(f, k === 7 ? DIAG_T[0] - 10 : ROWS0 + k * 5, 14))}));
    });
    void OT;
  }

  /* ======== 高潮：从笔头炸开成上百条细光丝（连续的一片 = 更大的无限） ======== */
  {
    const g = grp();
    const P0 = tpt(-24);
    const fils = Array.from({length: 90}, (_, i) => {
      const u = rng(i + 500) * 2 - 1, th = rng(i + 501) * Math.PI * 2, s = Math.sqrt(1 - u * u);
      const dir: V3 = [s * Math.cos(th) * 0.8, Math.abs(u) * 0.9 + 0.05, s * Math.sin(th) * 0.6 + 0.3];
      const Ln = 6 + 12 * rng(i + 502), curl = (rng(i + 503) - 0.5) * 0.6;
      const sideV: V3 = [-dir[2], 0.3 * (rng(i + 504) - 0.5), dir[0]];
      const pts: V3[] = Array.from({length: 40}, (_, k) => { const t = k / 39; return add(P0, add(mul(dir, Ln * t), mul(sideV, curl * Ln * t * t))); });
      return tube(g, pts, {r: 0.01, minPx: 0.8, color: i % 3 ? GOLD : '#ffd9a0'});
    });
    fils.forEach((t) => t.uni('uHot', 0));
    on((f) => {
      g.visible = f >= CLIMAX && f < CLIMAX + 120;
      if (!g.visible) return;
      const gr = eo(prog(f, CLIMAX, 46)), fo = 0.5 * (1 - prog(f, CLIMAX + 24, 80));
      fils.forEach((t) => t.set({p1: Math.max(0.01, gr), p0: 0.6 * eo(prog(f, CLIMAX + 10, 80)), a: fo}));
    });
  }

  /* ======== 结尾：Hilbert 卡 + 一扇开着的门（门里是光）+ 金线升入星空 ======== */
  {
    const g = grp();
    const card = photoCard(g, CARDS().hilbert2, IMG('hilbert'), false, {warm: 0.45});
    strokeA.hcard2 = (f) => 1 - ss(prog(f, L(31) - 30, 30));
    const floor = makeGrid(add(OE, [0, 0, -4]), 22, 1.0, '#6a4418');
    g.add(floor.group);
    const dx = DOOR_W2 / 2;
    const light = glass(g, new THREE.PlaneGeometry(DOOR_W2 * 0.96, DOOR_H2 * 0.97), {color: '#ff9a40', rim: '#fff0d0', body: 0, spec: 0});
    light.position.set(OE[0], OE[1] + DOOR_H2 * 0.485, OE[2] - 0.05);
    const leafG = grp(g); leafG.position.set(OE[0] - dx, OE[1], OE[2]);
    const leaf = glass(leafG, new THREE.PlaneGeometry(DOOR_W2 * 0.94, DOOR_H2 * 0.96).translate(DOOR_W2 * 0.47, DOOR_H2 * 0.48, 0), {color: '#3a2008', rim: '#ffcf8a', body: 0.25, spec: 0.3});
    const spill = glass(g, new THREE.PlaneGeometry(DOOR_W2 * 1.1, 4.5).rotateX(-Math.PI / 2).translate(0, 0.01, 2.25), {color: '#ffb060', rim: '#ffb060', body: 0, spec: 0});
    spill.position.set(OE[0], OE[1], OE[2]);
    on((f) => {
      const a = ss(prog(f, CLIMAX + 40, 50));
      g.visible = a > 0.003;
      if (!g.visible) return;
      card.set(eo(prog(f, HC2_0 + 6, 16)) * (1 - ss(prog(f, L(31) - 30, 30))), 1);
      floor.set({a: 0.35 * a * eo(prog(f, DOOR0 - 30, 40))});
      const d = eo(prog(f, DOOR1 - 10, 30));
      const open = ss(prog(f, DOOR1, 40));
      glassA(leaf, 0.7 * d); leafG.rotation.y = -1.25 * open;
      const glow = d * (0.25 + 0.75 * open) * (1 + 0.05 * Math.sin(f * 0.05));
      glassA(light, 0.8 * glow); light.mat.uniforms.uBody.value = 0.42;
      glassA(spill, 0.5 * open); spill.mat.uniforms.uBody.value = 0.35 * (1 - 0.3 * prog(f, FINAL0 + 60, 60));
    });
    void DOOR_H; void PASS1; void TFRAME0; void HC2_0;
  }

  /* ======== 每帧：相机、雾、景深 ======== */
  const update = (f: number) => {
    U.uTime.value = f / 30;
    for (const fn of ups) fn(f);
    const HIDE = (globalThis as {EP56_HIDE?: string}).EP56_HIDE;
    if (HIDE) scene.traverse((o) => { if (o.name && HIDE.includes(o.name)) o.visible = false; });
    const c = camAt(f);
    U.uFocus.value = len3(sub(c.tgt, c.pos));
    U.uCoc.value = 0.04;
    const fg = fogAt(f);
    U.uFog.value = fg.fog; U.uFogNear.value = fg.near;
    return c;
  };
  return {scene, update, ready: texReady()};
};

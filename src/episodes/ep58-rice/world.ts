// ep58 · 3D 世界（竖屏）：一次建好所有物体，update(f) 纯函数地设置可见度 / 进度 / 变换 / uniform，返回相机。
// 玻璃棋盘（深浅两种玻璃格 + 金色细格线 + 倒影）漂在暖色星空里；ô 1 上一粒发光的金色米粒；
// 米堆：ô 1–6 一粒粒、ô 7–32 小米堆、ô 33+ 一座米山（自相似锥体，体积 ∝ 2^(n−32)）；之后相机升空 → 地球（NASA 照片）→ 曲线 2^x。
import * as THREE from 'three';
import {staticFile} from 'remotion';
import {GOLD, Tube, U, V3, glassA, imgA, makeGlass, makeHaze, makeImage, makePearl, makePile, makePoints, makeTube} from './gl';
import {World} from './Stage';
import {
  BH, CARDS, CLIMAX, CURVE0, CURVE_PTS, CURVE_REF, EARTH0, EARTHC0, FRAMES, FRAME0, FRAME1, GRAIN_N, L, LE, MCARD0, Rect3, S3, SC, STROKES3, S3ID, VNC0,
  add, appear, baseCam, camAt, camKeyAt, distKeyAt, clamp, curvePt, distAt, eo, fogAt, isLight, lerp3, len3, moundRH, mountainK, mul, prog, progOf, rand, rrect3, sAt, sq, ss, sub, unproj,
} from './scene3';

const rng = (s: number) => rand(s * 7.13 + 0.37);
const WARM = ['#ffe6c0', '#ffd2a0', '#fff1dc', '#ffcf9a', '#ffdcb4'];
const win = (f: number, a: number, b: number, din = 30, dout = 30) => Math.min(ss(prog(f, a, din)), 1 - ss(prog(f, b, dout)));

/** 棋盘可见度：米山把它埋掉 / 相机拉远后淡出 */
export const boardA = (f: number) => 1 - ss(prog(f, SC.half2 + 230, 90));
/** 第一半盘的小米堆（与 ô 1–6 的米粒）：米山长大后被埋 */
export const smallA = (f: number) => 1 - ss((sAt(f) - 34) / 3);
export const mtnA = (f: number) => ss((sAt(f) - 32.25) / 0.5);
export const earthA = (f: number) => win(f, EARTH0 + 10, L(21) - 6, 30, 30);
export const vnA = (f: number) => win(f, VNC0 + 10, L(21) - 6, 20, 30);
export const curveA = (f: number) => ss(prog(f, CURVE0 - 10, 24));

/** 米粒：细长（长 : 宽 ≈ 3.6 : 1）、两头收尖、略扁、一头（胚芽端）稍钝 —— 沿 x 轴的车削体，长度 1 */
const grainGeo = () => {
  const N = 40, M = 20, P: number[] = [], Nn: number[] = [], I: number[] = [];
  const prof = (t: number) => { // t ∈ [−1, 1]
    const e = Math.pow(Math.abs(t), t > 0 ? 1.9 : 2.4);
    return 0.135 * Math.pow(Math.max(0, 1 - e), 0.62) * (1 + 0.04 * t);
  };
  for (let i = 0; i <= N; i++) {
    const t = -1 + (2 * i) / N, x = t * 0.5, r = prof(t);
    for (let j = 0; j <= M; j++) {
      const a = (j / M) * Math.PI * 2;
      P.push(x, r * Math.cos(a) * 0.82, r * Math.sin(a));
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
    const a = i * (M + 1) + j, b = a + M + 1;
    I.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  g.setIndex(I); g.computeVertexNormals();
  void Nn;
  return g;
};
/** 米堆轮廓：圆润的山顶 + 直的休止角斜面（y(r)，r ∈ [0,1]，y(0)=1，y(1)=0） */
const PA = 0.14;
const pileY = (r: number) => (Math.sqrt(1 + PA * PA) - Math.sqrt(r * r + PA * PA)) / (Math.sqrt(1 + PA * PA) - PA);
const pileGeo = () => {
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0)];
  for (let i = 0; i <= 48; i++) { const r = 1 - i / 48; pts.push(new THREE.Vector2(Math.max(r, 1e-4), pileY(r))); }
  pts.push(new THREE.Vector2(0, 1));
  return new THREE.LatheGeometry(pts, 96);
};

export const buildWorld = (): World => {
  const scene = new THREE.Scene();
  const ups: ((f: number) => void)[] = [];
  const on = (fn: (f: number) => void) => ups.push(fn);
  const grp = (parent: THREE.Object3D = scene) => { const g = new THREE.Group(); parent.add(g); return g; };
  const tube = (parent: THREE.Object3D, pts: V3[] | V3[][], o: Parameters<typeof makeTube>[1] = {}) => { const t = makeTube(pts, o); parent.add(t.group); return t; };
  const glass = (parent: THREE.Object3D, geo: THREE.BufferGeometry, o: Parameters<typeof makeGlass>[1] = {}) => { const g = makeGlass(geo, o); parent.add(g); return g; };
  const IMG = (n: string) => staticFile('ep58/' + n + '.jpg');
  const REFL = new Set<THREE.Object3D>();
  const faceTo = (obj: THREE.Object3D, r: Rect3) => {
    const ez = new THREE.Vector3().crossVectors(new THREE.Vector3(...r.ex), new THREE.Vector3(...r.ey));
    obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(...r.ex), new THREE.Vector3(...r.ey), ez));
    obj.position.set(...r.c);
  };
  /** 照片卡：不透明暗底 + 柔光照片；框由金线笔画画出 */
  const card = (parent: THREE.Object3D, r: Rect3, url: string, o: Parameters<typeof makeImage>[2] = {}) => {
    const back = makeImage(new THREE.PlaneGeometry(r.w * 0.99, r.h * 0.99), url, {warm: 0, gain: 0, feather: 0.02});
    faceTo(back, r); back.renderOrder = 20; parent.add(back);
    const img = makeImage(new THREE.PlaneGeometry(r.w * 0.94, r.h * 0.94), url, {warm: 0.3, gain: 0.85, feather: 0.04, ...o});
    faceTo(img, r); img.renderOrder = 21; parent.add(img);
    return (a: number) => { imgA(back, a * 0.92); imgA(img, a * 0.95); };
  };
  const billboard = (obj: THREE.Object3D, c: {pos: V3; tgt: V3}) => {
    const m = new THREE.Matrix4().lookAt(new THREE.Vector3(...c.pos), new THREE.Vector3(...c.tgt), new THREE.Vector3(0, 1, 0));
    obj.quaternion.setFromRotationMatrix(m);
  };

  /* ======== 全局：暖色星空（跟着相机走 = 无穷远）+ 按尺度分布的浮尘（景深） ======== */
  {
    const pos: V3[] = [], sz: number[] = [], col: string[] = [];
    for (let i = 0; i < 2400; i++) {
      const u = rng(i) * 2 - 1, th = rng(i + 0.5) * Math.PI * 2, r = 300 + 180 * rng(i + 0.9);
      const s = Math.sqrt(1 - u * u);
      pos.push([r * s * Math.cos(th), r * u, r * s * Math.sin(th)]);
      sz.push(0.3 + 0.5 * Math.pow(rng(i + 0.2), 3));
      col.push(WARM[i % WARM.length]);
    }
    const stars = makePoints(pos, sz, col, {cocPx: 0, maxPx: 5, soft: 0, minPx: 2.5});
    stars.mat.uniforms.uFog = {value: 0};
    scene.add(stars);
    const dp: V3[] = [], ds: number[] = [], dc: string[] = [];
    for (let i = 0; i < 700; i++) {
      const fr = Math.floor(rng(i + 3.3) * FRAMES), c = camKeyAt(fr), d = distKeyAt(fr);
      dp.push(add(c.tgt, [(rng(i + 1.1) - 0.5) * 1.6 * d, (rng(i + 1.7) - 0.45) * 0.9 * d, (rng(i + 2.3) - 0.5) * 1.6 * d]));
      ds.push((0.0006 + 0.0011 * rng(i + 4.4)) * d);
      dc.push(['#ffb060', '#ff9a50', '#ffd8a0', '#ffe8d0', '#ffc27a'][i % 5]);
    }
    for (let i = 0; i < 180; i++) {
      const fr = Math.floor(rng(i + 7.7) * FRAMES), c = camKeyAt(fr), d = distKeyAt(fr);
      const fw = mul(sub(c.tgt, c.pos), 1 / (len3(sub(c.tgt, c.pos)) || 1));
      const p0 = add(c.pos, mul(fw, d * (0.18 + 0.4 * rng(i + 8.1))));
      dp.push(add(p0, [(rng(i + 8.5) - 0.5) * 0.35 * d, (rng(i + 8.9) - 0.5) * 0.5 * d, (rng(i + 9.3) - 0.5) * 0.4 * d]));
      ds.push((0.0003 + 0.0004 * rng(i + 9.7)) * d);
      dc.push(['#ffb060', '#ffc890', '#ffd8a0', '#ffe8d0'][i % 4]);
    }
    const dust = makePoints(dp, ds, dc, {drift: 0, cocPx: 22, maxPx: 30, soft: 0.8, minPx: 2.5, near0: 0.05, near1: 0.15});
    scene.add(dust);
    on((f) => {
      const c = camAt(f), d = distAt(f);
      stars.position.set(...c.pos);
      stars.mat.uniforms.uA.value = 1.0;
      // 浮尘：近景淡出距离按尺度；相机飞得快（指数拉远 / 升空）时压暗，避免拖影闪烁
      dust.mat.uniforms.uNear0.value = 0.06 * d; dust.mat.uniforms.uNear1.value = 0.22 * d;
      const v = len3(sub(camAt(f + 1).pos, c.pos)) / d;
      dust.mat.uniforms.uA.value = 0.4 * (1 - 0.85 * ss(clamp((v - 0.004) / 0.012)));
    });
    // 棋盘背后的暖色雾幕
    const haze = makeHaze(60, 34, '#3a2008'); haze.position.set(0, 2, -16); scene.add(haze);
    const haze2 = makeHaze(70, 40, '#2a1606'); haze2.rotation.x = -Math.PI / 2; haze2.position.set(0, -0.4, 0); scene.add(haze2);
    on((f) => { const a = boardA(f); haze.mat.uniforms.uA.value = 0.5 * a; haze.visible = a > 0.003; haze2.mat.uniforms.uA.value = 0.45 * a; haze2.visible = a > 0.003; });
  }

  /* ======== 笔画：每一笔一个发光管 ======== */
  const tubes: Record<string, Tube> = {};
  const strokeA: Record<string, (f: number) => number> = {};
  for (const s of STROKES3) {
    if (!s.pts.length) continue;
    tubes[s.id] = tube(scene, s.pts, {r: s.r ?? 0.01, minPx: s.kind === 'link' ? 0.8 : 1.0, color: s.color ?? GOLD, core: s.core});
    if (s.dash) tubes[s.id].uni('uDash', s.dash);
  }
  for (const id of ['mcard', 'vn', 'earth', 'orbit']) if (tubes[id]) { tubes[id].core.renderOrder = 22; tubes[id].halo.renderOrder = 22; }
  for (const id of ['ring', 'sq1', 'sq2', 'back', 'hops', 'frame']) if (tubes[id]) REFL.add(tubes[id].group);
  const linkA = (s: S3) => (f: number) => 0.45 * (1 - prog(f, s.at + s.dur + 6, 40));
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
  strokeA.ring = (f) => 0.55 * (1 - ss(prog(f, L(2), 40)));
  strokeA.frame = (f) => boardA(f);
  strokeA.mcard = (f) => 0.9 * (1 - ss(prog(f, L(4) + 10, 24)));
  strokeA.sq1 = (f) => 0.85 * (1 - ss(prog(f, L(6) + 10, 30)));
  strokeA.sq2 = strokeA.sq1;
  strokeA.prev = (f) => 0.5 * (1 - ss(prog(f, L(5) + 30, 40)));
  strokeA.back = (f) => 0.6 * (1 - ss(prog(f, L(6) + 20, 40)));
  strokeA.hops = (f) => 0.95 * (1 - 0.5 * ss(prog(f, EARTH0, 60))) * (1 - ss(prog(f, L(21) - 10, 40)));
  strokeA.earth = (f) => earthA(f);
  strokeA.orbit = (f) => 0.5 * earthA(f);
  strokeA.vn = (f) => vnA(f);
  strokeA.curve = (f) => 1;
  strokeA.final = (f) => 0.9;

  /* ======== 玻璃棋盘 ======== */
  const gB = grp(); REFL.add(gB);
  const gBoard = grp(); // 不进倒影（倒影里只要米粒 / 米堆 / 金线）
  {
    const slab = glass(gBoard, new THREE.BoxGeometry(2 * BH + 0.3, 0.14, 2 * BH + 0.3).translate(0, -0.075, 0), {color: '#24160a', rim: '#ffcf8a', body: 0.25, spec: 0.12});
    const tileGeo = (light: boolean) => {
      const P: number[] = [], N: number[] = [];
      for (let n = 1; n <= 64; n++) {
        if (isLight(n) !== light) continue;
        const [x, , z] = sq(n), h = 0.47;
        const q = [[x - h, z - h], [x + h, z - h], [x + h, z + h], [x - h, z - h], [x + h, z + h], [x - h, z + h]];
        for (const [a, b] of q) { P.push(a, -0.004, b); N.push(0, 1, 0); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3));
      return g;
    };
    const lightT = glass(gBoard, tileGeo(true), {color: '#6a4620', rim: '#9a6c38', body: 0.26, spec: 0.05});
    const darkT = glass(gBoard, tileGeo(false), {color: '#1e1309', rim: '#6a4a28', body: 0.25, spec: 0.04});
    const lines: V3[][] = [];
    for (let i = 0; i <= 8; i++) { const v = i - 4; lines.push(densify2([[v, 0.004, -BH], [v, 0.004, BH]])); lines.push(densify2([[-BH, 0.004, v], [BH, 0.004, v]])); }
    const grid = tube(gBoard, lines, {r: 0.004, minPx: 0.6, color: '#b07a3a', core: '#e0b070', halo: false});
    grid.uni('uHot', 0);
    on((f) => {
      const a = boardA(f);
      gBoard.visible = a > 0.003;
      if (!gBoard.visible) return;
      const fp = ss(prog(f, FRAME0 + 6, FRAME1 - FRAME0 + 10));
      const t = (0.3 + 0.7 * fp) * a * (0.45 + 0.55 * clamp((distAt(f) - 1.5) / 6));
      glassA(slab, 0.7 * t); glassA(lightT, t); glassA(darkT, t);
      grid.set({a: 0.42 * t});
      // 近景：一圈柔光（目标点周围），远处的格子暗下去，顶部文字不压在亮格子上
      const c = baseCam(f), R = Math.max(5.5, distAt(f) * 0.62);
      for (const m of [slab, lightT, darkT]) { m.mat.uniforms.uSpotC.value.set(c.tgt[0], 0, c.tgt[2]); m.mat.uniforms.uSpotR.value = R; }
      const gm = grid.core.material as THREE.ShaderMaterial; gm.uniforms.uRadC.value.set(c.tgt[0], 0, c.tgt[2]); gm.uniforms.uRadR.value = R * 1.05;
      for (const id of ['frame', 'prev']) if (tubes[id]) for (const m of [tubes[id].core.material, tubes[id].halo.material] as THREE.ShaderMaterial[]) { m.uniforms.uRadC.value.set(c.tgt[0], 0, c.tgt[2]); m.uniforms.uRadR.value = R * (id === 'frame' ? 0.95 : 1.25); }
    });
  }

  /* ======== 米粒（ô 1–6）：一粒一粒的玻璃米粒；ô 1 那粒是主角（带柔光） ======== */
  {
    const gg = grainGeo();
    const grains: {n: number; m: THREE.Mesh & {mat: THREE.ShaderMaterial}; j: number}[] = [];
    const hero = makePearl(gg, {color: '#ffd49a', rim: '#fff4e2'}); gB.add(hero);
    hero.position.set(...add(sq(1), [0, 0.03, 0])); hero.rotation.set(0, 0.5, 0.06); hero.scale.setScalar(0.2);
    const halo = makeHaze(1, 1, '#ff9a3a'); scene.add(halo);
    for (let n = 2; n <= GRAIN_N; n++) {
      const cnt = 2 ** (n - 1), c = sq(n);
      for (let j = 0; j < cnt; j++) {
        const m = glass(gB, gg, {color: '#ffcf8a', rim: '#fff0d8', body: 0.5, spec: 0.35});
        const rr = 0.34 * Math.sqrt(rng(n * 100 + j)), th = rng(n * 100 + j + 0.5) * Math.PI * 2;
        const layer = n >= 5 && j > cnt * 0.6 ? 1 : 0;
        m.position.set(c[0] + rr * Math.cos(th) * (layer ? 0.6 : 1), 0.025 + layer * 0.035, c[2] + rr * Math.sin(th) * (layer ? 0.6 : 1));
        m.rotation.set(0, rng(n * 100 + j + 0.7) * Math.PI, (rng(n * 100 + j + 0.9) - 0.5) * 0.4);
        m.scale.setScalar(0.11);
        grains.push({n, m: m as THREE.Mesh & {mat: THREE.ShaderMaterial}, j});
      }
    }
    on((f) => {
      const sa = smallA(f) * boardA(f);
      // 主角米粒：开场大一点、亮一点，之后回到正常
      const heroK = 1 - ss(prog(f, L(2), 60));
      hero.scale.setScalar(0.12 + 0.07 * heroK);
      glassA(hero as never, eo(prog(f, 0, 12)) * sa);
      const c = camAt(f);
      billboard(halo, c);
      halo.position.set(...add(sq(1), [0, 0.05, 0]));
      const hs = 0.3 + 0.16 * heroK;
      halo.scale.set(hs, hs, hs);
      halo.mat.uniforms.uA.value = (0.05 + 0.03 * heroK) * eo(prog(f, 0, 14)) * sa;
      halo.visible = sa > 0.003;
      for (const g of grains) {
        // 一格里的米粒依次落下（不是同时闪现）
        const ap = appear(g.n, f);
        const k = clamp(ap * 1.6 - (g.j / (2 ** (g.n - 1))) * 0.6);
        glassA(g.m as never, eo(k) * sa);
      }
    });
  }

  /* ======== 小米堆（ô 7–32）：玻璃锥 + 表面的米粒光点 ======== */
  const coneGeo = new THREE.ConeGeometry(1, 1, 64, 1, true).translate(0, 0.5, 0);
  const conePts = (n: number, seed: number): V3[] => Array.from({length: n}, (_, i) => {
    const h = 1 - Math.sqrt(rng(seed + i * 1.37)), a = rng(seed + i * 2.11) * Math.PI * 2, r = (1 - h) * (0.92 + 0.06 * rng(seed + i * 3.7));
    return [r * Math.cos(a), h * 0.98, r * Math.sin(a)];
  });
  {
    const piles = [] as {n: number; g: THREE.Group; cone: ReturnType<typeof makeGlass>; pts: ReturnType<typeof makePoints>}[];
    for (let n = GRAIN_N + 1; n <= 32; n++) {
      const g = grp(gB);
      const [R, Hh] = moundRH(n);
      g.position.set(...sq(n)); g.scale.set(R, Hh, R);
      const cone = glass(g, coneGeo, {color: '#ffb35a', rim: '#ffe2b0', body: 0.2, spec: 0.12});
      const pp = conePts(36 + n * 2, n * 31);
      const pts = makePoints(pp, pp.map(() => 0.012), pp.map((_, i) => WARM[i % 5]), {cocPx: 6, maxPx: 8, soft: 0.3, minPx: 2.5, near0: 0.05, near1: 0.2});
      g.add(pts);
      piles.push({n, g, cone, pts});
    }
    on((f) => {
      const sa = smallA(f) * boardA(f), ma = mtnA(f);
      for (const p of piles) {
        const ap = appear(p.n, f);
        const a = eo(ap) * sa * (p.n === 32 ? 1 - ma : 1);
        p.g.visible = a > 0.003;
        if (!p.g.visible) continue;
        const [R, Hh] = moundRH(p.n);
        const grow = 0.6 + 0.4 * eo(ap);
        p.g.scale.set(R * grow, Hh * eo(ap), R * grow);
        glassA(p.cone, 0.6 * a);
        p.pts.mat.uniforms.uA.value = 0.5 * a;
      }
    });
  }

  /* ======== 米山（ô 33+）：一座连续长大的自相似锥体 ======== */
  {
    const g = grp(gB);
    const cone = makePile(pileGeo(), {color: '#ffb05a', rim: '#ffe0aa', occ: 0.72}); g.add(cone);
    cone.renderOrder = 5; // after the board (covers grid lines behind it), before the thread / sparkles
    if (tubes.hops) { tubes.hops.core.renderOrder = 7; tubes.hops.halo.renderOrder = 7; }
    const pp = conePts(2600, 991).map(([x, , z]) => { const r = Math.hypot(x, z); return [x, pileY(Math.min(1, r)) * 1.0 + 0.004, z] as V3; });
    const pts = makePoints(pp, pp.map((_, i) => 0.006 + 0.006 * rng(i + 5.5)), pp.map((_, i) => WARM[i % 5]), {cocPx: 8, maxPx: 10, soft: 0.4, minPx: 2.5, near0: 0.02, near1: 0.08});
    g.add(pts); pts.renderOrder = 6;
    // 高潮：从山脚扩散的两道金环
    const ringPts: V3[] = Array.from({length: 181}, (_, i) => { const a = (i / 180) * Math.PI * 2; return [Math.cos(a), 0.002, Math.sin(a)]; });
    const shock = [0, 1].map(() => { const sg = grp(); const t = tube(sg, ringPts, {r: 0.5, minPx: 1.4}); t.uni('uHot', 0); return {sg, t}; });
    on((f) => {
      const s = sAt(f), ma = mtnA(f);
      g.visible = ma > 0.003;
      const n0 = Math.min(63, Math.max(32, Math.floor(s)));
      const c = lerp3(sq(n0), sq(n0 + 1), clamp(s - n0));
      const k = mountainK(f);
      g.position.set(...c);
      g.scale.set(0.42 * k, 0.5 * k, 0.42 * k);
      // 米山越大越暗一点（大面积加法发光不过曝）；地球段淡到很暗，只留一个远处的金色山影
      const far = 1 - 0.75 * ss(prog(f, EARTH0, 60));
      glassA(cone, 0.8 * ma * far);
      pts.mat.uniforms.uA.value = 0.32 * ma * far;
      pts.mat.uniforms.uScale.value = k;
      shock.forEach((sh, i) => {
        const t0 = CLIMAX + i * 14, u = prog(f, t0, 70);
        const on2 = f >= t0 && u < 1;
        sh.sg.visible = on2;
        if (!on2) return;
        const R = 0.42 * k * (1.05 + 1.5 * eo(u));
        sh.t.update(ringPts.map((q) => [c[0] + q[0] * R, 0.002, c[2] + q[2] * R] as V3));
        sh.t.set({a: 0.7 * (1 - u) * (i ? 0.6 : 1)});
      });
    });
  }

  /* ======== 传说：波斯细密画（Shahnama of Shah Tahmasp，约 1530，The Met · CC0） ======== */
  {
    const g = grp();
    const mc = card(g, CARDS().chess, IMG('chess'), {warm: 0.25, gain: 0.85, feather: 0.03});
    on((f) => { const a = win(f, MCARD0 + 4, L(4) + 14, 18, 24); g.visible = a > 0.003; mc(a); });
  }

  /* ======== 地球（NASA Apollo 17，PD）：圆形遮罩、加法混合，金色圆框由笔头画出 ======== */
  {
    const g = grp();
    const r = CARDS().earth;
    const earth = makeImage(new THREE.PlaneGeometry(r.w * 1.02, r.h * 1.02), IMG('earth'), {mode: 1, add: true, warm: 0.3, gain: 0.95, feather: 0.025});
    faceTo(earth, r); earth.renderOrder = 21; g.add(earth);
    const glow = makeHaze(r.w * 1.9, r.h * 1.9 * 1.6, '#2a1606'); faceTo(glow, r); g.add(glow);
    const vc = card(g, CARDS().vn, IMG('vn'), {warm: 0.28, gain: 0.85, feather: 0.03});
    on((f) => {
      const a = earthA(f) * eo(prog(f, EARTHC0 + 8, 24));
      g.visible = a > 0.003 || vnA(f) > 0.003;
      imgA(earth, a); glow.mat.uniforms.uA.value = 0.5 * a;
      vc(vnA(f) * eo(prog(f, VNC0 + 14, 14)));
    });
  }

  /* ======== 结尾：曲线 2^x 的坐标轴 + 起点的一粒米 ======== */
  {
    const g = grp();
    const c = baseCam(CURVE_REF), d = distAt(CURVE_REF);
    const p0 = CURVE_PTS[0];
    const ax = tube(g, [unproj(c, 140, 1150, d * 0.78), unproj(c, 940, 1150, d * 0.66)], {r: d * 0.0007, minPx: 0.9, halo: false, color: '#b07a3a'});
    ax.uni('uHot', 0);
    const ay = tube(g, [unproj(c, 170, 1175, d * 0.78), unproj(c, 170, 400, d * 0.78)], {r: d * 0.0007, minPx: 0.9, halo: false, color: '#b07a3a'});
    ay.uni('uHot', 0);
    const gr = glass(g, grainGeo(), {color: '#ffcf8a', rim: '#fff2dc', body: 0.36, spec: 0.3});
    gr.position.set(...p0); gr.scale.setScalar(d * 0.03); gr.rotation.set(0.3, 0.6, 0.1);
    const halo = makeHaze(d * 0.16, d * 0.16, '#ff9a3a'); g.add(halo); halo.position.set(...p0);
    void curvePt;
    on((f) => {
      const a = curveA(f) * (1 - ss(prog(f, FRAMES - 34, 30)));
      g.visible = a > 0.003;
      if (!g.visible) return;
      ax.set({a: 0.4 * a}); ay.set({a: 0.3 * a * ss(prog(f, CURVE0, 30))});
      glassA(gr, 0.8 * a); billboard(halo, camAt(f)); halo.mat.uniforms.uA.value = 0.2 * a;
    });
  }

  /* ======== 每帧：相机、雾、景深 ======== */
  const update = (f: number) => {
    U.uTime.value = f / 30;
    for (const fn of ups) fn(f);
    const c = camAt(f);
    const fg = fogAt(f);
    U.uFocus.value = fg.focus;
    U.uCoc.value = fg.coc;
    U.uFog.value = fg.fog; U.uFogNear.value = fg.near;
    U.uDim.value = 1;
    return c;
  };
  // 倒影：只有棋盘上的米粒 / 米堆 / 金线（REFL）；米山长大后关掉
  const saved = new Map<THREE.Object3D, boolean>();
  const refl = (f: number, onP: boolean) => {
    if (onP) {
      const k = 0.14 * boardA(f) * (1 - ss((sAt(f) - 33) / 2)) * ss(prog(f, 20, 40));
      if (k < 0.003) return 0;
      saved.clear();
      for (const o of scene.children) { saved.set(o, o.visible); if (!REFL.has(o)) o.visible = false; }
      return k;
    }
    for (const [o, v] of saved) o.visible = v;
    saved.clear();
    return 0;
  };
  void LE; void EARTHC0; void rrect3; void S3ID;
  return {scene, update, refl, ready: texReadyAll()};
};
import {texReady} from './gl';
const texReadyAll = () => texReady();
const densify2 = (pts: V3[]): V3[] => { const a = pts[0], b = pts[1]; return Array.from({length: 25}, (_, i) => lerp3(a, b, i / 24)); };

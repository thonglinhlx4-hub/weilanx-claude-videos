// ep55 v2 · three.js 小内核（不用 R3F）：每帧由帧号 f 纯函数地设置所有 uniform / 变换后同步 render 一次。
// 发光线 = 自建"中心线 + 法线"管道几何：同一份几何挂两种材质（芯 / 晕），半径在顶点着色器里按深度放宽到至少 N 像素，
// 所以远处的线不会细到闪烁；绘制进度 / 尾巴用弧长参数 u 在片元里裁掉。全部用加法混合 + 深度雾 + 景深（离焦更软更暗）。
import * as THREE from 'three';

export type V3 = [number, number, number];
export const v3 = (a: V3) => new THREE.Vector3(a[0], a[1], a[2]);
export const W = 1920, H = 1080;

/* ---------------- 公共 uniform（相机相关，每帧写一次） ---------------- */
export const U = {
  uPxK: {value: 0.0006},   // 世界单位 / 像素 @ 深度 1 = 2 tan(fov/2) / H
  uFog: {value: 0.012},    // 指数平方雾密度
  uFogNear: {value: 8},    // 雾从这个深度开始
  uFocus: {value: 16},     // 对焦深度
  uCoc: {value: 0.05},     // 离焦强度 / 单位深度差
  uTime: {value: 0},
  uDim: {value: 1},        // 全局亮度（高潮前收暗等）
};
const COMMON = /* glsl */ `
uniform float uPxK; uniform float uFog; uniform float uFogNear; uniform float uFocus; uniform float uCoc; uniform float uTime; uniform float uDim;
float fogK(float d){ float x = max(0.0, d - uFogNear) * uFog; return exp(-x * x); }
float cocK(float d){ return clamp(abs(d - uFocus) * uCoc, 0.0, 1.0); }
`;

/* ---------------- 发光管 ---------------- */
const TUBE_VS = /* glsl */ `
${COMMON}
attribute vec3 aC; attribute vec3 aN; attribute float aU;
uniform float uR; uniform float uMinPx; uniform float uWave; uniform vec3 uRadC; uniform float uRadR;
varying float vU; varying float vNdv; varying float vD; varying float vRad;
void main(){
  vec3 c0 = aC + uWave * vec3(0.0, sin(aC.x * 0.33 + uTime * 0.5 + aC.z * 0.21), 0.6 * cos(aC.x * 0.27 + uTime * 0.37 + aC.y * 0.4));
  vec4 cv = modelViewMatrix * vec4(c0, 1.0);
  float d = max(0.05, -cv.z);
  float r = max(uR, uMinPx * uPxK * d);
  vec3 p = c0 + aN * r;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec3 n = normalize(normalMatrix * aN);
  vec3 v = normalize(-mv.xyz);
  vNdv = abs(dot(n, v));
  vU = aU; vD = d;
  vRad = uRadR > 0.0 ? 1.0 - smoothstep(0.5, 1.0, length((modelMatrix * vec4(c0, 1.0)).xz - uRadC.xz) / uRadR) : 1.0;
  gl_Position = projectionMatrix * mv;
}`;
const TUBE_FS = /* glsl */ `
${COMMON}
uniform vec3 uColor; uniform vec3 uCoreC; uniform float uA; uniform float uP0; uniform float uP1; uniform float uHalo; uniform float uHot; uniform float uDash;
varying float vU; varying float vNdv; varying float vD; varying float vRad;
void main(){
  if (vU > uP1 || vU < uP0) discard;
  if (uDash > 0.0 && fract(vU * uDash) > 0.55) discard;
  float fog = fogK(vD); float coc = cocK(vD);
  float hot = uHot * smoothstep(uP1 - 0.04, uP1, vU) * step(uP1, 0.9999);
  vec3 col; float a;
  if (uHalo > 0.5) {
    a = pow(vNdv, 2.2) * 0.26 * (1.0 + 0.8 * coc);
    col = uColor;
  } else {
    float c = pow(vNdv, 1.5);
    a = (0.35 + 0.65 * c) * (1.0 - 0.72 * coc);
    col = mix(uColor, uCoreC, c * (1.0 - 0.6 * coc));
  }
  a *= uA * fog * uDim * vRad * (1.0 + 0.5 * hot);
  gl_FragColor = vec4(col, a);
}`;

export type Tube = {
  geo: THREE.BufferGeometry; core: THREE.Mesh; halo: THREE.Mesh; group: THREE.Group;
  set: (o: {p1?: number; p0?: number; a?: number; color?: string; core?: string; visible?: boolean}) => void;
  uni: (k: string, v: number) => void;
  update: (pts: V3[]) => void; n: number;
};
const SIDES = 6;
/** 沿折线的平行移动标架；返回每个环的 (中心, 法线) 顶点数据 */
const fillTube = (pts: V3[], aC: Float32Array, aN: Float32Array, aU: Float32Array) => {
  const n = pts.length;
  const L: number[] = [0];
  for (let i = 1; i < n; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  const tot = L[n - 1] || 1;
  const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), tmp = new THREE.Vector3();
  const tan = (i: number, out: THREE.Vector3) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    out.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (out.lengthSq() < 1e-12) out.set(1, 0, 0);
    return out.normalize();
  };
  tan(0, T);
  // 初始法线：与切线最不平行的轴
  const ax = Math.abs(T.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  N.crossVectors(T, ax).normalize();
  for (let i = 0; i < n; i++) {
    if (i > 0) {
      tan(i, T);
      N.sub(tmp.copy(T).multiplyScalar(N.dot(T)));
      if (N.lengthSq() < 1e-10) N.crossVectors(T, Math.abs(T.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0));
      N.normalize();
    }
    B.crossVectors(T, N);
    for (let k = 0; k <= SIDES; k++) {
      const a = (k / SIDES) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      const j = (i * (SIDES + 1) + k) * 3;
      aC[j] = pts[i][0]; aC[j + 1] = pts[i][1]; aC[j + 2] = pts[i][2];
      aN[j] = N.x * c + B.x * s; aN[j + 1] = N.y * c + B.y * s; aN[j + 2] = N.z * c + B.z * s;
      aU[i * (SIDES + 1) + k] = L[i] / tot;
    }
  }
};
const tubeMat = (halo: boolean, r: number, minPx: number, color: string, core: string) => new THREE.ShaderMaterial({
  vertexShader: TUBE_VS, fragmentShader: TUBE_FS, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  uniforms: {
    ...U, uR: {value: halo ? r * 5 : r}, uMinPx: {value: halo ? minPx * 6 : minPx}, uColor: {value: new THREE.Color(halo ? (color === GOLD ? '#ffad55' : color) : color)},
    uCoreC: {value: new THREE.Color(core)}, uA: {value: 1}, uP0: {value: 0}, uP1: {value: 1}, uHalo: {value: halo ? 1 : 0}, uHot: {value: 1}, uDash: {value: 0}, uWave: {value: 0}, uRadC: {value: new THREE.Vector3()}, uRadR: {value: 0},
  },
});
export const GOLD = '#e8ae62';
export const makeTube = (pts: V3[] | V3[][], o: {r?: number; minPx?: number; color?: string; core?: string; halo?: boolean} = {}): Tube => {
  const polys: V3[][] = Array.isArray(pts[0][0]) ? (pts as V3[][]) : [pts as V3[]];
  const n = polys.reduce((k, p) => k + p.length, 0);
  const aC = new Float32Array(n * (SIDES + 1) * 3), aN = new Float32Array(n * (SIDES + 1) * 3), aU = new Float32Array(n * (SIDES + 1));
  const idx: number[] = [];
  let base = 0;
  for (const p of polys) {
    const m = p.length;
    const c = new Float32Array(m * (SIDES + 1) * 3), nn = new Float32Array(m * (SIDES + 1) * 3), u = new Float32Array(m * (SIDES + 1));
    fillTube(p, c, nn, u);
    aC.set(c, base * (SIDES + 1) * 3); aN.set(nn, base * (SIDES + 1) * 3); aU.set(u, base * (SIDES + 1));
    for (let i = 0; i < m - 1; i++) for (let k = 0; k < SIDES; k++) {
      const a = (base + i) * (SIDES + 1) + k, b = a + SIDES + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    base += m;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('aC', new THREE.BufferAttribute(aC, 3));
  geo.setAttribute('aN', new THREE.BufferAttribute(aN, 3));
  geo.setAttribute('aU', new THREE.BufferAttribute(aU, 1));
  geo.setAttribute('position', new THREE.BufferAttribute(aC, 3));
  geo.setIndex(idx);
  const color = o.color ?? GOLD, core = o.core ?? '#fff1d6', r = o.r ?? 0.018, minPx = o.minPx ?? 0.9;
  const coreM = tubeMat(false, r, minPx, color, core), haloM = tubeMat(true, r, minPx, color, core);
  const coreMesh = new THREE.Mesh(geo, coreM), haloMesh = new THREE.Mesh(geo, haloM);
  coreMesh.frustumCulled = false; haloMesh.frustumCulled = false;
  const group = new THREE.Group();
  if (o.halo !== false) group.add(haloMesh);
  group.add(coreMesh);
  const set: Tube['set'] = ({p1, p0, a, color: c, core: cc, visible}) => {
    for (const m of [coreM, haloM]) {
      if (p1 !== undefined) m.uniforms.uP1.value = p1;
      if (p0 !== undefined) m.uniforms.uP0.value = p0;
      if (a !== undefined) m.uniforms.uA.value = a;
    }
    if (c) { coreM.uniforms.uColor.value.set(c); haloM.uniforms.uColor.value.set(c === GOLD ? '#ffad55' : c); }
    if (cc) coreM.uniforms.uCoreC.value.set(cc);
    if (visible !== undefined) group.visible = visible;
    else if (a !== undefined) group.visible = a > 0.002 && (p1 === undefined || p1 > (p0 ?? 0));
  };
  const update = (q: V3[]) => {
    if (polys.length > 1) return;
    fillTube(q, aC, aN, aU);
    (geo.attributes.aC as THREE.BufferAttribute).needsUpdate = true;
    (geo.attributes.aN as THREE.BufferAttribute).needsUpdate = true;
    (geo.attributes.aU as THREE.BufferAttribute).needsUpdate = true;
  };
  const uni = (k: string, v: number) => { coreM.uniforms[k].value = v; haloM.uniforms[k].value = v; };
  return {geo, core: coreMesh, halo: haloMesh, group, set, update, uni, n};
};

/* ---------------- 玻璃 / 金属外壳：菲涅尔边缘光（加法） ---------------- */
const GLASS_VS = /* glsl */ `
${COMMON}
varying float vNdv; varying float vD; varying vec3 vWN; varying vec3 vR;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 n = normalize(normalMatrix * normal);
  vec3 v = normalize(-mv.xyz);
  vNdv = abs(dot(n, v)); vD = -mv.z;
  vR = reflect(-v, n);
  gl_Position = projectionMatrix * mv;
}`;
const GLASS_FS = /* glsl */ `
${COMMON}
uniform vec3 uColor; uniform vec3 uRim; uniform float uA; uniform float uBody; uniform float uSpec;
varying float vNdv; varying float vD; varying vec3 vR;
void main(){
  float fr = pow(1.0 - vNdv, 2.6);
  float band = smoothstep(0.55, 0.9, vR.y) * 0.8 + smoothstep(0.75, 0.98, -vR.x) * 0.5;
  vec3 col = uColor * uBody + uRim * fr * 0.9 + uRim * band * uSpec;
  float a = uA * fogK(vD) * uDim * (1.0 - 0.55 * cocK(vD));
  gl_FragColor = vec4(col * a, 1.0);
}`;
export type Glass = THREE.Mesh & {mat: THREE.ShaderMaterial};
export const makeGlass = (geo: THREE.BufferGeometry, o: {color?: string; rim?: string; body?: number; spec?: number} = {}): Glass => {
  const mat = new THREE.ShaderMaterial({
    vertexShader: GLASS_VS, fragmentShader: GLASS_FS, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    uniforms: {...U, uColor: {value: new THREE.Color(o.color ?? '#3a2a14')}, uRim: {value: new THREE.Color(o.rim ?? '#ffcf8a')}, uA: {value: 1}, uBody: {value: o.body ?? 0.18}, uSpec: {value: o.spec ?? 0.35}},
  });
  const m = new THREE.Mesh(geo, mat) as unknown as Glass;
  m.mat = mat; m.frustumCulled = false;
  return m;
};
export const glassA = (g: Glass, a: number) => { g.mat.uniforms.uA.value = a; g.visible = a > 0.002; };

/* ---------------- 粒子：星点 / 散景（景深：离焦变大变淡） ---------------- */
const PTS_VS = /* glsl */ `
${COMMON}
attribute float aSize; attribute vec3 aCol; attribute float aSeed;
uniform float uScale; uniform float uDrift; uniform float uMaxPx; uniform float uCocPx; uniform float uBok;
varying vec3 vCol; varying float vA;
void main(){
  vec3 p = position + uDrift * vec3(sin(uTime * 0.21 + aSeed * 6.0), sin(uTime * 0.17 + aSeed * 9.0) * 0.6, cos(uTime * 0.13 + aSeed * 4.0));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float d = max(0.1, -mv.z);
  float base = aSize * uScale / (d * uPxK);
  float coc = cocK(d);
  float s = clamp(base + coc * uCocPx, 1.5, uMaxPx);
  gl_PointSize = s;
  float tw = 0.75 + 0.25 * sin(uTime * (1.0 + aSeed * 2.0) + aSeed * 40.0);
  vA = fogK(d) * tw * mix(1.0, mix(1.0, 0.2, smoothstep(0.0, 1.0, coc)), uBok) * uDim;
  if (d < 0.6) vA = 0.0;
  vCol = aCol;
  gl_Position = projectionMatrix * mv;
}`;
const PTS_FS = /* glsl */ `
uniform float uA; uniform float uSoft;
varying vec3 vCol; varying float vA;
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0; float r = length(q);
  if (r > 1.0) discard;
  float disc = mix(1.0 - smoothstep(0.0, 1.0, r), (1.0 - smoothstep(0.82, 1.0, r)) * (0.75 + 0.25 * r), uSoft);
  gl_FragColor = vec4(vCol * disc * vA * uA, 1.0);
}`;
export type Pts = THREE.Points & {mat: THREE.ShaderMaterial};
export const makePoints = (pos: V3[], size: number[], col: string[], o: {scale?: number; drift?: number; maxPx?: number; cocPx?: number; soft?: number} = {}): Pts => {
  const g = new THREE.BufferGeometry();
  const P = new Float32Array(pos.length * 3), S = new Float32Array(pos.length), Cc = new Float32Array(pos.length * 3), Sd = new Float32Array(pos.length);
  const c = new THREE.Color();
  pos.forEach((p, i) => { P.set(p, i * 3); S[i] = size[i]; c.set(col[i]); Cc.set([c.r, c.g, c.b], i * 3); Sd[i] = (Math.sin(i * 91.7) * 43758.5) % 1; });
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(S, 1));
  g.setAttribute('aCol', new THREE.BufferAttribute(Cc, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(Sd, 1));
  const mat = new THREE.ShaderMaterial({
    vertexShader: PTS_VS, fragmentShader: PTS_FS, transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    uniforms: {...U, uScale: {value: o.scale ?? 1}, uDrift: {value: o.drift ?? 0}, uMaxPx: {value: o.maxPx ?? 90}, uCocPx: {value: o.cocPx ?? 40}, uA: {value: 1}, uSoft: {value: o.soft ?? 0.6}, uBok: {value: (o.cocPx ?? 40) > 0 ? 1 : 0}},
  });
  const m = new THREE.Points(g, mat) as unknown as Pts;
  m.mat = mat; m.frustumCulled = false;
  return m;
};

/* ---------------- 细线（网格地面等）：1px 线 + 雾 + 径向衰减 ---------------- */
const LN_VS = /* glsl */ `
${COMMON}
uniform vec3 uCenter; uniform float uRad;
varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float d = -mv.z;
  vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;
  float rr = length(wp.xz - uCenter.xz) / uRad;
  vA = fogK(d) * (1.0 - smoothstep(0.55, 1.0, rr)) * uDim;
  gl_Position = projectionMatrix * mv;
}`;
const LN_FS = /* glsl */ `
uniform vec3 uColor; uniform float uA; varying float vA;
void main(){ gl_FragColor = vec4(uColor * vA * uA, 1.0); }`;
export type Lines = THREE.LineSegments & {mat: THREE.ShaderMaterial};
export const makeLines = (segs: number[], o: {color?: string; center?: V3; rad?: number} = {}): Lines => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segs), 3));
  const mat = new THREE.ShaderMaterial({
    vertexShader: LN_VS, fragmentShader: LN_FS, transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    uniforms: {...U, uColor: {value: new THREE.Color(o.color ?? '#3c5ccc')}, uA: {value: 1}, uCenter: {value: v3(o.center ?? [0, 0, 0])}, uRad: {value: o.rad ?? 40}},
  });
  const m = new THREE.LineSegments(g, mat) as unknown as Lines;
  m.mat = mat; m.frustumCulled = false;
  return m;
};
/** 透视网格地面（y = y0 平面，以 c 为中心，半径 R，间距 s） */
export const gridSegs = (c: V3, R: number, s: number, y0 = c[1]): number[] => {
  const out: number[] = [];
  const n = Math.floor(R / s);
  for (let i = -n; i <= n; i++) {
    out.push(c[0] + i * s, y0, c[2] - R, c[0] + i * s, y0, c[2] + R);
    out.push(c[0] - R, y0, c[2] + i * s, c[0] + R, y0, c[2] + i * s);
  }
  return out;
};
/** 网格地面（发光细管版，抗锯齿更好）：返回多条两点折线 */
export const gridPolys = (c: V3, R: number, s: number, y0 = c[1]): V3[][] => {
  const out: V3[][] = [];
  const n = Math.floor(R / s);
  const seg = (a: V3, b: V3) => Array.from({length: 13}, (_, i) => [a[0] + (b[0] - a[0]) * i / 12, a[1] + (b[1] - a[1]) * i / 12, a[2] + (b[2] - a[2]) * i / 12] as V3);
  for (let i = -n; i <= n; i++) {
    out.push(seg([c[0] + i * s, y0, c[2] - R], [c[0] + i * s, y0, c[2] + R]));
    out.push(seg([c[0] - R, y0, c[2] + i * s], [c[0] + R, y0, c[2] + i * s]));
  }
  return out;
};
export const makeGrid = (c: V3, R: number, s: number, color = '#3352c8', y0 = c[1]) => {
  const t = makeTube(gridPolys(c, R, s, y0), {r: 0.004, minPx: 0.55, color, core: color, halo: false});
  t.core.material instanceof THREE.ShaderMaterial && (t.core.material.uniforms.uRadC.value.set(c[0], y0, c[2]), t.core.material.uniforms.uRadR.value = R);
  return t;
};
export const linesA = (l: Lines, a: number) => { l.mat.uniforms.uA.value = a; l.visible = a > 0.002; };

/* ---------------- 相机 ---------------- */
export type CamS = {pos: V3; tgt: V3; fov: number; roll?: number};
export const applyCam = (cam: THREE.PerspectiveCamera, c: CamS) => {
  cam.fov = c.fov; cam.aspect = W / H; cam.near = 0.05; cam.far = 2000;
  cam.position.set(c.pos[0], c.pos[1], c.pos[2]);
  cam.up.set(Math.sin(c.roll ?? 0), Math.cos(c.roll ?? 0), 0);
  cam.lookAt(c.tgt[0], c.tgt[1], c.tgt[2]);
  cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
  U.uPxK.value = (2 * Math.tan((c.fov * Math.PI) / 360)) / H;
};
const _cam = new THREE.PerspectiveCamera();
const _v = new THREE.Vector3();
/** 世界点 → 屏幕像素（浮点）；z<0 表示在相机后面 */
export const project = (c: CamS, p: V3): [number, number, number] => {
  applyCamNoU(_cam, c);
  _v.set(p[0], p[1], p[2]).applyMatrix4(_cam.matrixWorldInverse);
  const depth = -_v.z;
  _v.applyMatrix4(_cam.projectionMatrix);
  return [(_v.x * 0.5 + 0.5) * W, (-_v.y * 0.5 + 0.5) * H, depth];
};
const applyCamNoU = (cam: THREE.PerspectiveCamera, c: CamS) => {
  cam.fov = c.fov; cam.aspect = W / H; cam.near = 0.05; cam.far = 2000;
  cam.position.set(c.pos[0], c.pos[1], c.pos[2]);
  cam.up.set(Math.sin(c.roll ?? 0), Math.cos(c.roll ?? 0), 0);
  cam.lookAt(c.tgt[0], c.tgt[1], c.tgt[2]);
  cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
};

/* ---------------- 真实照片：柔光处理（暖色化、羽化边缘、雾、可加法或普通混合） ---------------- */
const IMG_VS = /* glsl */ `
${COMMON}
varying vec2 vUv; varying float vD; varying float vNdv;
void main(){
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vD = -mv.z;
  vNdv = abs(dot(normalize(normalMatrix * normal), normalize(-mv.xyz)));
  gl_Position = projectionMatrix * mv;
}`;
const IMG_FS = /* glsl */ `
${COMMON}
uniform sampler2D tex; uniform float uA; uniform float uMode; uniform float uWarm; uniform float uGain; uniform float uAdd; uniform float uFeather; uniform float uLift;
varying vec2 vUv; varying float vD; varying float vNdv;
void main(){
  vec3 c = texture2D(tex, vUv).rgb;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(c, l * vec3(1.08, 0.86, 0.62), uWarm) * uGain;
  c = max(c - uLift, 0.0) / (1.0 - uLift);
  float m = 1.0;
  if (uMode < 0.5) {
    vec2 e = min(vUv, 1.0 - vUv);
    m = smoothstep(0.0, uFeather, e.x) * smoothstep(0.0, uFeather, e.y);
  } else if (uMode < 1.5) {
    m = 1.0 - smoothstep(0.5 - uFeather, 0.5, length(vUv - 0.5));
  } else {
    c *= 0.25 + 0.75 * pow(vNdv, 0.7);
    m = 0.55 + 0.45 * vNdv;
  }
  float a = uA * m * fogK(vD) * uDim * (1.0 - 0.45 * cocK(vD));
  if (uAdd > 0.5) gl_FragColor = vec4(c * a, 1.0);
  else gl_FragColor = vec4(c * a, a);
}`;
const TEX: Record<string, THREE.Texture> = {};
const TEXP: Promise<unknown>[] = [];
export const texReady = () => Promise.all(TEXP);
export const loadTex = (url: string): THREE.Texture => {
  if (TEX[url]) return TEX[url];
  const t = new THREE.Texture();
  TEX[url] = t;
  TEXP.push(new Promise<void>((res) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { t.image = img; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true; res(); };
    img.onerror = () => res();
    img.src = url;
  }));
  return t;
};
export type Img = THREE.Mesh & {mat: THREE.ShaderMaterial};
export const makeImage = (geo: THREE.BufferGeometry, url: string, o: {mode?: number; warm?: number; gain?: number; add?: boolean; feather?: number; lift?: number} = {}): Img => {
  const mat = new THREE.ShaderMaterial({
    vertexShader: IMG_VS, fragmentShader: IMG_FS, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: o.add ? THREE.OneFactor : THREE.OneMinusSrcAlphaFactor,
    uniforms: {...U, tex: {value: loadTex(url)}, uA: {value: 1}, uMode: {value: o.mode ?? 0}, uWarm: {value: o.warm ?? 0.35}, uGain: {value: o.gain ?? 0.8}, uAdd: {value: o.add ? 1 : 0}, uFeather: {value: o.feather ?? 0.08}, uLift: {value: o.lift ?? 0}},
  });
  const m = new THREE.Mesh(geo, mat) as unknown as Img;
  m.mat = mat; m.frustumCulled = false;
  return m;
};
export const imgA = (m: Img, a: number) => { m.mat.uniforms.uA.value = a; m.visible = a > 0.002; };

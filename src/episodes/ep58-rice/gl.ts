// ep57（基于 ep56 gl.ts；新增：液体光容器 VESSEL、流动光管 uFlow、远景门阵 DoorField、暖色雾幕 Haze）· ep56（基于 ep55 v2 gl.ts）· three.js 小内核；粒子着色器按 ep55 v2 反馈改过：星点最小 2.5 px、慢速轻闪、近景散景按距离平滑淡出、出画边缘前淡出（不用 R3F）：每帧由帧号 f 纯函数地设置所有 uniform / 变换后同步 render 一次。
// 发光线 = 自建"中心线 + 法线"管道几何：同一份几何挂两种材质（芯 / 晕），半径在顶点着色器里按深度放宽到至少 N 像素，
// 所以远处的线不会细到闪烁；绘制进度 / 尾巴用弧长参数 u 在片元里裁掉。全部用加法混合 + 深度雾 + 景深（离焦更软更暗）。
import * as THREE from 'three';

export type V3 = [number, number, number];
export const v3 = (a: V3) => new THREE.Vector3(a[0], a[1], a[2]);
export const W = 1080, H = 1920; // 9:16 vertical

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
uniform float uR; uniform float uMinPx; uniform float uWave; uniform vec3 uRadC; uniform float uRadR; uniform float uGraze;
varying float vU; varying float vNdv; varying float vD; varying float vRad; varying float vGz;
void main(){
  vec3 c0 = aC + uWave * vec3(0.0, sin(aC.x * 0.33 + uTime * 0.5 + aC.z * 0.21), 0.6 * cos(aC.x * 0.27 + uTime * 0.37 + aC.y * 0.4));
  vec4 cv = modelViewMatrix * vec4(c0, 1.0);
  float d = max(0.05, -cv.z);
  float r = max(uR, uMinPx * uPxK * d);
  vec3 p = c0 + aN * r;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec3 n = normalize(normalMatrix * aN);
  vec3 v = normalize(-mv.xyz);
  vNdv = clamp(abs(dot(n, v)), 0.0, 1.0);
  vU = aU; vD = d;
  // ep56: floor grids fade out where they are seen at a grazing angle (lines stacking at the horizon made bright blobs)
  vGz = uGraze > 0.0 ? smoothstep(0.03, 0.2, abs(normalize(cameraPosition - (modelMatrix * vec4(c0, 1.0)).xyz).y)) : 1.0;
  vRad = uRadR > 0.0 ? 1.0 - smoothstep(0.5, 1.0, length((modelMatrix * vec4(c0, 1.0)).xz - uRadC.xz) / uRadR) : 1.0;
  gl_Position = projectionMatrix * mv;
}`;
const TUBE_FS = /* glsl */ `
${COMMON}
uniform vec3 uColor; uniform vec3 uCoreC; uniform float uA; uniform float uP0; uniform float uP1; uniform float uHalo; uniform float uHot; uniform float uDash; uniform float uFlow;
varying float vU; varying float vNdv; varying float vD; varying float vRad; varying float vGz;
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
  a *= uA * fog * uDim * vRad * vGz * (1.0 + 0.5 * hot);
  // ep57: liquid-light stream — soft travelling pulses along the tube (no spot: a gentle 0.55–1.0 modulation)
  if (uFlow > 0.0) a *= 0.62 + 0.38 * (0.5 + 0.5 * sin((vU * uFlow - uTime * 1.6) * 6.2832));
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
    uCoreC: {value: new THREE.Color(core)}, uA: {value: 1}, uP0: {value: 0}, uP1: {value: 1}, uHalo: {value: halo ? 1 : 0}, uHot: {value: 1}, uDash: {value: 0}, uFlow: {value: 0}, uWave: {value: 0}, uRadC: {value: new THREE.Vector3()}, uRadR: {value: 0}, uGraze: {value: 0},
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
varying float vNdv; varying float vD; varying vec3 vWN; varying vec3 vR; varying vec3 vW;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vW = (modelMatrix * vec4(position, 1.0)).xyz;
  vec3 n = normalize(normalMatrix * normal);
  vec3 v = normalize(-mv.xyz);
  vNdv = clamp(abs(dot(n, v)), 0.0, 1.0); vD = -mv.z;
  vR = reflect(-v, n);
  gl_Position = projectionMatrix * mv;
}`;
const GLASS_FS = /* glsl */ `
${COMMON}
uniform vec3 uColor; uniform vec3 uRim; uniform float uA; uniform float uBody; uniform float uSpec; uniform vec3 uSpotC; uniform float uSpotR;
varying float vNdv; varying float vD; varying vec3 vR; varying vec3 vW;
void main(){
  // ep56: clamp — vNdv can exceed 1.0 by float error, and pow(negative, y) is NaN (NaN/Inf then blooms into a white-blue blob)
  float fr = pow(clamp(1.0 - vNdv, 0.0, 1.0), 2.6);
  float band = smoothstep(0.55, 0.9, vR.y) * 0.8 + smoothstep(0.75, 0.98, -vR.x) * 0.5;
  vec3 col = uColor * uBody + uRim * fr * 0.9 + uRim * band * uSpec;
  float a = uA * fogK(vD) * uDim * (1.0 - 0.55 * cocK(vD));
  // ep58: optional pool of light (soft radial falloff on the floor around uSpotC) for close-ups of the board
  if (uSpotR > 0.0) a *= 0.12 + 0.88 * (1.0 - smoothstep(0.35, 1.0, length(vW.xz - uSpotC.xz) / uSpotR));
  gl_FragColor = vec4(col * a, 1.0);
}`;
export type Glass = THREE.Mesh & {mat: THREE.ShaderMaterial};
export const makeGlass = (geo: THREE.BufferGeometry, o: {color?: string; rim?: string; body?: number; spec?: number} = {}): Glass => {
  const mat = new THREE.ShaderMaterial({
    vertexShader: GLASS_VS, fragmentShader: GLASS_FS, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    uniforms: {...U, uColor: {value: new THREE.Color(o.color ?? '#3a2a14')}, uRim: {value: new THREE.Color(o.rim ?? '#ffcf8a')}, uA: {value: 1}, uBody: {value: o.body ?? 0.18}, uSpec: {value: o.spec ?? 0.35}, uSpotC: {value: new THREE.Vector3()}, uSpotR: {value: 0}},
  });
  const m = new THREE.Mesh(geo, mat) as unknown as Glass;
  m.mat = mat; m.frustumCulled = false;
  return m;
};
export const glassA = (g: Glass, a: number) => { g.mat.uniforms.uA.value = a; g.visible = a > 0.002; };

/* ---------------- ep58：米粒（珍珠般半透明的金色米粒）+ 米山（闭合实体、方向光照、颗粒纹理） ---------------- */
const LIT_VS = /* glsl */ `
${COMMON}
varying float vNdv; varying float vD; varying vec3 vWN; varying vec3 vV; varying vec3 vW; varying vec3 vL;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vW = (modelMatrix * vec4(position, 1.0)).xyz;
  vL = position;
  vWN = normalize(mat3(modelMatrix) * normal);
  vec3 n = normalize(normalMatrix * normal);
  vec3 v = normalize(-mv.xyz);
  vNdv = clamp(abs(dot(n, v)), 0.0, 1.0); vD = -mv.z;
  vV = normalize(cameraPosition - vW);
  gl_Position = projectionMatrix * mv;
}`;
/** 米粒：柔和的次表面透光（中轴更亮）+ 包裹漫反射 + 很小的珍珠高光 + 细细的纵向纹；整体峰值 < 0.9（不过曝） */
const PEARL_FS = /* glsl */ `
${COMMON}
uniform vec3 uColor; uniform vec3 uRim; uniform float uA; uniform vec3 uLight;
varying float vNdv; varying float vD; varying vec3 vWN; varying vec3 vV; varying vec3 vW; varying vec3 vL;
void main(){
  vec3 n = normalize(vWN); vec3 v = normalize(vV); vec3 l = normalize(uLight);
  float ndl = dot(n, l);
  float wrap = clamp((ndl + 0.45) / 1.45, 0.0, 1.0);
  float sss = pow(clamp(vNdv, 0.0, 1.0), 1.4);             // thicker centre glows a bit (light passes through the grain)
  float fr = pow(clamp(1.0 - vNdv, 0.0, 1.0), 3.0);
  vec3 h = normalize(l + v);
  float sp = pow(clamp(dot(n, h), 0.0, 1.0), 48.0);
  float ang = atan(vL.z, vL.y);
  float ridge = 0.9 + 0.1 * cos(ang * 7.0);                 // faint longitudinal ridges of a husked grain
  float tip = smoothstep(0.5, 0.36, abs(vL.x));             // ends a touch more translucent / darker
  float edge = smoothstep(0.0, 0.55, vNdv);                 // silhouette falls off → reads as a rounded, translucent body (not a flat disc)
  vec3 col = uColor * (0.05 + 0.27 * wrap * ridge + 0.34 * sss * sss) * edge * (0.6 + 0.4 * tip) + uRim * (0.12 * fr * tip + 0.4 * sp);
  float a = uA * fogK(vD) * uDim * (1.0 - 0.55 * cocK(vD));
  gl_FragColor = vec4(col * a, 1.0);
}`;
export const makePearl = (geo: THREE.BufferGeometry, o: {color?: string; rim?: string; light?: V3} = {}): Glass => {
  const mat = new THREE.ShaderMaterial({
    vertexShader: LIT_VS, fragmentShader: PEARL_FS, transparent: true, depthWrite: false, depthTest: false, side: THREE.FrontSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    uniforms: {...U, uColor: {value: new THREE.Color(o.color ?? '#ffd9a0')}, uRim: {value: new THREE.Color(o.rim ?? '#fff3e0')}, uA: {value: 1}, uLight: {value: v3(o.light ?? [-0.5, 0.8, 0.45])}},
  });
  const m = new THREE.Mesh(geo, mat) as unknown as Glass;
  m.mat = mat; m.frustumCulled = false;
  return m;
};
/** 米山：闭合凸体，只画正面；"over" 混合（遮住身后的格线，读成实体）+ 方向光 + 背光边缘 + 世界空间颗粒纹理 */
const PILE_FS = /* glsl */ `
${COMMON}
uniform vec3 uColor; uniform vec3 uRim; uniform float uA; uniform vec3 uLight; uniform float uOcc; uniform float uGrainS;
varying float vNdv; varying float vD; varying vec3 vWN; varying vec3 vV; varying vec3 vW; varying vec3 vL;
float hsh(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
void main(){
  vec3 n = normalize(vWN); vec3 l = normalize(uLight);
  float ndl = dot(n, l);
  float dif = clamp((ndl + 0.25) / 1.25, 0.0, 1.0);
  float fr = pow(clamp(1.0 - vNdv, 0.0, 1.0), 2.4);
  // granular texture in object space (scales with the pile, so it never shimmers as the pile grows)
  vec3 q = floor(vL * uGrainS);
  float g = hsh(q);
  float cell = length(fwidth(vL * uGrainS));                 // cells smaller than ~1 px would alias into noise: fade the texture out
  float grain = 1.0 - 0.18 * (1.0 - smoothstep(0.35, 0.9, cell)) * (1.0 - g);
  float foot = smoothstep(0.0, 0.08, vL.y);                 // the foot sinks softly into the board
  vec3 col = uColor * (0.05 + 0.62 * dif * dif) * grain + uRim * fr * (0.18 + 0.3 * (1.0 - dif));
  float a = uA * fogK(vD) * uDim * (1.0 - 0.45 * cocK(vD));
  float al = uOcc * a * (0.4 + 0.6 * foot);
  gl_FragColor = vec4(col * a * (0.55 + 0.45 * foot), al);
}`;
export const makePile = (geo: THREE.BufferGeometry, o: {color?: string; rim?: string; light?: V3; occ?: number; grainS?: number} = {}): Glass => {
  const mat = new THREE.ShaderMaterial({
    vertexShader: LIT_VS, fragmentShader: PILE_FS, transparent: true, depthWrite: false, depthTest: false, side: THREE.FrontSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: {...U, uColor: {value: new THREE.Color(o.color ?? '#ffb862')}, uRim: {value: new THREE.Color(o.rim ?? '#ffe2b0')}, uA: {value: 1}, uLight: {value: v3(o.light ?? [-0.55, 0.75, 0.4])}, uOcc: {value: o.occ ?? 0.7}, uGrainS: {value: o.grainS ?? 90}},
  });
  const m = new THREE.Mesh(geo, mat) as unknown as Glass;
  m.mat = mat; m.frustumCulled = false;
  return m;
};

/* ---------------- 粒子：星点 / 散景（景深：离焦变大变淡） ---------------- */
const PTS_VS = /* glsl */ `
${COMMON}
attribute float aSize; attribute vec3 aCol; attribute float aSeed;
uniform float uScale; uniform float uDrift; uniform float uMaxPx; uniform float uCocPx; uniform float uBok; uniform float uMinPx; uniform float uNear0; uniform float uNear1;
varying vec3 vCol; varying float vA;
void main(){
  vec3 p = position + uDrift * vec3(sin(uTime * 0.21 + aSeed * 6.0), sin(uTime * 0.17 + aSeed * 9.0) * 0.6, cos(uTime * 0.13 + aSeed * 4.0));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float d = max(0.1, -mv.z);
  float base = aSize * uScale / (d * uPxK);
  float coc = cocK(d);
  // ep56 lesson: min size 2.5 px (no sub-pixel stars that alias), gentle slow twinkle 0.9 + 0.1 sin
  float s = clamp(base + coc * uCocPx, uMinPx, uMaxPx);
  gl_PointSize = s;
  float tw = 0.9 + 0.1 * sin(uTime * (0.25 + aSeed * 0.35) + aSeed * 40.0);
  // energy-conserving: a sprite clamped up to uMinPx gets dimmer instead of bigger-and-brighter
  float area = clamp((base + 0.6) / s, 0.35, 1.0);
  vA = fogK(d) * tw * area * mix(1.0, mix(1.0, 0.12, smoothstep(0.0, 1.0, coc)), uBok) * uDim;
  // near-camera bokeh fades smoothly with distance (no hard cut)
  vA *= smoothstep(uNear0, uNear1, d);
  vCol = aCol;
  gl_Position = projectionMatrix * mv;
  // sprites whose centre leaves the frame are clipped whole by GL: fade them out before the edge instead of popping
  vec2 ndc = gl_Position.xy / max(1e-4, gl_Position.w);
  float e = max(abs(ndc.x), abs(ndc.y));
  vA *= 1.0 - smoothstep(0.86, 1.0, e - s / 1920.0);
  if (gl_Position.w < 0.05) vA = 0.0;
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
export const makePoints = (pos: V3[], size: number[], col: string[], o: {scale?: number; drift?: number; maxPx?: number; cocPx?: number; soft?: number; minPx?: number; near0?: number; near1?: number} = {}): Pts => {
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
    uniforms: {...U, uScale: {value: o.scale ?? 1}, uDrift: {value: o.drift ?? 0}, uMaxPx: {value: o.maxPx ?? 90}, uCocPx: {value: o.cocPx ?? 40}, uA: {value: 1}, uSoft: {value: o.soft ?? 0.6}, uBok: {value: (o.cocPx ?? 40) > 0 ? 1 : 0}, uMinPx: {value: o.minPx ?? 2.5}, uNear0: {value: o.near0 ?? 0.8}, uNear1: {value: o.near1 ?? 3.2}},
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
  t.core.material instanceof THREE.ShaderMaterial && (t.core.material.uniforms.uRadC.value.set(c[0], y0, c[2]), t.core.material.uniforms.uRadR.value = R, t.core.material.uniforms.uGraze.value = 1);
  return t;
};
export const linesA = (l: Lines, a: number) => { l.mat.uniforms.uA.value = a; l.visible = a > 0.002; };

/* ---------------- 相机 ---------------- */
export type CamS = {pos: V3; tgt: V3; fov: number; roll?: number};
export const applyCam = (cam: THREE.PerspectiveCamera, c: CamS) => {
  cam.fov = c.fov; cam.aspect = W / H; cam.near = 0.05; cam.far = 400000;
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
  cam.fov = c.fov; cam.aspect = W / H; cam.near = 0.05; cam.far = 400000;
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


/* ---------------- ep57：液体光容器（门板 / 光柱）：uFill = 液面高度（0..1，按 uv.y），表面轻微波动 ---------------- */
const VES_VS = /* glsl */ `
${COMMON}
varying vec2 vUv; varying float vD; varying float vNdv;
void main(){
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vD = -mv.z;
  vNdv = clamp(abs(dot(normalize(normalMatrix * normal), normalize(-mv.xyz))), 0.0, 1.0);
  gl_Position = projectionMatrix * mv;
}`;
const VES_FS = /* glsl */ `
${COMMON}
uniform float uFill; uniform float uA; uniform float uSideF; uniform float uGlassA; uniform float uLiqA; uniform vec3 uLiq; uniform vec3 uGlass;
varying vec2 vUv; varying float vD; varying float vNdv;
void main(){
  float has = step(0.002, uFill);
  float full = step(0.998, uFill);
  float wave = (0.010 * sin(vUv.x * 11.0 + uTime * 2.1) + 0.006 * sin(vUv.x * 23.0 - uTime * 2.9)) * has * (1.0 - full);
  float lvl = clamp(uFill + wave, 0.0, 1.0);
  float below = 1.0 - smoothstep(lvl - 0.008, lvl + 0.008, vUv.y);
  float surf = exp(-pow((vUv.y - lvl) / 0.014, 2.0)) * has * (1.0 - full);
  float caus = 0.86 + 0.14 * sin(vUv.x * 9.0 + vUv.y * 14.0 + uTime * 1.1) * sin(vUv.x * 5.0 - vUv.y * 8.0 - uTime * 0.8);
  vec3 liq = uLiq * (0.38 + 0.34 * smoothstep(lvl - 0.3, lvl, vUv.y)) * caus;
  float ex = mix(1.0, smoothstep(0.0, 0.07, vUv.x) * smoothstep(0.0, 0.07, 1.0 - vUv.x), uSideF);
  float fr = pow(clamp(1.0 - vNdv, 0.0, 1.0), 2.0);
  vec3 col = (liq * below + uLiq * surf * 0.75) * ex * uLiqA + uGlass * (0.05 + 0.3 * fr) * uGlassA;
  float a = uA * fogK(vD) * uDim * (1.0 - 0.5 * cocK(vD));
  gl_FragColor = vec4(clamp(col, 0.0, 4.0) * a, 1.0);
}`;
export type Vessel = THREE.Mesh & {mat: THREE.ShaderMaterial; fill: (v: number) => void};
export const makeVessel = (geo: THREE.BufferGeometry, o: {liq?: string; glass?: string; side?: boolean; glassA?: number} = {}): Vessel => {
  const mat = new THREE.ShaderMaterial({
    vertexShader: VES_VS, fragmentShader: VES_FS, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    uniforms: {...U, uFill: {value: 0}, uA: {value: 1}, uSideF: {value: o.side === false ? 0 : 1}, uGlassA: {value: o.glassA ?? 1}, uLiqA: {value: 1}, uLiq: {value: new THREE.Color(o.liq ?? '#ff9a3a')}, uGlass: {value: new THREE.Color(o.glass ?? '#ffcf8a')}},
  });
  const m = new THREE.Mesh(geo, mat) as unknown as Vessel;
  m.mat = mat; m.frustumCulled = false;
  m.fill = (v: number) => { mat.uniforms.uFill.value = Math.min(1, Math.max(0, v)); };
  return m;
};
export const vesA = (m: Vessel, a: number) => { m.mat.uniforms.uA.value = a; m.visible = a > 0.002; };

/* ---------------- ep57：暖色雾幕（远处的柔光，给"无尽舞台"一点暖色空气感） ---------------- */
const HAZE_FS = /* glsl */ `
${COMMON}
uniform vec3 uColor; uniform float uA; varying vec2 vUv; varying float vD; varying float vNdv;
void main(){
  vec2 q = (vUv - 0.5) * vec2(2.0, 2.0);
  float r = length(q * vec2(1.0, 1.6));
  float m = exp(-r * r * 2.2);
  gl_FragColor = vec4(uColor * m * uA * uDim, 1.0);
}`;
export const makeHaze = (w: number, h: number, color = '#3a2008') => {
  const mat = new THREE.ShaderMaterial({
    vertexShader: VES_VS, fragmentShader: HAZE_FS, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    uniforms: {...U, uColor: {value: new THREE.Color(color)}, uA: {value: 1}},
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat) as unknown as THREE.Mesh & {mat: THREE.ShaderMaterial};
  m.mat = mat; m.frustumCulled = false;
  return m;
};

/* ---------------- ep57：远景门阵（几百扇门合成一份几何）：门框 = 屏幕上至少 N 像素宽的平面丝带；
   亮度随距离衰减 + 门在屏幕上太小时淡出（不叠成白点）；uWave = "熄灯波"半径（按到你那扇门的地面距离）；aKeep 的门不熄 ---------------- */
const DF_VS = /* glsl */ `
${COMMON}
attribute vec3 aOff; attribute float aSide; attribute float aDist; attribute float aKeep; attribute float aKind; attribute float aH;
uniform float uR; uniform float uMinPx; uniform float uWave; uniform float uWaveW; uniform float uKeepB; uniform float uFarK;
varying float vA; varying float vKind; varying float vOn;
void main(){
  vec4 cv = modelViewMatrix * vec4(position, 1.0);
  float d = max(0.05, -cv.z);
  float r = max(uR, uMinPx * uPxK * d);
  if (aKeep > 0.5) r = max(r, 2.4 * uPxK * d);   // the two doors that stay lit keep a 2.4 px frame even far away
  vec3 p = position + aOff * aSide * r * (1.0 - aKind);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float fall = 1.0 / (1.0 + pow(d / uFarK, 1.7));
  float hpx = aH / (d * uPxK);
  float lod = smoothstep(5.0, 16.0, hpx);
  float on = smoothstep(uWave - uWaveW, uWave, aDist);   // inside the wave radius = switched off
  on = max(on, aKeep);
  float fog = fogK(d);
  if (aKeep > 0.5) { fall = max(fall, 0.8); fog = max(fog, 0.85); lod = 1.0; }
  vOn = on;
  vA = fog * fall * lod * mix(0.22, 1.0, on) * (aKeep > 0.5 ? uKeepB : 1.0) * uDim;
  vKind = aKind;
  gl_Position = projectionMatrix * mv;
  if (gl_Position.w < 0.05) vA = 0.0;
}`;
const DF_FS = /* glsl */ `
uniform vec3 uColor; uniform vec3 uPanel; uniform float uA; uniform float uPanelA;
varying float vA; varying float vKind; varying float vOn;
void main(){
  vec3 c = vKind > 0.5 ? uPanel * uPanelA * vOn : uColor;
  gl_FragColor = vec4(c * vA * uA, 1.0);
}`;
export type DoorFieldDoor = {base: V3; w: number; h: number; dist: number; keep: boolean};
export const makeDoorField = (doors: DoorFieldDoor[], o: {r?: number; minPx?: number; color?: string; panel?: string; farK?: number} = {}) => {
  const P: number[] = [], OFF: number[] = [], SD: number[] = [], DI: number[] = [], KP: number[] = [], KD: number[] = [], HH: number[] = [], idx: number[] = [];
  let n = 0;
  const vert = (p: V3, off: V3, sd: number, d: DoorFieldDoor, kind: number) => { P.push(...p); OFF.push(...off); SD.push(sd); DI.push(d.dist); KP.push(d.keep ? 1 : 0); KD.push(kind); HH.push(d.h); return n++; };
  for (const d of doors) {
    const [x, y, z] = d.base, hw = d.w / 2;
    const segs: [V3, V3, V3][] = [[[x - hw, y, z], [x - hw, y + d.h, z], [1, 0, 0]], [[x - hw, y + d.h, z], [x + hw, y + d.h, z], [0, 1, 0]], [[x + hw, y + d.h, z], [x + hw, y, z], [1, 0, 0]]];
    for (const [a, b, off] of segs) {
      const i0 = vert(a, off, -1, d, 0), i1 = vert(a, off, 1, d, 0), i2 = vert(b, off, -1, d, 0), i3 = vert(b, off, 1, d, 0);
      idx.push(i0, i2, i1, i1, i2, i3);
    }
    const q0 = vert([x - hw * 0.9, y, z], [0, 0, 0], 0, d, 1), q1 = vert([x + hw * 0.9, y, z], [0, 0, 0], 0, d, 1), q2 = vert([x - hw * 0.9, y + d.h * 0.95, z], [0, 0, 0], 0, d, 1), q3 = vert([x + hw * 0.9, y + d.h * 0.95, z], [0, 0, 0], 0, d, 1);
    idx.push(q0, q1, q2, q2, q1, q3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  g.setAttribute('aOff', new THREE.BufferAttribute(new Float32Array(OFF), 3));
  g.setAttribute('aSide', new THREE.BufferAttribute(new Float32Array(SD), 1));
  g.setAttribute('aDist', new THREE.BufferAttribute(new Float32Array(DI), 1));
  g.setAttribute('aKeep', new THREE.BufferAttribute(new Float32Array(KP), 1));
  g.setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(KD), 1));
  g.setAttribute('aH', new THREE.BufferAttribute(new Float32Array(HH), 1));
  g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    vertexShader: DF_VS, fragmentShader: DF_FS, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    uniforms: {...U, uR: {value: o.r ?? 0.02}, uMinPx: {value: o.minPx ?? 1.1}, uWave: {value: -10}, uWaveW: {value: 6}, uKeepB: {value: 1}, uFarK: {value: o.farK ?? 14},
      uColor: {value: new THREE.Color(o.color ?? '#e8ae62')}, uPanel: {value: new THREE.Color(o.panel ?? '#ff8a2a')}, uA: {value: 1}, uPanelA: {value: 0.08}},
  });
  const m = new THREE.Mesh(g, mat) as unknown as THREE.Mesh & {mat: THREE.ShaderMaterial};
  m.mat = mat; m.frustumCulled = false;
  return m;
};

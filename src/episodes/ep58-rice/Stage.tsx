// ep57（沿用 ep56；新增玻璃地面倒影：同一场景 y 取反再画一遍，亮度很低，只画标了 refl 的物体）· ep56（沿用 ep55 v2）· WebGL 画布：世界只建一次（每个渲染标签页各一份），之后每帧 update(f) 纯函数地设置状态再同步渲染。
// 后期：主画面（4× MSAA, 半浮点）→ 1/4、1/8 分辨率高斯模糊 → 柔和泛光叠回（强度低，保持 v1 的柔光）→ 软肩部压高光。
import React, {useLayoutEffect, useRef} from 'react';
import {continueRender, delayRender} from 'remotion';
import * as THREE from 'three';
import {CamS, H, W, U, applyCam} from './gl';

export type World = {ready?: Promise<unknown>; scene: THREE.Scene; update: (f: number) => CamS; refl?: (f: number, on: boolean) => number; inset?: (f: number) => {cam: CamS; rect: [number, number, number, number]; scene: THREE.Scene} | null};
type Post = {main: THREE.WebGLRenderTarget; a: THREE.WebGLRenderTarget; b: THREE.WebGLRenderTarget; c: THREE.WebGLRenderTarget; d: THREE.WebGLRenderTarget; quad: THREE.Mesh; qs: THREE.Scene; qc: THREE.OrthographicCamera; blur: THREE.ShaderMaterial; copy: THREE.ShaderMaterial; comp: THREE.ShaderMaterial};
type Ctx = {r: THREE.WebGLRenderer; w: World; cam: THREE.PerspectiveCamera; cam2: THREE.PerspectiveCamera; post: Post};

const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const makePost = (): Post => {
  const opt = {type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false};
  const main = new THREE.WebGLRenderTarget(W, H, {...opt, samples: 4, depthBuffer: true});
  const a = new THREE.WebGLRenderTarget(W / 4, H / 4, opt), b = new THREE.WebGLRenderTarget(W / 4, H / 4, opt);
  const c = new THREE.WebGLRenderTarget(W / 8, H / 8, opt), d = new THREE.WebGLRenderTarget(W / 8, H / 8, opt);
  const blur = new THREE.ShaderMaterial({
    vertexShader: VS, depthTest: false, depthWrite: false,
    uniforms: {tSrc: {value: null}, uDir: {value: new THREE.Vector2(1, 0)}},
    fragmentShader: `uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
      void main(){ vec3 s = texture2D(tSrc, vUv).rgb * 0.2270;
        s += (texture2D(tSrc, vUv + uDir * 1.3846).rgb + texture2D(tSrc, vUv - uDir * 1.3846).rgb) * 0.3162;
        s += (texture2D(tSrc, vUv + uDir * 3.2308).rgb + texture2D(tSrc, vUv - uDir * 3.2308).rgb) * 0.0703;
        gl_FragColor = vec4(s, 1.0); }`,
  });
  const copy = new THREE.ShaderMaterial({
    vertexShader: VS, depthTest: false, depthWrite: false, uniforms: {tSrc: {value: null}, uTex: {value: new THREE.Vector2()}},
    fragmentShader: `uniform sampler2D tSrc; uniform vec2 uTex; varying vec2 vUv;
      // ep56: per-tap firefly guard — a garbage pixel (NaN / Inf / >= 64, never legit here) is dropped before averaging;
      // checking after the average let a single spike through at 1/4 strength and it bloomed into a teal / yellow halo;
      // HDR (> 1.5) pixels cooler than R are never legit in this warm palette either (seen as blue halos)
      vec3 tap(vec2 o){ vec3 c = texture2D(tSrc, vUv + uTex * o).rgb; float mx = max(c.r, max(c.g, c.b)); bool cool = mx > 1.5 && max(c.g, c.b) > 1.15 * c.r; return (mx < 64.0 && min(c.r, min(c.g, c.b)) > -1.0 && !cool) ? c : vec3(0.0); }
      void main(){ vec3 s = tap(vec2(-1.0,-1.0)) + tap(vec2(1.0,-1.0)) + tap(vec2(-1.0,1.0)) + tap(vec2(1.0,1.0));
        s *= 0.25;
        gl_FragColor = vec4(clamp(s, 0.0, 16.0), 1.0); }`,
  });
  const comp = new THREE.ShaderMaterial({
    vertexShader: VS, depthTest: false, depthWrite: false, uniforms: {tMain: {value: null}, tA: {value: null}, tC: {value: null}, uK1: {value: 0.55}, uK2: {value: 0.5}},
    fragmentShader: `uniform sampler2D tMain; uniform sampler2D tA; uniform sampler2D tC; uniform float uK1; uniform float uK2; varying vec2 vUv;
      vec3 shoulder(vec3 x){ vec3 k = max(x - 0.78, 0.0); return min(x, 0.78) + 0.22 * (1.0 - exp(-k / 0.22)); }
      void main(){ vec3 m = texture2D(tMain, vUv).rgb; if (!(max(m.r, max(m.g, m.b)) < 64.0 && min(m.r, min(m.g, m.b)) > -1.0)) m = vec3(0.0); m = clamp(vec3(m.r == m.r ? m.r : 0.0, m.g == m.g ? m.g : 0.0, m.b == m.b ? m.b : 0.0), 0.0, 16.0); vec3 g = texture2D(tA, vUv).rgb * uK1 + texture2D(tC, vUv).rgb * uK2;
        vec3 col = shoulder(m + g) + vec3(0.012, 0.010, 0.016);
        gl_FragColor = vec4(col, 1.0); }`,
  });
  const qs = new THREE.Scene(), qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), copy);
  quad.frustumCulled = false; qs.add(quad);
  return {main, a, b, c, d, quad, qs, qc, blur, copy, comp};
};
const pass = (r: THREE.WebGLRenderer, p: Post, m: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null) => {
  p.quad.material = m; r.setRenderTarget(target); r.render(p.qs, p.qc);
};

export const GLStage: React.FC<{f: number; build: () => World; bloom?: number}> = ({f, build, bloom = 1}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const ctx = useRef<Ctx | null>(null);
  useLayoutEffect(() => {
    const h = delayRender('gl frame ' + f);
    let async = false;
    try {
      if (!ctx.current && ref.current) {
        const r = new THREE.WebGLRenderer({canvas: ref.current, antialias: false, preserveDrawingBuffer: true, alpha: false, powerPreference: 'high-performance'});
        r.setPixelRatio(1); r.setSize(W, H, false);
        r.outputColorSpace = THREE.LinearSRGBColorSpace;
        r.autoClear = false;
        ctx.current = {r, w: build(), cam: new THREE.PerspectiveCamera(), cam2: new THREE.PerspectiveCamera(), post: makePost()};
      }
      const c = ctx.current!;
      if (c.w.ready) {
        // 第一次：等照片纹理加载完再画
        async = true;
        c.w.ready.then(() => { c.w.ready = undefined; draw(c); continueRender(h); });
        return;
      }
      draw(c);
    } finally {
      if (!async) continueRender(h);
    }
  }, [f, build, bloom]);
  const draw = (c: Ctx) => {
    {
      const {r, post} = c;
      const t0 = performance.now();
      const cs = c.w.update(f);
      const t1 = performance.now();
      const ins = c.w.inset?.(f);
      // 1) 主画面
      r.setRenderTarget(post.main);
      r.setScissorTest(false); r.setViewport(0, 0, W, H);
      r.setClearColor(new THREE.Color('#030308'), 1); r.clear();
      if (ins) {
        // 放大镜：先渲染小视口（场景 uniform 用它自己的相机），再渲染主画面
        const [x, y, w, hh] = ins.rect;
        applyCam(c.cam2, ins.cam);
        c.cam2.aspect = w / hh; c.cam2.updateProjectionMatrix();
        r.setScissorTest(true); r.setScissor(x, H - y - hh, w, hh); r.setViewport(x, H - y - hh, w, hh);
        r.setClearColor(new THREE.Color('#05050c'), 1); r.clear();
        r.render(ins.scene, c.cam2);
        r.setScissorTest(false); r.setViewport(0, 0, W, H);
        // 主画面避开放大镜区域：用 scissor 分四块画
        applyCam(c.cam, cs);
        const rects: [number, number, number, number][] = [[0, 0, W, H - y - hh], [0, H - y, W, y], [0, H - y - hh, x, hh], [x + w, H - y - hh, W - x - w, hh]];
        r.setScissorTest(true);
        for (const [rx, ry, rw, rh] of rects) { if (rw <= 0 || rh <= 0) continue; r.setScissor(rx, ry, rw, rh); r.render(c.w.scene, c.cam); }
        r.setScissorTest(false);
      } else {
        applyCam(c.cam, cs);
        // 倒影：refl(f, true) 隐藏不该有倒影的物体并返回亮度系数；场景 y 取反（three 会自动翻转正反面）
        const k = c.w.refl ? c.w.refl(f, true) : 0;
        if (k > 0.002) {
          const sc = c.w.scene;
          const dim0 = U.uDim.value;
          sc.scale.y = -1; sc.updateMatrixWorld(true);
          U.uDim.value = dim0 * k;
          r.render(sc, c.cam);
          sc.scale.y = 1; sc.updateMatrixWorld(true);
          U.uDim.value = dim0;
        }
        c.w.refl?.(f, false);
        r.render(c.w.scene, c.cam);
      }
      r.getContext().finish();
      const t2 = performance.now();
      // 2) 泛光
      post.copy.uniforms.tSrc.value = post.main.texture; post.copy.uniforms.uTex.value.set(1 / W, 1 / H);
      pass(r, post, post.copy, post.a);
      for (let k = 0; k < 2; k++) {
        post.blur.uniforms.tSrc.value = post.a.texture; post.blur.uniforms.uDir.value.set(4 / W, 0); pass(r, post, post.blur, post.b);
        post.blur.uniforms.tSrc.value = post.b.texture; post.blur.uniforms.uDir.value.set(0, 4 / H); pass(r, post, post.blur, post.a);
      }
      post.copy.uniforms.tSrc.value = post.a.texture; post.copy.uniforms.uTex.value.set(4 / W, 4 / H);
      pass(r, post, post.copy, post.c);
      for (let k = 0; k < 2; k++) {
        post.blur.uniforms.tSrc.value = post.c.texture; post.blur.uniforms.uDir.value.set(8 / W, 0); pass(r, post, post.blur, post.d);
        post.blur.uniforms.tSrc.value = post.d.texture; post.blur.uniforms.uDir.value.set(0, 8 / H); pass(r, post, post.blur, post.c);
      }
      // 3) 合成到画布
      post.comp.uniforms.tMain.value = post.main.texture; post.comp.uniforms.tA.value = post.a.texture; post.comp.uniforms.tC.value = post.c.texture;
      post.comp.uniforms.uK1.value = 0.5 * bloom; post.comp.uniforms.uK2.value = 0.55 * bloom;
      r.setViewport(0, 0, W, H);
      pass(r, post, post.comp, null);
      r.getContext().finish();
      const t3 = performance.now();
      if ((globalThis as {EP58_PROF?: boolean}).EP58_PROF) console.log(`prof f=${f} update=${(t1 - t0).toFixed(0)} scene=${(t2 - t1).toFixed(0)} post=${(t3 - t2).toFixed(0)}`);
    }
  };
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', left: 0, top: 0, width: W, height: H}} />;
};

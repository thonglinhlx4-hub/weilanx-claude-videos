// Food map engine: satellite mosaic + region shapes + dish stickers + word captions.
// Data per episode: geo.json (mosaic px coords) + timeline.json (voice word timings).
import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Montserrat';
import geo from './geo.json';
import timeline from './timeline.json';

const {fontFamily} = loadFont('normal', {weights: ['800', '900'], subsets: ['latin', 'latin-ext']});

export const FOOD_W = 1080;
export const FOOD_H = 1920;
export const FOOD_FPS = 30;
export const FOOD_FRAMES = Math.ceil(timeline.total * FOOD_FPS);

type Item = {id: string; region: string; dish: string; x: number; y: number; path: string};
type Seg = {id: string; start: number; len: number; words: {w: string; s: number; e: number}[]};
const items = geo.items as Item[];
const segs = timeline.segs as Seg[];
const BASE = 'food/italy';

const xs = (geo.items as Item[]).map((i) => i.x);
const ys = (geo.items as Item[]).map((i) => i.y);
const OVERVIEW = {
  x: (Math.min(...xs) + Math.max(...xs)) / 2,
  y: (Math.min(...ys) + Math.max(...ys)) / 2 + 40,
  s: Math.min(940 / (Math.max(...xs) - Math.min(...xs) + 260), 1450 / (Math.max(...ys) - Math.min(...ys) + 300)),
};
const ZOOM: Record<string, number> = {sardegna: 0.9, sicilia: 0.9, puglia: 0.95, calabria: 0.95};
const camFor = (it: Item) => ({x: it.x, y: it.y + 150, s: ZOOM[it.id] ?? 1.05});
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

function camera(t: number) {
  const intro = segs[0];
  const outro = segs[segs.length - 1];
  const first = camFor(items[0]);
  if (t < intro.start + intro.len) {
    const k = ease(Math.min(1, Math.max(0, (t - 1.2) / (intro.start + intro.len - 1.2))));
    // zoom in log space so it feels even
    const s = Math.exp(lerp(Math.log(OVERVIEW.s), Math.log(first.s), k));
    return {x: lerp(OVERVIEW.x, first.x, k), y: lerp(OVERVIEW.y, first.y, k), s};
  }
  if (t >= outro.start - 0.2) {
    const last = camFor(items[items.length - 1]);
    const k = ease(Math.min(1, (t - outro.start + 0.2) / 1.1));
    const s = Math.exp(lerp(Math.log(last.s), Math.log(OVERVIEW.s), k));
    return {x: lerp(last.x, OVERVIEW.x, k), y: lerp(last.y, OVERVIEW.y, k), s};
  }
  let i = 0;
  for (let j = 0; j < items.length; j++) if (t >= segs[j + 1].start - 0.25) i = j;
  const cur = camFor(items[i]);
  if (i === 0) return cur;
  const prev = camFor(items[i - 1]);
  const k = ease(Math.min(1, Math.max(0, (t - (segs[i + 1].start - 0.25)) / 0.45)));
  return {x: lerp(prev.x, cur.x, k), y: lerp(prev.y, cur.y, k), s: lerp(prev.s, cur.s, k)};
}

const Flag: React.FC<{h: number}> = ({h}) => (
  <div style={{display: 'flex', height: h, width: h * 1.5, borderRadius: 6, overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,.45)'}}>
    <div style={{flex: 1, background: '#009246'}} />
    <div style={{flex: 1, background: '#fff'}} />
    <div style={{flex: 1, background: '#CE2B37'}} />
  </div>
);

const Sticker: React.FC<{it: Item; t0: number; t: number; fps: number; frame: number; active: boolean}> = ({it, t0, t, fps, frame, active}) => {
  if (t < t0) return null;
  const pop = spring({frame: frame - Math.round(t0 * fps), fps, config: {damping: 11, stiffness: 170, mass: 0.7}});
  const settle = active ? 0 : Math.min(1, (t - t0) / 0.6);
  const size = lerp(340, 230, ease(Math.min(1, settle)));
  const rot = interpolate(pop, [0, 1], [-14, 0]) + (it.x % 7) - 3;
  const outline = 'drop-shadow(5px 0 0 #fff) drop-shadow(-5px 0 0 #fff) drop-shadow(0 5px 0 #fff) drop-shadow(0 -5px 0 #fff) drop-shadow(0 14px 18px rgba(0,0,0,.55))';
  return (
    <div style={{position: 'absolute', left: it.x, top: it.y, transform: `translate(-50%,-62%) scale(${pop}) rotate(${rot}deg)`, width: size, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <Img src={staticFile(`${BASE}/dish/dish_${it.id}.png`)} style={{width: '100%', filter: outline}} />
      <div style={{marginTop: 10, padding: '6px 16px', borderRadius: 40, background: active ? '#FFD84D' : 'rgba(255,255,255,.95)', color: '#151515', fontFamily, fontWeight: 900, fontSize: active ? 30 : 24, letterSpacing: 0.5, whiteSpace: 'nowrap', boxShadow: '0 4px 10px rgba(0,0,0,.4)', textTransform: 'uppercase'}}>
        {it.region}
      </div>
    </div>
  );
};

export const FoodMap: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cam = camera(t);
  const tx = FOOD_W / 2 - cam.x * cam.s;
  const ty = FOOD_H / 2 - cam.y * cam.s;

  const segIdx = segs.findIndex((s, i) => t >= s.start && (i === segs.length - 1 || t < segs[i + 1].start));
  const seg = segs[Math.max(0, segIdx)];
  const activeId = seg && seg.id !== 'intro' && seg.id !== 'outro' ? seg.id : null;
  const inOutro = t >= segs[segs.length - 1].start;
  const allPaths = items.map((i) => i.path).join(' ');

  // caption: words of current segment, word-by-word
  const words = seg ? seg.words.filter((w) => t >= w.s - 0.05) : [];
  const curWord = seg ? seg.words.findIndex((w) => t >= w.s - 0.05 && t < w.e + 0.15) : -1;
  const capPop = seg && words.length ? spring({frame: frame - Math.round(words[words.length - 1].s * fps), fps, config: {damping: 14, stiffness: 260}}) : 0;

  const titleIn = spring({frame: frame - 4, fps, config: {damping: 14}});
  const titleOut = interpolate(t, [segs[1].start - 0.4, segs[1].start], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: '#0b1a2a', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: geo.W, height: geo.H, transformOrigin: '0 0', transform: `translate(${tx}px,${ty}px) scale(${cam.s})`}}>
        <Img src={staticFile(`${BASE}/sat.jpg`)} style={{position: 'absolute', width: geo.W, height: geo.H, filter: 'saturate(1.15) contrast(1.05)'}} />
        <svg width={geo.W} height={geo.H} style={{position: 'absolute', left: 0, top: 0}}>
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>
          {/* dim everything outside Italy */}
          <path d={`M-4000,-4000 H${geo.W + 4000} V${geo.H + 4000} H-4000 Z ${allPaths}`} fillRule="evenodd" fill="rgba(5,12,25,.42)" />
          {items.map((it) => {
            const segI = segs.findIndex((s) => s.id === it.id);
            const s0 = segs[segI].start;
            const isActive = it.id === activeId;
            const s1 = segs[segI].end;
            const flash = isActive ? interpolate(t - s0, [0, 0.15, 0.6], [0.1, 0.5, 0.36], {extrapolateRight: 'clamp'}) : 0;
            // done regions keep a soft white wash (like the reference); untold ones stay clear
            const done = t >= s1 ? interpolate(t - s1, [0, 0.35], [0.36, 0.3], {extrapolateRight: 'clamp'}) : 0;
            const fill = isActive ? flash : done;
            return (
              <g key={it.id}>
                {isActive && <path d={it.path} fill="none" stroke="#FFD84D" strokeWidth={10 / cam.s} filter="url(#glow)" opacity={0.9} />}
                <path d={it.path} fill={`rgba(255,255,255,${fill})`} stroke={isActive ? '#FFD84D' : 'rgba(255,255,255,.85)'} strokeWidth={(isActive ? 4 : 2) / cam.s} strokeLinejoin="round" />
              </g>
            );
          })}
        </svg>
        {/* stickers: inactive first, active on top */}
        {[...items].sort((a, b) => (a.id === activeId ? 1 : 0) - (b.id === activeId ? 1 : 0)).map((it) => {
          const s0 = segs.find((s) => s.id === it.id)!.start;
          return <Sticker key={it.id} it={it} t0={s0} t={t} fps={fps} frame={frame} active={it.id === activeId} />;
        })}
      </div>

      {/* vignette */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.45) 100%)'}} />

      {/* title */}
      <div style={{position: 'absolute', top: 170, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: titleOut, transform: `scale(${titleIn})`}}>
        <Flag h={70} />
        <div style={{fontFamily, fontWeight: 900, fontSize: 78, lineHeight: 1.02, color: '#fff', textAlign: 'center', textTransform: 'uppercase', WebkitTextStroke: '3px #000', paintOrder: 'stroke fill', textShadow: '0 6px 20px rgba(0,0,0,.6)'}}>
          Famous Food<br />of Every Region<br /><span style={{color: '#FFD84D'}}>Italy</span>
        </div>
      </div>

      {/* small corner tag after intro */}
      <div style={{position: 'absolute', top: 120, left: 60, display: 'flex', alignItems: 'center', gap: 14, opacity: inOutro ? 0 : 1 - titleOut}}>
        <Flag h={34} />
        <div style={{fontFamily, fontWeight: 900, fontSize: 34, color: '#fff', WebkitTextStroke: '2px #000', paintOrder: 'stroke fill', textTransform: 'uppercase'}}>Italy · Food Map</div>
      </div>

      {/* caption */}
      {seg && seg.id !== 'intro' && words.length > 0 && (
        <div style={{position: 'absolute', ...(inOutro ? {top: 150} : {bottom: 330}), width: '100%', padding: '0 70px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 22px', transform: `scale(${0.9 + 0.1 * capPop})`}}>
          {words.map((w, i) => (
            <span key={i} style={{fontFamily, fontWeight: 900, fontSize: 92, lineHeight: 1.08, textTransform: 'uppercase', color: i === curWord ? '#FFD84D' : '#fff', WebkitTextStroke: '6px #000', paintOrder: 'stroke fill', textShadow: '0 8px 24px rgba(0,0,0,.55)'}}>
              {w.w}{inOutro && i === seg.words.length - 1 ? '?' : ''}
            </span>
          ))}
        </div>
      )}

      <div style={{position: 'absolute', bottom: 40, right: 40, fontFamily, fontWeight: 800, fontSize: 18, color: 'rgba(255,255,255,.55)'}}>Imagery © Esri, Maxar, Earthstar Geographics</div>
      <Audio src={staticFile('audio/food/italy/mix.wav')} />
    </AbsoluteFill>
  );
};

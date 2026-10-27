// ep52-margin「Khoảng đệm」：金线一笔风，64 秒，120 BPM（一小节 60 帧），高潮重拍在 1440 帧。
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C, Defs, FONT, GlowPath, GlowText, Grid, H, Led, P, PenHead, Ribbon, Space, Stroke, Sub, W, clamp, eio, eo, partial, prog, pushOut, rand, smooth} from './kit';

export const EP52_FRAMES = 1920;
export const EP52_W = W, EP52_H = H;
export const BAR = 60;
export const CLIMAX = 1440;

const CUES: [number, number, string][] = [
  [0, 58, 'Mỗi ngày, bạn bước trên một sợi dây.'],
  [62, 118, 'Không lưới bên dưới. Không chỗ lùi.'],
  [122, 236, 'Thứ giữ bạn khỏi rơi có một cái tên.'],
  [244, 298, 'Lịch kín từ 7 giờ sáng đến 10 giờ đêm.'],
  [302, 358, 'Chỉ cần một việc trễ mười phút…'],
  [362, 416, '…cả ngày đổ theo như domino.'],
  [424, 508, 'Kỹ sư không xây cầu vừa khít tải trọng.'],
  [512, 608, 'Họ luôn chừa phần dư cho ngày tệ nhất.'],
  [612, 716, 'Cây cầu đứng vững nhờ phần không bao giờ dùng tới.'],
  [784, 866, 'Thời gian: kín 100% là hết chỗ cho bất ngờ.'],
  [870, 956, 'Chừa lại 20%. Đó là chỗ để thở.'],
  [964, 1076, 'Tiền bạc: quỹ dự phòng 3 đến 6 tháng chi tiêu.'],
  [1084, 1196, 'Sức lực: đừng sống ở mức 5% pin.'],
  [1204, 1270, 'Rồi sẽ có lúc bạn sai.'],
  [1274, 1340, 'Sai giờ. Sai số. Sai người.'],
  [1344, 1418, 'Khi đó, bạn còn chỗ để đứng không?'],
  [1474, 1556, 'Khoảng đệm chính là quyền được sai.'],
  [1564, 1640, 'Nó không phải lười biếng, cũng không phải lãng phí.'],
  [1644, 1716, 'Nó là tấm lưới bạn tự giăng sẵn,'],
  [1720, 1796, 'để vấp mà không ngã.'],
];

const Svg: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg width={W} height={H} style={{position: 'absolute', ...style}}>
    <Defs />
    {children}
  </svg>
);
const Label: React.FC<{text: string; f: number; at: number}> = ({text, f, at}) => (
  <div style={{position: 'absolute', left: 110, top: 90, fontFamily: FONT.sans, fontWeight: 800, fontSize: 64, letterSpacing: 6, color: 'rgba(225,222,215,0.82)', opacity: eo(prog(f, at, 12)), textShadow: '0 0 24px rgba(255,255,255,0.25)'}}>{text}</div>
);

const ROPE = smooth([[-60, 560], [480, 615], [960, 640], [1440, 615], [1980, 560]], 16);
const ropeY = (x: number) => 560 + 80 * (1 - Math.pow((x - 960) / 1020, 2));

/* S1 0–240 sợi dây + từ khóa */
const S1: React.FC<{f: number}> = ({f}) => {
  const x = 300 + 700 * eio(prog(f, 10, 220));
  const wob = Math.sin(f * 0.25) * 6;
  const ring = prog(f, 120, 26);
  return (
    <>
      <Svg>
        <Stroke pts={ROPE} f={f} at={0} dur={50} w={4} />
        {f > 30 ? <PenHead p={[x, ropeY(x) - 18 + wob * 0.3]} f={f} size={0.55} /> : null}
        {ring > 0 && ring < 1 ? <circle cx={960} cy={330} r={120 + ring * 700} fill="none" stroke={C.gold} strokeWidth={6 * (1 - ring)} opacity={1 - ring} filter="url(#b3)" /> : null}
      </Svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center', fontFamily: FONT.serif, fontSize: 30, letterSpacing: 8, color: 'rgba(243,239,230,0.6)', opacity: eo(prog(f, 124, 12))}}>TỪ KHÓA HÔM NAY</div>
      <GlowText text="KHOẢNG ĐỆM" f={f} at={120} y={330} size={170} ls={6} />
    </>
  );
};

/* S2 240–420 lịch kín domino */
const S2: React.FC<{f: number}> = ({f}) => {
  const times = ['7:00', '9:30', '12:00', '14:30', '17:00', '19:30'];
  const ext = 70 * eo(prog(f, 302, 14));
  return (
    <AbsoluteFill style={pushOut(f, 420)}>
      <Svg>
        <Stroke pts={[[160, 640], [1760, 640]]} f={f} at={240} dur={24} w={3} />
        {times.map((t, i) => {
          const o = eo(prog(f, 256 + i * 5, 10));
          const shift = i === 0 ? 0 : 70 * eo(prog(f, 316 + i * 6, 10));
          const red = i === 0 ? prog(f, 302, 6) : prog(f, 316 + i * 6, 6);
          const fall = i === 5 ? eo(prog(f, 352, 22)) : 0;
          const x = 200 + i * 255 + shift + fall * 60;
          const w = 240 + (i === 0 ? ext : 0);
          const col = red > 0.5 ? C.red : C.gold;
          return (
            <g key={i} opacity={o * (1 - fall * 0.8)} transform={`rotate(${fall * 40} ${x + w} 640) translate(0 ${fall * 240})`}>
              <rect x={x} y={500} width={w} height={120} rx={18} fill={red > 0.5 ? 'rgba(255,59,47,0.10)' : 'rgba(217,168,104,0.08)'} stroke={col} strokeWidth={10} opacity={0.4} filter="url(#b10)" />
              <rect x={x} y={500} width={w} height={120} rx={18} fill="none" stroke={red > 0.5 ? '#ffb3a8' : C.goldCore} strokeWidth={2.5} />
              <text x={x + 20} y={680} fill="rgba(243,239,230,0.65)" fontFamily={FONT.serif} fontSize={28}>{t}</text>
            </g>
          );
        })}
      </Svg>
      <Led label="TRỄ" value="+10 PHÚT" f={f} at={304} x={1260} y={140} size={70} />
      <GlowText text="TRỄ CẢ NGÀY" f={f} at={362} y={360} size={150} color="red" />
    </AbsoluteFill>
  );
};

/* S3 420–720 cây cầu / tải trọng */
const LOAD = smooth(Array.from({length: 13}).map((_, i): P => {
  const x = 200 + i * 126;
  const y = 820 - (180 + 90 * Math.sin(i * 1.3) + 60 * Math.sin(i * 0.55) + (i === 8 ? 120 : 0));
  return [x, Math.max(430, y)];
}), 10);
const S3: React.FC<{f: number}> = ({f}) => {
  const gap = eo(prog(f, 512, 20));
  const pct = Math.round(70 * eo(prog(f, 480, 70)));
  return (
    <>
      <Svg>
        <Grid x={200} y={200} w={1520} h={620} o={eo(prog(f, 420, 20))} />
        <Stroke pts={[[200, 820], [200, 200]]} f={f} at={420} dur={18} w={2.5} />
        <Stroke pts={[[200, 820], [1720, 820]]} f={f} at={426} dur={22} w={2.5} />
        <rect x={200} y={300} width={1520} height={130} fill="rgba(245,170,70,0.10)" opacity={gap} />
        <rect x={200} y={300} width={1520} height={130} fill="none" stroke={C.amber} strokeWidth={14} opacity={gap * 0.35} filter="url(#b28)" />
        <Stroke pts={[[200, 300], [1720, 300]]} f={f} at={450} dur={36} w={5} />
        <Stroke pts={LOAD} f={f} at={470} dur={80} w={3.5} color={C.blue} />
        <text x={220} y={280} fill={C.goldCore} fontFamily={FONT.serif} fontSize={30} opacity={eo(prog(f, 470, 12))}>Sức chịu tải</text>
        <text x={1500} y={790} fill="rgba(170,190,255,0.85)" fontFamily={FONT.serif} fontSize={30} opacity={eo(prog(f, 540, 12))}>Tải thực tế</text>
      </Svg>
      <Led label="TẢI ĐỈNH" value={`${String(pct).padStart(3, '0')}%`} f={f} at={480} x={1300} y={110} size={64} />
      <GlowText text="KHOẢNG ĐỆM" f={f} at={516} y={366} size={96} ls={4} />
      <GlowText text="30%" f={f} at={612} x={1560} y={366} size={90} />
    </>
  );
};

/* S4 720–780 hard cut flash */
const S4: React.FC<{f: number}> = ({f}) => (
  <>
    <GlowText text="CÒN BẠN?" f={f} at={721} y={500} size={280} color="white" />
    <AbsoluteFill style={{background: '#fff', opacity: 0.85 * (1 - prog(f, 720, 6))}} />
  </>
);

/* S5a 780–960 thời gian */
const S5a: React.FC<{f: number}> = ({f}) => {
  const full = eo(prog(f, 800, 40));
  const back = eio(prog(f, 870, 20));
  const lvl = full * (1 - 0.2 * back);
  const red = back < 0.5;
  return (
    <AbsoluteFill style={pushOut(f, 960)}>
      <Label text="THỜI GIAN" f={f} at={780} />
      <Svg>
        <Stroke pts={[[360, 480], [1560, 480], [1560, 620], [360, 620], [360, 480]]} f={f} at={780} dur={26} w={3} />
        <rect x={368} y={488} width={1184 * lvl} height={124} rx={6} fill={red ? 'rgba(255,59,47,0.55)' : 'rgba(240,166,64,0.6)'} />
        <rect x={368} y={488} width={1184 * lvl} height={124} fill={red ? C.red : C.amber} opacity={0.5} filter="url(#b28)" />
        {back > 0 ? <rect x={368 + 1184 * 0.8} y={488} width={1184 * 0.2 * back} height={124} fill="none" stroke={C.goldCore} strokeWidth={3} strokeDasharray="14 10" /> : null}
      </Svg>
      <Led label="LỊCH" value={`${String(Math.round(lvl * 100)).padStart(3, '0')}%`} f={f} at={800} x={1290} y={110} size={64} color={red ? C.red : '#ffc86b'} />
      <GlowText text="20%" f={f} at={880} x={1442} y={380} size={150} />
      <GlowText text="ĐỂ THỞ" f={f} at={890} x={1442} y={720} size={56} color="white" />
    </AbsoluteFill>
  );
};

/* S5b 960–1080 tiền bạc */
const S5b: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={pushOut(f, 1080)}>
    <Label text="TIỀN BẠC" f={f} at={960} />
    <Svg>
      {Array.from({length: 6}).map((_, i) => {
        const cx = 560 + i * 160;
        const t = eo(prog(f, 966 + i * 8, 14));
        const solid = i < 3;
        const pts = smooth(Array.from({length: 25}).map((_, k): P => [cx + 58 * Math.cos(-Math.PI / 2 + (k / 24) * Math.PI * 2), 600 + 58 * Math.sin(-Math.PI / 2 + (k / 24) * Math.PI * 2)]), 3);
        const {d} = partial(pts, t);
        return (
          <g key={i}>
            {solid && t >= 1 ? <circle cx={cx} cy={600} r={56} fill="rgba(240,166,64,0.45)" /> : null}
            <GlowPath d={d} w={solid ? 4 : 2.5} o={solid ? 1 : 0.7} />
            <text x={cx} y={710} textAnchor="middle" fill="rgba(243,239,230,0.6)" fontFamily={FONT.serif} fontSize={26} opacity={t}>{`T${i + 1}`}</text>
          </g>
        );
      })}
    </Svg>
    <GlowText text="3–6 THÁNG" f={f} at={1000} y={380} size={170} />
  </AbsoluteFill>
);

/* S5c 1080–1200 sức lực */
const S5c: React.FC<{f: number}> = ({f}) => {
  const up = eio(prog(f, 1140, 24));
  const lvl = 0.05 + 0.3 * up;
  const blink = up === 0 && Math.floor(f / 6) % 2 === 0 ? 0.35 : 1;
  const red = up < 0.5;
  return (
    <AbsoluteFill style={pushOut(f, 1200)}>
      <Label text="SỨC LỰC" f={f} at={1080} />
      <Svg>
        <Stroke pts={[[660, 420], [1220, 420], [1220, 700], [660, 700], [660, 420]]} f={f} at={1080} dur={24} w={3.5} />
        <Stroke pts={[[1220, 510], [1262, 510], [1262, 610], [1220, 610]]} f={f} at={1100} dur={8} w={3.5} />
        <rect x={672} y={432} width={536 * lvl} height={256} rx={6} fill={red ? C.red : C.amber} opacity={0.7 * blink * eo(prog(f, 1100, 6))} />
        <rect x={672} y={432} width={536 * lvl} height={256} fill={red ? C.red : C.amber} opacity={0.5 * blink} filter="url(#b28)" />
      </Svg>
      <GlowText text={`${Math.round(lvl * 100)}%`} f={f} at={1104} x={1500} y={560} size={170} color={red ? 'red' : 'gold'} />
    </AbsoluteFill>
  );
};

/* S6 1200–1440 leo dốc, không đệm, rồi tối lặng */
const CLIMB = smooth([[100, 900], [380, 820], [560, 760], [720, 610], [860, 560], [1020, 420], [1160, 330], [1300, 240], [1420, 212]], 12);
const S6: React.FC<{f: number}> = ({f}) => {
  const t = eo(prog(f, 1200, 200));
  const {head} = partial(CLIMB, t);
  const words: [string, number, P][] = [['sai giờ', 1276, [560, 700]], ['sai số', 1298, [880, 500]], ['sai người', 1320, [1180, 270]]];
  return (
    <>
      <Svg>
        <Stroke pts={CLIMB} f={f} at={1200} dur={200} w={4} />
        <line x1={0} x2={W} y1={200} y2={200} stroke={C.red} strokeWidth={2} strokeDasharray="18 12" opacity={eo(prog(f, 1230, 20)) * 0.8} />
        {f > 1360 ? Array.from({length: 14}).map((_, i) => {
          const a = rand(i + f) * Math.PI * 2;
          const r = 20 + rand(i * 3 + f) * 70;
          return <circle key={i} cx={head[0] + Math.cos(a) * r} cy={head[1] + Math.sin(a) * r} r={2} fill="#ffd9a0" />;
        }) : null}
        {words.map(([w, at, p]) => (
          <text key={w} x={p[0]} y={p[1]} fill="#ff7a68" fontFamily={FONT.sans} fontWeight={800} fontSize={44} opacity={eo(prog(f, at, 8))} style={{filter: 'drop-shadow(0 0 10px rgba(255,59,47,0.9))'}}>{w}</text>
        ))}
      </Svg>
      <div style={{position: 'absolute', left: 1500, top: 150, fontFamily: FONT.serif, fontSize: 30, color: '#ff8b7c', opacity: eo(prog(f, 1240, 12))}}>giới hạn</div>
    </>
  );
};

/* S7 1440–1560 bùng nổ */
const STRANDS = Array.from({length: 150}).map((_, i) => {
  const a = rand(i) * Math.PI * 2;
  const len = 500 + rand(i + 7) * 900;
  const bend = (rand(i + 13) - 0.5) * 1.2;
  const pts: P[] = Array.from({length: 6}).map((_, k) => {
    const s = k / 5;
    const aa = a + bend * s * s;
    return [960 + Math.cos(aa) * len * s, 470 + Math.sin(aa) * len * s * 0.75];
  });
  return {pts: smooth(pts, 5), d: 16 + rand(i + 21) * 22, w: 0.8 + rand(i + 33) * 1.6};
});
const S7: React.FC<{f: number}> = ({f}) => {
  const lf = f - CLIMAX;
  const shake = lf < 14 ? (1 - lf / 14) * 16 : 0;
  const ds = STRANDS.map((s) => partial(s.pts, eo(prog(f, CLIMAX, s.d)), Math.max(0, eo(prog(f, CLIMAX + 30, 60)) * 0.6)).d);
  return (
    <AbsoluteFill style={{transform: `translate(${Math.sin(lf * 2.3) * shake}px, ${Math.cos(lf * 1.7) * shake}px)`}}>
      <Svg>
        <g filter="url(#b10)" opacity={0.9}>{ds.map((d, i) => <path key={i} d={d} stroke={C.amber} strokeWidth={STRANDS[i].w * 4} fill="none" />)}</g>
        <g>{ds.map((d, i) => <path key={i} d={d} stroke={i % 5 === 0 ? '#fff' : '#ffe2b0'} strokeWidth={STRANDS[i].w} fill="none" opacity={0.9} />)}</g>
        <circle cx={960} cy={470} r={260 * (1 - prog(f, CLIMAX, 40)) + 40} fill="url(#headG)" />
      </Svg>
      <GlowText text="KHOẢNG ĐỆM" f={f} at={CLIMAX + 2} y={440} size={230} ls={8} />
      <GlowText text="= quyền được sai" f={f} at={CLIMAX + 24} y={640} size={84} color="white" font={FONT.serif} weight={600} />
      <AbsoluteFill style={{background: '#fff', opacity: 0.9 * (1 - prog(f, CLIMAX, 7))}} />
    </AbsoluteFill>
  );
};

/* S8 1560–1800 tấm lưới */
const NET = smooth([[160, 800], [560, 870], [960, 900], [1360, 870], [1760, 800]], 16);
const netY = (x: number) => 800 + 100 * (1 - Math.pow((x - 960) / 800, 2));
const S8: React.FC<{f: number}> = ({f}) => {
  const fall = prog(f, 1664, 18);
  const land = netY(960) - 16;
  let y = ropeY(960) - 18;
  if (f >= 1664) {
    if (fall < 1) y = y + (land - y) * fall * fall;
    else {
      const t = (f - 1682) / 30;
      y = land - Math.abs(Math.sin(t * Math.PI * 2.2)) * 70 * Math.exp(-t * 3);
    }
  }
  const sag = f >= 1682 ? 22 * Math.exp(-(f - 1682) / 14) * Math.abs(Math.cos((f - 1682) * 0.4)) : 0;
  const netGlow = f >= 1682 ? 1 + 1.5 * Math.exp(-(f - 1682) / 16) : 1;
  const netPts = NET.map(([x, yy]): P => [x, yy + sag * (1 - Math.pow((x - 960) / 800, 2))]);
  const cross = Array.from({length: 9}).map((_, i) => {
    const x = 260 + i * 175;
    return [[x, ropeY(x) + 10], [x + 70, netY(x + 70)]] as P[];
  });
  return (
    <>
      <Svg>
        <Stroke pts={ROPE} f={f} at={1560} dur={18} w={4} />
        <Stroke pts={netPts} f={f} at={1600} dur={36} w={3.5 * netGlow} />
        {cross.map((c, i) => <Stroke key={i} pts={c} f={f} at={1620 + i * 3} dur={14} w={1.4} o={0.55} head={false} />)}
        {f > 1570 ? <PenHead p={[960, y]} f={f} size={0.6} /> : null}
      </Svg>
      <GlowText text="KHOẢNG ĐỆM" f={f} at={1722} y={230} size={120} ls={5} />
      <GlowText text="= chỗ để vấp mà không ngã" f={f} at={1734} y={350} size={58} color="white" font={FONT.serif} weight={600} />
    </>
  );
};

/* S9 1800–1920 câu hỏi kết */
const QM = smooth([[870, 300], [900, 215], [985, 190], [1060, 240], [1050, 330], [965, 380], [960, 450]], 12);
const S9: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{opacity: 1 - prog(f, 1896, 24)}}>
    <Svg>
      <Stroke pts={QM} f={f} at={1802} dur={30} w={6} />
      {f > 1834 ? <PenHead p={[960, 520]} f={f} size={0.9} /> : null}
    </Svg>
    <GlowText text="Tuần này, bạn sẽ chừa trống" f={f} at={1830} y={680} size={76} color="white" weight={800} />
    <GlowText text="bao nhiêu phút cho chính mình?" f={f} at={1838} y={780} size={76} weight={800} />
    {f > 1850 ? <Led label="" value={Math.floor(f / 10) % 2 ? '__ PHÚT' : '   PHÚT'} f={f} at={1850} x={790} y={880} size={60} color="#ffc86b" /> : null}
  </AbsoluteFill>
);

export const Ep52Margin: React.FC = () => {
  const raw = useCurrentFrame();
  const freeze = raw >= CLIMAX - 3 && raw < CLIMAX;
  const f = freeze ? CLIMAX - 3 : raw;
  // trước cao trào: tối dần từ 0.7 giây trước, 3 khung cuối tĩnh lặng gần đen
  const dark = raw < CLIMAX ? clamp((raw - (CLIMAX - 21)) / 18) : 0;
  const scene =
    f < 240 ? <S1 f={f} /> : f < 420 ? <S2 f={f} /> : f < 720 ? <S3 f={f} /> : f < 780 ? <S4 f={f} /> : f < 960 ? <S5a f={f} /> : f < 1080 ? <S5b f={f} /> : f < 1200 ? <S5c f={f} /> : f < CLIMAX ? <S6 f={f} /> : f < 1560 ? <S7 f={f} /> : f < 1800 ? <S8 f={f} /> : <S9 f={f} />;
  const ribbons: [number, P][] = [[420, [200, 820]], [960, [560, 600]], [1080, [660, 420]], [1200, [100, 900]], [1800, [870, 300]]];
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Space f={f} dim={f >= 720 && f < 780 ? 0.4 : 1} warm={f >= CLIMAX && f < 1560 ? 1.4 : 0.6} />
      {scene}
      <Svg>{ribbons.map(([end, land]) => <Ribbon key={end} f={f} end={end} land={land} />)}</Svg>
      {f < 1800 ? <Sub f={f} cues={CUES} /> : null}
      <AbsoluteFill style={{background: '#000', opacity: 0.93 * dark, pointerEvents: 'none'}} />
      <Audio src={staticFile('audio/ep52-margin/bgm.wav')} />
    </AbsoluteFill>
  );
};

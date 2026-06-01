import React, { useEffect, useState, useRef, useCallback } from 'react';

/* ── Dialogue system ── */
const getGreetingsForNow = () => {
  const now = new Date();
  const hr = now.getHours();
  const day = now.getDay(); // 0 = Sun, 1 = Mon, 5 = Fri, 6 = Sat

  const greetingsList = [
    { omni: "Merhaba! 👋 Ben Omni! Bugün seni görmek çok güzel!", reply: ["Ben de seni gördüm! ❤️", "Harika görünüyor burası!", "Tanıştığımıza memnun oldum!"] }
  ];

  // Time-based custom greetings
  if (hr >= 6 && hr < 12) {
    greetingsList.push({
      omni: "Günaydın! ☀️ Harika bir sabah! Sıcak bir çay veya kahve aldın mı?",
      reply: ["Evet aldım, teşekkürler! ☕", "Günaydın tatlı robot! 😊", "Hazırım, başlayalım!"]
    });
  } else if (hr >= 12 && hr < 18) {
    greetingsList.push({
      omni: "İyi günler! 😊 Sana yardımcı olmak ve işleri kolaylaştırmak için buradayım!",
      reply: ["Çok teşekkürler Omni! ❤️", "Harika gidiyorsun!", "Ben de işlere başlayacaktım!"]
    });
  } else {
    greetingsList.push({
      omni: "İyi geceler! 🌙 Dinlenme vakti yaklaşırken ben buradayım, kahveni yudumlayabilirsin!",
      reply: ["İyi geceler Omni! 🥱", "Evet, dinlenme vakti geldi", "Çok tatlısın, teşekkürler!"]
    });
  }

  // Day-based custom greetings
  if (day === 1) { // Monday
    greetingsList.push({
      omni: "Pazartesi sendromu mu? Hiç dert etme, ben yanındayım! ☕",
      reply: ["Hahaha, süpersin! 😂", "İyi ki varsın Omni!", "O zaman işe koyulalım!"]
    });
  } else if (day === 5) { // Friday
    greetingsList.push({
      omni: "Hafta sonu yaklaşıyor! 🎉 Son maimleri de halledip güzelce dinlenelim!",
      reply: ["Oleyy! Çok iyi olur 🚀", "Hadi bitirelim şu işi!", "Hafta sonu planları hazır!"]
    });
  } else if (day === 0 || day === 6) { // Weekend
    greetingsList.push({
      omni: "Mutlu hafta sonları! 🎈 Bugün dinlenirken işleri bana bırakabilirsin!",
      reply: ["Harikasın Omni! 🍿", "Süper bir pazar/cumartesi!", "Teşekkürler asistanım!"]
    });
  }

  // General adorable greetings
  greetingsList.push(
    { omni: "Maillerini ben hallederim! Sen kahveni yudumla! ☕", reply: ["Gerçekten mi? Harika! 🚀", "Çok işime yarayacak!", "Sana güveniyorum!"] },
    { omni: "Bugün nasılsın? 😊 Sana özel hissettirmek benim en büyük görevim!", reply: ["Süper! Sen nasılsın?", "İyiyim, teşekkürler! ❤️", "Biraz heyecanlıyım 🎉"] }
  );

  return greetingsList;
};

export type Behavior = 'walk' | 'wave' | 'jump' | 'idle' | 'chat' | 'drag';

/* ── Arm component for cleaner geometry ── */
const Arm: React.FC<{
  side: 'left' | 'right';
  angle: number;
  waving: boolean;
  instant?: boolean;
}> = ({ side, angle, waving, instant }) => {
  const isLeft = side === 'left';
  const ox = isLeft ? 18 : 92; // pivot X
  const oy = 92;               // pivot Y
  const ax = isLeft ? 2 : 92;  // arm rect X
  const hx = isLeft ? 10 : 100; // hand center X

  return (
    <g
      transform={`rotate(${angle}, ${ox}, ${oy})`}
      style={{ transition: instant ? 'none' : 'transform 0.08s ease-out' }}
    >
      {/* Segment 1: Upper arm */}
      <rect x={ax} y={90} width={16} height={20} rx={8} fill="#1a2a3d" stroke="#334155" strokeWidth="1.5" />
      <rect x={ax} y={90} width={16} height={20} rx={8} fill="url(#limbG)" />
      
      {/* Joint: Elbow */}
      <circle cx={hx} cy={113} r={6} fill="#263244" stroke="#334155" strokeWidth="1.2" />

      {/* Segment 2: Forearm */}
      <rect x={ax} y={121} width={16} height={18} rx={8} fill="#1a2a3d" stroke="#334155" strokeWidth="1.5" />
      <rect x={ax} y={121} width={16} height={18} rx={8} fill="url(#limbG)" />

      {/* Hand (round) */}
      <circle cx={hx} cy={144} r={10} fill="#263244" stroke="#334155" strokeWidth="1.5" />
      {/* Knuckle highlight */}
      <ellipse cx={hx} cy={141} rx={6} ry={3} fill="#334155" opacity={0.5} />
      
      {/* Wave fingers on right arm */}
      {waving && !isLeft && (
        <>
          <line x1={hx - 5} y1={136} x2={hx - 8} y2={126} stroke="#60a5fa" strokeWidth="3.5" strokeLinecap="round" filter="url(#cyanGlow)" />
          <line x1={hx}     y1={135} x2={hx}      y2={124} stroke="#60a5fa" strokeWidth="3.5" strokeLinecap="round" filter="url(#cyanGlow)" />
          <line x1={hx + 5} y1={136} x2={hx + 8}  y2={126} stroke="#60a5fa" strokeWidth="3.5" strokeLinecap="round" filter="url(#cyanGlow)" />
        </>
      )}
    </g>
  );
};

/* ── Main Robot SVG ── */
export const OmniRobot: React.FC<{
  behavior: Behavior;
  facingLeft: boolean;
  walkCycle: number;
  jumpY: number;
  waveAngle: number;
  mouseEyeOffset: { x: number; y: number };
  headOnly?: boolean;
}> = ({ behavior, facingLeft, walkCycle, jumpY, waveAngle, mouseEyeOffset, headOnly = false }) => {
  const [blink, setBlink] = useState(false);
  const [idleLookX, setIdleLookX] = useState(0);

  // Blinking
  useEffect(() => {
    const go = () => {
      const isLateNight = new Date().getHours() >= 0 && new Date().getHours() < 6;
      const tid = setTimeout(() => {
        setBlink(true);
        setTimeout(() => { setBlink(false); go(); }, isLateNight ? 280 : 130);
      }, isLateNight ? 1000 + Math.random() * 1500 : 2000 + Math.random() * 4000);
      return tid;
    };
    const t = go();
    return () => clearTimeout(t);
  }, []);

  // Idle random eye drift
  useEffect(() => {
    if (behavior !== 'idle') { setIdleLookX(0); return; }
    const id = setInterval(() => {
      setIdleLookX((Math.random() - 0.5) * 6);
    }, 1200);
    return () => clearInterval(id);
  }, [behavior]);

  // Mouse takes priority over idle drift
  const rawLookX = (mouseEyeOffset.x !== 0 || mouseEyeOffset.y !== 0) ? mouseEyeOffset.x : idleLookX;
  const lookY = mouseEyeOffset.y;

  // If facingLeft is true, the SVG is scaled by scaleX(-1) which mirrors the horizontal axis.
  // We negate the X values internally so they look correct in screen space.
  const lookX = facingLeft ? -rawLookX : rawLookX;

  const isWalking = behavior === 'walk';
  const isWaving = behavior === 'wave';
  const isJumping = behavior === 'jump';
  const isChatting = behavior === 'chat';
  const isDragging = behavior === 'drag';

  const isLateNight = new Date().getHours() >= 0 && new Date().getHours() < 6;
  const isYawning = behavior === 'idle' && isLateNight;
  const showClosedEyes = blink || isYawning;

  // Dynamic dangling swing based on time for dragging behavior
  const leftLeg = isDragging ? 12 + Math.sin(Date.now() * 0.012) * 15
    : isWalking ? Math.sin(walkCycle) * 24 : 0;
  const rightLeg = isDragging ? -12 + Math.cos(Date.now() * 0.012) * 15
    : isWalking ? -Math.sin(walkCycle) * 24 : 0;
  const leftArm = isDragging ? -60 + Math.sin(Date.now() * 0.018) * 22
    : isWalking ? -Math.sin(walkCycle) * 20 : 0;
  const rightArm = isDragging ? -60 - Math.cos(Date.now() * 0.018) * 22
    : isWaving ? waveAngle : isWalking ? Math.sin(walkCycle) * 20 : 0;

  const bodyBob = isDragging ? Math.sin(Date.now() * 0.005) * 4
    : isWalking ? Math.abs(Math.sin(walkCycle)) * -4 : 0;
  const bodyTiltW = isDragging ? Math.sin(Date.now() * 0.006) * 5
    : isWaving ? Math.sin(waveAngle * 0.04) * 4 : 0;
  const bodyTiltC = isChatting ? Math.sin(walkCycle * 2) * 3 : 0;
  const bodySquish = isDragging ? 1.08 // stretch when dragged!
    : isJumping && jumpY < -30 ? 0.88 : 1;

  // Head turn: capped at ±15 degrees, smoothed by CSS transition.
  // We want the head to rotate towards the mouse in screen space.
  // In CSS 3D rotateY, a positive angle rotates the front to the left.
  // So we negate mouseEyeOffset.x to rotate to the right when mouse is on the right.
  // Furthermore, if facingLeft is true, the scaleX(-1) mirrors 3D rotation directions as well,
  // so we negate it once more (rendering positive instead of negative).
  const rawHeadTurn = -mouseEyeOffset.x * 2.7;
  const headTurnDeg = Math.max(-15, Math.min(15, facingLeft ? -rawHeadTurn : rawHeadTurn));

  // Happy big eyes when dragging or chatting
  const eyeSize = isDragging ? 13.5 : (isChatting ? 13 : 11);

  return (
    <svg
      width={headOnly ? "110" : "120"}
      height={headOnly ? "110" : "200"}
      viewBox={headOnly ? "15 0 90 92" : "0 0 120 200"}
      style={{
        transform: facingLeft ? 'scaleX(-1)' : 'scaleX(1)',
        overflow: 'visible',
        filter: `drop-shadow(0px ${headOnly ? 6 : (isJumping ? 20 : 12)}px ${headOnly ? 12 : (isJumping ? 32 : 20)}px rgba(99,102,241,${headOnly ? 0.35 : (isJumping ? 0.7 : 0.45)}))`,
        transition: 'filter 0.2s',
      }}
    >
      <defs>
        <radialGradient id="headG2" cx="38%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#0a0f1d" stopOpacity="0.1" />
        </radialGradient>
        <radialGradient id="bodyG2" cx="38%" cy="22%" r="65%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#0a0f1d" stopOpacity="0.1" />
        </radialGradient>
        <radialGradient id="limbG" cx="28%" cy="18%" r="72%">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#312e81" stopOpacity="0.2" />
        </radialGradient>
        <filter id="glow2">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="cyanGlow">
          <feGaussianBlur stdDeviation="2.2" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Whole body group — squish on jump, bob & tilt */}
      {!headOnly ? (
        <g
          transform={`
            translate(0, ${bodyBob})
            rotate(${bodyTiltW + bodyTiltC}, 60, 130)
            scale(1, ${bodySquish})
          `}
          style={{ transformOrigin: '60px 190px' }}
        >
          {/* ═══ HEAD GROUP — rotates toward mouse (3D perspective) ═══ */}
          <g style={{
            transform: `perspective(260px) rotateY(${headTurnDeg}deg)`,
            transformOrigin: '60px 49px',
            transition: 'transform 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}>
            {/* ── Left Headphone Ear ── */}
            <circle cx="16" cy="49" r="11" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            <circle cx="16" cy="49" r="11" fill="url(#headG2)" />
            <circle cx="16" cy="49" r="6" fill="#111827" opacity="0.35" />

            {/* ── Right Headphone Ear ── */}
            <circle cx="104" cy="49" r="11" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            <circle cx="104" cy="49" r="11" fill="url(#headG2)" />
            <circle cx="104" cy="49" r="6" fill="#111827" opacity="0.35" />

            {/* ── Left Antenna ── */}
            <path d="M 16 38 Q 12 24 16 10" fill="none" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
            <circle cx="16" cy="7" r="4.5" fill="#818cf8" filter="url(#glow2)">
              <animate attributeName="r" values={isDragging ? "5.5;8.5;5.5" : "4.2;6.8;4.2"} dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="fill" values={isDragging ? "#818cf8;#f43f5e;#818cf8" : "#818cf8;#c7d2fe;#818cf8"} dur="1.6s" repeatCount="indefinite" />
            </circle>

            {/* ── Right Antenna ── */}
            <path d="M 104 38 Q 108 24 104 10" fill="none" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
            <circle cx="104" cy="7" r="4.5" fill="#818cf8" filter="url(#glow2)">
              <animate attributeName="r" values={isDragging ? "5.5;8.5;5.5" : "4.2;6.8;4.2"} dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="fill" values={isDragging ? "#818cf8;#f43f5e;#818cf8" : "#818cf8;#c7d2fe;#818cf8"} dur="1.6s" repeatCount="indefinite" />
            </circle>

            {/* Head Capsule */}
            <rect x="20" y="18" width="80" height="62" rx="20" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            <rect x="20" y="18" width="80" height="62" rx="20" fill="url(#headG2)" />
            
            {/* Top Light Shine overlay for premium illustration feel */}
            <ellipse cx="60" cy="24" rx="30" ry="4" fill="white" opacity="0.08" />

            {/* ── Dark Face Mask ── */}
            <rect x="27" y="25" width="66" height="48" rx="16" fill="#0f172a" stroke="#2d3748" strokeWidth="1.5" />

            {/* Face details group — shifts dynamically for gaze tracking */}
            <g transform={`translate(${lookX * 0.95}, ${lookY * 0.85})`}>
              {/* Peach Blush */}
              <ellipse cx="34" cy="58" rx="7" ry="4" fill="#ff7a8a" opacity={isDragging ? 0.6 : (isChatting ? 0.45 : 0.25)} style={{ transition: 'opacity 0.4s' }} />
              <ellipse cx="86" cy="58" rx="7" ry="4" fill="#ff7a8a" opacity={isDragging ? 0.6 : (isChatting ? 0.45 : 0.25)} style={{ transition: 'opacity 0.4s' }} />

              {/* ── Glowing Crescent Eyes ── */}
              {showClosedEyes ? (
                <>
                  {/* Sleeping straight glowing cyan eyes */}
                  <line x1="34" y1="44" x2="48" y2="44" stroke="#4df0ff" strokeWidth="3.5" strokeLinecap="round" filter="url(#cyanGlow)" />
                  <line x1="72" y1="44" x2="86" y2="44" stroke="#4df0ff" strokeWidth="3.5" strokeLinecap="round" filter="url(#cyanGlow)" />
                </>
              ) : (
                <>
                  {/* Happy glowing cyan crescent arches */}
                  <path d="M 34 49 Q 41 39 48 49" fill="none" stroke="#4df0ff" strokeWidth="4.5" strokeLinecap="round" filter="url(#cyanGlow)" />
                  <path d="M 72 49 Q 79 39 86 49" fill="none" stroke="#4df0ff" strokeWidth="4.5" strokeLinecap="round" filter="url(#cyanGlow)" />
                </>
              )}

              {/* ── Glowing Cyan Mouth ── */}
              {isDragging ? (
                <path d="M 46 56 Q 60 70 74 56 Z" fill="#4df0ff" filter="url(#cyanGlow)" opacity="0.95" />
              ) : isYawning ? (
                <circle cx="60" cy="58" r="4.5" fill="#0f172a" stroke="#4df0ff" strokeWidth="2.5" filter="url(#cyanGlow)" />
              ) : isChatting || behavior === 'wave' ? (
                <path d="M 52 55 Q 60 63 68 55" fill="none" stroke="#4df0ff" strokeWidth="4" strokeLinecap="round" filter="url(#cyanGlow)" />
              ) : (
                <path d="M 54 56 Q 60 61 66 56" fill="none" stroke="#4df0ff" strokeWidth="3.2" strokeLinecap="round" filter="url(#cyanGlow)" />
              )}
            </g>

            {/* ── Neck ── */}
            <rect x="48" y="80" width="24" height="11" rx="5.5" fill="#263244" />
          </g>

          {/* ── Body ── */}
          <rect x="16" y="91" width="88" height="62" rx="18" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          <rect x="16" y="91" width="88" height="62" rx="18" fill="url(#bodyG2)" />

          {/* Chest screen */}
          <rect x="28" y="101" width="64" height="38" rx="9" fill="#0a1020" stroke="#1e40af" strokeWidth="1.5" />
          {/* Animated bar */}
          <rect x="34" y="111" width="52" height="7" rx="3.5" fill="#1d4ed8" opacity="0.35" />
          <rect x="34" y="111" width="18" height="7" rx="3.5" fill="#60a5fa">
            <animate attributeName="width" values="18;52;18" dur="2.2s" repeatCount="indefinite" />
          </rect>
          {/* Dots */}
          <circle cx="44" cy="128" r="5.5" fill="#22c55e">
            <animate attributeName="opacity" values="1;0.2;1" dur="2.1s" repeatCount="indefinite" />
          </circle>
          <circle cx="60" cy="128" r="5.5" fill="#6366f1">
            <animate attributeName="opacity" values="1;0.2;1" dur="1.7s" repeatCount="indefinite" />
          </circle>
          <circle cx="76" cy="128" r="5.5" fill="#f59e0b">
            <animate attributeName="opacity" values="1;0.2;1" dur="2.8s" repeatCount="indefinite" />
          </circle>

          {/* ── Arms ── */}
          <Arm side="left" angle={leftArm} waving={false} instant={false} />
          <Arm side="right" angle={-rightArm} waving={isWaving} instant={isWaving} />

          {/* Anime sparkles while waving */}
          {isWaving && [
            { x: 112, y: 56, d: '0s', s: 8 },
            { x: 122, y: 36, d: '0.12s', s: 5.5 },
            { x: 104, y: 28, d: '0.24s', s: 7 },
            { x: 126, y: 52, d: '0.06s', s: 4.5 },
          ].map((p, i) => (
            <g key={i}>
              <path
                d={`M${p.x},${p.y - p.s} L${p.x + 1.8},${p.y - 1.8} L${p.x + p.s},${p.y} L${p.x + 1.8},${p.y + 1.8} L${p.x},${p.y + p.s} L${p.x - 1.8},${p.y + 1.8} L${p.x - p.s},${p.y} L${p.x - 1.8},${p.y - 1.8}Z`}
                fill="#fbbf24"
                opacity="0"
              >
                <animate attributeName="opacity" values="0;1;0" dur="0.55s" begin={p.d} repeatCount="indefinite" />
              </path>
            </g>
          ))}

          {/* Jump excitement lines */}
          {isJumping && jumpY < -20 && [
            { x1: 2, y1: 155, x2: -14, y2: 148 },
            { x1: 118, y1: 155, x2: 134, y2: 148 },
            { x1: 2, y1: 165, x2: -12, y2: 162 },
            { x1: 118, y1: 165, x2: 132, y2: 162 },
          ].map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
          ))}

          {/* ── Segmented Legs ── */}
          <g transform={`rotate(${leftLeg}, 38, 153)`} style={{ transition: 'transform 0.04s' }}>
            {/* Segment 1: Upper leg */}
            <rect x="28" y="151" width="22" height="15" rx="8" fill="#1a2a3d" stroke="#334155" strokeWidth="1.5" />
            <rect x="28" y="151" width="22" height="15" rx="8" fill="url(#limbG)" />
            
            {/* Joint: Knee */}
            <circle cx="39" cy="169" r="5" fill="#263244" stroke="#334155" strokeWidth="1.2" />

            {/* Segment 2: Lower leg */}
            <rect x="28" y="174" width="22" height="12" rx="6" fill="#1a2a3d" stroke="#334155" strokeWidth="1.5" />
            <rect x="28" y="174" width="22" height="12" rx="6" fill="url(#limbG)" />

            {/* Shoe */}
            <ellipse cx="39" cy="189" rx="15" ry="6.5" fill="#263244" stroke="#334155" strokeWidth="1.5" />
            <ellipse cx="43" cy="189" rx="10" ry="4" fill="#1e40af" opacity="0.4" />
          </g>
          <g transform={`rotate(${rightLeg}, 82, 153)`} style={{ transition: 'transform 0.04s' }}>
            {/* Segment 1: Upper leg */}
            <rect x="70" y="151" width="22" height="15" rx="8" fill="#1a2a3d" stroke="#334155" strokeWidth="1.5" />
            <rect x="70" y="151" width="22" height="15" rx="8" fill="url(#limbG)" />
            
            {/* Joint: Knee */}
            <circle cx="81" cy="169" r="5" fill="#263244" stroke="#334155" strokeWidth="1.2" />

            {/* Segment 2: Lower leg */}
            <rect x="70" y="174" width="22" height="12" rx="6" fill="#1a2a3d" stroke="#334155" strokeWidth="1.5" />
            <rect x="70" y="174" width="22" height="12" rx="6" fill="url(#limbG)" />

            {/* Shoe */}
            <ellipse cx="81" cy="189" rx="15" ry="6.5" fill="#263244" stroke="#334155" strokeWidth="1.5" />
            <ellipse cx="85" cy="189" rx="10" ry="4" fill="#1e40af" opacity="0.4" />
          </g>
        </g>
      ) : (
        /* Just the Head Group (no body, arms, legs, coffee) */
        <g style={{
          transform: `perspective(260px) rotateY(${headTurnDeg}deg)`,
          transformOrigin: '60px 49px',
          transition: 'transform 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}>
          {/* ── Left Headphone Ear ── */}
          <circle cx="16" cy="49" r="11" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          <circle cx="16" cy="49" r="11" fill="url(#headG2)" />
          <circle cx="16" cy="49" r="6" fill="#111827" opacity="0.35" />

          {/* ── Right Headphone Ear ── */}
          <circle cx="104" cy="49" r="11" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          <circle cx="104" cy="49" r="11" fill="url(#headG2)" />
          <circle cx="104" cy="49" r="6" fill="#111827" opacity="0.35" />

          {/* ── Left Antenna ── */}
          <path d="M 16 38 Q 12 24 16 10" fill="none" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
          <circle cx="16" cy="7" r="4.5" fill="#818cf8" filter="url(#glow2)">
            <animate attributeName="r" values={isDragging ? "5.5;8.5;5.5" : "4.2;6.8;4.2"} dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="fill" values={isDragging ? "#818cf8;#f43f5e;#818cf8" : "#818cf8;#c7d2fe;#818cf8"} dur="1.6s" repeatCount="indefinite" />
          </circle>

          {/* ── Right Antenna ── */}
          <path d="M 104 38 Q 108 24 104 10" fill="none" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
          <circle cx="104" cy="7" r="4.5" fill="#818cf8" filter="url(#glow2)">
            <animate attributeName="r" values={isDragging ? "5.5;8.5;5.5" : "4.2;6.8;4.2"} dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="fill" values={isDragging ? "#818cf8;#f43f5e;#818cf8" : "#818cf8;#c7d2fe;#818cf8"} dur="1.6s" repeatCount="indefinite" />
          </circle>

          {/* Head Capsule */}
          <rect x="20" y="18" width="80" height="62" rx="20" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          <rect x="20" y="18" width="80" height="62" rx="20" fill="url(#headG2)" />
          
          {/* Top Light Shine overlay for premium illustration feel */}
          <ellipse cx="60" cy="24" rx="30" ry="4" fill="white" opacity="0.08" />

          {/* ── Dark Face Mask ── */}
          <rect x="27" y="25" width="66" height="48" rx="16" fill="#0f172a" stroke="#2d3748" strokeWidth="1.5" />

          {/* Face details group — shifts dynamically for gaze tracking */}
          <g transform={`translate(${lookX * 0.95}, ${lookY * 0.85})`}>
            {/* Peach Blush */}
            <ellipse cx="34" cy="58" rx="7" ry="4" fill="#ff7a8a" opacity={isDragging ? 0.6 : (isChatting ? 0.45 : 0.25)} style={{ transition: 'opacity 0.4s' }} />
            <ellipse cx="86" cy="58" rx="7" ry="4" fill="#ff7a8a" opacity={isDragging ? 0.6 : (isChatting ? 0.45 : 0.25)} style={{ transition: 'opacity 0.4s' }} />

            {/* ── Glowing Crescent Eyes ── */}
            {showClosedEyes ? (
              <>
                {/* Sleeping straight glowing cyan eyes */}
                <line x1="34" y1="44" x2="48" y2="44" stroke="#4df0ff" strokeWidth="3.5" strokeLinecap="round" filter="url(#cyanGlow)" />
                <line x1="72" y1="44" x2="86" y2="44" stroke="#4df0ff" strokeWidth="3.5" strokeLinecap="round" filter="url(#cyanGlow)" />
              </>
            ) : (
              <>
                {/* Happy glowing cyan crescent arches */}
                <path d="M 34 49 Q 41 39 48 49" fill="none" stroke="#4df0ff" strokeWidth="4.5" strokeLinecap="round" filter="url(#cyanGlow)" />
                <path d="M 72 49 Q 79 39 86 49" fill="none" stroke="#4df0ff" strokeWidth="4.5" strokeLinecap="round" filter="url(#cyanGlow)" />
              </>
            )}

            {/* ── Glowing Cyan Mouth ── */}
            {behavior === 'wave' ? (
              /* Waving / Happy smile when hovered inside Aegis card */
              <path d="M 44 68 Q 60 80 76 68" stroke="#f472b6" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
            ) : isDragging ? (
              <path d="M 46 56 Q 60 70 74 56 Z" fill="#4df0ff" filter="url(#cyanGlow)" opacity="0.95" />
            ) : isYawning ? (
              <circle cx="60" cy="58" r="4.5" fill="#0f172a" stroke="#4df0ff" strokeWidth="2.5" filter="url(#cyanGlow)" />
            ) : isChatting ? (
              <path d="M 52 55 Q 60 63 68 55" fill="none" stroke="#4df0ff" strokeWidth="4" strokeLinecap="round" filter="url(#cyanGlow)" />
            ) : (
              <path d="M 54 56 Q 60 61 66 56" fill="none" stroke="#4df0ff" strokeWidth="3.2" strokeLinecap="round" filter="url(#cyanGlow)" />
            )}
          </g>

          {/* ── Neck ── */}
          <rect x="48" y="80" width="24" height="11" rx="5.5" fill="#263244"/>
        </g>
      )}

      {/* Cozy Steaming Coffee Cup */}
      {!headOnly && jumpY === 0 && behavior !== 'drag' && (
        <g transform="translate(-20, 166)">
          {/* Cup Body (Big ceramic cup) */}
          <path d="M-8,6 L18,6 C18,6 18,24 14,28 C10,32 0,32 -4,28 C-8,24 -8,6 -8,6 Z" fill="#ffffff" stroke="#334155" strokeWidth="2" />
          
          {/* Cup Handle */}
          <path d="M18,10 C22,10 22,20 18,20" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
          <path d="M18,10 C22,10 22,20 18,20" fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />

          {/* Coffee inside */}
          <ellipse cx="5" cy="6" rx="12" ry="2" fill="#543d2b" />
          
          {/* Omni text label on the mug */}
          <text x="5" y="20" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" fontSize="7" fill="#475569" textAnchor="middle">Omni</text>

          {/* Animated Steam */}
          <path d="M2,-4 Q5,-10 1,-16 T3,-22" fill="none" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round" opacity="0.65" filter="url(#cyanGlow)">
            <animate attributeName="d" values="M2,-4 Q5,-10 1,-16 T3,-22; M2,-4 Q0,-10 4,-16 T0,-22; M2,-4 Q5,-10 1,-16 T3,-22" dur="2.5s" repeatCount="indefinite" />
          </path>
          <path d="M8,-4 Q11,-9 7,-14 T9,-20" fill="none" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round" opacity="0.65" filter="url(#cyanGlow)">
            <animate attributeName="d" values="M8,-4 Q11,-9 7,-14 T9,-20; M8,-4 Q6,-9 10,-14 T6,-20; M8,-4 Q11,-9 7,-14 T9,-20" dur="2.2s" repeatCount="indefinite" />
          </path>
        </g>
      )}
    </svg>
  );
};

/* ══════════════════════════════════════════
   AssistantMascot — orchestrates everything
   ══════════════════════════════════════════ */
export interface MascotHandle {
  attractToX: (x: number | null) => void;
  celebrate: () => void;
}

export const AssistantMascot = React.forwardRef<MascotHandle, {}>((_, ref) => {
  // Position
  const [x, setX] = useState(160);
  const [jumpY, setJumpY] = useState(0);
  const [facingLeft, setFacingLeft] = useState(false);

  // Behavior state machine
  const [behavior, setBehavior] = useState<Behavior>('walk');

  // Animation clocks
  const [walkCycle, setWalkCycle] = useState(0);
  const [waveAngle, setWaveAngle] = useState(0);

  // Speech
  const [bubble, setBubble] = useState<string | null>(null);
  const [replyBubble, setReplyBubble] = useState<string | null>(null);
  const [dialogIdx, setDialogIdx] = useState(0);
  const [clickable, setClickable] = useState(false);

  // Refs for live values in intervals
  const xRef = useRef(160);
  const targetXRef = useRef(160);
  const behaviorRef = useRef<Behavior>('walk');
  const lockRef = useRef(false);
  const walkSpeedRef = useRef(1.2);
  const attractRef = useRef<number | null>(null);  // button attract X
  const celebratingRef = useRef(false);
  const [mouseEyeOffset, setMouseEyeOffset] = useState({ x: 0, y: 0 });

  // Dragging mechanics
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startJumpY: 0 });
  const gravityIntervalRef = useRef<NodeJS.Timeout | null>(null);

  behaviorRef.current = behavior;

  // ── Expose imperative API ──
  React.useImperativeHandle(ref, () => ({
    attractToX: (bx: number | null) => { attractRef.current = bx; },
    celebrate: () => {
      if (celebratingRef.current) return;
      celebratingRef.current = true;
      lockRef.current = true;
      setBehavior('jump');
      doJump();
      setTimeout(() => {
        doJump();
        setBehavior('wave');
        setBubble('🎉 Hoş geldin!');
        setClickable(false);
        setTimeout(() => {
          setBubble(null);
          setBehavior('walk');
          lockRef.current = false;
          celebratingRef.current = false;
        }, 2500);
      }, 700);
    },
  }));

  // ── Mouse tracking for eye follow ──
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const GROUND = 22;
      // Omni's head world position (approximate)
      const headX = xRef.current;
      const headY = window.innerHeight - GROUND - 160; // ~160px from ground to eyes
      const dx = e.clientX - headX;
      const dy = e.clientY - headY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return;
      // Max offset 5.5px
      const maxOff = 5.5;
      setMouseEyeOffset({
        x: (dx / dist) * Math.min(maxOff, dist * 0.04),
        y: (dy / dist) * Math.min(maxOff * 0.6, dist * 0.025),
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // ── Dragging logic with physics ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;

    // Clear any running gravity fall
    if (gravityIntervalRef.current) {
      clearInterval(gravityIntervalRef.current);
      gravityIntervalRef.current = null;
    }

    setIsDragging(true);
    lockRef.current = true;
    setBehavior('drag');

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: xRef.current,
      startJumpY: jumpY
    };

    const dragGreetings = [
      "Wiii! 🎉 Havaya uçuyorum!",
      "Nereye gidiyoruz? 🚀",
      "Beni uçurdun! 😄",
      "Uçmak harika bir şey! ✨"
    ];
    setBubble(dragGreetings[Math.floor(Math.random() * dragGreetings.length)]);
    setClickable(false);
  }, [jumpY]);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;

      // Update X position (clamp within screen bounds)
      const newX = Math.max(40, Math.min(window.innerWidth - 40, dragStartRef.current.startX + dx));
      xRef.current = newX;
      setX(newX);

      // Update Y position (clamped above ground - jumpY is negative)
      const newJumpY = Math.min(0, dragStartRef.current.startJumpY + dy);
      setJumpY(newJumpY);

      // Face the drag direction
      if (Math.abs(dx) > 1.5) {
        setFacingLeft(dx < 0);
      }
    };

    const onMouseUp = () => {
      setIsDragging(false);
      setBehavior('jump');
      setBubble("Oleyy! Yere düşüyorum! 🪂");

      let vy = 0; // start falling from rest
      let y = jumpY; // current height (negative value)

      const gravityInterval = setInterval(() => {
        vy += 0.85; // gravity acceleration
        y += vy;

        if (y >= 0) {
          y = 0;

          if (vy > 5) {
            vy = -vy * 0.42; // bounce back with 42% kinetic energy
            y = -1; // pop slightly up
            walkSpeedRef.current = 0.05; // squash effect: slow down movement
          } else {
            clearInterval(gravityInterval);
            gravityIntervalRef.current = null;
            setJumpY(0);

            setBubble("Tombiş ayaklarımın üstüne düştüm! 🤖✨");
            setBehavior('wave');
            setTimeout(() => {
              setBubble(null);
              setBehavior('walk');
              lockRef.current = false;
            }, 1800);
          }
        }

        if (y < 0) {
          setJumpY(y);
        }
      }, 16);

      gravityIntervalRef.current = gravityInterval;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, jumpY]);

  // ── Walk targets ──
  useEffect(() => {
    const pick = () => {
      const w = window.innerWidth;
      // Sometimes walk near center, sometimes near edges
      const zones = [0.1, 0.25, 0.5, 0.65, 0.85];
      const zone = zones[Math.floor(Math.random() * zones.length)];
      targetXRef.current = w * zone + (Math.random() - 0.5) * 80;
    };
    pick();
    const id = setInterval(pick, 4500 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  // ── Walk loop ── smooth, no random speed variance
  useEffect(() => {
    const id = setInterval(() => {
      if (behaviorRef.current !== 'walk') return;
      // Attract to button if hovering
      const effectiveTarget = attractRef.current !== null ? attractRef.current : targetXRef.current;
      const dx = effectiveTarget - xRef.current;
      if (Math.abs(dx) < 2) {
        // Arrived near button — auto-wave
        if (attractRef.current !== null && !lockRef.current) {
          lockRef.current = true;
          setBehavior('wave');
          setBubble('Giriş yap! Seni bekliyorum! 🚀');
          setClickable(false);
        }
        return;
      }
      walkSpeedRef.current = Math.min(walkSpeedRef.current + 0.015, 1.2);
      const speed = attractRef.current !== null ? Math.min(walkSpeedRef.current * 2.2, 2.6) : walkSpeedRef.current;
      xRef.current += Math.sign(dx) * speed;
      setX(xRef.current);
      setFacingLeft(dx < 0);
      setWalkCycle(c => c + 0.13 * (walkSpeedRef.current / 1.2));
    }, 16);
    return () => clearInterval(id);
  }, []);

  // ── Wave angle ──
  useEffect(() => {
    if (behavior !== 'wave') { setWaveAngle(0); return; }
    let t = 0;
    const id = setInterval(() => {
      t += 0.28;
      // Anime: fast, overshoots, snaps back
      setWaveAngle(-80 + Math.sin(t) * 55);
    }, 16);
    return () => clearInterval(id);
  }, [behavior]);

  // ── Jump physics ── with soft landing
  const doJump = useCallback(() => {
    let vy = -13;
    let y = 0;
    const id = setInterval(() => {
      vy += 1.0; // gravity
      y += vy;
      if (y >= 0) {
        y = 0;
        clearInterval(id);
        // Landing: throttle walk speed to near-zero, let it ramp up naturally
        walkSpeedRef.current = 0.05;
      }
      setJumpY(y);
    }, 16);
  }, []);

  // ── Behavior scheduler ──
  const showSpeech = useCallback((msg: string, duration = 3000, makeClickable = false) => {
    setBubble(msg);
    setClickable(makeClickable);
    return new Promise<void>(res => setTimeout(() => { setBubble(null); setClickable(false); res(); }, duration));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const runCycle = async () => {
      while (!cancelled) {
        // Random pause between behaviors
        await new Promise(r => setTimeout(r, 4000 + Math.random() * 5000));
        if (cancelled || lockRef.current) continue;

        const roll = Math.random();
        const currentGreetings = getGreetingsForNow();

        if (roll < 0.35) {
          // Wave + speech (clickable)
          lockRef.current = true;
          setBehavior('wave');
          const dialog = currentGreetings[dialogIdx % currentGreetings.length];
          setDialogIdx(i => i + 1);
          await showSpeech(dialog.omni, 3500, true);
          setBehavior('walk');
          lockRef.current = false;

        } else if (roll < 0.6) {
          // Late night yawn or normal jump
          lockRef.current = true;
          const isLateNight = new Date().getHours() >= 0 && new Date().getHours() < 6;
          if (isLateNight && Math.random() < 0.6) {
            setBehavior('idle');
            setBubble("Uykum geldi... Esniyorum... 🥱");
            await new Promise(r => setTimeout(r, 2800));
            setBubble(null);
          } else {
            setBehavior('jump');
            doJump();
            await new Promise(r => setTimeout(r, 900));
          }
          setBehavior('walk');
          lockRef.current = false;

        } else if (roll < 0.75) {
          // Happy jump + wave combo
          lockRef.current = true;
          setBehavior('jump');
          doJump();
          await new Promise(r => setTimeout(r, 400));
          setBehavior('wave');
          const dialog = currentGreetings[dialogIdx % currentGreetings.length];
          setDialogIdx(i => i + 1);
          await showSpeech(dialog.omni, 3000, true);
          setBehavior('walk');
          lockRef.current = false;

        } else {
          // Idle look around
          lockRef.current = true;
          setBehavior('idle');
          await new Promise(r => setTimeout(r, 2000 + Math.random() * 1500));
          setBehavior('walk');
          lockRef.current = false;
        }
      }
    };

    runCycle();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line

  // ── Bubble click handler ──
  const handleBubbleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // prevent drag start!
    if (!clickable) return;
    const currentGreetings = getGreetingsForNow();
    const dialog = currentGreetings[(dialogIdx - 1 + currentGreetings.length) % currentGreetings.length];
    const replies = dialog.reply;
    const pick = replies[Math.floor(Math.random() * replies.length)];

    // Animate: quick jump of joy
    doJump();
    setBubble(null);
    setClickable(false);

    // Show "user reply" then Omni reacts
    setTimeout(() => {
      setReplyBubble(pick);
      setBehavior('chat');
      setTimeout(() => {
        setReplyBubble(null);
        setBehavior('walk');
      }, 2800);
    }, 300);
  }, [clickable, dialogIdx, doJump]);

  const GROUND = 22; // px from bottom

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Subtle floor line glow */}
      <div className="absolute bottom-0 left-0 right-0 h-28"
        style={{ background: 'linear-gradient(to top, rgba(99,102,241,0.07), transparent)' }}
      />

      {/* Shadow on the ground */}
      <div style={{
        position: 'absolute',
        bottom: GROUND - 6,
        left: x - 30,
        width: 60,
        height: 14,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.38) 0%, transparent 75%)',
        transform: `scaleX(${1 - Math.abs(jumpY) / 300})`,
        transition: isDragging ? 'none' : 'transform 0.05s, left 0.05s linear',
      }} />

      {/* Robot + bubbles */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          bottom: GROUND + Math.abs(jumpY), // jumpY is negative = goes up
          left: x - 60,
          transition: isDragging ? 'none' : 'left 0.05s linear',
          willChange: 'left, bottom',
          pointerEvents: 'auto',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {/* User reply (right side) */}
        {replyBubble && (
          <div style={{
            position: 'absolute',
            bottom: 205,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: 'white',
            fontWeight: 700,
            fontSize: 13,
            padding: '8px 16px',
            borderRadius: 18,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 20px rgba(99,102,241,0.5)',
            animation: 'omniPop 0.3s cubic-bezier(.36,.07,.19,.97)',
          }}>
            {replyBubble}
            <div style={{
              position: 'absolute', bottom: -8, left: '50%',
              transform: 'translateX(-50%)',
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid #8b5cf6',
            }} />
          </div>
        )}

        {/* Omni speech bubble */}
        {bubble && (
          <div
            onClick={handleBubbleClick}
            style={{
              position: 'absolute',
              bottom: 205,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,0.95)',
              color: '#1e293b',
              fontWeight: 700,
              fontSize: 13,
              padding: '9px 18px',
              borderRadius: 20,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 24px rgba(99,102,241,0.3)',
              border: clickable ? '2px solid #6366f1' : '1.5px solid #c7d2fe',
              cursor: clickable ? 'pointer' : 'default',
              pointerEvents: clickable ? 'all' : 'none',
              animation: 'omniPop 0.28s cubic-bezier(.36,.07,.19,.97)',
              userSelect: 'none',
            }}
          >
            {bubble}
            {clickable && (
              <span style={{
                display: 'inline-block',
                marginLeft: 8,
                fontSize: 11,
                color: '#6366f1',
                fontWeight: 500,
                opacity: 0.8,
              }}>
                cevapla ↩
              </span>
            )}
            {/* Bubble tail */}
            <div style={{
              position: 'absolute', bottom: -9, left: '50%',
              transform: 'translateX(-50%)',
              borderLeft: '9px solid transparent',
              borderRight: '9px solid transparent',
              borderTop: clickable ? '9px solid #6366f1' : '9px solid rgba(255,255,255,0.95)',
            }} />
          </div>
        )}

        <OmniRobot
          behavior={behavior}
          facingLeft={facingLeft}
          walkCycle={walkCycle}
          jumpY={jumpY}
          waveAngle={waveAngle}
          mouseEyeOffset={mouseEyeOffset}
        />
      </div>

      <style>{`
        @keyframes omniPop {
          0%   { transform: translateX(-50%) scale(0.6); opacity: 0; }
          70%  { transform: translateX(-50%) scale(1.06); }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
});

export default AssistantMascot;

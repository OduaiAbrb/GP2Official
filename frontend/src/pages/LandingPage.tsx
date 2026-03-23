import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Volume2, VolumeX, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Stage = 'falling' | 'cracking' | 'welcome' | 'growing' | 'forest';

interface PhaseNode {
  id: string; label: string; x: number; y: number;
  fill: string; stemFrom: [number, number];
}

// ─── Phase nodes hanging from branches ───────────────────────────────────────
const PHASES: PhaseNode[] = [
  { id: 'planning',               label: 'Planning',       x: 162, y: 285, fill: '#D4A017', stemFrom: [205, 262] },
  { id: 'feasibility_study',      label: 'Feasibility',    x: 255, y: 238, fill: '#c8870f', stemFrom: [278, 222] },
  { id: 'requirements_gathering', label: 'Requirements',   x: 342, y: 210, fill: '#b87e0e', stemFrom: [358, 198] },
  { id: 'validation',             label: 'Validation',     x: 400, y: 180, fill: '#8B5E3C', stemFrom: [412, 170] },
  { id: 'design',                 label: 'Design',         x: 715, y: 268, fill: '#6B4C8A', stemFrom: [688, 252] },
  { id: 'development',            label: 'Development',    x: 628, y: 230, fill: '#8B5E3C', stemFrom: [618, 218] },
  { id: 'tasks',                  label: 'Tasks',          x: 556, y: 210, fill: '#2A9D8F', stemFrom: [548, 200] },
  { id: 'cost_benefit',           label: 'Cost & Benefit', x: 510, y: 175, fill: '#b87e0e', stemFrom: [504, 165] },
  { id: 'risks',                  label: 'Risks',          x: 450, y: 148, fill: '#C1440E', stemFrom: [450, 138] },
  { id: 'summary',                label: 'Summary',        x: 450, y: 112, fill: '#D4A017', stemFrom: [450, 102] },
];

// ─── Info panels for clicking nodes ──────────────────────────────────────────
const PANELS: Record<string, { title: string; body: string }> = {
  planning:               { title: 'Planning',       body: 'Define your vision, goals, stakeholders, and success metrics. The seed of every great project.' },
  feasibility_study:      { title: 'Feasibility',    body: 'Analyse market, technical, economic and operational viability. Get a go/no-go recommendation.' },
  requirements_gathering: { title: 'Requirements',   body: 'Personas, user stories, functional and non-functional requirements with acceptance criteria.' },
  validation:             { title: 'Validation',     body: 'Stakeholder sign-off criteria, prototype validation and traceability matrix.' },
  design:                 { title: 'Design',         body: 'System architecture, component diagrams, data models, API specifications, and UX flows.' },
  development:            { title: 'Development',    body: 'Tech stack, folder structure, dev flow, and component breakdown for your build.' },
  tasks:                  { title: 'Tasks',          body: 'Epics, stories, estimates, dependencies, milestones, and Gantt visualisation.' },
  cost_benefit:           { title: 'Cost & Benefit', body: 'Cost drivers, estimated benefits, ROI, budget hotspots, and high-ROI opportunities.' },
  risks:                  { title: 'Risks',          body: 'Risk register with impact, likelihood, mitigation strategies and owner assignments.' },
  summary:                { title: 'Summary',        body: 'The golden acorn — a complete executive summary of your entire project plan, ready to share.' },
};

// ─── Web Audio breeze generator ───────────────────────────────────────────────
function startBreeze(): () => void {
  try {
    const ctx = new AudioContext();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;

    const lp1 = ctx.createBiquadFilter();
    lp1.type = 'lowpass'; lp1.frequency.value = 500; lp1.Q.value = 0.5;

    const lp2 = ctx.createBiquadFilter();
    lp2.type = 'lowpass'; lp2.frequency.value = 250; lp2.Q.value = 0.3;

    // Slow LFO for wind gusts
    const lfo = ctx.createOscillator();
    lfo.type = 'sine'; lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain);
    lfoGain.connect(ctx.destination);
    lfo.start();

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.028, ctx.currentTime + 2);

    src.connect(lp1); lp1.connect(lp2); lp2.connect(gain);
    gain.connect(ctx.destination); src.start();

    return () => { try { src.stop(); lfo.stop(); ctx.close(); } catch {} };
  } catch { return () => {}; }
}

// ─── Acorn node (hanging from branch) ────────────────────────────────────────
const HangingAcorn: React.FC<{
  x: number; y: number; r?: number; fill?: string; active?: boolean;
  label: string; delay?: number; visible?: boolean;
  onClick?: () => void;
}> = ({ x, y, r = 20, fill = '#D4A017', active = false, label, delay = 0, visible = true, onClick }) => {
  return (
    <g onClick={onClick} style={{ cursor: 'pointer', opacity: visible ? 1 : 0,
      transition: `opacity 0.4s ease ${delay}s, transform 0.4s ease ${delay}s`,
      transformBox: 'fill-box', transformOrigin: `${x}px ${y - r * 1.8}px`,
      transform: visible ? 'scaleY(1)' : 'scaleY(0)',
    }}>
      {/* Glow */}
      {active && <circle cx={x} cy={y + r * 0.3} r={r + 12} fill={fill} fillOpacity="0.18" />}
      {/* Hover target */}
      <circle cx={x} cy={y + r * 0.15} r={r + 8} fill="transparent" />
      {/* Stem */}
      <path d={`M ${x} ${y - r * 1.85} Q ${x + 3} ${y - r * 1.3} ${x} ${y - r * 0.95}`}
        stroke="#3d2412" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Cap (acorn hat) */}
      <ellipse cx={x} cy={y - r * 0.25} rx={r * 0.88} ry={r * 0.38} fill="#2c1b0e" />
      <ellipse cx={x} cy={y - r * 0.32} rx={r * 0.72} ry={r * 0.25} fill="#1a1008" />
      {/* Small crosshatch on cap */}
      {[-r*0.4,-r*0.15,r*0.1,r*0.35].map((dx,i) => (
        <line key={i} x1={x+dx} y1={y-r*0.52} x2={x+dx} y2={y-r*0.02}
          stroke="#3d2412" strokeWidth="0.8" opacity="0.6" />
      ))}
      {/* Body */}
      <ellipse cx={x} cy={y + r * 0.38} rx={r * 0.8} ry={r * 0.75}
        fill={fill}
        style={{ filter: active ? `drop-shadow(0 0 10px ${fill}aa)` : 'none', transition: 'filter 0.3s' }}
      />
      {/* Highlight */}
      <ellipse cx={x - r * 0.25} cy={y + r * 0.1} rx={r * 0.2} ry={r * 0.3}
        fill="rgba(255,255,255,0.14)" />
      {/* Stem nub */}
      <rect x={x - r * 0.1} y={y - r * 0.85} width={r * 0.2} height={r * 0.55}
        rx={r * 0.08} fill="#1a1008" />
      {/* Label */}
      <text x={x} y={y + r * 1.5} textAnchor="middle"
        fill={active ? '#f0e4c8' : '#c8b090'} fontSize="9.5" fontWeight="700"
        fontFamily="Inter,sans-serif" style={{ pointerEvents: 'none', transition: 'fill 0.2s' }}>
        {label}
      </text>
    </g>
  );
};

// ─── Cracked acorn for intro ──────────────────────────────────────────────────
const CrackedAcorn: React.FC<{ cracked: boolean; size?: number }> = ({ cracked, size = 100 }) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 100 120" fill="none">
    {!cracked ? (
      <>
        {/* Whole acorn */}
        <ellipse cx="50" cy="48" rx="33" ry="20" fill="#3d2412" />
        <ellipse cx="50" cy="48" rx="26" ry="13" fill="#221508" />
        <rect x="46" y="28" width="8" height="22" rx="4" fill="#221508" />
        <ellipse cx="50" cy="86" rx="30" ry="36" fill="#8B5E3C" />
        <ellipse cx="50" cy="78" rx="26" ry="30" fill="#c8895a" />
        <ellipse cx="40" cy="68" rx="8" ry="12" fill="rgba(255,255,255,0.1)" />
      </>
    ) : (
      <>
        {/* Left half falling left */}
        <g style={{ transformBox: 'fill-box', transform: 'rotate(-22deg) translate(-8px, 4px)', transformOrigin: '50px 90px' }}>
          <ellipse cx="40" cy="88" rx="22" ry="28" fill="#8B5E3C" />
          <ellipse cx="40" cy="50" rx="24" ry="14" fill="#3d2412" />
          <ellipse cx="40" cy="50" rx="18" ry="9" fill="#221508" />
          <rect x="38" y="36" width="6" height="16" rx="3" fill="#221508" />
        </g>
        {/* Right half falling right */}
        <g style={{ transformBox: 'fill-box', transform: 'rotate(22deg) translate(8px, 4px)', transformOrigin: '50px 90px' }}>
          <ellipse cx="62" cy="88" rx="22" ry="28" fill="#c8895a" />
          <ellipse cx="62" cy="50" rx="24" ry="14" fill="#5c3820" />
          <ellipse cx="62" cy="50" rx="18" ry="9" fill="#3d2412" />
          <rect x="59" y="36" width="6" height="16" rx="3" fill="#3d2412" />
        </g>
        {/* Golden spark rays */}
        {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((deg, i) => (
          <line key={i}
            x1="50" y1="92"
            x2={50 + Math.cos((deg - 90) * Math.PI / 180) * (30 + i % 3 * 8)}
            y2={92 + Math.sin((deg - 90) * Math.PI / 180) * (30 + i % 3 * 8)}
            stroke="#D4A017" strokeWidth="2.5" strokeLinecap="round"
            opacity={0.5 + i * 0.04}
          />
        ))}
        <circle cx="50" cy="92" r="10" fill="#D4A017" fillOpacity="0.35" />
        <circle cx="50" cy="92" r="5" fill="#e8bf40" fillOpacity="0.6" />
      </>
    )}
  </svg>
);

// ─── The Real Oak Tree SVG ────────────────────────────────────────────────────
const OakTree: React.FC<{
  growing: boolean;
  activePhase: string | null;
  onPhaseClick: (id: string) => void;
}> = ({ growing, activePhase, onPhaseClick }) => {

  // All trunk + branch paths defined as [d, strokeWidth, color, animDelay]
  // The trunk uses multiple overlapping strokes for bark texture
  const trunkPaths: [string, number, string, number][] = [
    // Base trunk — very thick
    ['M 450 582 C 446 560 454 538 448 512 C 442 486 456 462 450 438', 52, '#1a0f05', 0],
    ['M 450 582 C 446 560 454 538 448 512 C 442 486 456 462 450 438', 44, '#2c1b0e', 0],
    ['M 450 582 C 446 560 454 538 448 512 C 442 486 456 462 450 438', 34, '#3d2412', 0],
    // Mid trunk
    ['M 450 438 C 444 414 458 392 450 368', 30, '#2c1b0e', 0.1],
    ['M 450 438 C 444 414 458 392 450 368', 22, '#3d2412', 0.1],
    // Upper trunk  
    ['M 450 368 C 444 348 456 330 450 312', 18, '#2c1b0e', 0.18],
    ['M 450 368 C 444 348 456 330 450 312', 12, '#3d2412', 0.18],
    // Top of trunk → crown
    ['M 450 312 C 447 298 453 285 450 270', 10, '#2c1b0e', 0.25],
    ['M 450 312 C 447 298 453 285 450 270', 6, '#5c3820', 0.25],
    // Bark highlight (light streak)
    ['M 455 560 C 456 530 454 500 455 470 C 456 445 454 420 456 395', 2, '#5c3820', 0],
  ];

  // Main branches: [d, strokeWidth, color, delay]
  const branchPaths: [string, number, string, number][] = [
    // Left main branch (from trunk at ~y=400)
    ['M 447 410 C 410 395 360 370 310 352 C 270 338 230 320 205 308', 14, '#2c1b0e', 0.35],
    ['M 447 410 C 410 395 360 370 310 352 C 270 338 230 320 205 308', 8, '#3d2412', 0.35],
    // Left sub-branch to planning
    ['M 205 308 C 195 298 182 290 168 282', 7, '#2c1b0e', 0.55],
    ['M 205 308 C 195 298 182 290 168 282', 4, '#3d2412', 0.55],
    // Left sub-branch up to feasibility
    ['M 205 308 C 212 292 240 268 258 244', 7, '#2c1b0e', 0.6],
    ['M 205 308 C 212 292 240 268 258 244', 4, '#3d2412', 0.6],
    // Left mid branch (y=360)
    ['M 449 372 C 428 358 400 342 378 328 C 360 318 348 310 342 302', 9, '#2c1b0e', 0.45],
    ['M 449 372 C 428 358 400 342 378 328 C 360 318 348 310 342 302', 5, '#3d2412', 0.45],
    // left mid to requirements
    ['M 342 302 C 342 278 342 252 344 215', 5, '#2c1b0e', 0.65],
    ['M 342 302 C 342 278 342 252 344 215', 3, '#3d2412', 0.65],
    // Left high branch (y=332)
    ['M 449 335 C 438 322 425 312 415 298 C 408 288 404 280 402 270', 7, '#2c1b0e', 0.55],
    ['M 449 335 C 438 322 425 312 415 298 C 408 288 404 280 402 270', 3.5, '#3d2412', 0.55],
    // Left high → validation
    ['M 402 270 C 401 258 401 242 402 185', 4, '#2c1b0e', 0.7],
    ['M 402 270 C 401 258 401 242 402 185', 2, '#3d2412', 0.7],
    // Right main branch (from trunk at ~y=395)
    ['M 453 405 C 490 390 540 368 590 350 C 630 336 668 322 692 308', 14, '#2c1b0e', 0.38],
    ['M 453 405 C 490 390 540 368 590 350 C 630 336 668 322 692 308', 8, '#3d2412', 0.38],
    // Right sub to design
    ['M 692 308 C 700 295 706 282 716 268', 7, '#2c1b0e', 0.58],
    ['M 692 308 C 700 295 706 282 716 268', 4, '#3d2412', 0.58],
    // Right sub to development
    ['M 692 308 C 680 295 658 270 630 236', 7, '#2c1b0e', 0.63],
    ['M 692 308 C 680 295 658 270 630 236', 4, '#3d2412', 0.63],
    // Right mid branch (y=358)
    ['M 451 368 C 470 354 500 338 522 322 C 540 310 550 305 556 300', 9, '#2c1b0e', 0.48],
    ['M 451 368 C 470 354 500 338 522 322 C 540 310 550 305 556 300', 5, '#3d2412', 0.48],
    // right mid → tasks
    ['M 556 300 C 556 278 556 252 558 215', 5, '#2c1b0e', 0.67],
    ['M 556 300 C 556 278 556 252 558 215', 3, '#3d2412', 0.67],
    // Right high branch (y=330)
    ['M 451 332 C 462 318 474 308 484 296 C 492 286 498 278 500 268', 7, '#2c1b0e', 0.57],
    ['M 451 332 C 462 318 474 308 484 296 C 492 286 498 278 500 268', 3.5, '#3d2412', 0.57],
    // right high → cost_benefit
    ['M 500 268 C 500 252 506 232 512 180', 4, '#2c1b0e', 0.72],
    ['M 500 268 C 500 252 506 232 512 180', 2, '#3d2412', 0.72],
    // Top center → risks
    ['M 450 270 C 450 255 450 220 450 152', 6, '#2c1b0e', 0.78],
    ['M 450 270 C 450 255 450 220 450 152', 3, '#3d2412', 0.78],
    // top → summary
    ['M 450 152 C 450 142 450 132 450 116', 4, '#2c1b0e', 0.88],
    ['M 450 152 C 450 142 450 132 450 116', 2, '#3d2412', 0.88],
  ];

  // Roots
  const roots = [
    'M 450 578 C 430 582 400 585 375 585',
    'M 450 578 C 470 582 500 585 525 585',
    'M 450 578 C 425 585 390 586 360 586',
    'M 450 578 C 475 585 510 586 540 586',
    'M 450 578 C 418 586 380 588 345 588',
    'M 450 578 C 482 586 520 588 555 588',
  ];

  // Small leaf clusters in the canopy (decorative)
  const leafClusters = [
    { cx: 185, cy: 255, r: 42, color: '#3d7a4a', delay: 1.2 },
    { cx: 260, cy: 212, r: 36, color: '#5a9e6a', delay: 1.3 },
    { cx: 345, cy: 188, r: 32, color: '#4a8a58', delay: 1.35 },
    { cx: 402, cy: 158, r: 28, color: '#3d7a4a', delay: 1.4 },
    { cx: 718, cy: 248, r: 40, color: '#3d7a4a', delay: 1.25 },
    { cx: 630, cy: 208, r: 34, color: '#5a9e6a', delay: 1.32 },
    { cx: 558, cy: 190, r: 30, color: '#4a8a58', delay: 1.38 },
    { cx: 512, cy: 155, r: 26, color: '#3d7a4a', delay: 1.42 },
    { cx: 450, cy: 128, r: 24, color: '#5a9e6a', delay: 1.5 },
  ];

  return (
    <svg width="100%" height="100%" viewBox="0 0 900 600"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: 900, display: 'block', margin: '0 auto' }}>

      <defs>
        <radialGradient id="groundGlow" cx="50%" cy="100%" r="40%">
          <stop offset="0%" stopColor="#3d2412" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0c0702" stopOpacity="0" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Ground glow */}
      <ellipse cx="450" cy="588" rx="200" ry="18" fill="url(#groundGlow)" />

      {/* Roots */}
      {roots.map((d, i) => (
        <g key={i}>
          <path d={d} stroke="#1a0f05" strokeWidth={10 - i} fill="none" strokeLinecap="round"
            style={{ opacity: growing ? 1 : 0, transition: `opacity 0.5s ease 0.1s` }} />
          <path d={d} stroke="#2c1b0e" strokeWidth={6 - i * 0.5} fill="none" strokeLinecap="round"
            style={{ opacity: growing ? 1 : 0, transition: `opacity 0.5s ease 0.1s` }} />
        </g>
      ))}

      {/* Trunk paths */}
      {trunkPaths.map(([d, sw, color, delay], i) => (
        <path key={i} d={d} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 800,
            strokeDashoffset: growing ? 0 : 800,
            transition: `stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1) ${delay}s`,
          }} />
      ))}

      {/* Branch paths */}
      {branchPaths.map(([d, sw, color, delay], i) => (
        <path key={i} d={d} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 500,
            strokeDashoffset: growing ? 0 : 500,
            transition: `stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1) ${delay}s`,
          }} />
      ))}

      {/* Leaf canopy clusters (behind acorns) */}
      {leafClusters.map((lc, i) => (
        <g key={i} style={{
          opacity: growing ? 0.75 : 0,
          transition: `opacity 0.6s ease ${lc.delay}s`,
          transformBox: 'fill-box', transformOrigin: `${lc.cx}px ${lc.cy}px`,
          animation: growing ? `leafSway ${4 + i * 0.3}s ease-in-out ${i * 0.5}s infinite alternate` : 'none',
        }}>
          {/* Multiple overlapping leaf shapes for a cluster effect */}
          {[0,1,2,3,4,5].map(j => {
            const angle = (j / 6) * Math.PI * 2;
            const spread = lc.r * 0.6;
            const lx = lc.cx + Math.cos(angle) * spread * 0.7;
            const ly = lc.cy + Math.sin(angle) * spread * 0.5;
            const lr = lc.r * (0.5 + j * 0.08);
            const rot = angle * (180 / Math.PI) - 90;
            return (
              <path key={j}
                d={`M ${lx} ${ly - lr} C ${lx + lr*0.7} ${ly - lr*0.4}, ${lx + lr*0.7} ${ly + lr*0.2}, ${lx} ${ly + lr*0.45} C ${lx - lr*0.7} ${ly + lr*0.2}, ${lx - lr*0.7} ${ly - lr*0.4}, ${lx} ${ly - lr}`}
                fill={lc.color}
                opacity={0.55 + j * 0.05}
                transform={`rotate(${rot} ${lx} ${ly})`}
              />
            );
          })}
        </g>
      ))}

      {/* Hanging acorn nodes */}
      {PHASES.map((phase, i) => (
        <HangingAcorn
          key={phase.id}
          x={phase.x} y={phase.y} r={18}
          fill={phase.fill}
          active={activePhase === phase.id}
          label={phase.label}
          delay={1.1 + i * 0.07}
          visible={growing}
          onClick={() => onPhaseClick(phase.id)}
        />
      ))}

      {/* Gentle bark texture lines on trunk */}
      {[0,1,2,3,4].map(i => (
        <path key={i}
          d={`M ${448 + i * 3} ${560 - i * 15} C ${449 + i * 2} ${540 - i * 12} ${447 + i * 3} ${520 - i * 10} ${448 + i * 2} ${500 - i * 8}`}
          stroke="#1a0f05" strokeWidth="1.5" fill="none" strokeLinecap="round"
          opacity={0.3 - i * 0.04}
          style={{ opacity: growing ? (0.3 - i * 0.04) : 0, transition: `opacity 0.5s ease 0.5s` }}
        />
      ))}

      <style>{`
        @keyframes leafSway {
          0% { transform: rotate(-3deg); }
          100% { transform: rotate(3deg); }
        }
        @keyframes acornSway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
      `}</style>
    </svg>
  );
};

// ─── Floating leaf particles ──────────────────────────────────────────────────
const FloatingLeaf: React.FC<{ x: number; delay: number; duration: number; size: number }> =
  ({ x, delay, duration, size }) => (
    <div style={{
      position: 'absolute',
      left: `${x}%`,
      top: '-5%',
      width: size,
      height: size * 1.4,
      opacity: 0,
      animation: `leafFall ${duration}s ease-in ${delay}s infinite`,
      pointerEvents: 'none',
    }}>
      <svg width={size} height={size * 1.4} viewBox="0 0 20 28">
        <path d="M 10 0 C 17 5, 18 15, 10 24 C 2 15, 3 5, 10 0 Z"
          fill="#5a9e6a" opacity="0.6" />
        <line x1="10" y1="2" x2="10" y2="22" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
      </svg>
    </div>
  );

// ─── Main Landing Page ────────────────────────────────────────────────────────
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>(
    sessionStorage.getItem('acorn_intro_done') === '1' ? 'growing' : 'falling'
  );
  const [growing, setGrowing] = useState(stage === 'growing' || stage === 'forest');
  const [activePhase, setActivePhase] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const stopSoundRef = useRef<(() => void) | null>(null);

  // ── Intro sequence ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage === 'growing' || stage === 'forest') return;
    const t1 = setTimeout(() => setStage('cracking'), 2200);
    const t2 = setTimeout(() => setStage('welcome'), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleEnter = useCallback(() => {
    sessionStorage.setItem('acorn_intro_done', '1');
    setStage('growing');
    setTimeout(() => {
      setGrowing(true);
      setTimeout(() => setStage('forest'), 2500);
    }, 50);
  }, []);

  const handlePhaseClick = useCallback((id: string) => {
    setActivePhase(prev => prev === id ? null : id);
  }, []);

  const toggleSound = useCallback(() => {
    if (soundOn) {
      stopSoundRef.current?.();
      stopSoundRef.current = null;
      setSoundOn(false);
    } else {
      stopSoundRef.current = startBreeze();
      setSoundOn(true);
    }
  }, [soundOn]);

  // cleanup sound on unmount
  useEffect(() => () => { stopSoundRef.current?.(); }, []);

  // ── Intro stages ───────────────────────────────────────────────────────────
  if (stage === 'falling' || stage === 'cracking' || stage === 'welcome') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 90%, #1a1008 0%, #0c0702 60%, #050301 100%)' }}>

        {/* Stars */}
        {[...Array(30)].map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: `${1 + i % 3}px`, height: `${1 + i % 3}px`,
              left: `${(i * 7.3 + 3) % 96}%`, top: `${(i * 11.7 + 2) % 80}%`,
              background: i % 4 === 0 ? '#D4A017' : i % 4 === 1 ? '#c8895a' : i % 4 === 2 ? '#f0e4c8' : '#8a7055',
              opacity: 0.08 + (i % 6) * 0.03,
              animation: `starTwinkle ${3 + i % 5}s ease-in-out ${i * 0.4}s infinite`,
            }} />
        ))}

        {/* Ground glow */}
        <div className="absolute bottom-0 left-0 right-0 h-32"
          style={{ background: 'linear-gradient(to top, rgba(61,36,18,0.3) 0%, transparent 100%)' }} />

        {/* Ground line */}
        <div className="absolute bottom-[28%] left-[10%] right-[10%] h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(61,36,18,0.6), transparent)' }} />

        {/* Falling/cracking acorn */}
        <div style={{
          animation: stage === 'falling'
            ? 'acornFall 2s cubic-bezier(0.25,0.46,0.45,0.94) forwards'
            : stage === 'cracking' ? 'acornCrack 0.6s ease-in-out forwards'
            : 'none',
          marginBottom: stage === 'welcome' ? '0' : '0',
        }}>
          <CrackedAcorn cracked={stage === 'cracking' || stage === 'welcome'} size={110} />
        </div>

        {/* Impact flash */}
        {stage === 'cracking' && (
          <div className="absolute" style={{
            width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(212,160,23,0.8) 0%, transparent 65%)',
            animation: 'impactFlash 0.6s ease-out forwards',
            bottom: '27%', left: '50%', transform: 'translateX(-50%)',
          }} />
        )}

        {/* Golden light rays */}
        {stage === 'cracking' && (
          <div className="absolute" style={{ bottom: '28%', left: '50%', transform: 'translateX(-50%)' }}>
            {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: 2, height: 60 + i % 3 * 15,
                background: 'linear-gradient(to top, #D4A017, transparent)',
                transform: `rotate(${deg}deg)`,
                transformOrigin: '1px 0px',
                opacity: 0,
                animation: `rayFlash 0.6s ease-out forwards`,
              }} />
            ))}
          </div>
        )}

        {/* Welcome text */}
        {stage === 'welcome' && (
          <div className="mt-10 text-center" style={{ animation: 'welcomeIn 0.9s ease-out forwards' }}>
            <p className="text-xs font-bold tracking-[0.3em] mb-4"
              style={{ color: '#8a7055', letterSpacing: '0.3em' }}>
              AN ACORN FALLS. A FOREST GROWS.
            </p>
            <h1 className="text-5xl sm:text-6xl font-bold mb-4 leading-tight"
              style={{
                background: 'linear-gradient(135deg, #D4A017 0%, #e8bf40 40%, #c8895a 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
              Welcome to Acorn
            </h1>
            <p className="text-xl mb-10" style={{ color: '#8a7055' }}>
              Grow your project from a seed of an idea
            </p>
            <button onClick={handleEnter}
              className="group inline-flex items-center gap-3 px-12 py-5 rounded-2xl text-lg font-bold transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #D4A017, #c8870f)',
                color: '#0c0702',
                boxShadow: '0 0 60px rgba(212,160,23,0.4), 0 20px 40px rgba(0,0,0,0.3)',
              }}>
              🌳 Enter the Forest
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        <style>{`
          @keyframes acornFall {
            0%   { transform: translateY(-300px) rotate(-25deg) scale(0.7); opacity: 0; }
            60%  { transform: translateY(0px) rotate(6deg) scale(1); opacity: 1; }
            75%  { transform: translateY(-35px) rotate(-4deg) scale(1.05); }
            88%  { transform: translateY(4px) rotate(2deg) scale(1); }
            94%  { transform: translateY(-10px) rotate(-1deg); }
            100% { transform: translateY(0px) rotate(0deg) scale(1); opacity: 1; }
          }
          @keyframes acornCrack {
            0%   { transform: scale(1); }
            20%  { transform: scale(1.15) rotate(-3deg); }
            40%  { transform: scale(0.9) rotate(3deg); }
            60%  { transform: scale(1.08) rotate(-2deg); }
            80%  { transform: scale(0.97) rotate(1deg); }
            100% { transform: scale(1) rotate(0deg); }
          }
          @keyframes impactFlash {
            0%   { opacity: 1; transform: translateX(-50%) scale(0.3); }
            50%  { opacity: 0.8; }
            100% { opacity: 0; transform: translateX(-50%) scale(3); }
          }
          @keyframes rayFlash {
            0%   { opacity: 0; transform: rotate(var(--deg)) scaleY(0); }
            30%  { opacity: 0.9; transform: rotate(var(--deg)) scaleY(1); }
            100% { opacity: 0; transform: rotate(var(--deg)) scaleY(1.5); }
          }
          @keyframes welcomeIn {
            0%   { opacity: 0; transform: translateY(30px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes starTwinkle {
            0%, 100% { opacity: var(--base-op); transform: scale(1); }
            50% { opacity: calc(var(--base-op) * 2.5); transform: scale(1.5); }
          }
        `}</style>
      </div>
    );
  }

  // ── Tree stage ─────────────────────────────────────────────────────────────
  const activePanel = activePhase ? PANELS[activePhase] : null;

  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col"
      style={{ background: 'radial-gradient(ellipse at 50% 100%, #1a0f05 0%, #0c0702 55%, #050301 100%)' }}>

      {/* Stars */}
      {[...Array(20)].map((_, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{
            width: `${1 + i % 2}px`, height: `${1 + i % 2}px`,
            left: `${(i * 5.7 + 2) % 95}%`, top: `${(i * 9.3 + 2) % 55}%`,
            background: i % 3 === 0 ? '#D4A017' : '#f0e4c8',
            opacity: 0.06 + (i % 5) * 0.02,
          }} />
      ))}

      {/* Ground strip */}
      <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(26,15,5,0.8) 0%, transparent 100%)' }} />

      {/* Floating leaves */}
      {stage === 'forest' && [8,18,30,45,60,72,85,92].map((x, i) => (
        <FloatingLeaf key={i} x={x} delay={i * 3} duration={12 + i * 2} size={10 + i % 4 * 4} />
      ))}

      {/* NAV */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(61,36,18,0.3)' }}>
        <button
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
          onClick={() => { sessionStorage.removeItem('acorn_intro_done'); setStage('falling'); setGrowing(false); setActivePhase(null); }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: 'linear-gradient(135deg, #2c1b0e, #3d2412)' }}>🌰</div>
          <span className="text-lg font-bold" style={{
            background: 'linear-gradient(to right, #D4A017, #e8bf40)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Acorn</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound toggle */}
          <button onClick={toggleSound}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'rgba(61,36,18,0.5)', border: '1px solid rgba(212,160,23,0.2)' }}
            title={soundOn ? 'Mute breeze' : 'Play breeze'}>
            {soundOn
              ? <Volume2 className="w-4 h-4" style={{ color: '#D4A017' }} />
              : <VolumeX className="w-4 h-4" style={{ color: '#8a7055' }} />}
          </button>
          <button onClick={() => navigate('/login')}
            className="px-3 py-2 text-sm font-medium transition-colors hidden sm:block"
            style={{ color: '#8a7055' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f0e4c8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8a7055')}>
            Sign In
          </button>
          <button onClick={() => navigate('/register')}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #D4A017, #b8860b)', color: '#0c0702', boxShadow: '0 0 20px rgba(212,160,23,0.3)' }}>
            Start Free →
          </button>
        </div>
      </nav>

      {/* Tree area */}
      <div className="relative flex-1 flex items-end justify-center min-h-0">
        {/* Headline overlay */}
        <div className="absolute top-2 left-0 right-0 text-center z-10 pointer-events-none"
          style={{ opacity: growing ? 1 : 0, transition: 'opacity 1s ease 0.5s' }}>
          <p className="text-xs font-bold tracking-[0.25em] mb-1" style={{ color: '#5c3820' }}>
            AI-POWERED PROJECT PLANNING
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold"
            style={{ background: 'linear-gradient(135deg, #D4A017, #e8bf40)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Click an acorn to explore your phases
          </h2>
        </div>

        {/* SVG tree — fills available height */}
        <div className="w-full h-full relative" style={{ maxHeight: 540 }}>
          <OakTree growing={growing} activePhase={activePhase} onPhaseClick={handlePhaseClick} />
        </div>

        {/* Phase info panel */}
        {activePanel && (
          <div className="absolute right-4 top-12 z-30 rounded-2xl p-5 max-w-[260px]"
            style={{
              background: '#1a1008',
              border: `1px solid ${PHASES.find(p => p.id === activePhase)?.fill ?? '#D4A017'}44`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
              animation: 'panelIn 0.25s ease-out',
            }}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="font-bold text-base text-[#f0e4c8]">{activePanel.title}</h3>
              <button onClick={() => setActivePhase(null)}
                className="text-xl leading-none flex-shrink-0 transition-colors"
                style={{ color: '#5c3820' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f0e4c8')}
                onMouseLeave={e => (e.currentTarget.style.color = '#5c3820')}>×</button>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#c8b090' }}>{activePanel.body}</p>
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(61,36,18,0.5)' }}>
              <button onClick={() => navigate('/register')}
                className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.03]"
                style={{ background: 'linear-gradient(135deg, #D4A017, #b8860b)', color: '#0c0702' }}>
                Start planning with AI →
              </button>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-4 text-xs z-10 pointer-events-none"
          style={{ color: '#5c3820', opacity: growing ? 1 : 0, transition: 'opacity 1s ease 2s' }}>
          <span>🌰 Click any acorn to explore</span>
          <span>·</span>
          <span>🔊 Toggle breeze sound above</span>
        </div>
      </div>

      <style>{`
        @keyframes leafFall {
          0%   { transform: translateY(-10px) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.7; }
          90%  { opacity: 0.5; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;

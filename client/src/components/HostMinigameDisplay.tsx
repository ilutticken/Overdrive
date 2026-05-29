import React, { useEffect, useRef, useState } from 'react';

// Each sub-component is keyed by minigame type and remounts fresh each game.

// ─── Overload ─────────────────────────────────────────────────────────────────
function OverloadDisplay({ progress }: { progress: number }) {
  return (
    <div className="w-full bg-slate-900 border-4 border-red-900 h-24 rounded-full overflow-hidden relative shadow-[0_0_30px_rgba(220,38,38,0.5)]">
      <div className="h-full bg-red-600 transition-all duration-100 ease-out" style={{ width: `${(progress / 15) * 100}%` }} />
      <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white mix-blend-difference">
        {progress} / 15 TAPS
      </div>
    </div>
  );
}

// ─── Deflect ──────────────────────────────────────────────────────────────────
function DeflectDisplay() {
  const [scale, setScale] = useState(100);
  useEffect(() => {
    const id = window.setInterval(() => setScale(s => Math.max(0, s - 2.5)), 100);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      <div className="absolute rounded-full border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.8)]" style={{ width: '43%', height: '43%', borderWidth: '9px' }} />
      <div className="absolute rounded-full border-[12px] border-blue-400 shadow-[0_0_30px_rgba(96,165,250,0.8)] transition-all duration-100 ease-linear" style={{ width: `${Math.max(0, scale)}%`, height: `${Math.max(0, scale)}%` }} />
      <div className="w-4 h-4 bg-white rounded-full" />
    </div>
  );
}

// ─── Bluff ────────────────────────────────────────────────────────────────────
function BluffDisplay() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick(t => t + 1), 100);
    return () => clearInterval(id);
  }, []);
  const sweep = Math.abs(Math.sin((tick / 30) * Math.PI * 3)) * 100;
  const targetCenter = 65, sw = 15, cw = 7;
  return (
    <div className="relative w-full max-w-2xl h-16 bg-amber-950 rounded-full border-4 border-amber-900 overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.5)]">
      <div className="absolute top-0 bottom-0 bg-green-500/20 border-x-2 border-green-500/50" style={{ left: `${targetCenter - sw / 2}%`, width: `${sw}%` }} />
      <div className="absolute top-0 bottom-0 bg-green-400/60 border-x-4 border-green-400" style={{ left: `${targetCenter - cw / 2}%`, width: `${cw}%` }} />
      <div className="absolute top-0 bottom-0 w-4 bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,1)] transition-all duration-75" style={{ left: `calc(${Math.min(95, Math.max(0, sweep))}% - 8px)` }} />
    </div>
  );
}

// ─── Slash ────────────────────────────────────────────────────────────────────
function SlashDisplay() {
  const [angle, setAngle] = useState(45);
  useEffect(() => {
    const id = window.setInterval(() => setAngle(a => (a + 3) % 360), 50);
    return () => clearInterval(id);
  }, []);
  const rad = angle * Math.PI / 180;
  const r = 38, cx = 50, cy = 50;
  const x1 = cx - Math.cos(rad) * r, y1 = cy - Math.sin(rad) * r;
  const x2 = cx + Math.cos(rad) * r, y2 = cy + Math.sin(rad) * r;
  return (
    <svg viewBox="0 0 100 100" className="w-48 h-48">
      <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(244,63,94,0.15)" strokeWidth="0.5" />
      <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(244,63,94,0.08)" strokeWidth="0.3" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 4px #f43f5e)' }} />
      <circle cx="50" cy="50" r="1.5" fill="white" opacity="0.4" />
    </svg>
  );
}

// ─── Thread ───────────────────────────────────────────────────────────────────
function ThreadDisplay() {
  const [blocked, setBlocked] = useState<'L'|'R'>('L');
  useEffect(() => {
    const id = window.setInterval(() => setBlocked(b => b === 'L' ? 'R' : 'L'), 1200);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex w-64 h-32 gap-3">
      {(['L', 'R'] as const).map(side => (
        <div key={side} className={`flex-1 rounded-2xl flex items-center justify-center text-4xl font-black transition-all duration-300 ${blocked === side ? 'bg-red-950 border-4 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-slate-800 border-4 border-orange-500 text-orange-400'}`}>
          {blocked === side ? '✕' : side === 'L' ? '◀' : '▶'}
        </div>
      ))}
    </div>
  );
}

// ─── Lock ─────────────────────────────────────────────────────────────────────
function LockDisplay() {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now() / 1000;
      setPos({ x: 50 + Math.sin(t * 0.9) * 32, y: 50 + Math.sin(t * 1.7) * 28 });
    }, 50);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="relative w-64 h-64 bg-slate-900 border-4 border-violet-900 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(139,92,246,0.3)]">
      <div className="absolute w-16 h-16 rounded-full bg-violet-500 border-4 border-violet-300 shadow-[0_0_30px_rgba(139,92,246,0.9)]" style={{ left: `calc(${pos.x}% - 32px)`, top: `calc(${pos.y}% - 32px)`, transition: 'none' }} />
    </div>
  );
}

// ─── Chain ────────────────────────────────────────────────────────────────────
function ChainDisplay() {
  const SEQ_LEN = 8;
  const [index, setIndex] = useState(0);
  const [seq] = useState(() => Array.from({ length: SEQ_LEN }, () => Math.random() < 0.5 ? 'L' : 'R') as Array<'L'|'R'>);
  useEffect(() => {
    const id = window.setInterval(() => setIndex(i => (i + 1) % SEQ_LEN), 700);
    return () => clearInterval(id);
  }, []);
  const current = seq[index];
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        {seq.map((s, i) => (
          <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i < index ? 'bg-cyan-400' : i === index ? 'bg-white animate-pulse' : 'bg-slate-700'}`} />
        ))}
      </div>
      <div className={`text-8xl font-black ${current === 'L' ? 'text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.8)]' : 'text-fuchsia-400 drop-shadow-[0_0_30px_rgba(232,121,249,0.8)]'}`}>
        {current === 'L' ? '◀' : '▶'}
      </div>
    </div>
  );
}

// ─── Scan ─────────────────────────────────────────────────────────────────────
function ScanDisplay() {
  const [codes] = useState(() => {
    const arr: string[] = [];
    for (let i = 0; i < 8; i++) arr.push(Math.random().toString(16).substr(2, 4).toUpperCase());
    return arr;
  });
  const target = codes[0];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    let speed = 900;
    let tid: number;
    const tick = () => {
      setIdx(i => (i + 1) % codes.length);
      speed = Math.max(280, speed - 60);
      tid = window.setTimeout(tick, speed);
    };
    tid = window.setTimeout(tick, speed);
    return () => clearTimeout(tid);
  }, []);
  const curr = codes[idx];
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="px-6 py-2 bg-slate-900 border border-green-900 rounded-lg text-center">
        <div className="text-xs text-green-600 uppercase tracking-widest mb-1">ISOLATE TARGET</div>
        <div className="text-2xl font-mono font-black text-green-400 tracking-widest">{target}</div>
      </div>
      <div className={`text-5xl font-mono font-black py-4 px-8 rounded-xl border-2 transition-all ${curr === target ? 'text-green-300 border-green-500 bg-green-950/60 shadow-[0_0_30px_rgba(74,222,128,0.5)]' : 'text-slate-300 border-slate-700 bg-slate-900/50'}`}>
        {curr}
      </div>
    </div>
  );
}

// ─── Jam ──────────────────────────────────────────────────────────────────────
function JamDisplay() {
  const [targetX, setTargetX] = useState(50);
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now() / 1000;
      setTargetX(Math.max(8, Math.min(92, 50 + Math.sin(t * 0.7) * 35 + Math.sin(t * 1.3) * 10)));
    }, 50);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="relative w-full max-w-2xl h-24 bg-slate-900 border-4 border-lime-900 rounded-full overflow-hidden shadow-[0_0_20px_rgba(132,204,22,0.3)]">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(90deg,rgba(132,204,22,0.5) 0,transparent 1px,transparent 4px)', backgroundSize: '5px 100%' }} />
      <div className="absolute top-0 bottom-0 w-16 bg-lime-500/30 border-x-4 border-lime-500 transition-all duration-75" style={{ left: `calc(${targetX}% - 32px)` }} />
    </div>
  );
}

// ─── Surveillance ─────────────────────────────────────────────────────────────
function SurveillanceDisplay() {
  const [sweep, setSweep] = useState(0);
  const blindCenter = useRef(20 + Math.random() * 60);
  const blindWidth = 14;
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now() / 1000;
      setSweep(50 + Math.sin(t * 1.2) * 45);
    }, 50);
    return () => clearInterval(id);
  }, []);
  const inSpot = Math.abs(sweep - blindCenter.current) <= blindWidth / 2;
  return (
    <div className="relative w-full max-w-2xl h-20 bg-slate-900 border-4 border-teal-900 rounded-full overflow-hidden shadow-[0_0_20px_rgba(20,184,166,0.3)]">
      <div className="absolute top-0 bottom-0 bg-teal-500/20 border-x-2 border-teal-400/50" style={{ left: `${blindCenter.current - blindWidth / 2}%`, width: `${blindWidth}%` }} />
      <div className={`absolute top-2 bottom-2 w-6 rounded-full transition-all duration-75 ${inSpot ? 'bg-red-400 shadow-[0_0_15px_rgba(248,113,113,0.9)]' : 'bg-slate-400'}`} style={{ left: `calc(${sweep}% - 12px)` }} />
    </div>
  );
}

// ─── Doctor ───────────────────────────────────────────────────────────────────
// Shows a step-progress strip so spectators can follow along.
function DoctorDisplay({ progress }: { progress: number }) {
  // progress encodes: stepIndex * 10 + successes (emitted by Doctor component)
  const stepIndex = Math.floor(progress / 10);
  const successes = progress % 10;
  const STEPS = ['STEP 1', 'STEP 2', 'STEP 3'];
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl">
      <div className="flex gap-4 items-center">
        {STEPS.map((label, i) => (
          <React.Fragment key={i}>
            <div className={`flex flex-col items-center gap-2`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black transition-all
                ${i < stepIndex  ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(52,211,153,0.7)]' :
                  i === stepIndex ? 'bg-white text-slate-900 scale-110 animate-pulse' :
                                    'bg-slate-800 text-slate-500 border-2 border-slate-700'}`}>
                {i < stepIndex ? '✓' : i + 1}
              </div>
              <span className={`text-xs uppercase tracking-widest font-bold ${i === stepIndex ? 'text-white' : 'text-slate-500'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-12 h-0.5 mb-4 transition-colors ${i < stepIndex ? 'bg-emerald-500' : 'bg-slate-700'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="text-emerald-400 font-mono text-lg">
        {successes}/{stepIndex} STEPS SUCCESSFUL
      </div>
    </div>
  );
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const DISPLAYS: Record<string, React.ComponentType<any>> = {
  deflect:      DeflectDisplay,
  bluff:        BluffDisplay,
  slash:        SlashDisplay,
  thread:       ThreadDisplay,
  lock:         LockDisplay,
  chain:        ChainDisplay,
  scan:         ScanDisplay,
  jam:          JamDisplay,
  surveillance: SurveillanceDisplay,
  doctor:       DoctorDisplay,
};

// ─── Main export ─────────────────────────────────────────────────────────────

interface Props {
  type:     string;
  progress: number; // Overload: tap count. Doctor: stepIndex*10 + successes.
}

export default function HostMinigameDisplay({ type, progress }: Props) {
  if (type === 'overload') return <OverloadDisplay progress={progress} />;
  const Display = DISPLAYS[type];
  if (!Display) return null;
  // key forces remount (fresh state) when a new mini-game starts
  return <Display key={type} />;
}

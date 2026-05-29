import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../socket';
import CityBackground from './CityBackground';
import HostMinigameDisplay from './HostMinigameDisplay';
import { MINIGAME_META } from '../minigames';

// ─── Result label/tone maps ───────────────────────────────────────────────────

const RESULT_LABEL: Record<string, string> = {
  critical_success: 'CRITICAL SUCCESS', success: 'SUCCESS',
  mixed_success: 'MIXED SUCCESS', failure: 'FAILURE', critical_failure: 'CRITICAL FAILURE',
};
const RESULT_TONE: Record<string, string> = {
  critical_success: 'border-purple-400/60 bg-purple-950/60 text-purple-100',
  success:          'border-emerald-400/60 bg-emerald-950/60 text-emerald-100',
  mixed_success:    'border-amber-400/60 bg-amber-950/60 text-amber-100',
  failure:          'border-red-400/60 bg-red-950/60 text-red-100',
  critical_failure: 'border-rose-400/60 bg-rose-950/60 text-rose-100',
};
const DISP_LABEL: Record<number, string> = { 4:'OBEDIENT', 3:'COMPLIANT', 2:'NEUTRAL', 1:'HOSTILE', 0:'UNREASONABLE' };
const DISP_TONE: Record<number, string> = {
  4: 'border-emerald-400/60 bg-emerald-950/60 text-emerald-100',
  3: 'border-green-400/60 bg-green-950/60 text-green-100',
  2: 'border-yellow-400/60 bg-yellow-950/60 text-yellow-100',
  1: 'border-orange-400/60 bg-orange-950/60 text-orange-100',
  0: 'border-rose-400/60 bg-rose-950/60 text-rose-100',
};

// ─── Warning display config ───────────────────────────────────────────────────

const WARNING_DISPLAY: Record<string, { color: string; glow: string; label: string; sub: string }> = {
  overload:     { color: 'text-red-500',    glow: 'drop-shadow-[0_0_30px_rgba(220,38,38,1)]',   label: 'CRITICAL INTRUSION', sub: 'BRACE FOR FEEDBACK'  },
  deflect:      { color: 'text-blue-500',   glow: 'drop-shadow-[0_0_30px_rgba(59,130,246,1)]',  label: 'DEFLECT',            sub: 'PREPARE TO DEFLECT'  },
  bluff:        { color: 'text-amber-500',  glow: 'drop-shadow-[0_0_30px_rgba(245,158,11,1)]',  label: 'BLUFF',              sub: 'MAINTAIN RESOLVE'    },
  slash:        { color: 'text-rose-500',   glow: 'drop-shadow-[0_0_30px_rgba(244,63,94,1)]',   label: 'BLADE DRAWN',        sub: 'SLASH INCOMING'      },
  thread:       { color: 'text-orange-500', glow: 'drop-shadow-[0_0_30px_rgba(249,115,22,1)]',  label: 'CORRIDOR CLOSING',   sub: 'THREAD THE GATE'     },
  lock:         { color: 'text-violet-500', glow: 'drop-shadow-[0_0_30px_rgba(139,92,246,1)]',  label: 'TARGET ACQUIRED',    sub: 'LOCK ON'             },
  chain:        { color: 'text-cyan-500',   glow: 'drop-shadow-[0_0_30px_rgba(34,211,238,1)]',  label: 'COMBO INCOMING',     sub: 'CHAIN IT'            },
  scan:         { color: 'text-green-500',  glow: 'drop-shadow-[0_0_30px_rgba(74,222,128,1)]',  label: 'SIGNAL DETECTED',    sub: 'SCAN THE STREAM'     },
  jam:          { color: 'text-lime-500',   glow: 'drop-shadow-[0_0_30px_rgba(132,204,22,1)]',  label: 'FREQUENCY LIVE',     sub: 'JAM THE SIGNAL'      },
  surveillance: { color: 'text-teal-500',   glow: 'drop-shadow-[0_0_30px_rgba(20,184,166,1)]',  label: 'CAMERA ACTIVE',      sub: 'GHOST THE GUARD'     },
};

const ACTIVE_DISPLAY: Record<string, { border: string; glow: string; text: string; msg: string }> = {
  overload:     { border: 'border-red-900',    glow: 'rgba(220,38,38,0.5)',   text: 'text-red-400',    msg: 'OVERLOAD IN PROGRESS...'      },
  deflect:      { border: 'border-blue-900',   glow: 'rgba(59,130,246,0.5)',  text: 'text-blue-400',   msg: 'DEFLECTION PROTOCOL ACTIVE...' },
  bluff:        { border: 'border-amber-900',  glow: 'rgba(245,158,11,0.5)',  text: 'text-amber-400',  msg: 'MAINTAINING RESOLVE...'        },
  slash:        { border: 'border-rose-900',   glow: 'rgba(244,63,94,0.5)',   text: 'text-rose-400',   msg: 'SLASH IN PROGRESS...'          },
  thread:       { border: 'border-orange-900', glow: 'rgba(249,115,22,0.5)',  text: 'text-orange-400', msg: 'THREADING THE GATE...'         },
  lock:         { border: 'border-violet-900', glow: 'rgba(139,92,246,0.5)',  text: 'text-violet-400', msg: 'LOCKING ON TARGET...'          },
  chain:        { border: 'border-cyan-900',   glow: 'rgba(34,211,238,0.5)',  text: 'text-cyan-400',   msg: 'CHAINING COMBO...'             },
  scan:         { border: 'border-green-900',  glow: 'rgba(74,222,128,0.5)',  text: 'text-green-400',  msg: 'SCANNING SIGNAL...'            },
  jam:          { border: 'border-lime-900',   glow: 'rgba(132,204,22,0.5)',  text: 'text-lime-400',   msg: 'JAMMING FREQUENCY...'          },
  surveillance: { border: 'border-teal-900',   glow: 'rgba(20,184,166,0.5)',  text: 'text-teal-400',   msg: 'GHOSTING PATROL...'            },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function HostView() {
  const [roomCode, setRoomCode]   = useState<string | null>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [roomState, setRoomState] = useState('lobby');
  const [gmOnline, setGmOnline]   = useState(false);

  const [warningTarget, setWarningTarget]           = useState<string | null>(null);
  const [activeTarget, setActiveTarget]             = useState<string | null>(null);
  const [activeDossierTarget, setActiveDossierTarget] = useState<string | null>(null);
  const [activeType, setActiveType]                 = useState<string | null>(null);
  const [activeDifficulty, setActiveDifficulty]     = useState<string | null>(null);
  const [activeModifier, setActiveModifier]         = useState<any>(null);
  const [dossierDisposition, setDossierDisposition] = useState(2);
  const [minigameProgress, setMinigameProgress]     = useState(0);

  const [flashDrawState, setFlashDrawState]         = useState<'idle'|'prepare'|'go'|'results'>('idle');
  const [initiativeQueue, setInitiativeQueue]       = useState<any[]>([]);
  const [combatState, setCombatState]               = useState<{queue:any[];activeIndex:number}|null>(null);

  const [result, setResult] = useState<{show:boolean;success:boolean;degreeOfSuccess?:string;finalDisposition?:number;modifier?:any;difficultyTier?:string}>({show:false,success:false});
  const [recentResults, setRecentResults] = useState<Array<{kind:'minigame'|'dossier';targetName:string;label:string;detail:string;tone:string}>>([]);

  const audioRef    = useRef<HTMLAudioElement>(null);
  const alertRef    = useRef<any>(null);
  const charsRef    = useRef(characters);
  const activeTypeRef = useRef(activeType);
  const prevHealthRef = useRef<Map<string, number>>(new Map());
  const [healthEffects, setHealthEffects] = useState<Record<string, {kind:'wound'|'heal'}>>({});
  const healthTimers = useRef<Record<string, number>>({});

  useEffect(() => { charsRef.current = characters; }, [characters]);
  useEffect(() => { activeTypeRef.current = activeType; }, [activeType]);

  useEffect(() => {
    alertRef.current = new Audio('/sound/alert-beep.mp3');
    alertRef.current.preload = 'auto';
  }, []);

  const beep = () => { if (!alertRef.current) return; alertRef.current.currentTime = 0; alertRef.current.volume = 0.9; void alertRef.current.play().catch(() => {}); };

  const isReady = gmOnline && characters.filter(c => c.is_online === 1).length >= 1;

  // Health change effects
  useEffect(() => {
    characters.forEach(c => {
      const token = c.device_token;
      const hp = Number(c.health ?? 0);
      const prev = prevHealthRef.current.get(token);
      if (typeof prev === 'number' && hp !== prev) {
        const kind = hp < prev ? 'wound' : 'heal';
        setHealthEffects(e => ({ ...e, [token]: { kind } }));
        if (healthTimers.current[token]) clearTimeout(healthTimers.current[token]);
        healthTimers.current[token] = window.setTimeout(() => {
          setHealthEffects(e => { const { [token]: _, ...rest } = e; return rest; });
          delete healthTimers.current[token];
        }, 500);
      }
      prevHealthRef.current.set(token, hp);
    });
  }, [characters]);

  useEffect(() => () => { Object.values(healthTimers.current).forEach(clearTimeout); }, []);

  // Audio fade
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let id: number;
    if (!isReady) {
      audio.volume = 0;
      audio.play().catch(() => {});
      id = window.setInterval(() => { if (audio.volume < 0.95) audio.volume = Math.min(1, audio.volume + 0.05); else clearInterval(id); }, 100);
    } else {
      id = window.setInterval(() => { if (audio.volume > 0.05) audio.volume = Math.max(0, audio.volume - 0.05); else { audio.pause(); clearInterval(id); } }, 100);
    }
    return () => clearInterval(id);
  }, [isReady]);

  useEffect(() => {
    const saved = localStorage.getItem('overdrive_host_room');
    socket.emit('host:create_room', { roomCode: saved }, (res: any) => {
      if (res.success) {
        setRoomCode(res.roomCode);
        setRoomState(res.roomState);
        setCharacters(res.characters);
        localStorage.setItem('overdrive_host_room', res.roomCode);
      }
    });

    socket.on('room:state_update',        d => { setCharacters(d.characters); setRoomState(d.roomState); });
    socket.on('room:gm_presence',         d => setGmOnline(d.gmOnline));
    socket.on('room:minigame_warning',    d => { beep(); setWarningTarget(d.targetDeviceToken); setActiveType(d.minigameType); setActiveDifficulty(d.difficultyTier||null); setActiveModifier(d.modifier||null); setResult({show:false,success:false}); });
    socket.on('room:minigame_started',    d => { setWarningTarget(null); setActiveTarget(d.targetDeviceToken); setActiveType(d.minigameType); setActiveDifficulty(d.difficultyTier||null); setActiveModifier(d.modifier||null); setMinigameProgress(0); setResult({show:false,success:false}); });
    socket.on('room:minigame_progress',   d => { if (d.progress) setMinigameProgress(d.progress); });
    socket.on('room:dossier_started',     d => { beep(); setWarningTarget(null); setActiveDossierTarget(d.targetDeviceToken); setDossierDisposition(d.disposition); setResult({show:false,success:false}); });
    socket.on('room:dossier_update',      d => setDossierDisposition(d.disposition));
    socket.on('room:flash_draw_prepare',  ()  => { beep(); setFlashDrawState('prepare'); setInitiativeQueue([]); });
    socket.on('room:flash_draw_go',       d  => { setFlashDrawState('go'); if (d?.queue) setInitiativeQueue(d.queue); });
    socket.on('room:flash_draw_results',  d  => { setFlashDrawState('results'); if (d?.queue) setInitiativeQueue(d.queue); });
    socket.on('room:flash_draw_complete', ()  => { setFlashDrawState('idle'); setInitiativeQueue([]); });
    socket.on('room:combat_queue_update', d  => setCombatState(d));

    socket.on('room:minigame_result', d => {
      setActiveTarget(null); setActiveDossierTarget(null); setActiveDifficulty(null); setActiveModifier(null);
      const completedType = activeTypeRef.current;
      setActiveType(null);
      const isDossier = d.finalDisposition !== undefined;
      const char = charsRef.current.find(c => c.device_token === d.deviceToken);
      const name = char?.name || 'UNKNOWN';
      const meta = completedType ? MINIGAME_META[completedType] : null;
      const detail = isDossier ? 'DOSSIER' : (meta?.label || 'MINIGAME');
      const label = isDossier ? (DISP_LABEL[d.finalDisposition] || '') : (RESULT_LABEL[d.degreeOfSuccess] || '');
      const tone  = isDossier ? (DISP_TONE[d.finalDisposition] || '') : (RESULT_TONE[d.degreeOfSuccess] || '');
      setRecentResults(prev => [{ kind: isDossier ? 'dossier' : 'minigame', targetName: name, label, detail, tone }, ...prev].slice(0, 3));
      setResult({ show: true, success: d.success, degreeOfSuccess: d.degreeOfSuccess, finalDisposition: d.finalDisposition, modifier: d.modifier || null, difficultyTier: d.difficultyTier || null });
      setTimeout(() => setResult({ show: false, success: false }), 4000);
    });

    return () => {
      ['room:state_update','room:gm_presence','room:minigame_warning','room:minigame_started',
       'room:minigame_progress','room:dossier_started','room:dossier_update','room:minigame_result',
       'room:flash_draw_prepare','room:flash_draw_go','room:flash_draw_results',
       'room:flash_draw_complete','room:combat_queue_update'].forEach(e => socket.off(e));
    };
  }, []);

  useEffect(() => { if (!isReady) setRecentResults([]); }, [isReady]);

  const activeChar  = characters.find(c => c.device_token === (activeTarget || activeDossierTarget));
  const warningChar = characters.find(c => c.device_token === warningTarget);
  const warnDisplay = WARNING_DISPLAY[activeType || ''] || WARNING_DISPLAY.overload;

  return (
    <div className={`relative flex flex-col items-center justify-center min-h-screen p-8 text-center transition-colors duration-500 overflow-hidden
      ${roomState === 'combat' ? 'bg-red-950/20' : roomState === 'overdrive' ? 'bg-fuchsia-950/20' : ''}
      ${activeTarget || warningTarget ? 'bg-red-950/80' : ''}`}>
      <style>{`
        @keyframes host-card-shake { 0%,100%{transform:translateX(0) rotate(0)} 20%{transform:translateX(-4px) rotate(-1.5deg)} 40%{transform:translateX(4px) rotate(1.5deg)} 60%{transform:translateX(-2px) rotate(-0.75deg)} 80%{transform:translateX(2px) rotate(0.75deg)} }
        @keyframes host-card-heal  { 0%,100%{transform:scale(1)} 30%{transform:scale(1.03)} 60%{transform:scale(1.015)} }
      `}</style>
      <audio ref={audioRef} src="/sound/cyber_runner.ogg" loop />
      {isReady && <CityBackground />}

      {/* Result splash */}
      {result.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className={`text-9xl font-black tracking-widest animate-bounce drop-shadow-[0_0_50px_rgba(255,255,255,0.8)] flex flex-col items-center
            ${result.finalDisposition !== undefined
              ? result.finalDisposition >= 3 ? 'text-emerald-500' : result.finalDisposition === 2 ? 'text-yellow-400' : 'text-red-500'
              : result.degreeOfSuccess === 'critical_success' ? 'text-purple-500' : result.degreeOfSuccess === 'success' ? 'text-green-500' : result.degreeOfSuccess === 'mixed_success' ? 'text-amber-500' : 'text-red-600'}`}>
            {result.finalDisposition !== undefined && <div className="text-xl uppercase tracking-[0.45em] opacity-80 mb-4">FINAL DISPOSITION</div>}
            {result.finalDisposition !== undefined
              ? DISP_LABEL[result.finalDisposition] || ''
              : RESULT_LABEL[result.degreeOfSuccess || ''] || ''}
            {result.modifier && (
              <div className={`mt-6 px-8 py-4 rounded-2xl border text-center max-w-3xl ${result.modifier.type === 'consequence' ? 'border-orange-400/60 bg-orange-950/70 text-orange-100' : result.modifier.type === 'time' ? 'border-cyan-400/60 bg-cyan-950/70 text-cyan-100' : 'border-emerald-400/60 bg-emerald-950/70 text-emerald-100'}`}>
                <div className="text-xs uppercase tracking-[0.35em] opacity-80">{(result.modifier.type || 'modifier').toUpperCase()} MODIFIED</div>
                <div className="mt-2 text-4xl font-black">{result.modifier.label}</div>
                <div className="mt-2 text-2xl font-medium">{result.modifier.description}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent results */}
      {isReady && !activeTarget && !warningTarget && !activeDossierTarget && flashDrawState === 'idle' && (
        <div className="absolute right-6 top-6 z-40 w-80 rounded-2xl border border-white/10 bg-slate-950/85 p-4 text-left backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-200">LAST 3 RESULTS</h2>
            <div className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.35em] text-cyan-100">Live</div>
          </div>
          <div className="mt-3 space-y-2">
            {recentResults.length === 0
              ? <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-sm text-slate-300">No results yet.</div>
              : recentResults.map((r, i) => (
                <div key={i} className={`rounded-xl border px-3 py-2 ${r.tone}`}>
                  <div className="mt-1 text-xl font-black tracking-wide">{r.detail}</div>
                  <div className="mt-1 text-base font-bold uppercase tracking-[0.3em] opacity-95">{r.label}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.25em] opacity-85">{r.targetName}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Warning */}
      {warningTarget && warningChar && (
        <div className={`w-full max-w-6xl flex flex-col items-center animate-pulse duration-75 ${warnDisplay.color}`}>
          <div className={`text-8xl font-black mb-8 tracking-[0.1em] ${warnDisplay.glow}`}>⚠️ {warnDisplay.label} ⚠️</div>
          <h3 className="text-5xl text-white mt-4 tracking-widest">TARGET LOCKED: <span className={`font-bold ${warnDisplay.color}`}>{warningChar.name}</span></h3>
          <div className={`mt-12 text-3xl font-mono tracking-[0.3em] animate-bounce ${warnDisplay.color.replace('500','300')}`}>{warnDisplay.sub}</div>
          {activeModifier && (
            <div className={`mt-8 px-8 py-4 rounded-full border text-center backdrop-blur ${activeModifier.type==='time'?'bg-rose-950/90 border-rose-700 text-rose-100':activeModifier.type==='consequence'?'bg-orange-950/90 border-orange-700 text-orange-100':'bg-cyan-950/90 border-cyan-700 text-cyan-100'}`}>
              <div className="text-xs uppercase tracking-[0.35em] opacity-80">DIFFICULTY {activeDifficulty?.toUpperCase()||'STANDARD'}</div>
              <div className="mt-2 text-3xl font-black">{activeModifier.label}</div>
              <div className="mt-1 text-lg font-medium">{activeModifier.description}</div>
            </div>
          )}
        </div>
      )}

      {/* Active minigame */}
      {activeTarget && activeChar && (
        <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in zoom-in duration-300">
          {(() => {
            const p = ACTIVE_DISPLAY[activeType || ''] || ACTIVE_DISPLAY.overload;
            return (
              <>
                <h2 className={`text-6xl font-black mb-8 animate-pulse ${p.text}`}>{p.msg}</h2>
                <h3 className="text-4xl text-white mb-12">OPERATIVE: <span className="text-fuchsia-400">{activeChar.name}</span></h3>
                {activeModifier && (
                  <div className={`mb-8 px-6 py-3 rounded-lg border text-lg font-bold ${activeModifier.type==='time'?'bg-rose-950/80 border-rose-700 text-rose-100':activeModifier.type==='consequence'?'bg-orange-950/80 border-orange-700 text-orange-100':'bg-cyan-950/80 border-cyan-700 text-cyan-100'}`}>
                    <div className="text-xs uppercase tracking-[0.35em]">{activeDifficulty?.toUpperCase()||'STANDARD'} MODIFIER</div>
                    <div className="mt-1">{activeModifier.label} — {activeModifier.description}</div>
                  </div>
                )}
                <HostMinigameDisplay type={activeType || ''} progress={minigameProgress} />
              </>
            );
          })()}
        </div>
      )}

      {/* Active dossier */}
      {activeDossierTarget && activeChar && (
        <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <h2 className="text-6xl font-black mb-8 animate-pulse text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]">BIOMETRIC MONITORING</h2>
          <h3 className="text-4xl text-white mb-12">TARGET: <span className="text-emerald-400">{activeChar.name}</span></h3>
          <div className="w-full max-w-4xl bg-slate-900 border-4 border-emerald-900 h-48 rounded-lg relative shadow-[0_0_30px_rgba(16,185,129,0.5)] overflow-hidden flex flex-col items-center justify-center">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(0deg,transparent 24%,rgba(16,185,129,0.3) 25%,rgba(16,185,129,0.3) 26%,transparent 27%,transparent 74%,rgba(16,185,129,0.3) 75%,rgba(16,185,129,0.3) 76%,transparent 77%,transparent),linear-gradient(90deg,transparent 24%,rgba(16,185,129,0.3) 25%,rgba(16,185,129,0.3) 26%,transparent 27%,transparent 74%,rgba(16,185,129,0.3) 75%,rgba(16,185,129,0.3) 76%,transparent 77%,transparent)', backgroundSize: '50px 50px' }} />
            <div className="text-6xl font-mono text-emerald-400 z-10 flex flex-col items-center">
              <span className="text-xl text-emerald-600 mb-2">HEART RATE // STRESS LEVEL</span>
              {dossierDisposition === 4 ? '60 BPM [OBEDIENT]' : dossierDisposition === 3 ? '85 BPM [COMPLIANT]' : dossierDisposition === 2 ? '110 BPM [NEUTRAL]' : dossierDisposition === 1 ? '145 BPM [HOSTILE]' : '180+ BPM [UNREASONABLE]'}
            </div>
            <div className="absolute bottom-0 w-full h-2 bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,1)]" style={{ animation: `pulse ${dossierDisposition === 4 ? 2 : dossierDisposition === 3 ? 1.5 : dossierDisposition === 2 ? 1 : dossierDisposition === 1 ? 0.5 : 0.2}s infinite` }} />
            <style>{`@keyframes pulse{0%{transform:scaleX(0);opacity:1}50%{transform:scaleX(1);opacity:1}100%{transform:scaleX(1);opacity:0}}`}</style>
          </div>
        </div>
      )}

      {/* Flash Draw */}
      {flashDrawState === 'prepare' && <div className="fixed inset-0 z-40 bg-black/90 flex flex-col items-center justify-center animate-pulse"><div className="text-9xl font-black text-red-600 tracking-widest drop-shadow-[0_0_30px_rgba(220,38,38,1)]">READY...</div></div>}
      {flashDrawState === 'go' && <div className="fixed inset-0 z-40 bg-black/90 flex flex-col items-center justify-center"><div className="text-9xl font-black text-green-500 tracking-widest animate-bounce drop-shadow-[0_0_50px_rgba(34,197,94,1)]">DRAW!</div></div>}
      {flashDrawState === 'results' && (
        <div className="fixed inset-0 z-40 bg-black/90 flex flex-col items-center pt-24 pb-8 overflow-y-auto">
          <h2 className="text-6xl font-black text-green-500 mb-12 tracking-widest">INITIATIVE QUEUE</h2>
          <div className="w-full max-w-4xl space-y-4">
            {initiativeQueue.map((e, i) => (
              <div key={i} className={`p-6 rounded-lg border-2 flex justify-between items-center text-3xl font-bold ${e.isEnemy ? 'bg-red-950/50 border-red-500 text-red-400' : 'bg-slate-800/80 border-cyan-500 text-cyan-300'}`}>
                <div className="flex items-center gap-4"><span className="text-slate-500 w-12">{i+1}.</span><span>{e.name}</span></div>
                <span className="font-mono">{e.reactionTime}ms</span>
              </div>
            ))}
          </div>
          <p className="mt-12 text-slate-500 text-xl">Waiting for GM to resume operations...</p>
        </div>
      )}

      {/* Standard host UI */}
      {!activeTarget && !activeDossierTarget && !warningTarget && flashDrawState === 'idle' && (
        <>
          {combatState && combatState.queue.length > 0 && (
            <div className="absolute top-8 left-8 z-10 w-64 bg-slate-900/80 border border-slate-700 rounded-lg p-4 shadow-2xl backdrop-blur-sm">
              <h3 className="text-red-500 font-bold mb-3 border-b border-red-900 pb-1 text-sm tracking-widest">INITIATIVE</h3>
              <div className="space-y-2">
                {combatState.queue.map((e, i) => (
                  <div key={i} className={`p-2 rounded text-sm flex justify-between items-center transition-all ${i === combatState.activeIndex ? 'bg-red-600 text-white font-bold scale-105 border-l-4 border-white' : e.isEnemy ? 'text-red-400 opacity-80' : 'text-cyan-400 opacity-80'}`}>
                    <span className="truncate pr-2">{i+1}. {e.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className={`transition-all duration-1000 z-10 ${isReady ? 'absolute top-8 right-8 scale-50 origin-top-right' : 'mb-8 border-b-4 pb-8 w-full max-w-4xl'} ${!isReady ? (roomState==='combat'?'border-red-500':roomState==='overdrive'?'border-fuchsia-500':'border-cyan-500') : ''}`}>
            <h2 className="text-3xl text-slate-400 font-bold mb-2">ACCESS CODE:</h2>
            <div className="text-9xl font-black tracking-[0.2em] text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">{roomCode || '....'}</div>
            {roomState !== 'lobby' && <div className={`mt-8 text-4xl font-black tracking-widest animate-pulse ${roomState==='combat'?'text-red-500':'text-fuchsia-500'}`}>{roomState==='combat'?'COMBAT PROTOCOL ENGAGED':'SYSTEM OVERDRIVE ENGAGED'}</div>}
          </div>
          <div className={`transition-all duration-1000 z-10 w-full ${isReady ? 'absolute bottom-0 left-0 right-0 h-[35vh] flex flex-col items-center pt-8 px-8' : 'max-w-4xl'}`}>
            <div className={`w-full ${isReady ? 'max-w-7xl' : ''}`}>
              <h3 className="text-2xl text-left text-fuchsia-400 font-bold mb-6 border-b border-fuchsia-400/30 pb-2">CONNECTED OPERATIVES</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {characters.length === 0 && <p className="text-slate-500 italic col-span-full">Waiting for connections...</p>}
                {characters.map((c, i) => {
                  const fx = healthEffects[c.device_token];
                  return (
                    <div key={i}
                      className={`bg-slate-800 p-4 rounded border text-left transition-all ${c.is_online===0?'opacity-40 grayscale':''} ${fx?.kind==='wound'?'border-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.5)]':fx?.kind==='heal'?'border-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.5)]':'border-slate-700'}`}
                      style={{ animation: fx?.kind==='wound'?'host-card-shake 0.35s ease-in-out':fx?.kind==='heal'?'host-card-heal 0.45s ease-in-out':undefined }}
                    >
                      <div className="font-bold text-xl flex justify-between items-center">{c.name}{c.is_online===0&&<span className="text-xs font-black text-red-500 bg-red-950 px-2 py-1 rounded">OFFLINE</span>}</div>
                      <div className="text-xs text-slate-400 mt-2">HP: {c.health}/3 | ฿: {c.credits}</div>
                      <div className="text-xs text-amber-300 mt-2">BACKGROUND: {c.background||'Unassigned'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

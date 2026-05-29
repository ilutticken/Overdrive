import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../socket';
import { MINIGAME_REGISTRY, computeSetup } from '../minigames';
import type { MinigameSetup, DegreeOfSuccess } from '../minigames';

// ─── Warning display config ───────────────────────────────────────────────────

const WARNING_CONFIG: Record<string, { bg: string; border: string; color: string; label: string; sub: string }> = {
  overload:     { bg: 'bg-red-950/90',    border: 'border-red-600',    color: 'text-red-500',    label: 'INCOMING',        sub: 'PREPARE TO OVERLOAD'  },
  deflect:      { bg: 'bg-blue-950/90',   border: 'border-blue-600',   color: 'text-blue-500',   label: 'INCOMING',        sub: 'PREPARE TO DEFLECT'   },
  bluff:        { bg: 'bg-amber-950/90',  border: 'border-amber-600',  color: 'text-amber-500',  label: 'BLUFF DETECTED',  sub: 'MAINTAIN RESOLVE'     },
  slash:        { bg: 'bg-rose-950/90',   border: 'border-rose-600',   color: 'text-rose-500',   label: 'BLADE INCOMING',  sub: 'PREPARE TO SLASH'     },
  thread:       { bg: 'bg-orange-950/90', border: 'border-orange-600', color: 'text-orange-500', label: 'CORRIDOR CLOSING',sub: 'PREPARE TO THREAD'    },
  lock:         { bg: 'bg-violet-950/90', border: 'border-violet-600', color: 'text-violet-500', label: 'TARGET ACQUIRED', sub: 'PREPARE TO LOCK ON'   },
  chain:        { bg: 'bg-cyan-950/90',   border: 'border-cyan-600',   color: 'text-cyan-500',   label: 'COMBO INCOMING',  sub: 'PREPARE TO CHAIN'     },
  scan:         { bg: 'bg-green-950/90',  border: 'border-green-600',  color: 'text-green-500',  label: 'SIGNAL DETECTED', sub: 'PREPARE TO SCAN'      },
  jam:          { bg: 'bg-lime-950/90',   border: 'border-lime-600',   color: 'text-lime-500',   label: 'FREQUENCY LIVE',  sub: 'PREPARE TO JAM'       },
  surveillance: { bg: 'bg-teal-950/90',   border: 'border-teal-600',   color: 'text-teal-500',   label: 'CAMERA ACTIVE',   sub: 'PREPARE TO GHOST'     },
};

// ─── Archetype / background data ─────────────────────────────────────────────

const ARCHETYPES: Record<string, { label: string; meat: number; mind: number; moxie: number; desc: string }> = {
  'street-sam':   { label: 'The Street-Sam',  meat: 4, mind: 2, moxie: 1, desc: 'Meat focus. Excels at physical combat and parrying.' },
  'cyber-glitch': { label: 'The Cyber-Glitch', mind: 4, meat: 1, moxie: 2, desc: 'Mind focus. Excels at hacking and system overloads.' },
  'operator':     { label: 'The Operator',    moxie: 4, meat: 2, mind: 1, desc: 'Moxie focus. Excels at social bluffs and crew support.' },
};

const BACKGROUNDS = [
  { id: 'street-fixer',    label: 'Street Fixer',     description: 'A veteran of the undercity who survives by reading people and adapting fast.' },
  { id: 'corp-scion',      label: 'Corporate Scion',  description: 'Raised in boardrooms, this operative understands leverage, etiquette, and pressure.' },
  { id: 'ghost-runner',    label: 'Ghost Runner',     description: 'A stealth-first operator built for silent movement, evasion, and quick exits.' },
  { id: 'bio-hacker',      label: 'Bio-Hacker',       description: 'Tuned into body and machine limits, this operative thrives in risky augmentations.' },
  { id: 'grizzled-veteran',label: 'Grizzled Veteran', description: 'Scarred by past wars and trusted under pressure when calm is thin.' },
  { id: 'signal-weaver',   label: 'Signal Weaver',    description: 'A master of distractions, drones, and social noise that bends attention.' },
];

function getDeviceToken() {
  let t = localStorage.getItem('overdrive_device_token');
  if (!t) { t = 'device_' + Math.random().toString(36).substr(2, 9); localStorage.setItem('overdrive_device_token', t); }
  return t;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlayerView() {
  const [roomCode, setRoomCode]   = useState('');
  const [name, setName]           = useState('');
  const [joined, setJoined]       = useState(false);
  const [character, setCharacter] = useState<any>(null);
  const [roomState, setRoomState] = useState('lobby');

  // Profile state
  const [profiles, setProfiles]         = useState<any[]>([]);
  const [showProfiles, setShowProfiles] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<number|null>(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [createName, setCreateName]     = useState('');
  const [createArchetype, setCreateArchetype] = useState('street-sam');
  const [createBackground, setCreateBackground] = useState(BACKGROUNDS[0].id);

  // Active mini-game
  const [activeSetup, setActiveSetup]   = useState<MinigameSetup | null>(null);
  const [warningType, setWarningType]   = useState<string | null>(null);
  const [warningModifier, setWarningModifier]     = useState<any>(null);
  const [warningDifficulty, setWarningDifficulty] = useState<string | null>(null);

  // Flash draw
  const [flashDrawState, setFlashDrawState] = useState<'idle'|'prepare'|'go'|'results'>('idle');

  // Dossier (non-target view)
  const [dossierClues, setDossierClues] = useState<string[]>([]);

  // Dossier (target view) — handled by the existing Dossier inline UI
  const [activeDossier, setActiveDossier] = useState(false);
  const [dossierDisposition, setDossierDisposition] = useState(2);
  const [dossierTimeLeft, setDossierTimeLeft] = useState(15000);
  const [guessedMotivation, setGuessedMotivation] = useState(false);
  const [guessedFear, setGuessedFear] = useState(false);
  const dossierReportedRef = useRef(false);

  // Health effects
  const [healthEffect, setHealthEffect] = useState<{kind:'wound'|'heal'}|null>(null);
  const prevHealthRef  = useRef<number|null>(null);
  const healthTimerRef = useRef<number|null>(null);

  const alertRef = useRef<any>(null);
  useEffect(() => { alertRef.current = new Audio('/sound/alert-beep.mp3'); alertRef.current.preload = 'auto'; }, []);
  const beep = () => { if (!alertRef.current) return; alertRef.current.currentTime = 0; alertRef.current.volume = 0.9; void alertRef.current.play().catch(()=>{}); };

  // Health effect tracking
  useEffect(() => {
    if (!character) { prevHealthRef.current = null; return; }
    const hp = Number(character.health ?? 0);
    const prev = prevHealthRef.current;
    if (typeof prev === 'number' && prev !== hp) {
      setHealthEffect({ kind: hp < prev ? 'wound' : 'heal' });
      if (healthTimerRef.current) clearTimeout(healthTimerRef.current);
      healthTimerRef.current = window.setTimeout(() => { setHealthEffect(null); }, 500);
    }
    prevHealthRef.current = hp;
  }, [character?.health]);

  useEffect(() => () => { if (healthTimerRef.current) clearTimeout(healthTimerRef.current); }, []);

  // Dossier timer (target)
  useEffect(() => {
    if (!activeDossier || dossierTimeLeft <= 0) return;
    const id = window.setTimeout(() => setDossierTimeLeft(p => Math.max(0, p - 100)), 100);
    return () => clearTimeout(id);
  }, [activeDossier, dossierTimeLeft]);

  useEffect(() => {
    if (activeDossier && dossierTimeLeft <= 0 && !dossierReportedRef.current && character) {
      dossierReportedRef.current = true;
      socket.emit('player:dossier_timeout', { roomCode: character.room_code, deviceToken: getDeviceToken() });
      setTimeout(() => { dossierReportedRef.current = false; }, 1000);
    }
  }, [dossierTimeLeft, activeDossier]);

  // Mini-game completion handler — emits result to server
  const handleMinigameComplete = (degree: DegreeOfSuccess) => {
    if (!character) return;
    setActiveSetup(null);
    socket.emit('player:minigame_complete', {
      roomCode: character.room_code,
      deviceToken: getDeviceToken(),
      success: degree === 'success' || degree === 'critical_success' || degree === 'mixed_success',
      degreeOfSuccess: degree,
    });
  };

  const handleFlashTap = () => {
    if (flashDrawState !== 'go') return;
    socket.emit('player:flash_draw_tap', { roomCode: character?.room_code || roomCode, deviceToken: getDeviceToken(), name: character?.name });
    setFlashDrawState('results');
  };

  // Socket listeners (post-join)
  useEffect(() => {
    if (!joined) return;

    socket.on('room:state_update', d => {
      const me = d.characters.find((c: any) => c.device_token === getDeviceToken());
      if (me) setCharacter(me);
      setRoomState(d.roomState);
    });

    socket.on('room:minigame_warning', d => {
      if (d.targetDeviceToken !== getDeviceToken()) return;
      beep();
      setWarningType(d.minigameType);
      setWarningModifier(d.modifier || null);
      setWarningDifficulty(d.difficultyTier || null);
    });

    socket.on('room:minigame_started', d => {
      if (d.targetDeviceToken !== getDeviceToken()) return;
      setWarningType(null);
      const setup = computeSetup(
        d.minigameType,
        character ? { meat: character.meat, mind: character.mind, moxie: character.moxie } : null,
        d.modifier || null,
        d.difficultyTier || 'medium'
      );
      setActiveSetup(setup);
    });

    socket.on('room:minigame_result', () => {
      setActiveSetup(null);
      setActiveDossier(false);
      setDossierClues([]);
      setWarningType(null);
    });

    socket.on('room:flash_draw_prepare', () => { beep(); setFlashDrawState('prepare'); });
    socket.on('room:flash_draw_go',      () => setFlashDrawState('go'));
    socket.on('room:flash_draw_complete',() => setFlashDrawState('idle'));

    socket.on('room:dossier_started', d => {
      if (d.targetDeviceToken === getDeviceToken()) {
        beep();
        setActiveDossier(true);
        setDossierDisposition(d.disposition);
        setDossierTimeLeft(15000);
        setGuessedMotivation(false);
        setGuessedFear(false);
        dossierReportedRef.current = false;
      } else {
        setDossierClues(d.clues || []);
      }
    });

    socket.on('room:dossier_update', d => {
      setDossierDisposition(d.disposition);
      setGuessedMotivation(d.guessedMotivation);
      setGuessedFear(d.guessedFear);
      if (d.timePenalty) setDossierTimeLeft(p => Math.max(100, p - d.timePenalty));
    });

    return () => {
      ['room:state_update','room:minigame_warning','room:minigame_started','room:minigame_result',
       'room:flash_draw_prepare','room:flash_draw_go','room:flash_draw_complete',
       'room:dossier_started','room:dossier_update'].forEach(e => socket.off(e));
    };
  }, [joined, character]);

  // ── Profile helpers ──────────────────────────────────────────────────────────

  const fetchProfiles = () => {
    socket.emit('player:list_profiles', { deviceToken: getDeviceToken() }, (res: any) => {
      if (res.success) { setProfiles(res.profiles || []); setShowProfiles(true); }
      else alert(res.message || 'Failed to load profiles');
    });
  };

  const handleDeleteProfile = (id: number) => {
    if (!confirm('Delete this character?')) return;
    socket.emit('player:delete_profile', { deviceToken: getDeviceToken(), id }, (res: any) => {
      if (res.success) { fetchProfiles(); if (selectedProfileId === id) setSelectedProfileId(null); }
      else alert(res.message || 'Failed to delete');
    });
  };

  const handleCreateProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const stats = ARCHETYPES[createArchetype];
    const bg = BACKGROUNDS.find(b => b.id === createBackground);
    socket.emit('player:create_profile', {
      deviceToken: getDeviceToken(), name: createName || 'Unnamed',
      meat: stats.meat, mind: stats.mind, moxie: stats.moxie,
      background: bg?.label || '', health: 3, max_health: 3,
      credits: 0, gear: '[]', status_effects: '[]', notes: '',
    }, (res: any) => {
      if (res.success) { fetchProfiles(); setSelectedProfileId(res.id||null); setShowProfiles(true); setShowCreate(false); setName(res.profile.name||''); setCreateName(''); }
      else alert(res.message || 'Failed to create profile');
    });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const token = getDeviceToken();
    const stats = ARCHETYPES[createArchetype];
    const bg = BACKGROUNDS.find(b => b.id === createBackground);
    const payload: any = { roomCode, deviceToken: token, background: bg?.label || '' };
    if (selectedProfileId) payload.profileId = selectedProfileId;
    else { payload.name = name; payload.stats = { meat: stats.meat, mind: stats.mind, moxie: stats.moxie }; }
    socket.emit('player:join_room', payload, (res: any) => {
      if (res.success) {
        setJoined(true);
        const merged = res.profile
          ? { ...res.character, background: res.profile.background||res.character.background||'', health: res.profile.health, max_health: res.profile.max_health, credits: res.profile.credits, gear: res.profile.gear, status_effects: res.profile.status_effects, notes: res.profile.notes }
          : res.character;
        setCharacter(merged);
        setRoomState(res.roomState);
      } else alert(res.message);
    });
  };

  // ── Render: not yet joined ───────────────────────────────────────────────────

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <form onSubmit={handleJoin} className="bg-slate-800 p-8 rounded-lg w-full max-w-md border border-slate-700">
          <h2 className="text-2xl font-bold mb-6 text-fuchsia-400">INITIALIZE LINK</h2>
          <div className="space-y-4">
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => { showProfiles ? setShowProfiles(false) : fetchProfiles(); setShowCreate(false); }}
                className={`text-sm px-3 py-1 rounded ${showProfiles?'bg-slate-700 text-white border border-slate-600':'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'}`}>
                Choose Existing
              </button>
              <button type="button" onClick={() => { setShowCreate(s=>!s); setShowProfiles(false); }}
                className={`text-sm px-3 py-1 rounded ${showCreate?'bg-fuchsia-600 text-white':'bg-fuchsia-500 text-white/90 hover:bg-fuchsia-600'}`}>
                Create Character
              </button>
            </div>

            {showCreate && (
              <div className="mt-4 mb-4 p-4 bg-slate-900 rounded border">
                <h3 className="font-bold mb-2">Create New Character</h3>
                <div className="space-y-3">
                  <input value={createName} onChange={e=>setCreateName(e.target.value)} placeholder="Character Name" className="w-full p-2 bg-slate-800 rounded" />
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(ARCHETYPES).map(([key, data]) => (
                      <label key={key} className={`p-2 rounded border cursor-pointer transition-all ${createArchetype===key?'border-fuchsia-500 bg-fuchsia-500/10':'border-slate-700 bg-slate-900 hover:border-slate-500'}`}>
                        <input type="radio" name="archetype" value={key} checked={createArchetype===key} onChange={()=>setCreateArchetype(key)} className="hidden" />
                        <div className="font-bold text-fuchsia-300">{data.label}</div>
                        <div className="text-xs text-slate-400 mt-1">{data.desc}</div>
                        <div className="flex gap-2 mt-2 text-[10px] font-mono">
                          <span className="bg-slate-800 px-1 py-0.5 rounded text-white">MEAT:{data.meat}</span>
                          <span className="bg-slate-800 px-1 py-0.5 rounded text-white">MIND:{data.mind}</span>
                          <span className="bg-slate-800 px-1 py-0.5 rounded text-white">MOXIE:{data.moxie}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-slate-700 pt-3">
                    <div className="text-sm font-bold text-fuchsia-300 mb-2">Choose a Background</div>
                    {BACKGROUNDS.map(bg => (
                      <label key={bg.id} className={`p-2 rounded border cursor-pointer transition-all block mb-1 ${createBackground===bg.id?'border-amber-500 bg-amber-500/10':'border-slate-700 bg-slate-900 hover:border-slate-500'}`}>
                        <input type="radio" name="background" value={bg.id} checked={createBackground===bg.id} onChange={()=>setCreateBackground(bg.id)} className="hidden" />
                        <div className="font-bold text-amber-300">{bg.label}</div>
                        <div className="text-xs text-slate-400 mt-1">{bg.description}</div>
                      </label>
                    ))}
                  </div>
                  <div className="text-right mt-3">
                    <button type="button" onClick={handleCreateProfile} className="px-4 py-2 bg-fuchsia-600 rounded text-white">Create</button>
                  </div>
                </div>
              </div>
            )}

            {showProfiles && (
              <div className="mb-2 p-3 bg-slate-900 rounded border">
                {profiles.length === 0 && <div className="text-sm italic">No saved characters found.</div>}
                {profiles.map(p => (
                  <div key={p.id} className={`flex items-center justify-between p-2 rounded hover:bg-slate-800 ${selectedProfileId===p.id?'ring-2 ring-fuchsia-500':''}`}>
                    <div>
                      <div className="font-bold">{p.name||'Unnamed'}</div>
                      <div className="text-xs text-slate-400">MEAT:{p.meat} MIND:{p.mind} MOXIE:{p.moxie}</div>
                      <div className="text-xs text-amber-300 mt-1">BACKGROUND: {p.background||'Unassigned'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="radio" name="profile" checked={selectedProfileId===p.id} onChange={()=>{ setSelectedProfileId(p.id); setName(p.name||''); }} />
                      <button type="button" onClick={()=>handleDeleteProfile(p.id)} className="text-xs text-red-400 bg-red-950 px-2 py-1 rounded">Delete</button>
                    </div>
                  </div>
                ))}
                <div className="mt-2 text-right"><button type="button" onClick={()=>setShowProfiles(false)} className="text-sm text-slate-400">Close</button></div>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1">ROOM CODE</label>
              <input type="text" value={roomCode} onChange={e=>setRoomCode(e.target.value.toUpperCase())} maxLength={4} required className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white text-xl tracking-widest uppercase focus:border-fuchsia-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">CALLSIGN</label>
              <input type="text" value={name} onChange={e=>setName(e.target.value)} required className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white text-xl focus:border-fuchsia-500 focus:outline-none transition-colors" />
            </div>
          </div>
          <button type="submit" className="w-full mt-8 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-4 rounded transition-colors">ESTABLISH CONNECTION</button>
        </form>
      </div>
    );
  }

  // ── Render: joined ───────────────────────────────────────────────────────────

  // Flash draw screens
  if (flashDrawState === 'prepare') return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-red-900 border-8 border-red-500 animate-pulse duration-75">
      <div className="text-6xl font-black text-white mb-6 text-center tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.9)]">READY...</div>
    </div>
  );
  if (flashDrawState === 'go') return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-green-500 cursor-pointer active:bg-green-600 transition-colors" onPointerDown={handleFlashTap}>
      <div className="text-6xl font-black text-white text-center tracking-widest drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]">DRAW!</div>
      <p className="mt-8 text-white/80 font-bold">TAP ANYWHERE</p>
    </div>
  );
  if (flashDrawState === 'results') return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-900">
      <div className="text-3xl font-black text-cyan-400 mb-6 text-center tracking-widest">LATENCY LOGGED</div>
      <p className="text-xl text-slate-400 font-bold text-center">CHECK MAIN SCREEN FOR INITIATIVE QUEUE</p>
    </div>
  );

  // Warning screen
  if (warningType) {
    const w = WARNING_CONFIG[warningType] || WARNING_CONFIG.overload;
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen p-6 ${w.bg} border-8 ${w.border} animate-pulse duration-75`}>
        <h2 className={`text-5xl font-black ${w.color} mb-6 text-center drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]`}>⚠️ {w.label} ⚠️</h2>
        <div className={`mt-12 text-xl ${w.color.replace('500','300')} tracking-[0.2em] animate-bounce`}>{w.sub}</div>
        {warningModifier && (
          <div className="mt-10 max-w-2xl rounded border border-white/20 bg-black/50 px-6 py-4 text-center backdrop-blur">
            <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">DIFFICULTY · {warningDifficulty?.toUpperCase()||'STANDARD'}</div>
            <div className="mt-2 text-2xl font-bold text-white">{warningModifier.label}</div>
            <div className="mt-1 text-sm text-slate-200">{warningModifier.description}</div>
          </div>
        )}
      </div>
    );
  }

  // Active mini-game — look up component from registry and render it
  if (activeSetup) {
    const Component = MINIGAME_REGISTRY[activeSetup.type];
    if (Component) {
      return (
        <Component
          setup={activeSetup}
          onComplete={handleMinigameComplete}
          roomCode={character?.room_code || roomCode}
          deviceToken={getDeviceToken()}
        />
      );
    }
  }

  // Dossier — target view
  if (activeDossier && character) {
    return (
      <div className="flex flex-col items-center min-h-screen p-6 bg-slate-950 w-full overflow-y-auto">
        <h2 className="text-4xl font-black text-emerald-500 mb-2 animate-pulse">SOCIAL ENGINEERING</h2>
        <div className="text-xl font-bold text-white mb-4">TIME: {(dossierTimeLeft / 1000).toFixed(1)}s</div>
        <div className="text-emerald-400 font-bold mb-6 border border-emerald-900 bg-emerald-950/30 p-2 rounded w-full max-w-md text-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          DISPOSITION: {dossierDisposition===4?'OBEDIENT':dossierDisposition===3?'COMPLIANT':dossierDisposition===2?'NEUTRAL':dossierDisposition===1?'HOSTILE':'UNREASONABLE'}
        </div>
        <div className="w-full max-w-md space-y-4 pb-8">
          {!guessedMotivation ? (
            <div className="space-y-2">
              <h3 className="text-emerald-300 font-bold border-b border-emerald-900 pb-1">MOTIVATION ACTIONS</h3>
              {[['money','Offer a Bribe'],['fame','Promise Exposure & Glory'],['altruism','Appeal to the Greater Good'],['obedience','Invoke Corporate Authority']].map(([v,l]) => (
                <button key={v} onClick={() => socket.emit('player:dossier_action', { roomCode: character.room_code, deviceToken: getDeviceToken(), actionType:'motivation', actionValue:v })} className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded text-left border border-slate-700 transition-colors">{l}</button>
              ))}
            </div>
          ) : <div className="text-emerald-500 font-bold p-4 bg-emerald-950/50 rounded border border-emerald-900 text-center animate-pulse">MOTIVATION LEVERAGED</div>}

          {!guessedFear ? (
            <div className="space-y-2 mt-4">
              <h3 className="text-emerald-300 font-bold border-b border-emerald-900 pb-1">FEAR ACTIONS</h3>
              {[['violence','Threaten Physical Harm'],['ostracism','Threaten Social Exile'],['exposure','Blackmail with Secrets'],['poverty','Threaten Financial Ruin']].map(([v,l]) => (
                <button key={v} onClick={() => socket.emit('player:dossier_action', { roomCode: character.room_code, deviceToken: getDeviceToken(), actionType:'fear', actionValue:v })} className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded text-left border border-slate-700 transition-colors">{l}</button>
              ))}
            </div>
          ) : <div className="text-emerald-500 font-bold p-4 bg-emerald-950/50 rounded border border-emerald-900 text-center animate-pulse">FEAR LEVERAGED</div>}
        </div>
      </div>
    );
  }

  // Idle — character sheet
  return (
    <div className="flex flex-col items-center p-6 min-h-screen">
      <style>{`
        @keyframes player-sheet-glitch { 0%,100%{transform:translateX(0) scale(1);filter:hue-rotate(0deg) brightness(1)} 20%{transform:translateX(-3px) scale(1.01) skewX(-1deg);filter:hue-rotate(20deg) brightness(1.05)} 40%{transform:translateX(3px) scale(.99) skewX(1deg);filter:hue-rotate(-20deg) brightness(.95)} 60%{transform:translateX(-2px) scale(1.005);filter:hue-rotate(15deg) brightness(1.02)} 80%{transform:translateX(2px) scale(.995);filter:hue-rotate(-10deg) brightness(.98)} }
        @keyframes player-sheet-heal  { 0%,100%{transform:scale(1);box-shadow:0 0 0 rgba(16,185,129,0)} 35%{transform:scale(1.015);box-shadow:0 0 20px rgba(74,222,128,0.6)} }
      `}</style>
      <div
        className={`w-full max-w-md border-b-2 pb-4 mb-6 transition-all ${healthEffect?.kind==='wound'?'border-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.4)]':healthEffect?.kind==='heal'?'border-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.4)]':'border-fuchsia-500'}`}
        style={{ animation: healthEffect?.kind==='wound'?'player-sheet-glitch 0.35s ease-in-out':healthEffect?.kind==='heal'?'player-sheet-heal 0.45s ease-in-out':undefined }}
      >
        <h1 className="text-3xl font-bold">{character?.name}</h1>
        <div className="mt-2 text-sm text-amber-200">BACKGROUND: {character?.background||'Unassigned'}</div>
        <div className="flex justify-between mt-2 text-sm text-fuchsia-300 mb-4">
          <span>SYS INTEGRITY: {character?.health}/3</span>
          <span>CREDITS: ฿{character?.credits}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs text-center">
          {(['MEAT','MIND','MOXIE'] as const).map(s => (
            <div key={s} className="bg-slate-900 p-2 rounded border border-slate-700">
              <div className="text-slate-400">{s}</div>
              <div className="font-bold text-lg text-white">{character?.[s.toLowerCase()]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-md flex-1 flex flex-col justify-center items-center">
        {roomState === 'lobby'    && <p className="text-center opacity-50">AWAITING GM INSTRUCTION...</p>}
        {roomState === 'combat'   && <div className="animate-pulse text-red-500 font-bold text-2xl border-2 border-red-500 p-8 rounded text-center w-full">COMBAT PROTOCOL ACTIVE<br />STANDBY FOR FLASH-DRAW</div>}
        {roomState === 'overdrive'&& <div className="animate-bounce text-fuchsia-500 font-bold text-2xl border-2 border-fuchsia-500 p-8 rounded text-center w-full bg-fuchsia-500/10">SYSTEM OVERDRIVE<br />PREPARE FOR INJECTION</div>}
        {dossierClues.length > 0 && flashDrawState === 'idle' && (
          <div className="animate-pulse text-emerald-400 font-bold border-2 border-emerald-500 p-6 rounded text-left w-full bg-emerald-950/30 mt-4 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <h3 className="text-emerald-500 border-b border-emerald-900 pb-2 mb-4 tracking-widest">INTERCEPTED INTEL<br /><span className="text-xs text-white">SHOUT THIS TO YOUR CREW!</span></h3>
            <ul className="list-disc pl-4 space-y-3 text-sm text-emerald-200 font-mono">
              {dossierClues.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

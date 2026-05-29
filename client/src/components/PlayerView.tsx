import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../socket';
import { MINIGAME_REGISTRY, computeSetup, SKILL_NAMES, ATTRIBUTE_GROUPS } from '../minigames';
import type { MinigameSetup, DegreeOfSuccess, GlitchType, SkillName } from '../minigames';
import GlitchLayer from './GlitchLayer';
import ConsequencePicker, { type Position, type Effect } from './ConsequencePicker';
import { HealthBar, StressBar } from './StatBars';

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

// ─── Background data ──────────────────────────────────────────────────────────

const BACKGROUNDS: Array<{
  id: string; label: string; description: string;
  bonus: Partial<Record<SkillName, number>>;
}> = [
  { id: 'street-fixer',    label: 'Street Fixer',     description: 'A veteran of the undercity who survives by reading people and adapting fast.',                     bonus: { deceive: 2, sway: 1 } },
  { id: 'tunnel-rat',      label: 'Tunnel Rat',        description: 'A survivor of maintenance ducts and forgotten routes. Moves unseen and hears everything.',          bonus: { skulk: 2, attune: 1 } },
  { id: 'ghost-runner',    label: 'Ghost Runner',     description: 'A stealth-first operator built for silent movement, evasion, and quick exits.',                    bonus: { hustle: 2, rig: 1 } },
  { id: 'bio-hacker',      label: 'Bio-Hacker',       description: 'Tuned into body and machine limits, this operative thrives in risky augmentations.',               bonus: { doctor: 2, study: 1 } },
  { id: 'grizzled-veteran',label: 'Grizzled Veteran', description: 'Scarred by past wars and trusted under pressure when calm is thin.',                               bonus: { fight: 2, command: 1 } },
  { id: 'signal-weaver',   label: 'Signal Weaver',    description: 'A master of distractions, drones, and social noise that bends attention.',                        bonus: { hack: 2, pilot: 1 } },
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
  const [createBackground, setCreateBackground] = useState('');
  const [freePips, setFreePips]         = useState<Partial<Record<SkillName, number>>>({});

  // Active mini-game
  const [activeSetup, setActiveSetup]   = useState<MinigameSetup | null>(null);
  const [activePosition, setActivePosition] = useState<Position>('risky');
  const [activeEffect, setActiveEffect]     = useState<Effect>('standard');
  // Glitches accumulate per scene from consequences/conditions.
  // Cleared at scene end (GM control) or via specific abilities.
  const [activeGlitches, setActiveGlitches] = useState<GlitchType[]>([]);
  // Pending consequence selection — shown after a mini-game resolves
  const [pendingConsequence, setPendingConsequence] = useState<{
    degree: DegreeOfSuccess;
    position: Position;
    effect: Effect;
  } | null>(null);
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

  const handleConsequenceSubmit = (choices: string[]) => {
    if (!character) return;
    socket.emit('player:consequence_selected', {
      roomCode: character.room_code,
      deviceToken: getDeviceToken(),
      choices,
      degreeOfSuccess: pendingConsequence?.degree,
    });
    setPendingConsequence(null);
  };

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
      setActivePosition((d.position as Position) || 'risky');
      setActiveEffect((d.effect as Effect) || 'standard');
    });

    socket.on('room:minigame_started', d => {
      if (d.targetDeviceToken !== getDeviceToken()) return;
      setWarningType(null);
      setActivePosition((d.position as Position) || 'risky');
      setActiveEffect((d.effect as Effect) || 'standard');
      const pipRating: number = character ? (character[`skill_${d.skillName}`] ?? 1) : 1;
      const setup = computeSetup(
        d.minigameType,
        pipRating,
        d.modifier || null,
        d.difficultyTier || 'medium'
      );
      setActiveSetup(setup);
    });

    socket.on('room:minigame_result', d => {
      setActiveSetup(null);
      setActiveDossier(false);
      setDossierClues([]);
      setWarningType(null);
      // Show consequence picker for the target player
      if (d.deviceToken === getDeviceToken()) {
        setPendingConsequence({
          degree:   d.degreeOfSuccess as DegreeOfSuccess,
          position: (d.position as Position) || activePosition,
          effect:   (d.effect as Effect)     || activeEffect,
        });
      }
    });

    socket.on('room:consequence_override', d => {
      if (!d.deviceToken || d.deviceToken === getDeviceToken()) {
        setPendingConsequence(null);
      }
    });

    socket.on('room:glitch_applied', (d: { glitch: GlitchType }) => {
      setActiveGlitches(prev => [...prev, d.glitch]);
    });

    socket.on('room:glitches_cleared', () => {
      setActiveGlitches([]);
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
       'room:dossier_started','room:dossier_update',
       'room:glitch_applied','room:glitches_cleared','room:consequence_override'].forEach(e => socket.off(e));
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
    const bgObj = BACKGROUNDS.find(b => b.id === createBackground);
    if (!bgObj) { alert('Choose a background first.'); return; }
    const skillPayload: Record<string, number> = {};
    for (const s of SKILL_NAMES) {
      skillPayload[`skill_${s}`] = (bgObj.bonus[s] ?? 0) + (freePips[s] ?? 0);
    }
    socket.emit('player:create_profile', {
      deviceToken: getDeviceToken(), name: createName || 'Unnamed',
      background: bgObj.label, health: 3, max_health: 3,
      credits: 0, gear: '[]', status_effects: '[]', notes: '',
      stress: 8, max_stress: 8,
      ...skillPayload,
    }, (res: any) => {
      if (res.success) {
        fetchProfiles();
        setSelectedProfileId(res.id || null);
        setShowProfiles(true);
        setShowCreate(false);
        setName(res.profile.name || '');
        setCreateName('');
        setCreateBackground('');
        setFreePips({});
      } else alert(res.message || 'Failed to create profile');
    });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const token = getDeviceToken();
    const bgObj = BACKGROUNDS.find(b => b.id === createBackground);
    const payload: any = { roomCode, deviceToken: token, background: bgObj?.label || '' };
    if (selectedProfileId) {
      payload.profileId = selectedProfileId;
    } else {
      const skillPayload: Record<string, number> = {};
      for (const s of SKILL_NAMES) {
        skillPayload[`skill_${s}`] = (bgObj?.bonus[s] ?? 0) + (freePips[s] ?? 0);
      }
      payload.name = name;
      payload.skills = skillPayload;
    }
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

            {showCreate && (() => {
              const bgObj = BACKGROUNDS.find(b => b.id === createBackground);
              const freeAllocated = (Object.values(freePips) as number[]).reduce((s, v) => s + v, 0);
              const freeRemaining = 4 - freeAllocated;
              const canCreate = !!createName && !!createBackground && freeRemaining === 0;
              return (
                <div className="mt-4 mb-4 p-4 bg-slate-900 rounded border border-slate-700 space-y-4">
                  <h3 className="font-bold text-fuchsia-300">Create New Character</h3>

                  {/* Name */}
                  <input value={createName} onChange={e=>setCreateName(e.target.value)} placeholder="Character Name" className="w-full p-2 bg-slate-800 rounded border border-slate-600 text-white" />

                  {/* Step 1: Background */}
                  <div>
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">Step 1 — Choose Background</div>
                    {BACKGROUNDS.map(bg => {
                      const bonusSkills = Object.entries(bg.bonus) as [SkillName, number][];
                      return (
                        <label key={bg.id} className={`block p-2 rounded border cursor-pointer transition-all mb-1 ${createBackground===bg.id?'border-amber-500 bg-amber-500/10':'border-slate-700 bg-slate-900 hover:border-slate-500'}`}>
                          <input type="radio" name="background" value={bg.id} checked={createBackground===bg.id}
                            onChange={() => { setCreateBackground(bg.id); setFreePips({}); }} className="hidden" />
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-300">{bg.label}</span>
                            <span className="text-[10px] font-mono text-amber-200/70">
                              {bonusSkills.map(([s, n]) => `+${n} ${s.toUpperCase()}`).join(' · ')}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">{bg.description}</div>
                        </label>
                      );
                    })}
                  </div>

                  {/* Step 2: Pip allocation (only after background chosen) */}
                  {bgObj && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Step 2 — Distribute 4 Pips</div>
                        <span className={`text-xs font-bold ${freeRemaining===0?'text-emerald-400':'text-amber-300'}`}>
                          {freeRemaining > 0 ? `${freeRemaining} remaining` : 'All pips placed ✓'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mb-3">Max 2 pips per skill at creation. Background pips count toward the cap.</div>
                      {ATTRIBUTE_GROUPS.map(group => (
                        <div key={group.label} className="mb-3">
                          <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${group.color}`}>{group.label}</div>
                          {group.skills.map(skill => {
                            const bgPips    = bgObj.bonus[skill] ?? 0;
                            const free      = freePips[skill] ?? 0;
                            const total     = bgPips + free;
                            const canAdd    = freeRemaining > 0 && total < 2;
                            const canRemove = free > 0;
                            return (
                              <div key={skill} className="flex items-center justify-between py-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-300 uppercase w-16">{skill}</span>
                                  <div className="flex gap-0.5">
                                    {[0,1,2].map(i => (
                                      <div key={i} className={`w-3 h-3 rounded-sm ${i < total ? 'bg-fuchsia-500' : 'bg-slate-700'}`} />
                                    ))}
                                  </div>
                                  {bgPips > 0 && <span className="text-[9px] text-amber-400/70">(+{bgPips} bg)</span>}
                                </div>
                                <div className="flex gap-1">
                                  <button type="button"
                                    onClick={() => setFreePips(p => ({ ...p, [skill]: Math.max(0, (p[skill]??0)-1) }))}
                                    disabled={!canRemove}
                                    className="w-5 h-5 text-xs rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">−</button>
                                  <button type="button"
                                    onClick={() => setFreePips(p => ({ ...p, [skill]: (p[skill]??0)+1 }))}
                                    disabled={!canAdd}
                                    className="w-5 h-5 text-xs rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-right pt-1">
                    <button type="button" onClick={handleCreateProfile} disabled={!canCreate}
                      className="px-4 py-2 bg-fuchsia-600 rounded text-white disabled:opacity-40 disabled:cursor-not-allowed">
                      Create
                    </button>
                  </div>
                </div>
              );
            })()}

            {showProfiles && (
              <div className="mb-2 p-3 bg-slate-900 rounded border">
                {profiles.length === 0 && <div className="text-sm italic">No saved characters found.</div>}
                {profiles.map(p => (
                  <div key={p.id} className={`flex items-center justify-between p-2 rounded hover:bg-slate-800 ${selectedProfileId===p.id?'ring-2 ring-fuchsia-500':''}`}>
                    <div>
                      <div className="font-bold">{p.name||'Unnamed'}</div>
                      <div className="text-xs text-amber-300 mt-0.5">{p.background||'No background'}</div>
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

  // Consequence picker — shown after a mini-game result, before returning to idle
  if (pendingConsequence) {
    return (
      <ConsequencePicker
        degree={pendingConsequence.degree}
        position={pendingConsequence.position}
        effect={pendingConsequence.effect}
        onSubmit={handleConsequenceSubmit}
      />
    );
  }

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
        <div className="flex gap-3 mt-8">
          <div className={`px-4 py-1.5 rounded-full border text-sm font-black uppercase tracking-widest ${activePosition==='controlled'?'border-green-500 bg-green-950/80 text-green-300':activePosition==='desperate'?'border-red-500 bg-red-950/80 text-red-300':'border-amber-500 bg-amber-950/80 text-amber-300'}`}>
            {activePosition.toUpperCase()}
          </div>
          <div className={`px-4 py-1.5 rounded-full border text-sm font-black uppercase tracking-widest ${activeEffect==='great'?'border-purple-500 bg-purple-950/80 text-purple-300':activeEffect==='limited'?'border-slate-500 bg-slate-800 text-slate-300':'border-cyan-500 bg-cyan-950/80 text-cyan-300'}`}>
            {activeEffect.toUpperCase()} EFFECT
          </div>
        </div>
        {warningModifier && (
          <div className="mt-6 max-w-2xl rounded border border-white/20 bg-black/50 px-6 py-4 text-center backdrop-blur">
            <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">DIFFICULTY · {warningDifficulty?.toUpperCase()||'STANDARD'}</div>
            <div className="mt-2 text-2xl font-bold text-white">{warningModifier.label}</div>
            <div className="mt-1 text-sm text-slate-200">{warningModifier.description}</div>
          </div>
        )}
      </div>
    );
  }

  // Active mini-game — wrapped in GlitchLayer so stacked glitches fire independently
  if (activeSetup) {
    const Component = MINIGAME_REGISTRY[activeSetup.type];
    if (Component) {
      return (
        <GlitchLayer glitches={activeGlitches}>
          <Component
            setup={activeSetup}
            onComplete={handleMinigameComplete}
            roomCode={character?.room_code || roomCode}
            deviceToken={getDeviceToken()}
          />
        </GlitchLayer>
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
        <div className="mt-2 mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-fuchsia-300 shrink-0">HEALTH</span>
              <HealthBar health={character?.health ?? 0} maxHealth={character?.max_health ?? 3} />
            </div>
            <span className="text-sm text-fuchsia-300 shrink-0">฿{character?.credits}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-fuchsia-300 shrink-0 w-[7.5rem]">STRESS</span>
            <StressBar stress={character?.stress ?? 8} maxStress={character?.max_stress ?? 8} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          {ATTRIBUTE_GROUPS.map(group => (
            <div key={group.label} className="bg-slate-900 rounded border border-slate-700 p-1.5">
              <div className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 text-center ${group.color}`}>{group.label}</div>
              {group.skills.map(skill => (
                <div key={skill} className="flex justify-between items-center py-0.5">
                  <span className="text-[10px] text-slate-400 uppercase">{skill.slice(0,3)}</span>
                  <span className={`text-[11px] font-bold ${(character?.[`skill_${skill}`]??1)===0?'text-slate-600':(character?.[`skill_${skill}`]??1)>=2?'text-fuchsia-300':'text-white'}`}>
                    {character?.[`skill_${skill}`] ?? 1}
                  </span>
                </div>
              ))}
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

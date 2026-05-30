import React, { useEffect, useState } from 'react';
import { socket } from '../socket';
import { MINIGAME_META, ATTRIBUTE_GROUPS } from '../minigames';
import { ClockGMCard, type Clock } from './ClockDisplay';
import type { GlitchType } from '../minigames/types';
import { HealthBar, StressBar } from './StatBars';

// Mini-games grouped by attribute for the GM panel
const MINIGAME_GROUPS: Array<{ label: string; types: string[] }> = [
  { label: 'TOUGHNESS — PHYSICAL', types: ['deflect', 'slash', 'thread', 'lock', 'chain'] },
  { label: 'INSIGHT — TECH',       types: ['overload', 'scan', 'jam', 'doctor'] },
  { label: 'RESOLVE — SOCIAL',     types: ['bluff', 'surveillance'] },
];

type Position = 'controlled' | 'risky' | 'desperate';
type Effect   = 'limited'    | 'standard' | 'great';

const GLITCH_OPTIONS: Array<{ id: GlitchType; label: string }> = [
  { id: 'static_burst',  label: 'Static Burst'  },
  { id: 'mirror',        label: 'Mirror'         },
  { id: 'screen_tear',   label: 'Screen Tear'    },
  { id: 'noise',         label: 'Noise'          },
  { id: 'clock_drift',   label: 'Clock Drift'    },
  { id: 'signal_bleed',  label: 'Signal Bleed'   },
  { id: 'frame_drop',    label: 'Frame Drop'     },
  { id: 'zone_shift',    label: 'Zone Shift'     },
  { id: 'input_lag',     label: 'Input Lag'      },
  { id: 'blackout',      label: 'Blackout'       },
];

const CLOCK_TYPES: Clock['type'][] = ['threat', 'project', 'scene'];
const CLOCK_SIZES = [4, 6, 8];

export default function GMView() {
  const [roomCode, setRoomCode]     = useState('');
  const [joined, setJoined]         = useState(false);
  const [characters, setCharacters] = useState<any[]>([]);
  const [roomState, setRoomState]   = useState('lobby');
  const [gmMessage, setGmMessage]   = useState<{text:string;type:'error'|'info'}|null>(null);
  const [flashDrawState, setFlashDrawState] = useState<'idle'|'prepare'|'go'|'results'>('idle');
  const [combatState, setCombatState] = useState<{queue:any[];activeIndex:number}|null>(null);
  const [dossierSetup, setDossierSetup] = useState<Record<string,{disposition:string;motivation:string;fear:string}>>({});

  // ── New: Position, Effect, Difficulty ─────────────────────────────────────
  const [selectedPosition, setSelectedPosition] = useState<Position>('risky');
  const [selectedEffect, setSelectedEffect]     = useState<Effect>('standard');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy'|'medium'|'hard'>('medium');

  // ── Clocks ─────────────────────────────────────────────────────────────────
  const [clocks, setClocks]         = useState<Clock[]>([]);
  const [newClockName, setNewClockName]   = useState('');
  const [newClockType, setNewClockType]   = useState<Clock['type']>('threat');
  const [newClockSize, setNewClockSize]   = useState(6);
  const [showClockForm, setShowClockForm] = useState(false);

  // ── Consequence feed ───────────────────────────────────────────────────────
  const [consequenceFeed, setConsequenceFeed] = useState<Array<{name:string;choices:string[];degree:string}>>([]);

  const showError = (msg: string) => { setGmMessage({text:msg,type:'error'}); setTimeout(()=>setGmMessage(null),4000); };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    socket.emit('gm:join_room', { roomCode }, (res: any) => {
      if (res.success) {
        setJoined(true);
        setCharacters(res.characters);
        setRoomState(res.roomState);
        // Load clocks for this room
        socket.emit('player:request_clock_data', { roomCode }, (r: any) => {
          if (r?.success) setClocks(r.clocks || []);
        });
      } else alert(res.message);
    });
  };

  useEffect(() => {
    if (!joined) return;
    socket.on('room:state_update',        d => { setCharacters(d.characters); setRoomState(d.roomState); });
    socket.on('room:flash_draw_prepare',  () => setFlashDrawState('prepare'));
    socket.on('room:flash_draw_go',       () => setFlashDrawState('go'));
    socket.on('room:flash_draw_results',  () => setFlashDrawState('results'));
    socket.on('room:flash_draw_complete', () => setFlashDrawState('idle'));
    socket.on('room:combat_queue_update', d  => setCombatState(d));
    socket.on('room:clocks_update',       d  => setClocks(d.clocks || []));
    socket.on('room:consequence_selected', d => {
      const char = characters.find(c => c.device_token === d.deviceToken);
      setConsequenceFeed(prev => [
        { name: char?.name || 'Unknown', choices: d.choices, degree: d.degreeOfSuccess },
        ...prev,
      ].slice(0, 5));
      if (d.clockAdvanceError) showError('Threat clock advance failed — no auto-advance clocks available.');
    });
    return () => {
      ['room:state_update','room:flash_draw_prepare','room:flash_draw_go','room:flash_draw_results',
       'room:flash_draw_complete','room:combat_queue_update','room:clocks_update',
       'room:consequence_selected'].forEach(e => socket.off(e));
    };
  }, [joined, characters]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const triggerMinigame = (type: string, deviceToken: string) => {
    socket.emit('gm:start_minigame', {
      roomCode,
      targetDeviceToken: deviceToken,
      minigameType:    type,
      difficultyTier:  selectedDifficulty,
      position:        selectedPosition,
      effect:          selectedEffect,
    }, (res: any) => {
      if (!res?.success) showError(res?.message || 'Failed to start minigame');
    });
  };

  const setHealth = (deviceToken: string, newHealth: number) => {
    socket.emit('gm:set_player_health', { roomCode, deviceToken, newHealth }, (res: any) => {
      if (!res?.success) showError(res?.message || 'Failed to set HP');
    });
  };

  const setStress = (deviceToken: string, newStress: number) => {
    socket.emit('gm:set_player_stress', { roomCode, deviceToken, newStress }, (res: any) => {
      if (!res?.success) showError(res?.message || 'Failed to set Stress');
    });
  };

  const setAutoLose = (deviceToken: string, enabled: boolean) => {
    socket.emit('gm:set_auto_lose', { roomCode, deviceToken, enabled }, (res: any) => {
      if (!res?.success) showError(res?.message || 'Failed to set auto-lose');
    });
  };

  const setAutoLoseStress = (deviceToken: string, enabled: boolean) => {
    socket.emit('gm:set_auto_lose_stress', { roomCode, deviceToken, enabled }, (res: any) => {
      if (!res?.success) showError(res?.message || 'Failed to set auto-lose stress');
    });
  };

  const applyGlitch = (deviceToken: string, glitch: GlitchType) => {
    socket.emit('gm:apply_glitch', { roomCode, deviceToken, glitch }, (res: any) => {
      if (!res?.success) showError('Failed to apply glitch');
    });
  };

  const clearGlitches = (deviceToken: string) => {
    socket.emit('gm:clear_glitches', { roomCode, deviceToken });
  };

  const createClock = () => {
    if (!newClockName.trim()) return;
    socket.emit('gm:create_clock', { roomCode, name: newClockName.trim(), type: newClockType, segments: newClockSize, visible: true });
    setNewClockName('');
    setShowClockForm(false);
  };

  const advanceClock = (id: number, amount = 1) => socket.emit('gm:advance_clock', { roomCode, clockId: id, amount });
  const removeClock  = (id: number)             => socket.emit('gm:remove_clock',  { roomCode, clockId: id });
  const toggleClock  = (id: number)             => socket.emit('gm:toggle_clock_visibility', { roomCode, clockId: id });

  const setClockAutoAdvance = (id: number, enabled: boolean) => {
    socket.emit('gm:set_clock_auto_advance', { roomCode, clockId: id, enabled });
  };

  const overrideConsequence = (deviceToken: string) => {
    socket.emit('gm:override_consequence', { roomCode, deviceToken });
  };

  // ── Login screen ───────────────────────────────────────────────────────────

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <form onSubmit={handleJoin} className="bg-slate-800 p-8 rounded-lg w-full max-w-md border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <h2 className="text-2xl font-bold mb-6 text-amber-500">MASTER CONTROL LOGIN</h2>
          <div>
            <label className="block text-xs text-slate-400 mb-1">TARGET ROOM</label>
            <input type="text" value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} maxLength={4} required className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white text-xl tracking-widest uppercase focus:border-amber-500 focus:outline-none" />
          </div>
          <button type="submit" className="w-full mt-8 bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded transition-colors">OVERRIDE PROTOCOL</button>
        </form>
      </div>
    );
  }

  // ── Main GM view ──────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen p-4 gap-4">

      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-amber-500 pb-4">
        <div>
          <h1 className="text-2xl font-black text-amber-500">MASTER DECK // {roomCode}</h1>
          <p className="text-sm text-slate-400">Phase: <span className="text-white font-bold">{roomState.toUpperCase()}</span></p>
        </div>
        <div className="flex gap-2">
          {(['lobby','combat','overdrive'] as const).map(s => (
            <button key={s} onClick={() => socket.emit('gm:set_state', { roomCode, newState: s })}
              className={`px-3 py-2 rounded font-bold text-sm ${roomState===s?(s==='combat'?'bg-red-600':s==='overdrive'?'bg-fuchsia-600':'bg-amber-600'):'bg-slate-700 hover:bg-slate-600'}`}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {gmMessage && <div className={`p-3 rounded ${gmMessage.type==='error'?'bg-red-800':'bg-slate-800'} text-white`}>{gmMessage.text}</div>}

      {/* Initiative (combat only) */}
      {roomState === 'combat' && (
        <div className="p-4 bg-red-950/50 border border-red-900 rounded-lg flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-red-500">INITIATIVE</h2>
            {!combatState && flashDrawState === 'idle' && (
              <button onClick={() => socket.emit('gm:start_flash_draw', { roomCode }, (res:any) => { if (!res?.success) showError('Failed'); })}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded animate-pulse text-sm">FLASH DRAW</button>
            )}
            {flashDrawState === 'results' && (
              <button onClick={() => socket.emit('gm:confirm_initiative', { roomCode })}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded animate-pulse text-sm">APPROVE</button>
            )}
            {flashDrawState !== 'idle' && flashDrawState !== 'results' && <div className="text-red-500 font-bold animate-pulse text-sm">AWAITING...</div>}
          </div>
          {combatState && combatState.queue.length > 0 && (
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {combatState.queue.map((e, i) => (
                  <div key={i} className={`px-3 py-1 rounded text-sm font-bold ${i===combatState.activeIndex?'bg-red-600 text-white':'bg-slate-800 text-slate-400'}`}>{i+1}. {e.name}</div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => socket.emit('gm:next_turn', { roomCode })} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 font-bold rounded text-sm">NEXT TURN</button>
                <button onClick={() => socket.emit('gm:clear_initiative', { roomCode })} className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-500 font-bold rounded text-sm border border-red-900">CLEAR</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Action Setup: Position + Effect + Difficulty ── */}
      <div className="bg-slate-900 border border-cyan-900 rounded-lg p-4 space-y-4">
        <div className="text-cyan-300 text-xs font-bold uppercase tracking-[0.3em]">ACTION SETUP</div>

        {/* Position */}
        <div>
          <div className="text-xs text-slate-400 mb-2 uppercase tracking-widest">Position (consequence severity)</div>
          <div className="inline-flex rounded-full bg-slate-800 p-1 gap-1">
            {([
              { id: 'controlled', label: 'Controlled', active: 'bg-green-700 text-white', hint: 'Mild consequences' },
              { id: 'risky',      label: 'Risky',      active: 'bg-amber-700 text-white', hint: 'Standard consequences' },
              { id: 'desperate',  label: 'Desperate',  active: 'bg-red-700 text-white',   hint: 'Severe consequences' },
            ] as const).map(p => (
              <button key={p.id} onClick={() => setSelectedPosition(p.id)}
                title={p.hint}
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors ${selectedPosition===p.id ? p.active : 'text-slate-300 hover:bg-slate-700'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Effect */}
        <div>
          <div className="text-xs text-slate-400 mb-2 uppercase tracking-widest">Effect (what success accomplishes)</div>
          <div className="inline-flex rounded-full bg-slate-800 p-1 gap-1">
            {([
              { id: 'limited',  label: 'Limited',  active: 'bg-slate-600 text-white', hint: 'Partial progress' },
              { id: 'standard', label: 'Standard', active: 'bg-cyan-700 text-white',  hint: 'Full progress'    },
              { id: 'great',    label: 'Great',    active: 'bg-purple-700 text-white', hint: 'Extra progress'  },
            ] as const).map(e => (
              <button key={e.id} onClick={() => setSelectedEffect(e.id)}
                title={e.hint}
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors ${selectedEffect===e.id ? e.active : 'text-slate-300 hover:bg-slate-700'}`}>
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty modifier */}
        <div>
          <div className="text-xs text-slate-400 mb-2 uppercase tracking-widest">Modifier roll</div>
          <div className="inline-flex rounded-full bg-slate-800 p-1 gap-1">
            {(['easy','medium','hard'] as const).map(t => (
              <button key={t} onClick={() => setSelectedDifficulty(t)}
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors ${selectedDifficulty===t?'bg-cyan-600 text-white':'text-slate-300 hover:bg-slate-700'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Clocks ── */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="text-white font-bold uppercase tracking-widest text-sm">CLOCKS</div>
          <button onClick={() => setShowClockForm(s => !s)}
            className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded font-bold text-white">
            {showClockForm ? 'CANCEL' : '+ NEW CLOCK'}
          </button>
        </div>

        {showClockForm && (
          <div className="flex flex-col gap-2 mb-4 p-3 bg-slate-800 rounded-lg">
            <input value={newClockName} onChange={e => setNewClockName(e.target.value)}
              placeholder="Clock name (e.g. Security Response)"
              className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm" />
            <div className="flex gap-2">
              <select value={newClockType} onChange={e => setNewClockType(e.target.value as Clock['type'])}
                className="flex-1 bg-slate-900 border border-slate-600 text-white p-2 rounded text-sm">
                {CLOCK_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
              <select value={newClockSize} onChange={e => setNewClockSize(Number(e.target.value))}
                className="bg-slate-900 border border-slate-600 text-white p-2 rounded text-sm">
                {CLOCK_SIZES.map(s => <option key={s} value={s}>{s} segments</option>)}
              </select>
            </div>
            <button onClick={createClock} className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2 rounded text-sm">CREATE</button>
          </div>
        )}

        {clocks.length === 0 && !showClockForm && (
          <p className="text-slate-500 italic text-sm">No active clocks.</p>
        )}
        <div className="space-y-2">
          {clocks.map(c => (
            <ClockGMCard key={c.id} clock={c}
              onAdvance={id => advanceClock(id, 1)}
              onReduce={id  => advanceClock(id, -1)}
              onRemove={removeClock}
              onToggle={toggleClock}
              onToggleAutoAdvance={setClockAutoAdvance}
            />
          ))}
        </div>
      </div>

      {/* ── Consequence feed ── */}
      {consequenceFeed.length > 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="text-white font-bold uppercase tracking-widest text-sm mb-3">RECENT CONSEQUENCES</div>
          <div className="space-y-2">
            {consequenceFeed.map((entry, i) => (
              <div key={i} className="text-sm bg-slate-800 rounded p-2">
                <span className="font-bold text-white">{entry.name}</span>
                <span className="text-slate-400"> · {entry.degree.replace('_',' ').toUpperCase()}</span>
                <div className="text-slate-300 text-xs mt-1">{entry.choices.join(', ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Character cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map((c, i) => {
          const ds = dossierSetup[c.device_token] || { disposition: '2', motivation: 'money', fear: 'violence' };
          const setDs = (patch: Partial<typeof ds>) => setDossierSetup(s => ({ ...s, [c.device_token]: { ...ds, ...patch } }));
          return (
            <div key={i} className={`bg-slate-800 p-4 rounded-lg border border-slate-700 ${c.is_online===0?'opacity-40 grayscale':''}`}>
              {/* Name + credits */}
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-white">{c.name}</h3>
                <span className="text-sm text-yellow-400 shrink-0 ml-2">฿{c.credits}</span>
              </div>

              {/* Health bar + controls */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-green-400 uppercase tracking-widest font-bold">HEALTH</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setHealth(c.device_token, Math.max(0, Number(c.health||0)-1))}
                      className="w-6 h-6 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm leading-none"
                      disabled={c.is_online === 0}>−</button>
                    <button onClick={() => setHealth(c.device_token, Math.min(c.max_health||3, Number(c.health||0)+1))}
                      className="w-6 h-6 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm leading-none"
                      disabled={c.is_online === 0}>+</button>
                    <label className="flex items-center gap-0.5 ml-1 cursor-pointer text-slate-400">
                      <input type="checkbox" checked={Number(c.auto_lose_on_fail)===1} onChange={e => setAutoLose(c.device_token, e.target.checked)} className="w-3 h-3" />
                      <span className="text-[9px] uppercase">auto</span>
                    </label>
                  </div>
                </div>
                <HealthBar health={c.health ?? 0} maxHealth={c.max_health ?? 3} />
              </div>

              {/* Stress bar + controls */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-yellow-400 uppercase tracking-widest font-bold">STRESS</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setStress(c.device_token, Math.max(0, Number(c.stress??8)-1))}
                      className="w-6 h-6 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm leading-none"
                      disabled={c.is_online === 0}>−</button>
                    <button onClick={() => setStress(c.device_token, Math.min(c.max_stress??8, Number(c.stress??8)+1))}
                      className="w-6 h-6 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm leading-none"
                      disabled={c.is_online === 0}>+</button>
                    <label className="flex items-center gap-0.5 ml-1 cursor-pointer text-slate-400">
                      <input type="checkbox" checked={Number(c.auto_lose_stress_on_fail)===1} onChange={e => setAutoLoseStress(c.device_token, e.target.checked)} className="w-3 h-3" />
                      <span className="text-[9px] uppercase">auto</span>
                    </label>
                  </div>
                </div>
                <StressBar stress={c.stress ?? 8} maxStress={c.max_stress ?? 8} />
              </div>

              {/* Skills by attribute */}
              <div className="grid grid-cols-3 gap-1 text-xs mb-3">
                {ATTRIBUTE_GROUPS.map(group => (
                  <div key={group.label} className="bg-slate-900 rounded p-1">
                    <div className={`text-[8px] font-bold uppercase tracking-widest text-center mb-1 ${group.color}`}>{group.label.slice(0,3)}</div>
                    {group.skills.map(skill => (
                      <div key={skill} className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-400 uppercase">{skill.slice(0,3)}</span>
                        <span className={`text-[10px] font-bold ${(c[`skill_${skill}`]??1)===0?'text-slate-600':(c[`skill_${skill}`]??1)>=2?'text-fuchsia-300':'text-white'}`}>
                          {c[`skill_${skill}`] ?? 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Minigame buttons */}
              <div className="space-y-2 border-t border-slate-700 pt-3">
                {MINIGAME_GROUPS.map(group => (
                  <div key={group.label}>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{group.label}</div>
                    <div className="grid grid-cols-2 gap-1">
                      {group.types.map(type => {
                        const meta = MINIGAME_META[type];
                        return (
                          <button key={type}
                            onClick={() => triggerMinigame(type, c.device_token)}
                            className={`${meta.color} text-white font-bold py-1.5 rounded text-xs transition-colors`}
                            disabled={c.is_online === 0}>
                            {meta.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Dossier */}
                <div className="border-t border-slate-600 pt-2 mt-1">
                  <div className="text-[10px] text-emerald-600 uppercase tracking-widest mb-1">DOSSIER (RESOLVE)</div>
                  <div className="grid grid-cols-3 gap-1 mb-1">
                    {[
                      { label:'Pos', value: ds.disposition, onChange: (v:string) => setDs({disposition:v}),
                        opts: [['4','Obedient'],['3','Compliant'],['2','Neutral'],['1','Hostile'],['0','Unreasonable']] },
                      { label:'Mot', value: ds.motivation, onChange: (v:string) => setDs({motivation:v}),
                        opts: [['money','Money'],['fame','Fame'],['altruism','Altruism'],['obedience','Obedience']] },
                      { label:'Fear',value: ds.fear, onChange: (v:string) => setDs({fear:v}),
                        opts: [['violence','Violence'],['ostracism','Ostracism'],['exposure','Exposure'],['poverty','Poverty']] },
                    ].map(sel => (
                      <select key={sel.label} value={sel.value} onChange={e => sel.onChange(e.target.value)}
                        className="bg-slate-900 border border-slate-600 text-white p-1 rounded text-xs w-full">
                        {sel.opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    ))}
                  </div>
                  <button
                    onClick={() => socket.emit('gm:start_dossier', { roomCode, targetDeviceToken: c.device_token, disposition: ds.disposition, motivation: ds.motivation, fear: ds.fear }, (res:any) => { if (!res?.success) showError(res?.message||'Failed'); })}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded text-xs transition-colors"
                    disabled={c.is_online === 0}>
                    START DOSSIER
                  </button>
                </div>

                {/* Glitch controls */}
                <div className="border-t border-slate-600 pt-2 mt-1">
                  <div className="text-[10px] text-fuchsia-500 uppercase tracking-widest mb-1">GLITCHES</div>
                  <div className="grid grid-cols-2 gap-1 mb-1">
                    {GLITCH_OPTIONS.map(g => (
                      <button key={g.id}
                        onClick={() => applyGlitch(c.device_token, g.id)}
                        className="bg-fuchsia-950 hover:bg-fuchsia-900 border border-fuchsia-800 text-fuchsia-300 font-bold py-1 rounded text-[10px] transition-colors"
                        disabled={c.is_online === 0}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => clearGlitches(c.device_token)}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-1 rounded text-[10px]"
                    disabled={c.is_online === 0}>
                    CLEAR GLITCHES
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

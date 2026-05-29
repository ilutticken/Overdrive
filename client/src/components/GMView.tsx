import React, { useEffect, useState } from 'react';
import { socket } from '../socket';
import { MINIGAME_META } from '../minigames';

const BACKGROUND_OPTIONS = [
  { id: 'street-fixer', label: 'Street Fixer' },
  { id: 'corp-scion',   label: 'Corporate Scion' },
  { id: 'ghost-runner', label: 'Ghost Runner' },
  { id: 'bio-hacker',   label: 'Bio-Hacker' },
  { id: 'grizzled-veteran', label: 'Grizzled Veteran' },
  { id: 'signal-weaver', label: 'Signal Weaver' },
];

// Mini-games grouped by stat for the GM panel
const MINIGAME_GROUPS: Array<{ label: string; types: string[] }> = [
  { label: 'MEAT — PHYSICAL', types: ['deflect', 'slash', 'thread', 'lock', 'chain'] },
  { label: 'MIND — TECH',     types: ['overload', 'scan', 'jam'] },
  { label: 'MOXIE — SOCIAL',  types: ['bluff', 'surveillance'] },
];

export default function GMView() {
  const [roomCode, setRoomCode]   = useState('');
  const [joined, setJoined]       = useState(false);
  const [characters, setCharacters] = useState<any[]>([]);
  const [roomState, setRoomState] = useState('lobby');
  const [gmMessage, setGmMessage] = useState<{text:string;type:'error'|'info'}|null>(null);
  const [flashDrawState, setFlashDrawState] = useState<'idle'|'prepare'|'go'|'results'>('idle');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy'|'medium'|'hard'>('medium');
  const [combatState, setCombatState] = useState<{queue:any[];activeIndex:number}|null>(null);
  const [dossierSetup, setDossierSetup] = useState<Record<string,{disposition:string;motivation:string;fear:string}>>({});

  const showError = (msg: string) => { setGmMessage({text:msg,type:'error'}); setTimeout(()=>setGmMessage(null),4000); };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    socket.emit('gm:join_room', { roomCode }, (res: any) => {
      if (res.success) { setJoined(true); setCharacters(res.characters); setRoomState(res.roomState); }
      else alert(res.message);
    });
  };

  useEffect(() => {
    if (!joined) return;
    socket.on('room:state_update',        d => { setCharacters(d.characters); setRoomState(d.roomState); });
    socket.on('room:flash_draw_prepare',  ()  => setFlashDrawState('prepare'));
    socket.on('room:flash_draw_go',       ()  => setFlashDrawState('go'));
    socket.on('room:flash_draw_results',  ()  => setFlashDrawState('results'));
    socket.on('room:flash_draw_complete', ()  => setFlashDrawState('idle'));
    socket.on('room:combat_queue_update', d  => setCombatState(d));
    return () => {
      ['room:state_update','room:flash_draw_prepare','room:flash_draw_go',
       'room:flash_draw_results','room:flash_draw_complete','room:combat_queue_update'].forEach(e => socket.off(e));
    };
  }, [joined]);

  const triggerMinigame = (type: string, deviceToken: string) => {
    socket.emit('gm:start_minigame', { roomCode, targetDeviceToken: deviceToken, minigameType: type, difficultyTier: selectedDifficulty }, (res: any) => {
      if (!res?.success) showError(res?.message || 'Failed to start minigame');
    });
  };

  const setHealth = (deviceToken: string, newHealth: number) => {
    socket.emit('gm:set_player_health', { roomCode, deviceToken, newHealth }, (res: any) => {
      if (!res?.success) showError(res?.message || 'Failed to set HP');
    });
  };

  const setAutoLose = (deviceToken: string, enabled: boolean) => {
    socket.emit('gm:set_auto_lose', { roomCode, deviceToken, enabled }, (res: any) => {
      if (!res?.success) showError(res?.message || 'Failed to set auto-lose');
    });
  };

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

  return (
    <div className="flex flex-col min-h-screen p-6">
      <div className="flex justify-between items-center border-b-2 border-amber-500 pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-amber-500">MASTER DECK // ROOM: {roomCode}</h1>
          <p className="text-sm text-slate-400">Current Phase: <span className="text-white font-bold">{roomState.toUpperCase()}</span></p>
        </div>
        <div className="flex gap-2">
          {(['lobby','combat','overdrive'] as const).map(s => (
            <button key={s} onClick={() => socket.emit('gm:set_state', { roomCode, newState: s })}
              className={`px-4 py-2 rounded font-bold ${roomState===s?(s==='combat'?'bg-red-600':s==='overdrive'?'bg-fuchsia-600':'bg-amber-600'):'bg-slate-700 hover:bg-slate-600'}`}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {gmMessage && <div className={`mb-4 p-3 rounded ${gmMessage.type==='error'?'bg-red-800 text-white':'bg-slate-800 text-white'}`}>{gmMessage.text}</div>}

      {/* Initiative */}
      {roomState === 'combat' && (
        <div className="mb-6 p-4 bg-red-950/50 border border-red-900 rounded-lg flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-red-500">INITIATIVE PROTOCOL</h2>
              <p className="text-sm text-slate-400">Test reaction times to establish turn order.</p>
            </div>
            {!combatState && flashDrawState === 'idle' && (
              <button onClick={() => socket.emit('gm:start_flash_draw', { roomCode }, (res:any) => { if (!res?.success) showError('Failed to start flash draw'); })}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded animate-pulse">TRIGGER FLASH DRAW</button>
            )}
            {flashDrawState === 'results' && (
              <button onClick={() => socket.emit('gm:confirm_initiative', { roomCode })}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded animate-pulse">APPROVE INITIATIVE</button>
            )}
            {flashDrawState !== 'idle' && flashDrawState !== 'results' && <div className="text-red-500 font-bold animate-pulse">AWAITING DRAW...</div>}
          </div>
          {combatState && combatState.queue.length > 0 && (
            <div className="mt-4 border-t border-red-900 pt-4">
              <h3 className="text-sm text-red-400 font-bold mb-2">ACTIVE COMBAT QUEUE</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {combatState.queue.map((e, i) => (
                  <div key={i} className={`px-3 py-1 rounded text-sm font-bold ${i===combatState.activeIndex?'bg-red-600 text-white':'bg-slate-800 text-slate-400'}`}>{i+1}. {e.name}</div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => socket.emit('gm:next_turn', { roomCode })} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 font-bold rounded text-sm">NEXT TURN</button>
                <button onClick={() => socket.emit('gm:clear_initiative', { roomCode })} className="px-4 py-2 bg-red-950 hover:bg-red-900 text-red-500 font-bold rounded text-sm border border-red-900">CLEAR QUEUE</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Difficulty selector */}
      <div className="mb-6 bg-slate-900 border border-cyan-900 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-cyan-300 text-xs font-bold uppercase tracking-[0.3em]">MINIGAME DIFFICULTY</div>
            <p className="text-sm text-slate-400 mt-1">Each trigger rolls a fresh modifier from the selected tier.</p>
          </div>
          <div className="inline-flex rounded-full bg-slate-800 p-1">
            {(['easy','medium','hard'] as const).map(t => (
              <button key={t} onClick={() => setSelectedDifficulty(t)}
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors ${selectedDifficulty===t?'bg-cyan-600 text-white':'text-slate-300 hover:bg-slate-700'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Character cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {characters.map((c, i) => {
          const ds = dossierSetup[c.device_token] || { disposition: '2', motivation: 'money', fear: 'violence' };
          const setDs = (patch: Partial<typeof ds>) => setDossierSetup(s => ({ ...s, [c.device_token]: { ...ds, ...patch } }));
          return (
            <div key={i} className={`bg-slate-800 p-4 rounded-lg border border-slate-700 ${c.is_online===0?'opacity-40 grayscale':''}`}>
              <h3 className="text-xl font-bold text-white mb-2">{c.name}</h3>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-green-400">HP: {c.health}/3</span>
                <span className="text-yellow-400">฿: {c.credits}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-center mb-4">
                {(['MEAT','MIND','MOXIE'] as const).map(stat => (
                  <div key={stat} className="bg-slate-900 p-2 rounded">
                    <div className="text-slate-400">{stat}</div>
                    <div className="font-bold text-lg">{c[stat.toLowerCase()]}</div>
                  </div>
                ))}
              </div>

              {/* Minigame buttons grouped by stat */}
              <div className="mt-2 pt-2 border-t border-slate-700 flex flex-col gap-2">
                {MINIGAME_GROUPS.map(group => (
                  <div key={group.label}>
                    <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">{group.label}</div>
                    {group.types.map(type => {
                      const meta = MINIGAME_META[type];
                      return (
                        <button key={type}
                          onClick={() => triggerMinigame(type, c.device_token)}
                          className={`w-full ${meta.color} text-white font-bold py-1.5 rounded text-xs transition-colors mb-1`}
                          disabled={c.is_online === 0}
                        >
                          {meta.label} ({meta.stat})
                        </button>
                      );
                    })}
                  </div>
                ))}

                {/* Dossier */}
                <div className="border-t border-slate-600 pt-2 mt-1">
                  <h4 className="text-emerald-500 font-bold mb-2 text-xs uppercase tracking-widest">DOSSIER (MOXIE)</h4>
                  <select value={ds.disposition} onChange={e => setDs({disposition:e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white p-2 rounded text-sm mb-1">
                    <option value="4">Obedient</option><option value="3">Compliant</option>
                    <option value="2">Neutral</option><option value="1">Hostile</option><option value="0">Unreasonable</option>
                  </select>
                  <select value={ds.motivation} onChange={e => setDs({motivation:e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white p-2 rounded text-sm mb-1">
                    <option value="money">Money</option><option value="fame">Fame</option>
                    <option value="altruism">Altruism</option><option value="obedience">Obedience</option>
                  </select>
                  <select value={ds.fear} onChange={e => setDs({fear:e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white p-2 rounded text-sm mb-2">
                    <option value="violence">Violence</option><option value="ostracism">Ostracism</option>
                    <option value="exposure">Exposure</option><option value="poverty">Poverty</option>
                  </select>
                  <button
                    onClick={() => socket.emit('gm:start_dossier', { roomCode, targetDeviceToken: c.device_token, disposition: ds.disposition, motivation: ds.motivation, fear: ds.fear }, (res:any) => { if (!res?.success) showError(res?.message||'Failed'); })}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-sm transition-colors"
                    disabled={c.is_online === 0}
                  >START DOSSIER HACK</button>
                </div>
              </div>

              {/* Health controls */}
              <div className="mt-4 flex gap-2 items-center border-t border-slate-700 pt-4">
                <button className="w-12 h-10 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-sm" onClick={() => setHealth(c.device_token, Math.max(0, Number(c.health||0)-1))}>-</button>
                <div className="text-sm text-slate-300">HP: {c.health}/{c.max_health||3}</div>
                <button className="w-12 h-10 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-sm" onClick={() => setHealth(c.device_token, Math.min(c.max_health||3, Number(c.health||0)+1))}>+</button>
                <label className="flex items-center gap-2 text-slate-300 ml-4">
                  <input type="checkbox" checked={Number(c.auto_lose_on_fail)===1} onChange={e => setAutoLose(c.device_token, e.target.checked)} />
                  <span className="text-xs">Auto-lose</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

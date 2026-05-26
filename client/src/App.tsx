import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { socket } from './socket';

// --- Placeholder Components ---

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-8 p-4">
      <h1 className="text-6xl font-black text-cyan-400 tracking-widest drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">OVERDRIVE</h1>
      <p className="text-xl text-slate-300">Select your interface protocol:</p>
      
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl">
        <button onClick={() => navigate('/play')} className="flex-1 p-6 border-2 border-fuchsia-500 rounded-lg hover:bg-fuchsia-500/20 transition-all group">
          <h2 className="text-2xl font-bold text-fuchsia-400 group-hover:text-fuchsia-300">CYBER-DECK</h2>
          <p className="text-sm mt-2 opacity-80">Player Controller</p>
        </button>
        
        <button onClick={() => navigate('/host')} className="flex-1 p-6 border-2 border-cyan-500 rounded-lg hover:bg-cyan-500/20 transition-all group">
          <h2 className="text-2xl font-bold text-cyan-400 group-hover:text-cyan-300">MAIN SCREEN</h2>
          <p className="text-sm mt-2 opacity-80">Public Display Host</p>
        </button>

        <button onClick={() => navigate('/gm')} className="flex-1 p-6 border-2 border-amber-500 rounded-lg hover:bg-amber-500/20 transition-all group">
          <h2 className="text-2xl font-bold text-amber-400 group-hover:text-amber-300">MASTER DECK</h2>
          <p className="text-sm mt-2 opacity-80">GM Control</p>
        </button>
      </div>
    </div>
  );
};

const HostView = () => {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [roomState, setRoomState] = useState('lobby');

  // Minigame Display State
  const [warningTarget, setWarningTarget] = useState<string | null>(null);
  const [activeMinigameTarget, setActiveMinigameTarget] = useState<string | null>(null);
  const [minigameProgress, setMinigameProgress] = useState(0);
  const [minigameResult, setMinigameResult] = useState<{success: boolean, show: boolean}>({ success: false, show: false });

  useEffect(() => {
    const savedRoom = localStorage.getItem('overdrive_host_room');
    
    socket.emit('host:create_room', { roomCode: savedRoom }, (res: any) => {
      if (res.success) {
        setRoomCode(res.roomCode);
        setRoomState(res.roomState);
        setCharacters(res.characters);
        localStorage.setItem('overdrive_host_room', res.roomCode);
      }
    });

    socket.on('room:state_update', (data) => {
      setCharacters(data.characters);
      setRoomState(data.roomState);
    });

    socket.on('room:minigame_warning', (data) => {
      setWarningTarget(data.targetDeviceToken);
      setMinigameResult({ success: false, show: false });
    });

    socket.on('room:minigame_started', (data) => {
      setWarningTarget(null);
      setActiveMinigameTarget(data.targetDeviceToken);
      setMinigameProgress(0);
      setMinigameResult({ success: false, show: false });
    });

    socket.on('room:minigame_progress', (data) => {
      if (data.progress) {
        setMinigameProgress(data.progress);
      }
    });

    socket.on('room:minigame_result', (data) => {
      setActiveMinigameTarget(null);
      setMinigameResult({ success: data.success, show: true });
      
      // Hide splash after 4 seconds
      setTimeout(() => {
        setMinigameResult({ success: false, show: false });
      }, 4000);
    });

    return () => {
      socket.off('room:state_update');
      socket.off('room:minigame_warning');
      socket.off('room:minigame_started');
      socket.off('room:minigame_progress');
      socket.off('room:minigame_result');
    };
  }, []);

  const activeCharacter = characters.find(c => c.device_token === activeMinigameTarget);
  const warningCharacter = characters.find(c => c.device_token === warningTarget);

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-8 text-center transition-colors duration-500 
      ${roomState === 'combat' ? 'bg-red-950/20' : roomState === 'overdrive' ? 'bg-fuchsia-950/20' : ''}
      ${activeMinigameTarget || warningTarget ? 'bg-red-950/80' : ''}
    `}>
      {/* Result Splash Overlay */}
      {minigameResult.show && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm`}>
          <div className={`text-9xl font-black tracking-widest animate-bounce drop-shadow-[0_0_50px_rgba(255,255,255,0.8)]
            ${minigameResult.success ? 'text-green-500' : 'text-red-600'}`
          }>
            {minigameResult.success ? 'SUCCESS' : 'FAILURE'}
          </div>
        </div>
      )}

      {/* Pre-game Warning UI */}
      {warningTarget && warningCharacter && (
        <div className="w-full max-w-6xl flex flex-col items-center animate-pulse duration-75">
           <div className="text-8xl font-black text-red-600 mb-8 tracking-[0.1em] drop-shadow-[0_0_30px_rgba(220,38,38,1)]">
             ⚠️ CRITICAL INTRUSION ⚠️
           </div>
           <h3 className="text-5xl text-white mt-4 tracking-widest">
             TARGET LOCKED: <span className="text-red-500 font-bold">{warningCharacter.name}</span>
           </h3>
           <div className="mt-12 text-3xl text-red-400 font-mono tracking-[0.3em] animate-bounce">
             BRACE FOR FEEDBACK
           </div>
        </div>
      )}

      {/* Active Minigame UI */}
      {activeMinigameTarget && activeCharacter && (
        <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in zoom-in duration-300">
           <h2 className="text-6xl font-black text-red-500 mb-8 animate-pulse">OVERLOAD PROTOCOL INITIATED</h2>
           <h3 className="text-4xl text-white mb-12">OPERATIVE: <span className="text-fuchsia-400">{activeCharacter.name}</span></h3>
           
           <div className="w-full bg-slate-900 border-4 border-red-900 h-24 rounded-full overflow-hidden relative shadow-[0_0_30px_rgba(220,38,38,0.5)]">
             <div 
               className="h-full bg-red-600 transition-all duration-100 ease-out"
               style={{ width: `${(minigameProgress / 15) * 100}%` }}
             ></div>
             <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white mix-blend-difference">
                {minigameProgress} / 15 TAPS
             </div>
           </div>
        </div>
      )}

      {/* Standard Host UI (Hidden during minigame) */}
      {!activeMinigameTarget && !warningTarget && (
        <>
          <div className={`mb-8 border-b-4 pb-8 w-full max-w-4xl transition-colors ${roomState === 'combat' ? 'border-red-500' : roomState === 'overdrive' ? 'border-fuchsia-500' : 'border-cyan-500'}`}>
            <h2 className="text-3xl text-slate-400 font-bold mb-2">ACCESS CODE:</h2>
            <div className="text-9xl font-black tracking-[0.2em] text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
              {roomCode || '....'}
            </div>
            
            {roomState !== 'lobby' && (
              <div className={`mt-8 text-4xl font-black tracking-widest animate-pulse ${roomState === 'combat' ? 'text-red-500' : 'text-fuchsia-500'}`}>
                {roomState === 'combat' ? 'COMBAT PROTOCOL ENGAGED' : 'SYSTEM OVERDRIVE ENGAGED'}
              </div>
            )}
          </div>
          
          <div className="w-full max-w-4xl">
            <h3 className="text-2xl text-left text-fuchsia-400 font-bold mb-6 border-b border-fuchsia-400/30 pb-2">CONNECTED OPERATIVES</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {characters.length === 0 && <p className="text-slate-500 italic col-span-full">Waiting for connections...</p>}
              {characters.map((c, i) => (
                <div key={i} className={`bg-slate-800 p-4 rounded border border-slate-700 text-left transition-all ${c.is_online === 0 ? 'opacity-40 grayscale' : ''}`}>
                  <div className="font-bold text-xl flex justify-between items-center">
                    {c.name}
                    {c.is_online === 0 && <span className="text-xs font-black text-red-500 bg-red-950 px-2 py-1 rounded">OFFLINE</span>}
                  </div>
                  <div className="text-xs text-slate-400 mt-2">HP: {c.health}/3 | ฿: {c.credits}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const PlayerView = () => {
  const [roomCode, setRoomCode] = useState('');
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [character, setCharacter] = useState<any>(null);
  const [roomState, setRoomState] = useState('lobby');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [showProfiles, setShowProfiles] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [createName, setCreateName] = useState('');
  const [createArchetype, setCreateArchetype] = useState('street-sam');
  const [showCreate, setShowCreate] = useState(false);

  // Minigame State
  const [warningState, setWarningState] = useState<string | null>(null);
  const [activeMinigame, setActiveMinigame] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(3000); // Dynamic based on stats
  const [tapCount, setTapCount] = useState(0);

  // Generate or retrieve persistent device token
  const getDeviceToken = () => {
    let token = localStorage.getItem('overdrive_device_token');
    if (!token) {
      token = 'device_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('overdrive_device_token', token);
    }
    return token;
  };

  const archetypes: Record<string, { label: string, meat: number, mind: number, moxie: number, desc: string }> = {
    'street-sam': { label: 'The Street-Sam', meat: 4, mind: 2, moxie: 1, desc: 'Meat focus. Excels at physical combat and parrying.' },
    'cyber-glitch': { label: 'The Cyber-Glitch', mind: 4, meat: 1, moxie: 2, desc: 'Mind focus. Excels at hacking and system overloads.' },
    'operator': { label: 'The Operator', moxie: 4, meat: 2, mind: 1, desc: 'Moxie focus. Excels at social bluffs and crew support.' }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const token = getDeviceToken();
    const stats = archetypes[createArchetype];
    
    const payload: any = {
      roomCode,
      deviceToken: token,
    };

    // If selectedProfileId exists, tell server to use that profile
    if (selectedProfileId) payload.profileId = selectedProfileId;
    else payload.name = name, payload.stats = { meat: stats.meat, mind: stats.mind, moxie: stats.moxie };

    socket.emit('player:join_room', payload, (res: any) => {
      if (res.success) {
        setJoined(true);
        setCharacter(res.character);
        setRoomState(res.roomState);
      } else {
        alert(res.message);
      }
    });
  };

  const fetchProfiles = () => {
    const token = getDeviceToken();
    socket.emit('player:list_profiles', { deviceToken: token }, (res: any) => {
      if (res.success) {
        setProfiles(res.profiles || []);
        setShowProfiles(true);
      } else {
        alert(res.message || 'Failed to load profiles');
      }
    });
  };

  const handleDeleteProfile = (id: number) => {
    const token = getDeviceToken();
    if (!confirm('Delete this character?')) return;
    socket.emit('player:delete_profile', { deviceToken: token, id }, (res: any) => {
      if (res.success) {
        // Refresh list
        fetchProfiles();
        if (selectedProfileId === id) setSelectedProfileId(null);
      } else {
        alert(res.message || 'Failed to delete');
      }
    });
  };

  const handleCreateProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = getDeviceToken();
    const stats = archetypes[createArchetype];
    socket.emit('player:create_profile', {
      deviceToken: token,
      name: createName || 'Unnamed',
      meat: stats.meat,
      mind: stats.mind,
      moxie: stats.moxie,
      health: 3,
      max_health: 3,
      credits: 0,
      gear: '[]',
      status_effects: '[]',
      notes: ''
    }, (res: any) => {
      if (res.success) {
        // Refresh list and auto-select
        fetchProfiles();
        setSelectedProfileId(res.id || null);
        setShowProfiles(true);
        setShowCreate(false);
        setName(res.profile.name || '');
        setCreateName('');
      } else {
        alert(res.message || 'Failed to create profile');
      }
    });
  };

  useEffect(() => {
    if (joined) {
      socket.on('room:state_update', (data) => {
        // Find our updated character data
        const updatedMe = data.characters.find((c: any) => c.device_token === getDeviceToken());
        if (updatedMe) setCharacter(updatedMe);
        
        setRoomState(data.roomState);
      });

      socket.on('room:minigame_warning', (data) => {
        if (data.targetDeviceToken === getDeviceToken() && data.minigameType === 'overload') {
          setWarningState('overload');
        }
      });

      socket.on('room:minigame_started', (data) => {
        if (data.targetDeviceToken === getDeviceToken() && data.minigameType === 'overload') {
          // Dynamic Timer based on Mind Stat
          // Mind 1: 3.0s | Mind 2-3: 4.0s | Mind 4+: 5.5s
          let startingTime = 3000;
          if (character) {
             if (character.mind >= 4) startingTime = 5500;
             else if (character.mind >= 2) startingTime = 4000;
          }
          
          setWarningState(null);
          setActiveMinigame('overload');
          setTapCount(0);
          setTimeLeft(startingTime);
        }
      });

      return () => {
        socket.off('room:state_update');
        socket.off('room:minigame_warning');
        socket.off('room:minigame_started');
      };
    }
  }, [joined]);

  // Minigame Timer Logic
  useEffect(() => {
    let timer: number;
    if (activeMinigame === 'overload' && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 100) {
            clearInterval(timer);
            // Time up logic handled here to ensure it fires once
            handleMinigameComplete(false);
            return 0;
          }
          return prev - 100;
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [activeMinigame, timeLeft]);

  const handleTap = () => {
    if (activeMinigame !== 'overload' || timeLeft <= 0) return;

    const newCount = tapCount + 1;
    setTapCount(newCount);
    
    socket.emit('player:minigame_progress', {
      roomCode: character.room_code,
      deviceToken: getDeviceToken(),
      progress: newCount
    });

    if (newCount >= 15) {
      handleMinigameComplete(true);
    }
  };

  const handleMinigameComplete = (success: boolean) => {
    setActiveMinigame(null);
    socket.emit('player:minigame_complete', {
      roomCode: character.room_code,
      deviceToken: getDeviceToken(),
      success
    });
  };

  if (joined) {
    if (warningState === 'overload') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-red-950/90 border-8 border-red-600 animate-pulse duration-75">
          <h2 className="text-5xl font-black text-red-500 mb-6 text-center drop-shadow-[0_0_20px_rgba(220,38,38,0.9)]">⚠️ INCOMING ⚠️</h2>
          <div className="text-3xl font-bold text-white text-center tracking-widest mt-8">
            NEURAL SPIKE<br/>DETECTED
          </div>
          <div className="mt-12 text-xl text-red-300 tracking-[0.2em] animate-bounce">
            PREPARE TO OVERLOAD
          </div>
        </div>
      );
    }

    if (activeMinigame === 'overload') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-red-950">
          <h2 className="text-4xl font-black text-red-500 mb-2 animate-pulse">OVERLOAD</h2>
          <div className="text-xl font-bold text-white mb-8">TIME: {(timeLeft / 1000).toFixed(1)}s</div>
          
          <button 
            onPointerDown={handleTap} // Better than onClick for fast mobile taps
            className="w-64 h-64 rounded-full bg-red-600 border-8 border-red-800 shadow-[0_0_50px_rgba(220,38,38,0.8)] active:bg-red-500 active:scale-95 transition-all flex items-center justify-center select-none"
          >
            <span className="text-6xl font-black text-white">{tapCount} / 15</span>
          </button>
          
          <p className="mt-12 text-slate-400 text-lg">MASH TO CRASH ASSET!</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center p-6 min-h-screen">
        <div className="w-full max-w-md border-b-2 border-fuchsia-500 pb-4 mb-6">
          <h1 className="text-3xl font-bold">{character?.name}</h1>
          <div className="flex justify-between mt-2 text-sm text-fuchsia-300 mb-4">
            <span>SYS INTEGRITY: {character?.health}/3</span>
            <span>CREDITS: ฿{character?.credits}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div className="bg-slate-900 p-2 rounded border border-slate-700">
              <div className="text-slate-400">MEAT</div>
              <div className="font-bold text-lg text-white">{character?.meat}</div>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-700">
              <div className="text-slate-400">MIND</div>
              <div className="font-bold text-lg text-white">{character?.mind}</div>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-700">
              <div className="text-slate-400">MOXIE</div>
              <div className="font-bold text-lg text-white">{character?.moxie}</div>
            </div>
          </div>
        </div>
        
        <div className="w-full max-w-md flex-1 flex flex-col justify-center items-center">
          {roomState === 'lobby' && (
             <p className="text-center opacity-50">AWAITING GM INSTRUCTION...</p>
          )}
          {roomState === 'combat' && (
             <div className="animate-pulse text-red-500 font-bold text-2xl border-2 border-red-500 p-8 rounded text-center w-full">
               COMBAT PROTOCOL ACTIVE<br/>STANDBY FOR FLASH-DRAW
             </div>
          )}
          {roomState === 'overdrive' && (
             <div className="animate-bounce text-fuchsia-500 font-bold text-2xl border-2 border-fuchsia-500 p-8 rounded text-center w-full bg-fuchsia-500/10">
               SYSTEM OVERDRIVE<br/>PREPARE FOR INJECTION
             </div>
          )}
        </div>
      </div>
    );
  }

  // Profile selection UI will be embedded in the existing form below

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <form onSubmit={handleJoin} className="bg-slate-800 p-8 rounded-lg w-full max-w-md border border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-fuchsia-400">INITIALIZE LINK</h2>
        
        <div className="space-y-4">
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => {
                // toggle profiles panel
                if (showProfiles) {
                  setShowProfiles(false);
                } else {
                  fetchProfiles();
                }
                setShowCreate(false);
              }}
              className={`text-sm px-3 py-1 rounded ${showProfiles ? 'bg-slate-700 text-white border border-slate-600' : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'}`}>
              Choose Existing
            </button>

            <button
              type="button"
              onClick={() => {
                setShowCreate((s) => !s);
                setShowProfiles(false);
              }}
              className={`text-sm px-3 py-1 rounded ${showCreate ? 'bg-fuchsia-600 text-white' : 'bg-fuchsia-500 text-white/90 hover:bg-fuchsia-600'}`}>
              Create Character
            </button>
          </div>

          {/* Create New Character Section (toggle) */}
          {showCreate && (
            <div className="mt-4 mb-4 p-4 bg-slate-900 rounded border">
              <h3 className="font-bold mb-2">Create New Character</h3>
              <div className="space-y-3">
                <input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Character Name" className="w-full p-2 bg-slate-800 rounded" />
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(archetypes).map(([key, data]) => (
                    <label key={key} className={`p-2 rounded border cursor-pointer transition-all ${createArchetype === key ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-slate-700 bg-slate-900 hover:border-slate-500'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="createArchetype" value={key} checked={createArchetype === key} onChange={() => setCreateArchetype(key)} className="hidden" />
                        <div className="flex-1">
                          <div className="font-bold text-fuchsia-300">{data.label}</div>
                          <div className="text-xs text-slate-400 mt-1">{data.desc}</div>
                          <div className="flex gap-2 mt-2 text-[10px] font-mono">
                            <span className="bg-slate-800 px-1 py-0.5 rounded text-white">MEAT:{data.meat}</span>
                            <span className="bg-slate-800 px-1 py-0.5 rounded text-white">MIND:{data.mind}</span>
                            <span className="bg-slate-800 px-1 py-0.5 rounded text-white">MOXIE:{data.moxie}</span>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="text-right">
                  <button type="button" onClick={handleCreateProfile} className="px-4 py-2 bg-fuchsia-600 rounded text-white">Create</button>
                </div>
              </div>
            </div>
          )}

          {showProfiles && (
            <div className="mb-2 p-3 bg-slate-900 rounded border">
              {profiles.length === 0 && <div className="text-sm italic">No saved characters found.</div>}
              {profiles.map((p) => (
                <div key={p.id} className={`flex items-center justify-between p-2 rounded hover:bg-slate-800 ${selectedProfileId === p.id ? 'ring-2 ring-fuchsia-500' : ''}`}>
                  <div>
                    <div className="font-bold">{p.name || 'Unnamed'}</div>
                    <div className="text-xs text-slate-400">MEAT:{p.meat} MIND:{p.mind} MOXIE:{p.moxie}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="profile" checked={selectedProfileId === p.id} onChange={() => { setSelectedProfileId(p.id); setName(p.name || ''); }} />
                    <button type="button" onClick={() => handleDeleteProfile(p.id)} className="text-xs text-red-400 bg-red-950 px-2 py-1 rounded">Delete</button>
                  </div>
                </div>
              ))}
              <div className="mt-2 text-right">
                <button type="button" onClick={() => setShowProfiles(false)} className="text-sm text-slate-400">Close</button>
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-400 mb-1">ROOM CODE</label>
            <input 
              type="text" 
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              maxLength={4}
              required
              className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white text-xl tracking-widest uppercase focus:border-fuchsia-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">CALLSIGN</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white text-xl focus:border-fuchsia-500 focus:outline-none transition-colors"
            />
          </div>
          
          {/* Archetype selection moved to Create New Character section */}
        </div>

        <button type="submit" className="w-full mt-8 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-4 rounded transition-colors">
          ESTABLISH CONNECTION
        </button>
      </form>
    </div>
  );
};

const GMView = () => {
  const [roomCode, setRoomCode] = useState('');
  const [joined, setJoined] = useState(false);
  const [characters, setCharacters] = useState<any[]>([]);
  const [roomState, setRoomState] = useState('lobby');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    socket.emit('gm:join_room', { roomCode }, (res: any) => {
      if (res.success) {
        setJoined(true);
        setCharacters(res.characters);
        setRoomState(res.roomState);
      } else {
        alert(res.message);
      }
    });
  };

  useEffect(() => {
    if (joined) {
      socket.on('room:state_update', (data) => {
        setCharacters(data.characters);
        setRoomState(data.roomState);
      });
      return () => {
        socket.off('room:state_update');
      };
    }
  }, [joined]);

  const changeState = (newState: string) => {
    socket.emit('gm:set_state', { roomCode, newState });
  };

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <form onSubmit={handleJoin} className="bg-slate-800 p-8 rounded-lg w-full max-w-md border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <h2 className="text-2xl font-bold mb-6 text-amber-500">MASTER CONTROL LOGIN</h2>
          <div>
            <label className="block text-xs text-slate-400 mb-1">TARGET ROOM</label>
            <input 
              type="text" 
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              maxLength={4}
              required
              className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white text-xl tracking-widest uppercase focus:border-amber-500 focus:outline-none"
            />
          </div>
          <button type="submit" className="w-full mt-8 bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded transition-colors">
            OVERRIDE PROTOCOL
          </button>
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
          <button onClick={() => changeState('lobby')} className={`px-4 py-2 rounded font-bold ${roomState === 'lobby' ? 'bg-amber-600' : 'bg-slate-700 hover:bg-slate-600'}`}>LOBBY</button>
          <button onClick={() => changeState('combat')} className={`px-4 py-2 rounded font-bold ${roomState === 'combat' ? 'bg-red-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>COMBAT</button>
          <button onClick={() => changeState('overdrive')} className={`px-4 py-2 rounded font-bold ${roomState === 'overdrive' ? 'bg-fuchsia-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>OVERDRIVE</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {characters.map((c, i) => (
          <div key={i} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-2">{c.name}</h3>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-green-400">HP: {c.health}/3</span>
              <span className="text-yellow-400">฿: {c.credits}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-slate-400">MEAT</div>
                <div className="font-bold text-lg">{c.meat}</div>
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-slate-400">MIND</div>
                <div className="font-bold text-lg">{c.mind}</div>
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-slate-400">MOXIE</div>
                <div className="font-bold text-lg">{c.moxie}</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700 flex justify-center">
              <button 
                onClick={() => {
                  socket.emit('gm:start_minigame', {
                    roomCode,
                    targetDeviceToken: c.device_token,
                    minigameType: 'overload'
                  });
                }}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded text-sm transition-colors"
              >
                TRIGGER OVERLOAD
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- App Component ---

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/host" element={<HostView />} />
        <Route path="/play" element={<PlayerView />} />
        <Route path="/gm" element={<GMView />} />
      </Routes>
    </Router>
  );
}

export default App;

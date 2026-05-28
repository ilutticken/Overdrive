import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { socket } from './socket';

const StaticLayer = ({ src }: { src: string }) => (
  <div className="absolute inset-0" style={{ 
    backgroundImage: `url(${src})`, 
    backgroundSize: 'auto 100%', 
    backgroundPosition: 'bottom left', 
    backgroundRepeat: 'repeat-x'
  }}></div>
);

const ScrollingLayer = ({ src, speedClass }: { src: string, speedClass: string }) => (
  <div className={`absolute inset-0 flex w-max ${speedClass}`}>
    {[1, 2, 3, 4].map(i => (
      <img key={i} src={src} className="h-full w-auto max-w-none pointer-events-none" alt="" />
    ))}
  </div>
);

const CityBackground = () => {
  const rainSvg = `data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='20' y1='0' x2='20' y2='25' stroke='rgba(100,240,255,0.4)' stroke-width='1.5' /%3E%3Cline x1='70' y1='50' x2='70' y2='80' stroke='rgba(100,240,255,0.2)' stroke-width='1' /%3E%3C/svg%3E`;

  return (
    <div className="absolute top-0 left-0 right-0 h-[65vh] pointer-events-none overflow-hidden bg-[#0a0a1a] z-[-1] border-b-2 border-cyan-900 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
      
      <StaticLayer src="/city-skyline/Background_City_Skyline_Stars_01.png" />
      <ScrollingLayer src="/city-skyline/Background_City_Skyline_Cloud_01.png" speedClass="animate-cloud-slow" />
      <StaticLayer src="/city-skyline/Background_City_Skyline_Back_04.png" />
      <ScrollingLayer src="/city-skyline/Background_City_Skyline_Cloud_02.png" speedClass="animate-cloud-fast" />
      <StaticLayer src="/city-skyline/Background_City_Skyline_Back_03.png" />
      <StaticLayer src="/city-skyline/Background_City_Skyline_Back_02.png" />
      <StaticLayer src="/city-skyline/Background_City_Skyline_Back_01.png" />
      <StaticLayer src="/city-skyline/Background_City_Skyline_Front_02.png" />
      <StaticLayer src="/city-skyline/Background_City_Skyline_Front_01.png" />
      
      {/* Rain overlays */}
      <div className="absolute inset-0 mix-blend-screen overflow-hidden">
        {/* Drops */}
        <div className="absolute -top-[50%] -left-[50%] -right-[50%] h-[200%] rain-drop-layer" style={{
          backgroundImage: `url("${rainSvg}")`,
          backgroundSize: '100px 100px',
          transform: 'rotate(15deg)'
        }}></div>
        {/* CRT Scanline */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'linear-gradient(180deg, rgba(34,211,238,0) 0%, rgba(34,211,238,0.5) 50%, rgba(34,211,238,0) 100%)',
          backgroundSize: '100% 200%',
          animation: 'rain-scan 2s linear infinite'
        }}></div>
      </div>

      <style>{`
        @keyframes rain-scan {
          0% { background-position: 0% -100%; }
          100% { background-position: 0% 100%; }
        }
        @keyframes rain-fall {
          from { background-position: 0 0; }
          to { background-position: 0 100px; }
        }
        .rain-drop-layer {
          animation: rain-fall 0.3s linear infinite;
        }
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
        .animate-cloud-slow {
          animation: scroll-left 120s linear infinite;
        }
        .animate-cloud-fast {
          animation: scroll-left 80s linear infinite;
        }
      `}</style>
    </div>
  );
};

const backgroundOptions = [
  { id: 'street-fixer', label: 'Street Fixer', description: 'A veteran of the undercity who survives by reading people and adapting fast.' },
  { id: 'corp-scion', label: 'Corporate Scion', description: 'Raised in boardrooms, this operative understands leverage, etiquette, and pressure.' },
  { id: 'ghost-runner', label: 'Ghost Runner', description: 'A stealth-first operator built for silent movement, evasion, and quick exits.' },
  { id: 'bio-hacker', label: 'Bio-Hacker', description: 'Tuned into body and machine limits, this operative thrives in risky augmentations.' },
  { id: 'grizzled-veteran', label: 'Grizzled Veteran', description: 'Scarred by past wars and trusted under pressure when calm is thin.' },
  { id: 'signal-weaver', label: 'Signal Weaver', description: 'A master of distractions, drones, and social noise that bends attention.' }
];

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
  const [gmOnline, setGmOnline] = useState(false);

  // Minigame Display State
  const [warningTarget, setWarningTarget] = useState<string | null>(null);
  const [activeMinigameTarget, setActiveMinigameTarget] = useState<string | null>(null);
  const [activeDossierTarget, setActiveDossierTarget] = useState<string | null>(null);
  const [dossierDisposition, setDossierDisposition] = useState(2);
  const [activeMinigameType, setActiveMinigameType] = useState<string | null>(null);
  const [activeMinigameDifficulty, setActiveMinigameDifficulty] = useState<string | null>(null);
  const [activeMinigameModifier, setActiveMinigameModifier] = useState<any>(null);
  const [minigameProgress, setMinigameProgress] = useState(0);
  const [minigameResult, setMinigameResult] = useState<{success: boolean, show: boolean, degreeOfSuccess?: string, finalDisposition?: number, modifier?: any, difficultyTier?: string}>({ success: false, show: false });
  const [recentResults, setRecentResults] = useState<Array<{
    kind: 'minigame' | 'dossier';
    targetName: string;
    label: string;
    detail: string;
    tone: string;
  }>>([]);

  // Flash Draw State
  const [flashDrawState, setFlashDrawState] = useState<'idle' | 'prepare' | 'go' | 'results'>('idle');
  const [initiativeQueue, setInitiativeQueue] = useState<any[]>([]);
  const [activeCombatState, setActiveCombatState] = useState<{queue: any[], activeIndex: number} | null>(null);

  const audioRef = React.useRef<HTMLAudioElement>(null);
  const alertToneRef = React.useRef<any>(null);
  const charactersRef = React.useRef(characters);
  const activeMinigameTypeRef = React.useRef(activeMinigameType);

  useEffect(() => {
    alertToneRef.current = new Audio('/sound/alert-beep.mp3');
    alertToneRef.current.preload = 'auto';
  }, []);

  const playAlertBeep = () => {
    const tone = alertToneRef.current;
    if (!tone) return;
    tone.currentTime = 0;
    tone.volume = 0.9;
    void tone.play().catch(() => {});
  };

  useEffect(() => {
    charactersRef.current = characters;
  }, [characters]);

  useEffect(() => {
    activeMinigameTypeRef.current = activeMinigameType;
  }, [activeMinigameType]);

  const isGameReady = gmOnline && characters.filter(c => c.is_online === 1).length >= 1;

  // Audio Fading Logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let fadeInterval: number;

    if (!isGameReady) {
      // Fade in
      audio.volume = 0;
      audio.play().catch(e => console.warn('Audio autoplay prevented:', e));
      fadeInterval = window.setInterval(() => {
        if (audio.volume < 0.95) {
          audio.volume += 0.05;
        } else {
          audio.volume = 1;
          clearInterval(fadeInterval);
        }
      }, 100);
    } else {
      // Fade out
      fadeInterval = window.setInterval(() => {
        if (audio.volume > 0.05) {
          audio.volume -= 0.05;
        } else {
          audio.volume = 0;
          audio.pause();
          clearInterval(fadeInterval);
        }
      }, 100);
    }

    return () => clearInterval(fadeInterval);
  }, [isGameReady]);

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

    socket.on('room:gm_presence', (data) => {
      setGmOnline(data.gmOnline);
    });

    socket.on('room:minigame_warning', (data) => {
      playAlertBeep();
      setWarningTarget(data.targetDeviceToken);
      setActiveMinigameType(data.minigameType);
      setActiveMinigameDifficulty(data.difficultyTier || null);
      setActiveMinigameModifier(data.modifier || null);
      setMinigameResult({ success: false, show: false });
    });

    socket.on('room:minigame_started', (data) => {
      setWarningTarget(null);
      setActiveMinigameTarget(data.targetDeviceToken);
      setActiveMinigameType(data.minigameType);
      setActiveMinigameDifficulty(data.difficultyTier || null);
      setActiveMinigameModifier(data.modifier || null);
      setMinigameProgress(0);
      setMinigameResult({ success: false, show: false });
    });

    socket.on('room:minigame_progress', (data) => {
      if (data.progress) {
        setMinigameProgress(data.progress);
      }
    });

    socket.on('room:dossier_started', (data) => {
      playAlertBeep();
      setWarningTarget(null);
      setActiveDossierTarget(data.targetDeviceToken);
      setDossierDisposition(data.disposition);
      setMinigameResult({ success: false, show: false });
    });

    socket.on('room:dossier_update', (data) => {
      setDossierDisposition(data.disposition);
    });

    socket.on('room:minigame_result', (data) => {
      setActiveMinigameTarget(null);
      setActiveDossierTarget(null);
      setActiveMinigameDifficulty(null);
      setActiveMinigameModifier(null);

      const completedMinigameType = activeMinigameTypeRef.current;
      setActiveMinigameType(null);

      const isDossierResult = data.finalDisposition !== undefined;
      const targetCharacter = charactersRef.current.find((character) => character.device_token === data.deviceToken);
      const targetName = targetCharacter?.name || 'UNKNOWN OPERATIVE';
      const minigameName = isDossierResult ? 'DOSSIER' : formatMinigameName(completedMinigameType);
      const label = isDossierResult
        ? dispositionLabelMap[data.finalDisposition]
        : resultLabelMap[data.degreeOfSuccess] || 'UNKNOWN';

      setRecentResults((prev) => {
        const entry: {
          kind: 'minigame' | 'dossier';
          targetName: string;
          label: string;
          detail: string;
          tone: string;
        } = {
          kind: isDossierResult ? 'dossier' : 'minigame',
          targetName,
          label,
          detail: minigameName,
          tone: isDossierResult
            ? dispositionToneMap[data.finalDisposition] || 'border-slate-400/60 bg-slate-950/60 text-slate-100'
            : resultToneMap[data.degreeOfSuccess] || 'border-slate-400/60 bg-slate-950/60 text-slate-100'
        };

        return [entry, ...prev].slice(0, 3);
      });

      setMinigameResult({
        success: data.success,
        show: true,
        degreeOfSuccess: data.degreeOfSuccess,
        finalDisposition: data.finalDisposition,
        modifier: data.modifier || null,
        difficultyTier: data.difficultyTier || null
      });
      
      // Hide splash after 4 seconds
      setTimeout(() => {
        setMinigameResult({ success: false, show: false });
      }, 4000);
    });

    socket.on('room:flash_draw_prepare', () => {
      playAlertBeep();
      setFlashDrawState('prepare');
      setInitiativeQueue([]);
    });

    socket.on('room:flash_draw_go', (data) => {
      setFlashDrawState('go');
      if (data && data.queue) setInitiativeQueue(data.queue);
    });

    socket.on('room:flash_draw_results', (data) => {
      setFlashDrawState('results');
      if (data && data.queue) setInitiativeQueue(data.queue);
    });

    socket.on('room:flash_draw_complete', () => {
      setFlashDrawState('idle');
      setInitiativeQueue([]);
    });

    socket.on('room:combat_queue_update', (data) => {
      setActiveCombatState(data);
    });

    return () => {
      socket.off('room:state_update');
      socket.off('room:gm_presence');
      socket.off('room:minigame_warning');
      socket.off('room:minigame_started');
      socket.off('room:minigame_progress');
      socket.off('room:dossier_started');
      socket.off('room:dossier_update');
      socket.off('room:minigame_result');
      socket.off('room:flash_draw_prepare');
      socket.off('room:flash_draw_go');
      socket.off('room:flash_draw_results');
      socket.off('room:flash_draw_complete');
      socket.off('room:combat_queue_update');
    };
  }, []);

  const activeCharacter = characters.find(c => c.device_token === (activeMinigameTarget || activeDossierTarget));
  const warningCharacter = characters.find(c => c.device_token === warningTarget);

  const resultLabelMap: Record<string, string> = {
    critical_success: 'CRITICAL SUCCESS',
    success: 'SUCCESS',
    mixed_success: 'MIXED SUCCESS',
    failure: 'FAILURE',
    critical_failure: 'CRITICAL FAILURE'
  };

  const dispositionLabelMap: Record<number, string> = {
    4: 'OBEDIENT',
    3: 'COMPLIANT',
    2: 'NEUTRAL',
    1: 'HOSTILE',
    0: 'UNREASONABLE'
  };

  const resultToneMap: Record<string, string> = {
    critical_success: 'border-purple-400/60 bg-purple-950/60 text-purple-100',
    success: 'border-emerald-400/60 bg-emerald-950/60 text-emerald-100',
    mixed_success: 'border-amber-400/60 bg-amber-950/60 text-amber-100',
    failure: 'border-red-400/60 bg-red-950/60 text-red-100',
    critical_failure: 'border-rose-400/60 bg-rose-950/60 text-rose-100'
  };

  const dispositionToneMap: Record<number, string> = {
    4: 'border-emerald-400/60 bg-emerald-950/60 text-emerald-100',
    3: 'border-green-400/60 bg-green-950/60 text-green-100',
    2: 'border-yellow-400/60 bg-yellow-950/60 text-yellow-100',
    1: 'border-orange-400/60 bg-orange-950/60 text-orange-100',
    0: 'border-rose-400/60 bg-rose-950/60 text-rose-100'
  };

  const formatMinigameName = (minigameType?: string | null) => {
    if (minigameType === 'deflect') return 'DEFLECT';
    if (minigameType === 'bluff') return 'BLUFF';
    if (minigameType === 'overload') return 'OVERLOAD';
    return 'MINIGAME';
  };

  useEffect(() => {
    if (!isGameReady) {
      setRecentResults([]);
    }
  }, [isGameReady]);

  return (
    <div className={`relative flex flex-col items-center justify-center min-h-screen p-8 text-center transition-colors duration-500 overflow-hidden
      ${roomState === 'combat' ? 'bg-red-950/20' : roomState === 'overdrive' ? 'bg-fuchsia-950/20' : ''}
      ${activeMinigameTarget || warningTarget ? 'bg-red-950/80' : ''}
    `}>
      <audio ref={audioRef} src="/sound/cyber_runner.ogg" loop />
      {isGameReady && <CityBackground />}
      {/* Result Splash Overlay */}
      {minigameResult.show && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm`}>
          <div className={`text-9xl font-black tracking-widest animate-bounce drop-shadow-[0_0_50px_rgba(255,255,255,0.8)] flex flex-col items-center
            ${minigameResult.finalDisposition !== undefined
              ? minigameResult.finalDisposition >= 3 ? 'text-emerald-500' : minigameResult.finalDisposition === 2 ? 'text-yellow-400' : 'text-red-500'
              : minigameResult.degreeOfSuccess === 'critical_success' ? 'text-purple-500' : 
                minigameResult.degreeOfSuccess === 'success' ? 'text-green-500' : 
                minigameResult.degreeOfSuccess === 'mixed_success' ? 'text-amber-500' : 
                'text-red-600'}`
          }>
            {minigameResult.finalDisposition !== undefined && (
              <div className="text-xl uppercase tracking-[0.45em] opacity-80 mb-4">FINAL DISPOSITION</div>
            )}
            {minigameResult.finalDisposition !== undefined ? (
              minigameResult.finalDisposition === 4 ? 'OBEDIENT' :
              minigameResult.finalDisposition === 3 ? 'COMPLIANT' :
              minigameResult.finalDisposition === 2 ? 'NEUTRAL' :
              minigameResult.finalDisposition === 1 ? 'HOSTILE' : 'UNREASONABLE'
            ) : (
              minigameResult.degreeOfSuccess === 'critical_success' ? 'CRITICAL SUCCESS' : 
              minigameResult.degreeOfSuccess === 'success' ? 'SUCCESS' : 
              minigameResult.degreeOfSuccess === 'mixed_success' ? 'MIXED SUCCESS' : 
              minigameResult.degreeOfSuccess === 'critical_failure' ? 'CRITICAL FAILURE' : 
              'FAILURE'
            )}
             {minigameResult.modifier && (
               <div className={`mt-6 px-8 py-4 rounded-2xl border text-center max-w-3xl ${minigameResult.modifier.type === 'consequence' ? 'border-orange-400/60 bg-orange-950/70 text-orange-100' : minigameResult.modifier.type === 'time' ? 'border-cyan-400/60 bg-cyan-950/70 text-cyan-100' : 'border-emerald-400/60 bg-emerald-950/70 text-emerald-100'}`}>
                 <div className="text-xs uppercase tracking-[0.35em] opacity-80">{(minigameResult.modifier.type || 'modifier').toUpperCase()} MODIFIED</div>
                 <div className="mt-2 text-4xl font-black">{minigameResult.modifier.label}</div>
                 <div className="mt-2 text-2xl font-medium">{minigameResult.modifier.description}</div>
               </div>
             )}
             </div>
             </div>
             )}

      {isGameReady && !activeMinigameTarget && !warningTarget && !activeDossierTarget && flashDrawState === 'idle' && (
        <div className="absolute right-6 top-6 z-40 w-80 rounded-2xl border border-white/10 bg-slate-950/85 p-4 text-left backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-200">LAST 3 RESULTS</h2>
            <div className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.35em] text-cyan-100">Live</div>
          </div>

          <div className="mt-3 space-y-2">
            {recentResults.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-sm text-slate-300">
                No results yet.
              </div>
            ) : (
              recentResults.map((entry, index) => (
                <div key={`${entry.label}-${entry.targetName}-${index}`} className={`rounded-xl border px-3 py-2 ${entry.tone}`}>
                  <div className="mt-1 text-xl font-black tracking-wide">{entry.detail}</div>
                  <div className="mt-1 text-base font-bold uppercase tracking-[0.3em] opacity-95">{entry.label}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.25em] opacity-85">{entry.targetName}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Pre-game Warning UI */}
      {warningTarget && warningCharacter && (
        <div className={`w-full max-w-6xl flex flex-col items-center animate-pulse duration-75 ${activeMinigameType === 'deflect' ? 'text-blue-500' : activeMinigameType === 'bluff' ? 'text-amber-500' : 'text-red-600'}`}>
           <div className={`text-8xl font-black mb-8 tracking-[0.1em] ${activeMinigameType === 'deflect' ? 'drop-shadow-[0_0_30px_rgba(59,130,246,1)]' : activeMinigameType === 'bluff' ? 'drop-shadow-[0_0_30px_rgba(245,158,11,1)]' : 'drop-shadow-[0_0_30px_rgba(220,38,38,1)]'}`}>
             ⚠️ {activeMinigameType === 'deflect' ? 'DEFLECT' : activeMinigameType === 'bluff' ? 'BLUFF' : 'CRITICAL INTRUSION'} ⚠️
           </div>
           <h3 className="text-5xl text-white mt-4 tracking-widest">
             TARGET LOCKED: <span className={`font-bold ${activeMinigameType === 'deflect' ? 'text-blue-400' : activeMinigameType === 'bluff' ? 'text-amber-400' : 'text-red-500'}`}>{warningCharacter.name}</span>
           </h3>
           <div className={`mt-12 text-3xl font-mono tracking-[0.3em] animate-bounce ${activeMinigameType === 'deflect' ? 'text-blue-300' : activeMinigameType === 'bluff' ? 'text-amber-300' : 'text-red-400'}`}>
             {activeMinigameType === 'deflect' ? 'PREPARE TO DEFLECT' : activeMinigameType === 'bluff' ? 'MAINTAIN RESOLVE' : 'BRACE FOR FEEDBACK'}
           </div>
           {activeMinigameModifier && (
             <div className={`mt-8 px-8 py-4 rounded-full border text-center backdrop-blur ${activeMinigameModifier.type === 'time' ? 'bg-rose-950/90 border-rose-700 text-rose-100' : activeMinigameModifier.type === 'consequence' ? 'bg-orange-950/90 border-orange-700 text-orange-100' : 'bg-cyan-950/90 border-cyan-700 text-cyan-100'}`}>
               <div className="text-xs uppercase tracking-[0.35em] opacity-80">DIFFICULTY {activeMinigameDifficulty?.toUpperCase() || 'STANDARD'}</div>
               <div className="mt-2 text-3xl font-black">{activeMinigameModifier.label}</div>
               <div className="mt-1 text-lg font-medium">{activeMinigameModifier.description}</div>
             </div>
           )}
        </div>
      )}

      {/* Active Minigame UI */}
      {activeMinigameTarget && activeCharacter && (
        <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in zoom-in duration-300">
           <h2 className={`text-6xl font-black mb-8 animate-pulse ${activeMinigameType === 'deflect' ? 'text-blue-500' : activeMinigameType === 'bluff' ? 'text-amber-500' : 'text-red-500'}`}>
             {activeMinigameType === 'deflect' ? 'DEFLECTION PROTOCOL ACTIVE' : activeMinigameType === 'bluff' ? 'BLUFF PROTOCOL ACTIVE' : 'OVERLOAD PROTOCOL INITIATED'}
           </h2>
           <h3 className="text-4xl text-white mb-12">OPERATIVE: <span className="text-fuchsia-400">{activeCharacter.name}</span></h3>
           {activeMinigameModifier && (
             <div className={`mb-8 px-6 py-3 rounded-lg border text-lg font-bold ${activeMinigameModifier.type === 'time' ? 'bg-rose-950/80 border-rose-700 text-rose-100' : activeMinigameModifier.type === 'consequence' ? 'bg-orange-950/80 border-orange-700 text-orange-100' : 'bg-cyan-950/80 border-cyan-700 text-cyan-100'}`}>
               <div className="text-xs uppercase tracking-[0.35em]">{activeMinigameDifficulty?.toUpperCase() || 'STANDARD'} MODIFIER</div>
               <div className="mt-1">{activeMinigameModifier.label} — {activeMinigameModifier.description}</div>
             </div>
           )}
           
           {activeMinigameType === 'overload' && (
             <div className="w-full bg-slate-900 border-4 border-red-900 h-24 rounded-full overflow-hidden relative shadow-[0_0_30px_rgba(220,38,38,0.5)]">
               <div 
                 className="h-full bg-red-600 transition-all duration-100 ease-out"
                 style={{ width: `${(minigameProgress / 15) * 100}%` }}
               ></div>
               <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white mix-blend-difference">
                  {minigameProgress} / 15 TAPS
               </div>
             </div>
           )}
           
           {activeMinigameType === 'deflect' && (
             <div className="w-full max-w-2xl bg-slate-900 border-4 border-blue-900 h-16 rounded-full flex items-center justify-center relative shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                <div className="text-2xl font-black text-blue-400 tracking-widest animate-pulse">AWAITING IMPACT...</div>
             </div>
           )}

           {activeMinigameType === 'bluff' && (
             <div className="w-full max-w-2xl bg-slate-900 border-4 border-amber-900 h-16 rounded-full flex items-center justify-center relative shadow-[0_0_30px_rgba(245,158,11,0.5)] overflow-hidden">
                <div className="absolute inset-0 bg-amber-900/30"></div>
                <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-amber-500/50 blur-xl animate-pulse"></div>
                <div className="absolute left-[70%] right-[15%] top-0 bottom-0 border-x-4 border-green-500 bg-green-500/20 z-10"></div>
                <div className="z-20 text-2xl font-black text-amber-400 tracking-widest drop-shadow-md animate-pulse">MAINTAINING RESOLVE...</div>
             </div>
           )}
        </div>
      )}

      {/* Active Dossier UI (Host) */}
      {activeDossierTarget && activeCharacter && (
        <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in zoom-in duration-300">
           <h2 className="text-6xl font-black mb-8 animate-pulse text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]">
             BIOMETRIC MONITORING
           </h2>
           <h3 className="text-4xl text-white mb-12">TARGET: <span className="text-emerald-400">{activeCharacter.name}</span></h3>
           
           <div className="w-full max-w-4xl bg-slate-900 border-4 border-emerald-900 h-48 rounded-lg relative shadow-[0_0_30px_rgba(16,185,129,0.5)] overflow-hidden flex flex-col items-center justify-center">
             <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(16, 185, 129, 0.3) 25%, rgba(16, 185, 129, 0.3) 26%, transparent 27%, transparent 74%, rgba(16, 185, 129, 0.3) 75%, rgba(16, 185, 129, 0.3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(16, 185, 129, 0.3) 25%, rgba(16, 185, 129, 0.3) 26%, transparent 27%, transparent 74%, rgba(16, 185, 129, 0.3) 75%, rgba(16, 185, 129, 0.3) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px' }}></div>
             
             <div className="text-6xl font-mono text-emerald-400 z-10 flex flex-col items-center">
               <span className="text-xl text-emerald-600 mb-2">HEART RATE // STRESS LEVEL</span>
               {dossierDisposition === 4 ? '60 BPM [OBEDIENT]' :
                dossierDisposition === 3 ? '85 BPM [COMPLIANT]' :
                dossierDisposition === 2 ? '110 BPM [NEUTRAL]' :
                dossierDisposition === 1 ? '145 BPM [HOSTILE]' :
                '180+ BPM [UNREASONABLE]'}
             </div>
             
             {/* Visual heartbeat line */}
             <div className="absolute bottom-0 w-full h-2 bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,1)] transition-all ease-linear" style={{
                transformOrigin: 'left',
                animation: `pulse ${dossierDisposition === 4 ? 2 : dossierDisposition === 3 ? 1.5 : dossierDisposition === 2 ? 1 : dossierDisposition === 1 ? 0.5 : 0.2}s infinite`
             }}></div>
             <style>{`
               @keyframes pulse {
                 0% { transform: scaleX(0); opacity: 1; }
                 50% { transform: scaleX(1); opacity: 1; }
                 100% { transform: scaleX(1); opacity: 0; }
               }
             `}</style>
           </div>
        </div>
      )}

      {/* Flash Draw UI */}
      {flashDrawState === 'prepare' && (
        <div className="fixed inset-0 z-40 bg-black/90 flex flex-col items-center justify-center animate-pulse">
           <div className="text-9xl font-black text-red-600 tracking-widest drop-shadow-[0_0_30px_rgba(220,38,38,1)]">
             READY...
           </div>
        </div>
      )}
      {flashDrawState === 'go' && (
        <div className="fixed inset-0 z-40 bg-black/90 flex flex-col items-center justify-center">
           <div className="text-9xl font-black text-green-500 tracking-widest animate-bounce drop-shadow-[0_0_50px_rgba(34,197,94,1)]">
             DRAW!
           </div>
        </div>
      )}
      {flashDrawState === 'results' && (
        <div className="fixed inset-0 z-40 bg-black/90 flex flex-col items-center pt-24 pb-8 overflow-y-auto">
           <h2 className="text-6xl font-black text-green-500 mb-12 tracking-widest">INITIATIVE QUEUE</h2>
           <div className="w-full max-w-4xl space-y-4">
             {initiativeQueue.map((entry, idx) => (
               <div key={idx} className={`p-6 rounded-lg border-2 flex justify-between items-center text-3xl font-bold ${entry.isEnemy ? 'bg-red-950/50 border-red-500 text-red-400' : 'bg-slate-800/80 border-cyan-500 text-cyan-300'}`}>
                 <div className="flex items-center gap-4">
                   <span className="text-slate-500 w-12">{idx + 1}.</span>
                   <span>{entry.name}</span>
                 </div>
                 <span className="font-mono">{entry.reactionTime}ms</span>
               </div>
             ))}
           </div>
           <p className="mt-12 text-slate-500 text-xl">Waiting for GM to resume operations...</p>
        </div>
      )}

      {/* Standard Host UI (Hidden during minigame or flash draw) */}
      {!activeMinigameTarget && !activeDossierTarget && !warningTarget && flashDrawState === 'idle' && (
        <>
          {activeCombatState && activeCombatState.queue.length > 0 && (
            <div className="absolute top-8 left-8 z-10 w-64 bg-slate-900/80 border border-slate-700 rounded-lg p-4 shadow-2xl backdrop-blur-sm">
              <h3 className="text-red-500 font-bold mb-3 border-b border-red-900 pb-1 text-sm tracking-widest">INITIATIVE</h3>
              <div className="space-y-2">
                {activeCombatState.queue.map((entry, idx) => (
                  <div key={idx} className={`p-2 rounded text-sm flex justify-between items-center transition-all ${idx === activeCombatState.activeIndex ? 'bg-red-600 text-white font-bold scale-105 border-l-4 border-white' : entry.isEnemy ? 'text-red-400 opacity-80' : 'text-cyan-400 opacity-80'}`}>
                    <span className="truncate pr-2">{idx + 1}. {entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className={`transition-all duration-1000 z-10 ${isGameReady ? 'absolute top-8 right-8 scale-50 origin-top-right border-none pb-0 mb-0' : 'mb-8 border-b-4 pb-8 w-full max-w-4xl'} ${!isGameReady && roomState === 'combat' ? 'border-red-500' : !isGameReady && roomState === 'overdrive' ? 'border-fuchsia-500' : !isGameReady ? 'border-cyan-500' : ''}`}>
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
          
          <div className={`transition-all duration-1000 z-10 w-full ${isGameReady ? 'absolute bottom-0 left-0 right-0 h-[35vh] flex flex-col items-center pt-8 px-8' : 'max-w-4xl'}`}>
            <div className={`w-full ${isGameReady ? 'max-w-7xl' : ''}`}>
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
                    <div className="text-xs text-amber-300 mt-2">BACKGROUND: {c.background || 'Unassigned'}</div>
                  </div>
                ))}
              </div>
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
  const [createBackground, setCreateBackground] = useState(backgroundOptions[0].id);
  const [showCreate, setShowCreate] = useState(false);

  // Minigame State
  const [warningState, setWarningState] = useState<string | null>(null);
  const [currentMinigameModifier, setCurrentMinigameModifier] = useState<any>(null);
  const [currentMinigameDifficulty, setCurrentMinigameDifficulty] = useState<string | null>(null);
  const [activeMinigame, setActiveMinigame] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(3000); // Dynamic based on stats
  const [minigameDuration, setMinigameDuration] = useState(3000);
  const [tapCount, setTapCount] = useState(0);
  const [mashOffset, setMashOffset] = useState({ x: 0, y: 0 });
  const [bluffTargetCenter, setBluffTargetCenter] = useState(50);
  const [bluffSuccessWindow, setBluffSuccessWindow] = useState(15);
  const [bluffCriticalWindow, setBluffCriticalWindow] = useState(7);
  const alertToneRef = React.useRef<any>(null);
  const tapCountRef = React.useRef(0);
  const minigameReportedRef = React.useRef(false);

  useEffect(() => {
    alertToneRef.current = new Audio('/sound/alert-beep.mp3');
    alertToneRef.current.preload = 'auto';
  }, []);

  const playAlertBeep = () => {
    const tone = alertToneRef.current;
    if (!tone) return;
    tone.currentTime = 0;
    tone.volume = 0.9;
    void tone.play().catch(() => {});
  };

  // Flash Draw State
  const [flashDrawState, setFlashDrawState] = useState<'idle' | 'prepare' | 'go' | 'results'>('idle');

  // Dossier State
  const [activeDossier, setActiveDossier] = useState(false);
  const [dossierDisposition, setDossierDisposition] = useState(2);
  const [dossierClues, setDossierClues] = useState<string[]>([]);
  const [dossierGuessedMotivation, setDossierGuessedMotivation] = useState(false);
  const [dossierGuessedFear, setDossierGuessedFear] = useState(false);

  const handleFlashDrawTap = () => {
    if (flashDrawState !== 'go') return;
    socket.emit('player:flash_draw_tap', {
      roomCode: character?.room_code || roomCode,
      deviceToken: getDeviceToken(),
      name: character?.name
    });
    setFlashDrawState('results');
  };

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
    const selectedBackground = backgroundOptions.find((bg) => bg.id === createBackground);
    
    const payload: any = {
      roomCode,
      deviceToken: token,
      background: selectedBackground?.label || ''
    };

    // If selectedProfileId exists, tell server to use that profile
    if (selectedProfileId) payload.profileId = selectedProfileId;
    else payload.name = name, payload.stats = { meat: stats.meat, mind: stats.mind, moxie: stats.moxie };

    socket.emit('player:join_room', payload, (res: any) => {
      if (res.success) {
        setJoined(true);
        // Merge persistent profile into character if present
        if (res.profile) {
          const merged = { ...res.character, background: res.profile.background || res.character.background || '', health: res.profile.health, max_health: res.profile.max_health, credits: res.profile.credits, gear: res.profile.gear, status_effects: res.profile.status_effects, notes: res.profile.notes };
          setCharacter(merged);
        } else {
          setCharacter(res.character);
        }
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
    const selectedBackground = backgroundOptions.find((bg) => bg.id === createBackground);
    socket.emit('player:create_profile', {
      deviceToken: token,
      name: createName || 'Unnamed',
      meat: stats.meat,
      mind: stats.mind,
      moxie: stats.moxie,
      background: selectedBackground?.label || '',
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
        setCreateBackground(backgroundOptions[0].id);
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
        if (data.targetDeviceToken === getDeviceToken()) {
          playAlertBeep();
          setWarningState(data.minigameType);
          setCurrentMinigameModifier(data.modifier || null);
          setCurrentMinigameDifficulty(data.difficultyTier || null);
        }
      });

      socket.on('room:minigame_started', (data) => {
        if (data.targetDeviceToken === getDeviceToken()) {
          let startingTime = 3000;
          
          if (data.minigameType === 'overload') {
            if (character) {
               if (character.mind >= 4) startingTime = 5500;
               else if (character.mind >= 2) startingTime = 4000;
            }
            setTapCount(0);
            setMashOffset({ x: 0, y: 0 });
            tapCountRef.current = 0;
          } else if (data.minigameType === 'deflect') {
            if (character) {
               if (character.meat >= 4) startingTime = 5000;
               else if (character.meat >= 2) startingTime = 3500;
               else startingTime = 2000;
            }
          }

          if (data.minigameType === 'bluff') {
            const modifierLabel = data.modifier?.label;
            const modifierMultiplier = modifierLabel === 'LOCKED ON' ? 0.55 : modifierLabel === 'STEADY HAND' ? 1.6 : 1;
            const successWindow = Math.max(8, Math.min(28, 15 * modifierMultiplier));
            const criticalWindow = Math.max(4, Math.min(16, 7 * modifierMultiplier));
            const randomCenter = Math.max(successWindow / 2, Math.min(100 - successWindow / 2, (Math.random() * (100 - successWindow)) + successWindow / 2));

            setBluffTargetCenter(randomCenter);
            setBluffSuccessWindow(successWindow);
            setBluffCriticalWindow(criticalWindow);
          } else {
            setBluffTargetCenter(50);
            setBluffSuccessWindow(15);
            setBluffCriticalWindow(7);
          }

          if (data.modifier?.type === 'time' && typeof data.modifier.durationMultiplier === 'number') {
            startingTime = Math.max(1000, Math.floor(startingTime * data.modifier.durationMultiplier));
          }
          
          setWarningState(null);
          setCurrentMinigameModifier(data.modifier || null);
          setCurrentMinigameDifficulty(data.difficultyTier || null);
          setActiveMinigame(data.minigameType);
          setMinigameDuration(startingTime);
          setTimeLeft(startingTime);
        }
      });

      socket.on('room:flash_draw_prepare', () => {
        playAlertBeep();
        setFlashDrawState('prepare');
      });

      socket.on('room:flash_draw_go', () => {
        setFlashDrawState('go');
      });

      socket.on('room:flash_draw_complete', () => {
        setFlashDrawState('idle');
      });

      socket.on('room:dossier_started', (data) => {
        if (data.targetDeviceToken === getDeviceToken()) {
          playAlertBeep();
          setActiveDossier(true);
          setDossierDisposition(data.disposition);
          setMinigameDuration(15000);
          setTimeLeft(15000);
          setDossierGuessedMotivation(false);
          setDossierGuessedFear(false);
        } else {
          setDossierClues(data.clues || []);
        }
      });

      socket.on('room:dossier_update', (data) => {
        setDossierDisposition(data.disposition);
        setDossierGuessedMotivation(data.guessedMotivation);
        setDossierGuessedFear(data.guessedFear);
        if (data.timePenalty) {
           setTimeLeft(prev => Math.max(100, prev - data.timePenalty));
        }
      });

      socket.on('room:minigame_result', () => {
         setCurrentMinigameModifier(null);
         setCurrentMinigameDifficulty(null);
         setActiveMinigame(null);
         setActiveDossier(false);
         setDossierClues([]);
      });

      return () => {
        socket.off('room:state_update');
        socket.off('room:minigame_warning');
        socket.off('room:minigame_started');
        socket.off('room:flash_draw_prepare');
        socket.off('room:flash_draw_go');
        socket.off('room:flash_draw_complete');
        socket.off('room:dossier_started');
        socket.off('room:dossier_update');
        socket.off('room:minigame_result');
      };
    }
  }, [joined]);

  // Minigame Timer Logic
  useEffect(() => {
    let timer: number;
    if ((activeMinigame || activeDossier) && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 100) {
            clearInterval(timer);
            // Time up logic handled here to ensure it fires once
            if (!minigameReportedRef.current) {
              minigameReportedRef.current = true;
              if (activeDossier && character) {
                 socket.emit('player:dossier_timeout', { roomCode: character.room_code, deviceToken: getDeviceToken() });
                 setTimeout(() => { minigameReportedRef.current = false; }, 1000);
              } else if (activeMinigame === 'overload') {
                const finalTaps = tapCountRef.current;
                let degreeOfSuccess = 'failure';
                if (finalTaps < 14) degreeOfSuccess = 'critical_failure';
                else if (finalTaps <= 16) degreeOfSuccess = 'failure';
                else if (finalTaps <= 19) degreeOfSuccess = 'mixed_success';
                else if (finalTaps <= 22) degreeOfSuccess = 'success';
                else degreeOfSuccess = 'critical_success';
                handleMinigameComplete(degreeOfSuccess);
              } else {
                 handleMinigameComplete('failure'); // Run out of time is a failure for all currently
              }
            }
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
    const modifier = currentMinigameModifier;
    const targetModifier = modifier?.type === 'target';
    const movementScale = targetModifier
      ? (modifier?.label === 'LOCKED ON' ? 34 : 10)
      : currentMinigameDifficulty === 'hard' ? 18 : currentMinigameDifficulty === 'easy' ? 8 : 12;
    const turbulence = targetModifier
      ? (modifier?.label === 'LOCKED ON' ? 20 : 5)
      : currentMinigameDifficulty === 'hard' ? 12 : currentMinigameDifficulty === 'easy' ? 4 : 8;
    const angle = (newCount * 73) % 360;
    const radians = angle * (Math.PI / 180);
    const nextOffset = {
      x: Math.cos(radians) * movementScale + Math.sin(newCount * 1.9) * turbulence,
      y: Math.sin(radians) * movementScale + Math.cos(newCount * 2.3) * turbulence
    };

    setTapCount(newCount);
    setMashOffset(nextOffset);
    tapCountRef.current = newCount;
    
    socket.emit('player:minigame_progress', {
      roomCode: character.room_code,
      deviceToken: getDeviceToken(),
      progress: newCount
    });
  };

  const handleDeflectTap = () => {
    if (activeMinigame !== 'deflect' || timeLeft <= 0 || minigameReportedRef.current) return;

    // Scale goes from 100 to 0
    const currentScale = (timeLeft / minigameDuration) * 100;

    let degreeOfSuccess = 'failure';
    // Target zone is visually centered around 40% scale
    if (currentScale >= 37 && currentScale <= 43) {
      degreeOfSuccess = 'critical_success';
    } else if (currentScale >= 34 && currentScale <= 46) {
      degreeOfSuccess = 'success';
    } else if (currentScale >= 30 && currentScale <= 50) {
      degreeOfSuccess = 'mixed_success';
    } else if (currentScale < 20 || currentScale > 60) {
      degreeOfSuccess = 'critical_failure';
    }

    minigameReportedRef.current = true;
    handleMinigameComplete(degreeOfSuccess);
  };

  const handleBluffTap = () => {
    if (activeMinigame !== 'bluff' || timeLeft <= 0 || minigameReportedRef.current) return;

    // Sweeps back and forth 3 times over the duration
    const sweep = Math.abs(Math.sin((timeLeft / minigameDuration) * Math.PI * 3)) * 100;
    const absoluteError = Math.abs(sweep - bluffTargetCenter);

    let degreeOfSuccess = 'failure';
    if (absoluteError <= bluffCriticalWindow / 2) {
      degreeOfSuccess = 'critical_success';
    } else if (absoluteError <= bluffSuccessWindow / 2) {
      degreeOfSuccess = 'success';
    } else if (absoluteError <= Math.max(bluffSuccessWindow / 2 + 8, bluffCriticalWindow / 2 + 10)) {
      degreeOfSuccess = 'mixed_success';
    }

    minigameReportedRef.current = true;
    handleMinigameComplete(degreeOfSuccess);
  };
  const handleMinigameComplete = (degreeOfSuccess: string) => {
    setActiveMinigame(null);
    setMashOffset({ x: 0, y: 0 });
    socket.emit('player:minigame_complete', {
      roomCode: character.room_code,
      deviceToken: getDeviceToken(),
      success: degreeOfSuccess === 'success' || degreeOfSuccess === 'critical_success' || degreeOfSuccess === 'mixed_success',
      degreeOfSuccess
    });
    // Reset reported flag shortly after to allow future minigames
    setTimeout(() => { minigameReportedRef.current = false; }, 1000);
  };

  if (joined) {
    if (flashDrawState === 'prepare') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-red-900 border-8 border-red-500 animate-pulse duration-75">
          <div className="text-6xl font-black text-white mb-6 text-center tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.9)]">
            READY...
          </div>
        </div>
      );
    }

    if (flashDrawState === 'go') {
      return (
        <div 
          className="flex flex-col items-center justify-center min-h-screen p-6 bg-green-500 cursor-pointer active:bg-green-600 transition-colors"
          onPointerDown={handleFlashDrawTap}
        >
          <div className="text-6xl font-black text-white text-center tracking-widest drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            DRAW!
          </div>
          <p className="mt-8 text-white/80 font-bold">TAP ANYWHERE</p>
        </div>
      );
    }

    if (flashDrawState === 'results') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-900">
          <div className="text-3xl font-black text-cyan-400 mb-6 text-center tracking-widest">
            LATENCY LOGGED
          </div>
          <p className="text-xl text-slate-400 font-bold text-center">CHECK MAIN SCREEN FOR INITIATIVE QUEUE</p>
        </div>
      );
    }

    if (warningState === 'overload') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-red-950/90 border-8 border-red-600 animate-pulse duration-75">
          <h2 className="text-5xl font-black text-red-500 mb-6 text-center drop-shadow-[0_0_20px_rgba(220,38,38,0.9)]">⚠️ INCOMING ⚠️</h2>
          <div className="text-3xl font-bold text-white text-center tracking-widest mt-8">
            BLUFF<br/>DETECTED
          </div>
          <div className="mt-12 text-xl text-red-300 tracking-[0.2em] animate-bounce">
            PREPARE TO OVERLOAD
          </div>
          {currentMinigameModifier && (
            <div className="mt-10 max-w-2xl rounded border border-red-500/40 bg-black/50 px-6 py-4 text-center backdrop-blur">
              <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">DIFFICULTY · {currentMinigameDifficulty?.toUpperCase() || 'STANDARD'}</div>
              <div className="mt-2 text-2xl font-bold text-white">{currentMinigameModifier.label}</div>
              <div className="mt-1 text-sm text-slate-200">{currentMinigameModifier.description}</div>
            </div>
          )}
        </div>
      );
    }

    if (warningState === 'deflect') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-blue-950/90 border-8 border-blue-600 animate-pulse duration-75">
          <h2 className="text-5xl font-black text-blue-500 mb-6 text-center drop-shadow-[0_0_20px_rgba(59,130,246,0.9)]">⚠️ INCOMING ⚠️</h2>
          <div className="text-3xl font-bold text-white text-center tracking-widest mt-8">
            DEFLECT<br/>DETECTED
          </div>
          <div className="mt-12 text-xl text-blue-300 tracking-[0.2em] animate-bounce">
            PREPARE TO DEFLECT
          </div>
          {currentMinigameModifier && (
            <div className="mt-10 max-w-2xl rounded border border-blue-500/40 bg-black/50 px-6 py-4 text-center backdrop-blur">
              <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">DIFFICULTY · {currentMinigameDifficulty?.toUpperCase() || 'STANDARD'}</div>
              <div className="mt-2 text-2xl font-bold text-white">{currentMinigameModifier.label}</div>
              <div className="mt-1 text-sm text-slate-200">{currentMinigameModifier.description}</div>
            </div>
          )}
        </div>
      );
    }

    if (warningState === 'bluff') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-amber-950/90 border-8 border-amber-600 animate-pulse duration-75">
          <h2 className="text-5xl font-black text-amber-500 mb-6 text-center drop-shadow-[0_0_20px_rgba(245,158,11,0.9)]">⚠️ INCOMING ⚠️</h2>
          <div className="text-3xl font-bold text-white text-center tracking-widest mt-8">
            BLUFF<br/>DETECTED
          </div>
          <div className="mt-12 text-xl text-amber-300 tracking-[0.2em] animate-bounce">
            MAINTAIN RESOLVE
          </div>
          {currentMinigameModifier && (
            <div className="mt-10 max-w-2xl rounded border border-amber-500/40 bg-black/50 px-6 py-4 text-center backdrop-blur">
              <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">DIFFICULTY · {currentMinigameDifficulty?.toUpperCase() || 'STANDARD'}</div>
              <div className="mt-2 text-2xl font-bold text-white">{currentMinigameModifier.label}</div>
              <div className="mt-1 text-sm text-slate-200">{currentMinigameModifier.description}</div>
            </div>
          )}
        </div>
      );
    }

    if (activeMinigame === 'overload') {
      const overloadColor = tapCount < 8 ? '#ef4444' : tapCount < 16 ? '#fb7185' : tapCount < 24 ? '#f59e0b' : '#22c55e';
      const overloadBorder = tapCount < 8 ? '#fda4af' : tapCount < 16 ? '#fecdd3' : tapCount < 24 ? '#fde68a' : '#86efac';
      const overloadGlow = tapCount < 8 ? 'rgba(248,113,113,0.9)' : tapCount < 16 ? 'rgba(244,114,182,0.95)' : tapCount < 24 ? 'rgba(251,191,36,0.95)' : 'rgba(74,222,128,0.95)';
      const pulseScale = 1 + Math.min(0.25, tapCount * 0.012);

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-red-950">
          <h2 className="text-4xl font-black text-red-500 mb-2 animate-pulse">OVERLOAD</h2>
          <div className="text-xl font-bold text-white mb-2">TIME: {(timeLeft / 1000).toFixed(1)}s</div>
          {currentMinigameModifier && (
            <div className="mb-6 rounded border border-red-500/30 bg-black/40 px-4 py-2 text-center backdrop-blur">
              <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">{currentMinigameDifficulty?.toUpperCase() || 'STANDARD'} MODIFIER</div>
              <div className="mt-1 text-sm font-bold text-white">{currentMinigameModifier.label} — {currentMinigameModifier.description}</div>
            </div>
          )}
          
          <div className="relative w-80 h-80 rounded-full border border-red-400/30 bg-red-950/60 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(127,29,29,0.55)]">
            <div className="absolute inset-3 rounded-full border border-red-500/20"></div>
            <button 
              onPointerDown={handleTap}
              className="absolute w-40 h-40 rounded-full flex items-center justify-center select-none transition-all duration-75 ease-out"
              style={{
                transform: `translate(${mashOffset.x}px, ${mashOffset.y}px) scale(${pulseScale})`,
                backgroundColor: overloadColor,
                border: `8px solid ${overloadBorder}`,
                boxShadow: `0 0 ${24 + tapCount * 1.5}px ${overloadGlow}, inset 0 0 16px rgba(255,255,255,0.25)`
              }}
            >
              <span className="text-5xl font-black text-white">{tapCount}</span>
            </button>
          </div>
          
          <p className="mt-12 text-slate-300 text-lg text-center">MASH THE MOVING CORE!</p>
        </div>
      );
    }

    if (activeMinigame === 'deflect') {
      const currentScale = (timeLeft / minigameDuration) * 100;
      return (
        <div 
          className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 cursor-pointer"
          onPointerDown={handleDeflectTap}
        >
          <h2 className="text-4xl font-black text-blue-500 mb-2 animate-pulse">DEFLECT</h2>
          <div className="text-xl font-bold text-white mb-2">TIME: {(timeLeft / 1000).toFixed(1)}s</div>
          {currentMinigameModifier && (
            <div className="mb-6 rounded border border-blue-500/30 bg-black/40 px-4 py-2 text-center backdrop-blur">
              <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">{currentMinigameDifficulty?.toUpperCase() || 'STANDARD'} MODIFIER</div>
              <div className="mt-1 text-sm font-bold text-white">{currentMinigameModifier.label} — {currentMinigameModifier.description}</div>
            </div>
          )}
          
          <div className="relative w-80 h-80 flex items-center justify-center">
             {/* Mixed success bounds (30% to 50%) */}
             <div className="absolute rounded-full border-green-500/20 pointer-events-none" style={{ width: '50%', height: '50%', borderWidth: '32px' }}></div>
             {/* Target Zone (Critical Success 37% to 43%) */}
             <div className="absolute rounded-full border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.8)] pointer-events-none" style={{ width: '43%', height: '43%', borderWidth: '9px' }}></div>
             
             {/* The Shrinking Arc */}
             <div 
               className="absolute rounded-full border-[12px] border-blue-400 shadow-[0_0_30px_rgba(96,165,250,0.8)] pointer-events-none transition-all duration-100 ease-linear"
               style={{
                 width: `${Math.max(0, currentScale)}%`,
                 height: `${Math.max(0, currentScale)}%`,
               }}
             ></div>
             
             <div className="w-4 h-4 bg-white rounded-full pointer-events-none"></div>
          </div>
          
          <p className="mt-12 text-slate-400 text-lg">TAP WHEN RINGS ALIGN!</p>
        </div>
      );
    }

    if (activeMinigame === 'bluff') {
      const sweep = Math.abs(Math.sin((timeLeft / minigameDuration) * Math.PI * 3)) * 100;
      const successLeft = Math.max(0, bluffTargetCenter - bluffSuccessWindow / 2);
      const successWidth = Math.min(bluffSuccessWindow, 100 - successLeft);
      const criticalLeft = Math.max(0, bluffTargetCenter - bluffCriticalWindow / 2);
      const criticalWidth = Math.min(bluffCriticalWindow, 100 - criticalLeft);
      return (
        <div 
          className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 cursor-pointer"
          onPointerDown={handleBluffTap}
        >
          <h2 className="text-4xl font-black text-amber-500 mb-2 animate-pulse">RESOLVE</h2>
          <div className="text-xl font-bold text-white mb-2">TIME: {(timeLeft / 1000).toFixed(1)}s</div>
          {currentMinigameModifier && (
            <div className="mb-6 rounded border border-amber-500/30 bg-black/40 px-4 py-2 text-center backdrop-blur">
              <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">{currentMinigameDifficulty?.toUpperCase() || 'STANDARD'} MODIFIER</div>
              <div className="mt-1 text-sm font-bold text-white">{currentMinigameModifier.label} — {currentMinigameModifier.description}</div>
            </div>
          )}
          
          <div className="relative w-full max-w-sm h-16 bg-amber-950 rounded-full border-4 border-amber-900 overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.5)]">
             <div 
               className="absolute top-0 bottom-0 bg-green-500/20 border-x-2 border-green-500/50"
               style={{ left: `${successLeft}%`, width: `${successWidth}%` }}
             ></div>
             <div 
               className="absolute top-0 bottom-0 bg-green-400/60 border-x-4 border-green-400"
               style={{ left: `${criticalLeft}%`, width: `${criticalWidth}%` }}
             ></div>
             
             {/* Moving Bar */}
             <div 
               className="absolute top-0 bottom-0 w-4 bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,1)] transition-all duration-75"
               style={{ left: `calc(${Math.min(95, Math.max(0, sweep))}% - 8px)` }}
             ></div>
          </div>
          
          <p className="mt-12 text-slate-400 text-lg text-center">TAP IN THE GREEN ZONE<br/>TO MAINTAIN RESOLVE!</p>
        </div>
      );
    }

    if (activeDossier && character) {
      return (
        <div className="flex flex-col items-center min-h-screen p-6 bg-slate-950 w-full overflow-y-auto">
          <h2 className="text-4xl font-black text-emerald-500 mb-2 animate-pulse">SOCIAL ENGINEERING</h2>
          <div className="text-xl font-bold text-white mb-4">TIME: {(timeLeft / 1000).toFixed(1)}s</div>
          
          <div className="text-emerald-400 font-bold mb-6 border border-emerald-900 bg-emerald-950/30 p-2 rounded w-full max-w-md text-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
             DISPOSITION: {dossierDisposition === 4 ? 'OBEDIENT' : dossierDisposition === 3 ? 'COMPLIANT' : dossierDisposition === 2 ? 'NEUTRAL' : dossierDisposition === 1 ? 'HOSTILE' : 'UNREASONABLE'}
          </div>

          <div className="w-full max-w-md space-y-4 pb-8">
             {!dossierGuessedMotivation && (
               <div className="space-y-2">
                 <h3 className="text-emerald-300 font-bold border-b border-emerald-900 pb-1">MOTIVATION ACTIONS</h3>
                 <button onClick={() => socket.emit('player:dossier_action', { roomCode: character.room_code, deviceToken: getDeviceToken(), actionType: 'motivation', actionValue: 'money' })} className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded text-left border border-slate-700 transition-colors">Offer a Bribe</button>
                 <button onClick={() => socket.emit('player:dossier_action', { roomCode: character.room_code, deviceToken: getDeviceToken(), actionType: 'motivation', actionValue: 'fame' })} className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded text-left border border-slate-700 transition-colors">Promise Exposure & Glory</button>
                 <button onClick={() => socket.emit('player:dossier_action', { roomCode: character.room_code, deviceToken: getDeviceToken(), actionType: 'motivation', actionValue: 'altruism' })} className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded text-left border border-slate-700 transition-colors">Appeal to the Greater Good</button>
                 <button onClick={() => socket.emit('player:dossier_action', { roomCode: character.room_code, deviceToken: getDeviceToken(), actionType: 'motivation', actionValue: 'obedience' })} className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded text-left border border-slate-700 transition-colors">Invoke Corporate Authority</button>
               </div>
             )}
             {dossierGuessedMotivation && <div className="text-emerald-500 font-bold p-4 bg-emerald-950/50 rounded border border-emerald-900 text-center animate-pulse">MOTIVATION LEVERAGED</div>}
             
             {!dossierGuessedFear && (
               <div className="space-y-2 mt-4">
                 <h3 className="text-emerald-300 font-bold border-b border-emerald-900 pb-1">FEAR ACTIONS</h3>
                 <button onClick={() => socket.emit('player:dossier_action', { roomCode: character.room_code, deviceToken: getDeviceToken(), actionType: 'fear', actionValue: 'violence' })} className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded text-left border border-slate-700 transition-colors">Threaten Physical Harm</button>
                 <button onClick={() => socket.emit('player:dossier_action', { roomCode: character.room_code, deviceToken: getDeviceToken(), actionType: 'fear', actionValue: 'ostracism' })} className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded text-left border border-slate-700 transition-colors">Threaten Social Exile</button>
                 <button onClick={() => socket.emit('player:dossier_action', { roomCode: character.room_code, deviceToken: getDeviceToken(), actionType: 'fear', actionValue: 'exposure' })} className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded text-left border border-slate-700 transition-colors">Blackmail with Secrets</button>
                 <button onClick={() => socket.emit('player:dossier_action', { roomCode: character.room_code, deviceToken: getDeviceToken(), actionType: 'fear', actionValue: 'poverty' })} className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded text-left border border-slate-700 transition-colors">Threaten Financial Ruin</button>
               </div>
             )}
             {dossierGuessedFear && <div className="text-emerald-500 font-bold p-4 bg-emerald-950/50 rounded border border-emerald-900 text-center animate-pulse">FEAR LEVERAGED</div>}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center p-6 min-h-screen">
        <div className="w-full max-w-md border-b-2 border-fuchsia-500 pb-4 mb-6">
          <h1 className="text-3xl font-bold">{character?.name}</h1>
          <div className="mt-2 text-sm text-amber-200">BACKGROUND: {character?.background || 'Unassigned'}</div>
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
          {/* Player-side auto-lose removed; controlled by GM */}
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
          {dossierClues.length > 0 && flashDrawState === 'idle' && !activeDossier && !activeMinigame && (
             <div className="animate-pulse text-emerald-400 font-bold border-2 border-emerald-500 p-6 rounded text-left w-full bg-emerald-950/30 mt-4 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
               <h3 className="text-emerald-500 border-b border-emerald-900 pb-2 mb-4 tracking-widest">INTERCEPTED INTEL<br/><span className="text-xs text-white">SHOUT THIS TO YOUR CREW!</span></h3>
               <ul className="list-disc pl-4 space-y-3 text-sm text-emerald-200 font-mono">
                 {dossierClues.map((c, i) => <li key={i}>{c}</li>)}
               </ul>
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
                <div className="mt-3 border-t border-slate-700 pt-3">
                  <div className="text-sm font-bold text-fuchsia-300 mb-2">Choose a Background</div>
                  <div className="grid grid-cols-1 gap-2">
                    {backgroundOptions.map((background) => (
                      <label key={background.id} className={`p-2 rounded border cursor-pointer transition-all ${createBackground === background.id ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 bg-slate-900 hover:border-slate-500'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="createBackground" value={background.id} checked={createBackground === background.id} onChange={() => setCreateBackground(background.id)} className="hidden" />
                          <div className="flex-1">
                            <div className="font-bold text-amber-300">{background.label}</div>
                            <div className="text-xs text-slate-400 mt-1">{background.description}</div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
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
              {profiles.map((p) => (
                <div key={p.id} className={`flex items-center justify-between p-2 rounded hover:bg-slate-800 ${selectedProfileId === p.id ? 'ring-2 ring-fuchsia-500' : ''}`}>
                  <div>
                    <div className="font-bold">{p.name || 'Unnamed'}</div>
                    <div className="text-xs text-slate-400">MEAT:{p.meat} MIND:{p.mind} MOXIE:{p.moxie}</div>
                    <div className="text-xs text-amber-300 mt-1">BACKGROUND: {p.background || 'Unassigned'}</div>
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
  const [gmMessage, setGmMessage] = useState<{text: string, type: 'error' | 'info'} | null>(null);

  const [flashDrawState, setFlashDrawState] = useState<'idle' | 'prepare' | 'go' | 'results'>('idle');
  const [selectedDifficultyTier, setSelectedDifficultyTier] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [activeCombatState, setActiveCombatState] = useState<{queue: any[], activeIndex: number} | null>(null);
  const [dossierSetup, setDossierSetup] = useState<{ [key: string]: { disposition: string, motivation: string, fear: string } }>({});

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
      socket.on('room:flash_draw_prepare', () => setFlashDrawState('prepare'));
      socket.on('room:flash_draw_go', () => setFlashDrawState('go'));
      socket.on('room:flash_draw_results', () => setFlashDrawState('results'));
      socket.on('room:flash_draw_complete', () => setFlashDrawState('idle'));
      socket.on('room:combat_queue_update', (data) => setActiveCombatState(data));

      return () => {
        socket.off('room:state_update');
        socket.off('room:flash_draw_prepare');
        socket.off('room:flash_draw_go');
        socket.off('room:flash_draw_results');
        socket.off('room:flash_draw_complete');
        socket.off('room:combat_queue_update');
      };
    }
  }, [joined]);

  const gmSetAutoLose = (targetDeviceToken: string, enabled: boolean) => {
    socket.emit('gm:set_auto_lose', { roomCode, deviceToken: targetDeviceToken, enabled }, (res: any) => {
      if (!res || !res.success) {
        const msg = (res && res.message) || 'Failed to set auto-lose';
        setGmMessage({ text: msg, type: 'error' });
        setTimeout(() => setGmMessage(null), 4000);
      }
    });
  };

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
      {gmMessage && (
        <div className={`mb-4 p-3 rounded ${gmMessage.type === 'error' ? 'bg-red-800 text-white' : 'bg-slate-800 text-white'}`}>
          {gmMessage.text}
        </div>
      )}

      {roomState === 'combat' && (
        <div className="mb-6 p-4 bg-red-950/50 border border-red-900 rounded-lg flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-red-500">INITIATIVE PROTOCOL</h2>
              <p className="text-sm text-slate-400">Test reaction times to establish turn order.</p>
            </div>
            
            {!activeCombatState && flashDrawState === 'idle' && (
              <button 
                onClick={() => {
                  socket.emit('gm:start_flash_draw', { roomCode }, (res: any) => {
                    if (!res || !res.success) {
                       setGmMessage({ text: 'Failed to start flash draw', type: 'error' });
                       setTimeout(() => setGmMessage(null), 4000);
                    }
                  });
                }}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded animate-pulse"
              >
                TRIGGER FLASH DRAW
              </button>
            )}

            {flashDrawState === 'results' && (
              <button 
                onClick={() => {
                  socket.emit('gm:confirm_initiative', { roomCode });
                }}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded animate-pulse"
              >
                APPROVE INITIATIVE
              </button>
            )}
            
            {flashDrawState !== 'idle' && flashDrawState !== 'results' && (
              <div className="text-red-500 font-bold animate-pulse">AWAITING DRAW...</div>
            )}
          </div>
          
          {activeCombatState && activeCombatState.queue.length > 0 && (
            <div className="mt-4 border-t border-red-900 pt-4">
              <h3 className="text-sm text-red-400 font-bold mb-2">ACTIVE COMBAT QUEUE</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {activeCombatState.queue.map((entry, idx) => (
                  <div key={idx} className={`px-3 py-1 rounded text-sm font-bold ${idx === activeCombatState.activeIndex ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {idx + 1}. {entry.name}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => socket.emit('gm:next_turn', { roomCode })}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 font-bold rounded text-sm"
                >
                  NEXT TURN
                </button>
                <button 
                  onClick={() => socket.emit('gm:clear_initiative', { roomCode })}
                  className="px-4 py-2 bg-red-950 hover:bg-red-900 text-red-500 font-bold rounded text-sm border border-red-900"
                >
                  CLEAR QUEUE
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mb-6 bg-slate-900 border border-cyan-900 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-cyan-300 text-xs font-bold uppercase tracking-[0.3em]">MINIGAME DIFFICULTY</div>
            <p className="text-sm text-slate-400 mt-1">Each trigger rolls a fresh modifier from the selected tier.</p>
          </div>
          <div className="inline-flex rounded-full bg-slate-800 p-1">
            {(['easy', 'medium', 'hard'] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setSelectedDifficultyTier(tier)}
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors ${selectedDifficultyTier === tier ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {characters.map((c, i) => (
          <div key={i} className={`bg-slate-800 p-4 rounded-lg border border-slate-700 ${c.is_online === 0 ? 'opacity-40 grayscale' : ''}`}>
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
            <div className="mt-4 pt-4 border-t border-slate-700 flex flex-col gap-2">
              <button 
                onClick={() => {
                  socket.emit('gm:start_minigame', {
                    roomCode,
                    targetDeviceToken: c.device_token,
                    minigameType: 'overload',
                    difficultyTier: selectedDifficultyTier
                  }, (res: any) => {
                    if (!res || !res.success) {
                      const msg = (res && res.message) || 'Failed to start minigame';
                      setGmMessage({ text: msg, type: 'error' });
                      setTimeout(() => setGmMessage(null), 4000);
                    }
                  });
                }}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded text-sm transition-colors"
                disabled={c.is_online === 0}
              >
                TRIGGER OVERLOAD (MIND)
              </button>
              
              <button 
                onClick={() => {
                  socket.emit('gm:start_minigame', {
                    roomCode,
                    targetDeviceToken: c.device_token,
                    minigameType: 'deflect',
                    difficultyTier: selectedDifficultyTier
                  }, (res: any) => {
                    if (!res || !res.success) {
                      const msg = (res && res.message) || 'Failed to start minigame';
                      setGmMessage({ text: msg, type: 'error' });
                      setTimeout(() => setGmMessage(null), 4000);
                    }
                  });
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded text-sm transition-colors"
                disabled={c.is_online === 0}
              >
                TRIGGER DEFLECT (MEAT)
              </button>

              <button 
                onClick={() => {
                  socket.emit('gm:start_minigame', {
                    roomCode,
                    targetDeviceToken: c.device_token,
                    minigameType: 'bluff',
                    difficultyTier: selectedDifficultyTier
                  }, (res: any) => {
                    if (!res || !res.success) {
                      const msg = (res && res.message) || 'Failed to start minigame';
                      setGmMessage({ text: msg, type: 'error' });
                      setTimeout(() => setGmMessage(null), 4000);
                    }
                  });
                }}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded text-sm transition-colors"
                disabled={c.is_online === 0}
              >
                TRIGGER BLUFF (MOXIE)
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700">
               <h4 className="text-emerald-500 font-bold mb-2">TRIGGER DOSSIER (MOXIE)</h4>
               <div className="space-y-2">
                 <select 
                   value={dossierSetup[c.device_token]?.disposition || '2'} 
                   onChange={e => setDossierSetup(s => ({...s, [c.device_token]: {...(s[c.device_token] || { motivation: 'money', fear: 'violence' }), disposition: e.target.value}}))} 
                   className="w-full bg-slate-900 border border-slate-600 text-white p-2 rounded text-sm"
                 >
                   <option value="4">Obedient</option>
                   <option value="3">Compliant</option>
                   <option value="2">Neutral</option>
                   <option value="1">Hostile</option>
                   <option value="0">Unreasonable</option>
                 </select>
                 <select 
                   value={dossierSetup[c.device_token]?.motivation || 'money'} 
                   onChange={e => setDossierSetup(s => ({...s, [c.device_token]: {...(s[c.device_token] || { disposition: '2', fear: 'violence' }), motivation: e.target.value}}))} 
                   className="w-full bg-slate-900 border border-slate-600 text-white p-2 rounded text-sm"
                 >
                   <option value="money">Money</option>
                   <option value="fame">Fame</option>
                   <option value="altruism">Altruism</option>
                   <option value="obedience">Obedience</option>
                 </select>
                 <select 
                   value={dossierSetup[c.device_token]?.fear || 'violence'} 
                   onChange={e => setDossierSetup(s => ({...s, [c.device_token]: {...(s[c.device_token] || { disposition: '2', motivation: 'money' }), fear: e.target.value}}))} 
                   className="w-full bg-slate-900 border border-slate-600 text-white p-2 rounded text-sm"
                 >
                   <option value="violence">Violence</option>
                   <option value="ostracism">Ostracism</option>
                   <option value="exposure">Exposure</option>
                   <option value="poverty">Poverty</option>
                 </select>
                 <button 
                   onClick={() => {
                     const setup = dossierSetup[c.device_token] || { disposition: '2', motivation: 'money', fear: 'violence' };
                     socket.emit('gm:start_dossier', {
                       roomCode,
                       targetDeviceToken: c.device_token,
                       disposition: setup.disposition,
                       motivation: setup.motivation,
                       fear: setup.fear
                     }, (res: any) => {
                       if (!res || !res.success) {
                         const msg = (res && res.message) || 'Failed to start minigame';
                         setGmMessage({ text: msg, type: 'error' });
                         setTimeout(() => setGmMessage(null), 4000);
                       }
                     });
                   }}
                   className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-sm transition-colors"
                   disabled={c.is_online === 0}
                 >
                   START DOSSIER HACK
                 </button>
               </div>
            </div>

            <div className="mt-4 flex gap-2 items-center border-t border-slate-700 pt-4">
              <button className="w-12 h-10 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-sm" onClick={() => {
                const cur = Number(c.health || 0);
                const num = Math.max(0, cur - 1);
                socket.emit('gm:set_player_health', { roomCode, deviceToken: c.device_token, newHealth: num }, (res: any) => {
                  if (!res || !res.success) {
                    const msg = (res && res.message) || 'Failed to set HP';
                    setGmMessage({ text: msg, type: 'error' });
                    setTimeout(() => setGmMessage(null), 4000);
                  }
                });
              }}>-</button>
              <div className="text-sm text-slate-300">HP: {c.health}/{c.max_health || 3}</div>
              <button className="w-12 h-10 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-sm" onClick={() => {
                const cur = Number(c.health || 0);
                const num = Math.min(c.max_health || 3, cur + 1);
                socket.emit('gm:set_player_health', { roomCode, deviceToken: c.device_token, newHealth: num }, (res: any) => {
                  if (!res || !res.success) {
                    const msg = (res && res.message) || 'Failed to set HP';
                    setGmMessage({ text: msg, type: 'error' });
                    setTimeout(() => setGmMessage(null), 4000);
                  }
                });
              }}>+</button>

              <label className="flex items-center gap-2 text-slate-300 ml-4">
                <input type="checkbox" checked={Number(c.auto_lose_on_fail) === 1} onChange={e => gmSetAutoLose(c.device_token, e.target.checked)} />
                <span className="text-xs">Auto-lose</span>
              </label>
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

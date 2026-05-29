import React from 'react';

const StaticLayer = ({ src }: { src: string }) => (
  <div className="absolute inset-0" style={{ backgroundImage: `url(${src})`, backgroundSize: 'auto 100%', backgroundPosition: 'bottom left', backgroundRepeat: 'repeat-x' }} />
);

const ScrollingLayer = ({ src, speedClass }: { src: string; speedClass: string }) => (
  <div className={`absolute inset-0 flex w-max ${speedClass}`}>
    {[1, 2, 3, 4].map(i => (
      <img key={i} src={src} className="h-full w-auto max-w-none pointer-events-none" alt="" />
    ))}
  </div>
);

export default function CityBackground() {
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
      <div className="absolute inset-0 mix-blend-screen overflow-hidden">
        <div className="absolute -top-[50%] -left-[50%] -right-[50%] h-[200%] rain-drop-layer" style={{ backgroundImage: `url("${rainSvg}")`, backgroundSize: '100px 100px', transform: 'rotate(15deg)' }} />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(180deg, rgba(34,211,238,0) 0%, rgba(34,211,238,0.5) 50%, rgba(34,211,238,0) 100%)', backgroundSize: '100% 200%', animation: 'rain-scan 2s linear infinite' }} />
      </div>
      <style>{`
        @keyframes rain-scan { 0% { background-position: 0% -100%; } 100% { background-position: 0% 100%; } }
        @keyframes rain-fall { from { background-position: 0 0; } to { background-position: 0 100px; } }
        .rain-drop-layer { animation: rain-fall 0.3s linear infinite; }
        @keyframes scroll-left { 0% { transform: translateX(0); } 100% { transform: translateX(-25%); } }
        .animate-cloud-slow { animation: scroll-left 120s linear infinite; }
        .animate-cloud-fast { animation: scroll-left 80s linear infinite; }
      `}</style>
    </div>
  );
}

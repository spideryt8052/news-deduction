import React, { useEffect, useRef, useState } from 'react';
import { 
  MessageSquare, 
  Newspaper, 
  Globe2, 
  Image as ImageIcon, 
  FileText, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const MEDIA_TOKENS = [
  { label: 'WhatsApp', desc: 'Viral Forwards', icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { label: 'Breaking News', desc: 'Headlines & Reports', icon: Newspaper, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  { label: 'Article Links', desc: 'Web Stories', icon: Globe2, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { label: 'Screenshots', desc: 'Social Media Posts', icon: ImageIcon, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { label: 'Voice Notes', desc: 'Audio Rumors', icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { label: 'Fact Checks', desc: 'Verified Sources', icon: ShieldCheck, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
];

export default function GlobeVisual() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [cards, setCards] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Canvas globe rendering loop - warm, elegant Earth aesthetic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let rotation = 0;

    const size = isMobile ? 270 : 350;
    canvas.width = size * window.devicePixelRatio;
    canvas.height = size * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = isMobile ? 85 : 110;

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      // 1. Warm Atmospheric Outer Halo
      const haloGrad = ctx.createRadialGradient(
        centerX, centerY, radius * 0.75,
        centerX, centerY, radius * 1.35
      );
      haloGrad.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
      haloGrad.addColorStop(0.5, 'rgba(37, 99, 235, 0.08)');
      haloGrad.addColorStop(1, 'rgba(11, 15, 25, 0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // 2. Deep Blue Earth Ocean Sphere
      const oceanGrad = ctx.createRadialGradient(
        centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.15,
        centerX, centerY, radius
      );
      oceanGrad.addColorStop(0, '#1e293b');
      oceanGrad.addColorStop(0.4, '#0f172a');
      oceanGrad.addColorStop(0.85, '#090d16');
      oceanGrad.addColorStop(1, '#05070c');

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = oceanGrad;
      ctx.fill();
      ctx.clip(); // Clip contents to sphere

      // 3. Subtle Latitude Rings
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += 30) {
        const radLat = (lat * Math.PI) / 180;
        const y = centerY + Math.sin(radLat) * radius;
        const rLat = Math.cos(radLat) * radius;
        ctx.beginPath();
        ctx.ellipse(centerX, y, rLat, rLat * 0.22, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4. Rotating Longitude Meridians
      for (let lon = 0; lon < 180; lon += 30) {
        const radLon = ((lon + rotation) * Math.PI) / 180;
        const xOffset = Math.sin(radLon) * radius;
        ctx.beginPath();
        ctx.ellipse(centerX + xOffset * 0.5, centerY, Math.abs(xOffset), radius, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
        ctx.stroke();
      }

      // 5. Global Fact-Check Beacon Points (Cities / News Centers)
      const cities = [
        { lat: 28.6, lon: 77.2, label: 'New Delhi' },
        { lat: 51.5, lon: -0.1, label: 'London' },
        { lat: 40.7, lon: -74.0, label: 'New York' },
        { lat: 35.6, lon: 139.6, label: 'Tokyo' },
        { lat: -33.8, lon: 151.2, label: 'Sydney' },
        { lat: -23.5, lon: -46.6, label: 'São Paulo' },
        { lat: 1.35, lon: 103.8, label: 'Singapore' },
        { lat: 25.2, lon: 55.2, label: 'Dubai' },
      ];

      cities.forEach((city, idx) => {
        const radLon = ((city.lon + rotation * 1.5) * Math.PI) / 180;
        const radLat = (city.lat * Math.PI) / 180;

        // Front-facing test
        const cosLon = Math.cos(radLon);
        if (cosLon > 0) {
          const x = centerX + Math.sin(radLon) * Math.cos(radLat) * radius;
          const y = centerY - Math.sin(radLat) * radius * 0.85;

          // Pulse dot
          ctx.fillStyle = idx % 2 === 0 ? 'rgba(56, 189, 248, 0.85)' : 'rgba(52, 211, 153, 0.85)';
          ctx.beginPath();
          ctx.arc(x, y, isMobile ? 2 : 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Soft ring around dot
          ctx.strokeStyle = idx % 2 === 0 ? 'rgba(56, 189, 248, 0.3)' : 'rgba(52, 211, 153, 0.3)';
          ctx.beginPath();
          ctx.arc(x, y, isMobile ? 4.5 : 6, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      ctx.restore();

      // 6. Atmospheric Rim Crescent (Soft daylight reflection)
      const rimGrad = ctx.createLinearGradient(
        centerX - radius, centerY - radius,
        centerX + radius, centerY + radius
      );
      rimGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      rimGrad.addColorStop(0.6, 'rgba(30, 41, 59, 0.2)');
      rimGrad.addColorStop(1, 'rgba(15, 23, 42, 0.1)');

      ctx.strokeStyle = rimGrad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      rotation += 0.35;
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isMobile]);

  // Orbiting cards physics loop
  useEffect(() => {
    let animId;
    let angle = 0;

    const orbitLoop = () => {
      const rx = isMobile ? 135 : 185; // horizontal radius
      const ry = isMobile ? 48 : 68;   // vertical tilt radius
      const count = MEDIA_TOKENS.length;

      const updated = MEDIA_TOKENS.map((token, i) => {
        const theta = angle + (i * (2 * Math.PI)) / count;
        const x = rx * Math.cos(theta);
        const y = ry * Math.sin(theta);
        const z = Math.sin(theta); // -1 (back) to +1 (front)

        const scale = isMobile ? 0.8 + 0.2 * ((z + 1) / 2) : 0.85 + 0.25 * ((z + 1) / 2);
        const opacity = 0.4 + 0.6 * ((z + 1) / 2);
        const zIndex = z > 0 ? 30 : 5;

        return {
          ...token,
          x,
          y,
          scale,
          opacity,
          zIndex,
          isFront: z > 0,
        };
      });

      setCards(updated);
      angle += 0.007; // gentle smooth orbit
      animId = requestAnimationFrame(orbitLoop);
    };

    orbitLoop();
    return () => cancelAnimationFrame(animId);
  }, [isMobile]);

  return (
    <div 
      ref={containerRef} 
      className="relative flex items-center justify-center w-full max-w-[440px] md:max-w-[500px] h-[350px] md:h-[430px] mx-auto select-none"
    >
      {/* Central 3D Earth Canvas */}
      <div className="relative z-10 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          style={{ width: isMobile ? 270 : 350, height: isMobile ? 270 : 350 }}
          className="pointer-events-none drop-shadow-[0_10px_35px_rgba(15,23,42,0.8)]"
        />

        {/* Clean, Human Center Emblem */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-2xl bg-slate-900/90 border border-slate-700/60 flex items-center justify-center shadow-xl shadow-black/40 backdrop-blur-md">
            <CheckCircle2 className="w-5 h-5 text-sky-400" />
          </div>
          <span className="text-[10px] tracking-wider text-slate-300 font-semibold mt-1.5 uppercase">
            Global Truth
          </span>
        </div>
      </div>

      {/* Orbiting Media Information Nodes - Human, Friendly Design */}
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            style={{
              transform: `translate(${card.x}px, ${card.y}px) scale(${card.scale})`,
              opacity: card.opacity,
              zIndex: card.zIndex,
              transition: 'transform 0.05s linear, opacity 0.05s linear',
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className={`px-3 py-2 rounded-2xl bg-slate-900/90 border ${card.border} shadow-xl shadow-black/30 backdrop-blur-md flex items-center gap-2.5 whitespace-nowrap`}>
              <div className={`p-1.5 rounded-xl ${card.bg} ${card.color}`}>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-100 tracking-tight">
                  {card.label}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {card.desc}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Subtle Orbital Orbit Ring */}
      <div 
        style={{
          width: isMobile ? 270 : 370,
          height: isMobile ? 96 : 136,
          borderRadius: '50%',
          border: '1px dashed rgba(148, 163, 184, 0.15)',
          transform: 'rotateX(68deg)',
        }}
        className="absolute pointer-events-none"
      />
    </div>
  );
}

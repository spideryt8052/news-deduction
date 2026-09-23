import React, { useEffect, useRef, useState } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  MessageSquare, 
  Newspaper, 
  Globe2, 
  ShieldCheck 
} from 'lucide-react';

const MEDIA_TOKENS = [
  { label: 'TEXT', icon: FileText, color: 'text-cyan-400', border: 'border-cyan-500/40', bg: 'bg-cyan-950/80', tag: 'Claim' },
  { label: 'IMAGE', icon: ImageIcon, color: 'text-purple-400', border: 'border-purple-500/40', bg: 'bg-purple-950/80', tag: 'Visual' },
  { label: 'VIDEO', icon: Video, color: 'text-rose-400', border: 'border-rose-500/40', bg: 'bg-rose-950/80', tag: 'Deepfake' },
  { label: 'POST', icon: MessageSquare, color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-950/80', tag: 'Viral' },
  { label: 'NEWS', icon: Newspaper, color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-950/80', tag: 'Headline' },
  { label: 'SOURCE', icon: Globe2, color: 'text-blue-400', border: 'border-blue-500/40', bg: 'bg-blue-950/80', tag: 'Domain' },
];

export default function GlobeVisual() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [cards, setCards] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  // Resize listener for mobile optimization
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Canvas globe rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let rotation = 0;

    // Responsive Canvas Sizing
    const size = isMobile ? 260 : 340;
    canvas.width = size * window.devicePixelRatio;
    canvas.height = size * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = isMobile ? 80 : 105;

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      // 1. Atmosphere Outer Glow
      const glowGrad = ctx.createRadialGradient(
        centerX, centerY, radius * 0.7,
        centerX, centerY, radius * 1.35
      );
      glowGrad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
      glowGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.12)');
      glowGrad.addColorStop(1, 'rgba(7, 11, 20, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // 2. Earth Dark Ocean Sphere
      const oceanGrad = ctx.createRadialGradient(
        centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.1,
        centerX, centerY, radius
      );
      oceanGrad.addColorStop(0, '#102347');
      oceanGrad.addColorStop(0.7, '#081226');
      oceanGrad.addColorStop(1, '#050a14');

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = oceanGrad;
      ctx.fill();
      ctx.clip(); // Clip inner wireframe grid to sphere

      // 3. Digital Longitude & Latitude Grid (Wireframe Network)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1;

      // Latitude rings
      for (let lat = -60; lat <= 60; lat += 30) {
        const radLat = (lat * Math.PI) / 180;
        const y = centerY + Math.sin(radLat) * radius;
        const rLat = Math.cos(radLat) * radius;
        ctx.beginPath();
        ctx.ellipse(centerX, y, rLat, rLat * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Rotating Longitude Meridians
      for (let lon = 0; lon < 180; lon += 30) {
        const radLon = ((lon + rotation) * Math.PI) / 180;
        const xOffset = Math.sin(radLon) * radius;
        ctx.beginPath();
        ctx.ellipse(centerX + xOffset * 0.5, centerY, Math.abs(xOffset), radius, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.stroke();
      }

      // 4. Digital Node Pulses on Earth surface
      const numNodes = 14;
      for (let i = 0; i < numNodes; i++) {
        const nodeAngle = ((i * 360) / numNodes + rotation * 1.2) * (Math.PI / 180);
        const nodeY = centerY + Math.sin(i * 1.5) * (radius * 0.7);
        const nodeX = centerX + Math.cos(nodeAngle) * (radius * 0.85);

        // Render node only if facing front
        if (Math.sin(nodeAngle) > -0.2) {
          ctx.fillStyle = i % 2 === 0 ? '#06b6d4' : '#3b82f6';
          ctx.beginPath();
          ctx.arc(nodeX, nodeY, isMobile ? 1.5 : 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Subtle connection vectors
          if (i > 0) {
            const prevAngle = (((i - 1) * 360) / numNodes + rotation * 1.2) * (Math.PI / 180);
            const prevY = centerY + Math.sin((i - 1) * 1.5) * (radius * 0.7);
            const prevX = centerX + Math.cos(prevAngle) * (radius * 0.85);
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(nodeX, nodeY);
            ctx.stroke();
          }
        }
      }

      ctx.restore();

      // 5. Outer atmospheric rim border
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      rotation += 0.4;
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
      const rx = isMobile ? 130 : 180; // horizontal radius
      const ry = isMobile ? 45 : 65;   // vertical tilt radius
      const count = MEDIA_TOKENS.length;

      const updated = MEDIA_TOKENS.map((token, i) => {
        const theta = angle + (i * (2 * Math.PI)) / count;
        const x = rx * Math.cos(theta);
        const y = ry * Math.sin(theta);
        const z = Math.sin(theta); // -1 (back) to +1 (front)

        // Depth scale: 0.7x (far) to 1.1x (near)
        const scale = isMobile ? 0.75 + 0.25 * ((z + 1) / 2) : 0.8 + 0.35 * ((z + 1) / 2);
        // Opacity: 0.4 (far) to 1.0 (near)
        const opacity = 0.35 + 0.65 * ((z + 1) / 2);
        // Z-Index: 5 for back (behind globe), 25 for front
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
      angle += 0.008; // smooth orbit velocity
      animId = requestAnimationFrame(orbitLoop);
    };

    orbitLoop();
    return () => cancelAnimationFrame(animId);
  }, [isMobile]);

  return (
    <div 
      ref={containerRef} 
      className="relative flex items-center justify-center w-full max-w-[420px] md:max-w-[480px] h-[340px] md:h-[420px] mx-auto select-none"
    >
      {/* Central 3D Digital Earth Canvas */}
      <div className="relative z-10 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          style={{ width: isMobile ? 260 : 340, height: isMobile ? 260 : 340 }}
          className="pointer-events-none drop-shadow-[0_0_35px_rgba(6,182,212,0.3)]"
        />

        {/* Inner Core Center Badge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="w-9 h-9 rounded-xl bg-dark-900/90 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/20 backdrop-blur-md">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="text-[9px] font-mono tracking-widest text-cyan-300 font-bold mt-1 uppercase">
            Global Truth
          </span>
        </div>
      </div>

      {/* Orbiting Media Information Nodes */}
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
            <div className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl glass-panel border ${card.border} ${card.bg} shadow-lg backdrop-blur-md flex items-center space-x-2 whitespace-nowrap`}>
              <div className={`p-1 rounded-lg bg-dark-900/80 ${card.color}`}>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] sm:text-xs font-bold text-white tracking-wide">
                  {card.label}
                </span>
                <span className="text-[9px] text-slate-400 font-medium">
                  {card.tag}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Subtle Orbital Orbit Ring Guide (CSS 3D Ellipse) */}
      <div 
        style={{
          width: isMobile ? 260 : 360,
          height: isMobile ? 90 : 130,
          borderRadius: '50%',
          border: '1px dashed rgba(6, 182, 212, 0.15)',
          transform: 'rotateX(65deg)',
        }}
        className="absolute pointer-events-none"
      />
    </div>
  );
}

import React, { useEffect, useRef } from 'react';

export type WeatherEffectType =
  | 'sunny'
  | 'cloudy'
  | 'rain'
  | 'thunderstorm'
  | 'fog'
  | 'snow';

export type TimeOfDay = 'day' | 'golden' | 'night';

interface WeatherBackgroundProps {
  effect: WeatherEffectType;
  timeOfDay: TimeOfDay;
  windSpeedKmh?: number;
}

export const WeatherBackground: React.FC<WeatherBackgroundProps> = ({
  effect,
  timeOfDay,
  windSpeedKmh = 14,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background Sky Gradients inspired by Realme / Android Weather
  const skyGradient = React.useMemo(() => {
    if (effect === 'thunderstorm') {
      return timeOfDay === 'night'
        ? 'bg-gradient-to-b from-[#080914] via-[#0f1424] to-[#121829]'
        : 'bg-gradient-to-b from-[#181f2c] via-[#242e3e] to-[#1a2230]';
    }

    if (effect === 'rain') {
      return timeOfDay === 'night'
        ? 'bg-gradient-to-b from-[#0b1120] via-[#151f32] to-[#111827]'
        : 'bg-gradient-to-b from-[#334155] via-[#475569] to-[#64748b]';
    }

    if (effect === 'fog') {
      return timeOfDay === 'night'
        ? 'bg-gradient-to-b from-[#18181b] via-[#27272a] to-[#3f3f46]'
        : 'bg-gradient-to-b from-[#94a3b8] via-[#cbd5e1] to-[#f1f5f9]';
    }

    if (effect === 'cloudy') {
      if (timeOfDay === 'night') {
        return 'bg-gradient-to-b from-[#070b14] via-[#0f172a] to-[#1e293b]';
      }
      if (timeOfDay === 'golden') {
        return 'bg-gradient-to-b from-[#431407] via-[#9a3412] to-[#ea580c]';
      }
      return 'bg-gradient-to-b from-[#0284c7] via-[#38bdf8] to-[#93c5fd]';
    }

    // Sunny / Clear
    if (timeOfDay === 'night') {
      return 'bg-gradient-to-b from-[#020617] via-[#0a1128] to-[#1e1b4b]';
    }
    if (timeOfDay === 'golden') {
      return 'bg-gradient-to-b from-[#3b0764] via-[#c2410c] to-[#f97316]';
    }
    // Bright Sunny Day
    return 'bg-gradient-to-b from-[#0284c7] via-[#38bdf8] to-[#bae6fd]';
  }, [effect, timeOfDay]);

  // Canvas particle engine for rain, splashes, and lightning bolts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Rain drop particle class with depth layering
    interface RainDrop {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
      thickness: number;
      layer: 'fg' | 'bg';
    }

    interface Splash {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      opacity: number;
      vx: number;
      vy: number;
    }

    const rainDrops: RainDrop[] = [];
    const splashes: Splash[] = [];
    const dropCount = effect === 'thunderstorm' ? 220 : effect === 'rain' ? 140 : 0;

    for (let i = 0; i < dropCount; i++) {
      const isForeground = Math.random() > 0.4;
      rainDrops.push({
        x: Math.random() * (width + 300) - 150,
        y: Math.random() * height,
        length: isForeground ? Math.random() * 26 + 18 : Math.random() * 16 + 10,
        speed: isForeground ? Math.random() * 14 + 20 : Math.random() * 10 + 14,
        opacity: isForeground ? Math.random() * 0.4 + 0.45 : Math.random() * 0.25 + 0.15,
        thickness: isForeground ? Math.random() * 1.6 + 1.0 : Math.random() * 0.8 + 0.5,
        layer: isForeground ? 'fg' : 'bg',
      });
    }

    // Realistic multi-fork Lightning Bolt Generator
    let isLightningActive = false;
    let lightningFlashAlpha = 0;
    let lightningBranches: { x1: number; y1: number; x2: number; y2: number; width: number }[] = [];

    const generateLightningTree = (
      startX: number,
      startY: number,
      targetY: number,
      branchProbability: number
    ) => {
      let curX = startX;
      let curY = startY;

      while (curY < targetY) {
        const nextX = curX + (Math.random() - 0.5) * 50;
        const nextY = curY + Math.random() * 32 + 18;
        lightningBranches.push({
          x1: curX,
          y1: curY,
          x2: nextX,
          y2: nextY,
          width: 3.5,
        });

        // Sub-fork branch
        if (Math.random() < branchProbability && curY < targetY * 0.8) {
          let subX = nextX;
          let subY = nextY;
          const subLength = Math.random() * 4 + 2;
          for (let b = 0; b < subLength; b++) {
            const forkNextX = subX + (Math.random() - 0.4) * 45;
            const forkNextY = subY + Math.random() * 25 + 12;
            lightningBranches.push({
              x1: subX,
              y1: subY,
              x2: forkNextX,
              y2: forkNextY,
              width: 1.5,
            });
            subX = forkNextX;
            subY = forkNextY;
          }
        }

        curX = nextX;
        curY = nextY;
      }
    };

    const triggerLightningBolt = () => {
      isLightningActive = true;
      lightningFlashAlpha = 0.95;
      lightningBranches = [];

      const mainStartX = width * (0.25 + Math.random() * 0.5);
      const targetY = height * (0.65 + Math.random() * 0.25);
      generateLightningTree(mainStartX, 0, targetY, 0.45);

      // Secondary nearby strike
      if (Math.random() > 0.5) {
        generateLightningTree(mainStartX + (Math.random() - 0.5) * 120, 0, targetY * 0.7, 0.3);
      }

      setTimeout(() => {
        lightningFlashAlpha = 0.35;
      }, 60);

      setTimeout(() => {
        lightningFlashAlpha = 0.8;
      }, 110);

      setTimeout(() => {
        lightningFlashAlpha = 0.2;
      }, 170);

      setTimeout(() => {
        isLightningActive = false;
        lightningFlashAlpha = 0;
        lightningBranches = [];
      }, 280);
    };

    let nextLightningTime = Date.now() + Math.random() * 3500 + 2000;
    const slantX = Math.min(7, Math.max(2, windSpeedKmh * 0.2));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Rain and Splashes
      if (effect === 'rain' || effect === 'thunderstorm') {
        ctx.lineCap = 'round';
        for (let i = 0; i < rainDrops.length; i++) {
          const drop = rainDrops[i];
          ctx.beginPath();
          ctx.strokeStyle = `rgba(220, 240, 255, ${drop.opacity})`;
          ctx.lineWidth = drop.thickness;
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x + slantX * 2.2, drop.y + drop.length);
          ctx.stroke();

          drop.x += slantX;
          drop.y += drop.speed;

          // When drop hits ground area, spawn realistic splash rings
          if (drop.y > height - 100 && Math.random() > 0.82) {
            splashes.push({
              x: drop.x,
              y: height - Math.random() * 60,
              radius: 1,
              maxRadius: Math.random() * 6 + 3,
              opacity: 0.7,
              vx: (Math.random() - 0.5) * 2.5,
              vy: -(Math.random() * 2.5 + 1.2),
            });
          }

          // Reset to top
          if (drop.y > height) {
            drop.y = -drop.length - Math.random() * 40;
            drop.x = Math.random() * (width + 300) - 150;
          }
        }

        // Render & update splash particles
        for (let i = splashes.length - 1; i >= 0; i--) {
          const s = splashes[i];
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(230, 245, 255, ${s.opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          s.radius += 0.45;
          s.x += s.vx;
          s.y += s.vy;
          s.opacity -= 0.045;

          if (s.opacity <= 0 || s.radius >= s.maxRadius) {
            splashes.splice(i, 1);
          }
        }
      }

      // 2. Thunderstorm Lightning Engine
      if (effect === 'thunderstorm') {
        const now = Date.now();
        if (now > nextLightningTime) {
          triggerLightningBolt();
          nextLightningTime = now + Math.random() * 5500 + 3500;
        }

        if (isLightningActive && lightningFlashAlpha > 0) {
          // Full Sky Flash Luminescence
          ctx.fillStyle = `rgba(225, 238, 255, ${lightningFlashAlpha * 0.4})`;
          ctx.fillRect(0, 0, width, height);

          // Outer Glow
          ctx.beginPath();
          ctx.strokeStyle = `rgba(165, 205, 255, ${lightningFlashAlpha * 0.8})`;
          ctx.lineWidth = 6;
          ctx.shadowColor = '#60a5fa';
          ctx.shadowBlur = 24;

          for (const branch of lightningBranches) {
            ctx.moveTo(branch.x1, branch.y1);
            ctx.lineTo(branch.x2, branch.y2);
          }
          ctx.stroke();

          // Intense Core White Filament
          ctx.beginPath();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.2;
          ctx.shadowBlur = 6;
          for (const branch of lightningBranches) {
            ctx.moveTo(branch.x1, branch.y1);
            ctx.lineTo(branch.x2, branch.y2);
          }
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [effect, windSpeedKmh]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none overflow-hidden transition-all duration-1000 z-0 ${skyGradient}`}
    >
      {/* -----------------------------------------------------------------
          1. SUNNY / CLEAR DAY: Realistic Moving Sun with Solar Flare & Rays
         ----------------------------------------------------------------- */}
      {effect === 'sunny' && timeOfDay !== 'night' && (
        <div className="absolute inset-0 overflow-hidden">
          {/* Main Celestial Sun Orb moving gently in realistic time */}
          <div className="absolute top-10 right-8 sm:top-14 sm:right-20 flex items-center justify-center animate-sun-celestial">
            {/* Outer solar corona diffusion */}
            <div className="absolute w-80 h-80 rounded-full bg-amber-400/30 blur-3xl animate-pulse" />
            
            {/* Rotating sunrays aura halo */}
            <div className="absolute w-64 h-64 rounded-full border-2 border-amber-300/40 animate-sun-rays" />
            <div className="absolute w-72 h-72 rounded-full border border-dashed border-amber-200/25 animate-sun-rays" />

            {/* Glowing Golden Solar Orb */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-200 to-white shadow-[0_0_90px_rgba(251,191,36,0.9)] relative">
              {/* Internal solar flare highlights */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-b from-white/80 via-transparent to-amber-400/30 blur-[2px]" />
            </div>
          </div>

          {/* Ambient Sunlight Atmospheric Beam */}
          <div className="absolute -top-12 right-0 w-[600px] h-[600px] bg-gradient-to-br from-amber-200/25 via-transparent to-transparent rotate-45 pointer-events-none" />

          {/* Light Fair-Weather Cirrus Clouds drifting across the sun */}
          <div className="absolute top-40 left-0 right-0 opacity-35 animate-cloud-slow">
            <svg
              className="w-[140%] h-36 text-white/40"
              viewBox="0 0 1200 120"
              fill="currentColor"
            >
              <path d="M0,80 Q200,20 400,60 T800,40 T1200,70 L1200,120 L0,120 Z" />
            </svg>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------
          2. CLEAR NIGHT: Detailed Cratered Moon & Twinkling Starfield
         ----------------------------------------------------------------- */}
      {timeOfDay === 'night' && (
        <div className="absolute inset-0 overflow-hidden">
          {/* Twinkling Starfield */}
          <div className="absolute inset-0">
            {Array.from({ length: 52 }).map((_, i) => {
              const top = (i * 17) % 85;
              const left = (i * 29) % 98;
              const size = (i % 3) + 1.5;
              const duration = ((i % 4) + 2) * 0.9;
              const delay = (i % 5) * 0.5;
              return (
                <div
                  key={i}
                  style={{
                    top: `${top}%`,
                    left: `${left}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                  }}
                  className="absolute rounded-full bg-white animate-pulse"
                />
              );
            })}
          </div>

          {/* Shooting Star Streak across the night sky */}
          <div className="absolute top-20 right-28 w-36 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent animate-shooting-star" />

          {/* Realistic Glowing Moon with Crater Textures */}
          {effect !== 'rain' && effect !== 'thunderstorm' && (
            <div className="absolute top-12 right-10 sm:top-16 sm:right-24 flex items-center justify-center animate-sun-celestial">
              {/* Lunar Halo */}
              <div className="absolute w-60 h-60 rounded-full bg-blue-300/20 blur-3xl animate-pulse" />
              
              {/* Moon Sphere with Realism */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#f8fafc] via-[#e2e8f0] to-[#94a3b8] shadow-[0_0_50px_rgba(241,245,249,0.6)] relative overflow-hidden">
                {/* Authentic crater shading */}
                <div className="absolute top-4 left-5 w-6 h-6 rounded-full bg-slate-400/30 blur-[1px]" />
                <div className="absolute top-10 left-12 w-8 h-8 rounded-full bg-slate-400/25 blur-[1px]" />
                <div className="absolute bottom-5 left-7 w-9 h-9 rounded-full bg-slate-400/35 blur-[1.5px]" />
                <div className="absolute top-14 right-5 w-5 h-5 rounded-full bg-slate-400/25 blur-[1px]" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* -----------------------------------------------------------------
          3. CLOUDY / OVERCAST: Multi-Layer Realistic Moving Cloud Banks
             - Day: Volumetric white & silver cumulus
             - Night: Deep slate-navy moonlit clouds
             - Storm: Dark charcoal ominous thunderheads
         ----------------------------------------------------------------- */}
      {(effect === 'cloudy' || effect === 'rain' || effect === 'thunderstorm') && (
        <div className={`absolute inset-0 overflow-hidden ${effect === 'thunderstorm' ? 'animate-thunder-clouds' : ''}`}>
          {/* Back Tier Clouds (Slow continuous drift) */}
          <div className="absolute -top-12 -left-24 w-[150%] opacity-60 animate-cloud-slow">
            <svg
              className={`w-full h-72 ${
                effect === 'thunderstorm'
                  ? 'text-slate-900/85'
                  : effect === 'rain'
                  ? 'text-slate-500/60'
                  : timeOfDay === 'night'
                  ? 'text-slate-800/60'
                  : 'text-white/50'
              }`}
              viewBox="0 0 1000 300"
              fill="currentColor"
            >
              <path d="M0,150 Q150,50 300,120 T600,80 T900,140 Q950,180 1000,150 L1000,300 L0,300 Z" />
            </svg>
          </div>

          {/* Middle Tier Clouds (Medium speed drift) */}
          <div className="absolute top-6 -left-36 w-[160%] opacity-80 animate-cloud-medium">
            <svg
              className={`w-full h-80 drop-shadow-md ${
                effect === 'thunderstorm'
                  ? 'text-slate-950/90'
                  : effect === 'rain'
                  ? 'text-slate-600/75'
                  : timeOfDay === 'night'
                  ? 'text-slate-900/75'
                  : 'text-slate-100/80'
              }`}
              viewBox="0 0 1000 300"
              fill="currentColor"
            >
              <path d="M0,180 Q200,90 400,150 T700,110 T1000,170 L1000,300 L0,300 Z" />
            </svg>
          </div>

          {/* Front Tier Volumetric Clouds (Faster organic drift) */}
          <div className="absolute top-24 -left-12 w-[140%] opacity-90 animate-cloud-fast">
            <svg
              className={`w-full h-96 drop-shadow-xl ${
                effect === 'thunderstorm'
                  ? 'text-slate-950/95'
                  : effect === 'rain'
                  ? 'text-slate-700/85'
                  : timeOfDay === 'night'
                  ? 'text-slate-800/90'
                  : 'text-white/90'
              }`}
              viewBox="0 0 1000 300"
              fill="currentColor"
            >
              <path d="M0,210 Q250,130 500,190 T800,150 T1000,220 L1000,300 L0,300 Z" />
            </svg>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------
          4. FOG / MIST: Realistic Multi-Layer Rolling Atmospheric Vapor
         ----------------------------------------------------------------- */}
      {effect === 'fog' && (
        <div className="absolute inset-0 overflow-hidden">
          {/* Dense High-Altitude Mist */}
          <div className="absolute top-8 left-0 w-[170%] h-72 bg-gradient-to-r from-white/40 via-white/80 to-white/40 blur-3xl animate-fog-1" />

          {/* Mid-Altitude Rolling Fog Bank */}
          <div className="absolute top-48 -left-28 w-[190%] h-96 bg-gradient-to-r from-slate-200/60 via-white/90 to-slate-100/60 blur-3xl animate-fog-2" />

          {/* Ground-Level Dense Fog Blanket */}
          <div className="absolute bottom-0 left-0 right-0 h-[450px] bg-gradient-to-t from-white/95 via-white/70 to-transparent blur-2xl" />
        </div>
      )}

      {/* -----------------------------------------------------------------
          5. RAIN & THUNDERSTORM: HTML5 Canvas Particle Engine
         ----------------------------------------------------------------- */}
      {(effect === 'rain' || effect === 'thunderstorm') && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />
      )}

      {/* Bottom atmospheric horizon gradient for effortless readability */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/35 via-black/10 to-transparent pointer-events-none" />
    </div>
  );
};

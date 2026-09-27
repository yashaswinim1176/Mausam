import React, { useEffect, useRef } from 'react';
import { WeatherConditionType } from '../types/weather';

interface WeatherCanvasProps {
  condition: WeatherConditionType;
  timeDecimal: number; // 0.00 to 24.00
  windSpeedKmh: number;
  windDegrees: number;
  rainIntensityPct: number;
  cloudDensityPct: number;
  fogDensityPct: number;
  snowIntensityPct: number;
  isLightningActive?: boolean;
  onLightningTriggered?: () => void;
  onLuminanceChange?: (isDark: boolean, skyLuminance: number) => void;
  showScenicLandscape?: boolean;
  selectedLandscapeIdx?: number;
}

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  thickness: number;
  opacity: number;
  layer: number; // 0=far, 1=mid, 2=near
}

interface SplashRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
}

interface SplashDroplet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface CloudPuff {
  x: number;
  y: number;
  scale: number;
  baseRadius: number;
  layer: number; // 0=far, 1=mid, 2=low
  opacity: number;
  puffOffsets: { dx: number; dy: number; r: number; alpha: number }[];
}

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  vx: number;
  vy: number;
  opacity: number;
  active: boolean;
}

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  swingAmplitude: number;
  swingSpeed: number;
  swingPhase: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

interface LightningBranch {
  points: { x: number; y: number }[];
  alpha: number;
  width: number;
  forks: LightningBranch[];
}

export const WeatherCanvas: React.FC<WeatherCanvasProps> = ({
  condition,
  timeDecimal,
  windSpeedKmh,
  windDegrees,
  rainIntensityPct,
  cloudDensityPct,
  fogDensityPct,
  snowIntensityPct,
  isLightningActive = false,
  onLightningTriggered,
  onLuminanceChange,
  showScenicLandscape = true,
  selectedLandscapeIdx = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // References for animation state
  const stateRef = useRef({
    width: 0,
    height: 0,
    dpr: 1,
    lastTime: 0,
    raindrops: [] as RainDrop[],
    splashes: [] as SplashRipple[],
    splashDroplets: [] as SplashDroplet[],
    cloudPuffs: [] as CloudPuff[],
    stars: [] as Star[],
    shootingStar: null as ShootingStar | null,
    snowflakes: [] as Snowflake[],
    lightning: null as LightningBranch | null,
    lightningFlashAlpha: 0,
    nextLightningTime: 0,
    fogTime: 0,
  });

  // Calculate sky gradient palette from time of day and condition
  const getSkyPalette = (t: number, cond: WeatherConditionType) => {
    // Colors: [top, middle, horizon, sunGlow]
    let top = [3, 7, 18];
    let mid = [12, 21, 39];
    let bot = [17, 24, 39];
    let sunGlow = 'rgba(255, 200, 100, 0.3)';

    // Sunrise 05:00 - 06:45
    if (t >= 5.0 && t < 6.75) {
      const p = (t - 5.0) / 1.75;
      top = lerpColor([15, 23, 42], [30, 27, 75], p);
      mid = lerpColor([30, 27, 75], [126, 34, 206], p);
      bot = lerpColor([67, 40, 116], [251, 146, 60], p);
      sunGlow = `rgba(255, 180, 80, ${0.4 + p * 0.4})`;
    }
    // Morning into Noon 06:45 - 12:00
    else if (t >= 6.75 && t < 12.0) {
      const p = (t - 6.75) / 5.25;
      top = lerpColor([30, 27, 75], [2, 132, 199], p);
      mid = lerpColor([126, 34, 206], [56, 189, 248], p);
      bot = lerpColor([251, 146, 60], [186, 230, 253], p);
      sunGlow = 'rgba(255, 240, 180, 0.85)';
    }
    // Afternoon into Golden Hour 12:00 - 17.0
    else if (t >= 12.0 && t < 17.0) {
      const p = (t - 12.0) / 5.0;
      top = lerpColor([2, 132, 199], [3, 105, 161], p);
      mid = lerpColor([56, 189, 248], [125, 211, 252], p);
      bot = lerpColor([186, 230, 253], [253, 224, 71], p);
      sunGlow = 'rgba(255, 230, 140, 0.8)';
    }
    // Sunset / Golden Hour 17.0 - 18.75
    else if (t >= 17.0 && t < 18.75) {
      const p = (t - 17.0) / 1.75;
      top = lerpColor([3, 105, 161], [49, 46, 129], p);
      mid = lerpColor([125, 211, 252], [192, 38, 211], p);
      bot = lerpColor([253, 224, 71], [239, 68, 68], p);
      sunGlow = `rgba(255, 100, 40, ${0.7 - p * 0.3})`;
    }
    // Dusk / Twilight 18.75 - 20.0
    else if (t >= 18.75 && t < 20.0) {
      const p = (t - 18.75) / 1.25;
      top = lerpColor([49, 46, 129], [15, 23, 42], p);
      mid = lerpColor([192, 38, 211], [59, 7, 100], p);
      bot = lerpColor([239, 68, 68], [17, 24, 39], p);
      sunGlow = 'rgba(180, 80, 120, 0.2)';
    }
    // Deep Night 20.0 - 05:00
    else {
      top = [3, 7, 18];
      mid = [10, 18, 35];
      bot = [17, 24, 39];
      sunGlow = 'rgba(100, 150, 255, 0.15)';
    }

    // Weather condition color adjustments
    if (cond === 'thunderstorm') {
      top = lerpColor(top, [6, 9, 18], 0.85);
      mid = lerpColor(mid, [12, 17, 29], 0.85);
      bot = lerpColor(bot, [22, 28, 45], 0.75);
    } else if (cond === 'rain') {
      top = lerpColor(top, [20, 30, 48], 0.65);
      mid = lerpColor(mid, [35, 52, 75], 0.65);
      bot = lerpColor(bot, [60, 80, 105], 0.55);
    } else if (cond === 'overcast') {
      top = lerpColor(top, [50, 60, 75], 0.6);
      mid = lerpColor(mid, [75, 88, 105], 0.6);
      bot = lerpColor(bot, [120, 135, 150], 0.5);
    } else if (cond === 'fog') {
      top = lerpColor(top, [70, 80, 95], 0.5);
      mid = lerpColor(mid, [110, 120, 135], 0.65);
      bot = lerpColor(bot, [170, 180, 195], 0.75);
    } else if (cond === 'snow') {
      top = lerpColor(top, [45, 55, 70], 0.5);
      mid = lerpColor(mid, [80, 95, 115], 0.55);
      bot = lerpColor(bot, [150, 165, 185], 0.6);
    }

    return { top, mid, bot, sunGlow };
  };

  const lerpColor = (c1: number[], c2: number[], factor: number): number[] => {
    return [
      Math.round(c1[0] + (c2[0] - c1[0]) * factor),
      Math.round(c1[1] + (c2[1] - c1[1]) * factor),
      Math.round(c1[2] + (c2[2] - c1[2]) * factor),
    ];
  };

  // Initialize particles & clouds on resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const state = stateRef.current;
      state.width = canvas.width;
      state.height = canvas.height;
      state.dpr = dpr;

      // Init starfield
      state.stars = [];
      for (let i = 0; i < 220; i++) {
        state.stars.push({
          x: Math.random() * state.width,
          y: Math.random() * (state.height * 0.7),
          radius: (Math.random() * 1.4 + 0.5) * dpr,
          baseAlpha: Math.random() * 0.7 + 0.3,
          twinkleSpeed: Math.random() * 2.5 + 1.0,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }

      // Init clouds with multi-lobed organic shapes
      state.cloudPuffs = [];
      const numClouds = 16;
      for (let i = 0; i < numClouds; i++) {
        const layer = i % 3; // 0=far (high), 1=mid, 2=low
        const scale = (layer === 0 ? 0.65 : layer === 1 ? 1.0 : 1.4) * dpr;
        const baseRadius = (55 + Math.random() * 40) * scale;
        const puffOffsets = [];
        const lobes = 6 + Math.floor(Math.random() * 5);
        for (let l = 0; l < lobes; l++) {
          const angle = (l / lobes) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
          const dist = (Math.random() * 0.55 + 0.2) * baseRadius;
          puffOffsets.push({
            dx: Math.cos(angle) * dist,
            dy: Math.sin(angle) * dist * 0.55,
            r: (0.45 + Math.random() * 0.55) * baseRadius,
            alpha: 0.65 + Math.random() * 0.35,
          });
        }
        state.cloudPuffs.push({
          x: Math.random() * state.width * 1.5 - state.width * 0.25,
          y: (Math.random() * 0.42 + (layer === 0 ? 0.05 : layer === 1 ? 0.12 : 0.2)) * state.height,
          scale,
          baseRadius,
          layer,
          opacity: layer === 0 ? 0.45 : layer === 1 ? 0.65 : 0.85,
          puffOffsets,
        });
      }

      // Init rain particles
      state.raindrops = [];
      const dropCount = 700;
      for (let i = 0; i < dropCount; i++) {
        const layer = i % 3;
        state.raindrops.push({
          x: Math.random() * state.width,
          y: Math.random() * state.height,
          length: (layer === 0 ? 12 : layer === 1 ? 22 : 36) * dpr,
          speed: (layer === 0 ? 800 : layer === 1 ? 1200 : 1600) * dpr,
          thickness: (layer === 0 ? 0.75 : layer === 1 ? 1.2 : 1.8) * dpr,
          opacity: layer === 0 ? 0.25 : layer === 1 ? 0.5 : 0.75,
          layer,
        });
      }

      // Init snow particles
      state.snowflakes = [];
      const snowCount = 200;
      for (let i = 0; i < snowCount; i++) {
        state.snowflakes.push({
          x: Math.random() * state.width,
          y: Math.random() * state.height,
          radius: (Math.random() * 2.8 + 1.2) * dpr,
          speedY: (Math.random() * 60 + 40) * dpr,
          speedX: (Math.random() * 20 - 10) * dpr,
          swingAmplitude: (Math.random() * 25 + 10) * dpr,
          swingSpeed: Math.random() * 2 + 1,
          swingPhase: Math.random() * Math.PI * 2,
          opacity: Math.random() * 0.7 + 0.3,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 2,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main high-performance Animation Loop
  useEffect(() => {
    let animId: number;

    const generateLightning = (startX: number, startY: number, endY: number): LightningBranch => {
      const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
      let curX = startX;
      let curY = startY;
      const forks: LightningBranch[] = [];

      while (curY < endY) {
        curY += (Math.random() * 25 + 15) * stateRef.current.dpr;
        curX += (Math.random() * 40 - 20) * stateRef.current.dpr;
        points.push({ x: curX, y: curY });

        // Branching fork probability
        if (Math.random() < 0.22 && points.length > 2) {
          const forkPoints = [{ x: curX, y: curY }];
          let fx = curX;
          let fy = curY;
          const fAngle = (Math.random() - 0.5) * 0.8 + 0.4;
          for (let f = 0; f < 4; f++) {
            fy += 20 * stateRef.current.dpr;
            fx += Math.sin(fAngle) * 25 * stateRef.current.dpr;
            forkPoints.push({ x: fx, y: fy });
          }
          forks.push({
            points: forkPoints,
            alpha: 0.85,
            width: 1.5 * stateRef.current.dpr,
            forks: [],
          });
        }
      }

      return {
        points,
        alpha: 1.0,
        width: 3.2 * stateRef.current.dpr,
        forks,
      };
    };

    const render = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const state = stateRef.current;
      if (!state.lastTime) state.lastTime = time;
      const dt = Math.min((time - state.lastTime) / 1000, 0.1);
      state.lastTime = time;
      state.fogTime += dt;

      const { width, height, dpr } = state;
      ctx.clearRect(0, 0, width, height);

      // 1. Compute Sky Colors and Luminance
      const palette = getSkyPalette(timeDecimal, condition);
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, `rgb(${palette.top.join(',')})`);
      skyGrad.addColorStop(0.55, `rgb(${palette.mid.join(',')})`);
      skyGrad.addColorStop(1, `rgb(${palette.bot.join(',')})`);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Report luminance to parent for adaptive dark/light UI
      const avgLuminance =
        (palette.top[0] * 0.299 + palette.top[1] * 0.587 + palette.top[2] * 0.114 +
         palette.bot[0] * 0.299 + palette.bot[1] * 0.587 + palette.bot[2] * 0.114) / 2;
      const isDark = avgLuminance < 115 || condition === 'thunderstorm' || condition === 'rain';
      if (onLuminanceChange && Math.random() < 0.05) {
        onLuminanceChange(isDark, avgLuminance);
      }

      // 2. Starfield (Night / Dawn / Dusk)
      const isNight = timeDecimal < 5.5 || timeDecimal > 19.5;
      if (isNight && condition !== 'overcast' && condition !== 'thunderstorm' && condition !== 'rain') {
        const starFade = timeDecimal < 5.5
          ? 1 - Math.max(0, (timeDecimal - 4.5) / 1.0)
          : Math.min(1, (timeDecimal - 19.0) / 1.0);

        ctx.save();
        for (const s of state.stars) {
          const alpha = s.baseAlpha * starFade * (0.6 + 0.4 * Math.sin(time * 0.002 * s.twinkleSpeed + s.twinklePhase));
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Intermittent Shooting Star
        if (!state.shootingStar && Math.random() < 0.004 && isNight) {
          state.shootingStar = {
            x: Math.random() * width * 0.8,
            y: Math.random() * height * 0.3,
            length: (Math.random() * 80 + 50) * dpr,
            speed: (Math.random() * 600 + 700) * dpr,
            vx: 1.0,
            vy: 0.6,
            opacity: 1.0,
            active: true,
          };
        }

        if (state.shootingStar && state.shootingStar.active) {
          const ss = state.shootingStar;
          ss.x += ss.vx * ss.speed * dt;
          ss.y += ss.vy * ss.speed * dt;
          ss.opacity -= dt * 1.5;

          const ssGrad = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.vx * ss.length, ss.y - ss.vy * ss.length);
          ssGrad.addColorStop(0, `rgba(255, 255, 255, ${ss.opacity})`);
          ssGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.strokeStyle = ssGrad;
          ctx.lineWidth = 1.8 * dpr;
          ctx.beginPath();
          ctx.moveTo(ss.x, ss.y);
          ctx.lineTo(ss.x - ss.vx * ss.length, ss.y - ss.vy * ss.length);
          ctx.stroke();

          if (ss.opacity <= 0 || ss.x > width || ss.y > height) {
            state.shootingStar = null;
          }
        }
        ctx.restore();
      }

      // 3. Sun / Moon Coordinates and Optical Glow
      const isSunUp = timeDecimal >= 5.5 && timeDecimal <= 19.0;
      if (isSunUp && condition !== 'thunderstorm' && condition !== 'overcast') {
        const sunProgress = (timeDecimal - 5.5) / 13.5; // 0 at dawn, 1 at dusk
        const sunX = width * (0.15 + sunProgress * 0.7);
        const sunY = height * (0.85 - Math.sin(sunProgress * Math.PI) * 0.65);
        const sunRadius = (28 + Math.sin(sunProgress * Math.PI) * 8) * dpr;

        ctx.save();
        // Atmospheric Corona Bloom
        const coronaGrad = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.5, sunX, sunY, sunRadius * 6.5);
        coronaGrad.addColorStop(0, palette.sunGlow);
        coronaGrad.addColorStop(0.35, palette.sunGlow.replace(/[\d.]+\)$/, '0.18)'));
        coronaGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = coronaGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius * 6.5, 0, Math.PI * 2);
        ctx.fill();

        // God Rays / Light Shafts (Sunny / Clear)
        if (condition === 'sunny' || condition === 'partly_cloudy') {
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          const numRays = 8;
          for (let r = 0; r < numRays; r++) {
            const rayAngle = (r / numRays) * Math.PI * 2 + time * 0.0002;
            const rayLength = height * 0.9;
            const raySpread = 0.12 + Math.sin(time * 0.001 + r) * 0.03;
            const rayGrad = ctx.createRadialGradient(sunX, sunY, sunRadius, sunX, sunY, rayLength);
            rayGrad.addColorStop(0, 'rgba(255, 245, 200, 0.12)');
            rayGrad.addColorStop(0.6, 'rgba(255, 230, 160, 0.03)');
            rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = rayGrad;
            ctx.beginPath();
            ctx.moveTo(sunX, sunY);
            ctx.arc(sunX, sunY, rayLength, rayAngle - raySpread, rayAngle + raySpread);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }

        // Solar Disk
        const diskGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
        diskGrad.addColorStop(0, '#ffffff');
        diskGrad.addColorStop(0.7, '#fff7ed');
        diskGrad.addColorStop(1, '#fef08a');
        ctx.fillStyle = diskGrad;
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 24 * dpr;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Anamorphic Lens Flare
        if (condition === 'sunny' && sunProgress > 0.15 && sunProgress < 0.85) {
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          const centerX = width * 0.5;
          const centerY = height * 0.5;
          const dx = centerX - sunX;
          const dy = centerY - sunY;

          // Ghost flare artifacts along optical axis
          const flareFactors = [0.3, 0.6, 0.9, 1.25, 1.6];
          const flareColors = [
            'rgba(56, 189, 248, 0.18)',
            'rgba(168, 85, 247, 0.15)',
            'rgba(251, 146, 60, 0.2)',
            'rgba(253, 224, 71, 0.22)',
            'rgba(34, 197, 94, 0.16)',
          ];

          for (let f = 0; f < flareFactors.length; f++) {
            const fx = sunX + dx * flareFactors[f];
            const fy = sunY + dy * flareFactors[f];
            const fr = (18 + f * 12) * dpr;
            ctx.fillStyle = flareColors[f];
            ctx.beginPath();
            ctx.arc(fx, fy, fr, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      } else if (!isSunUp) {
        // Realistic Moon Disk
        const moonProgress = timeDecimal < 5.5 ? (timeDecimal + 4.5) / 10.0 : (timeDecimal - 19.5) / 10.0;
        const moonX = width * (0.2 + moonProgress * 0.6);
        const moonY = height * (0.28 - Math.sin(moonProgress * Math.PI) * 0.15);
        const moonRadius = 22 * dpr;

        ctx.save();
        // Moon Glow
        const moonHalo = ctx.createRadialGradient(moonX, moonY, moonRadius, moonX, moonY, moonRadius * 4.5);
        moonHalo.addColorStop(0, 'rgba(224, 231, 255, 0.28)');
        moonHalo.addColorStop(0.5, 'rgba(199, 210, 254, 0.08)');
        moonHalo.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = moonHalo;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius * 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Moon Body
        const moonBodyGrad = ctx.createRadialGradient(moonX - moonRadius * 0.2, moonY - moonRadius * 0.2, 0, moonX, moonY, moonRadius);
        moonBodyGrad.addColorStop(0, '#ffffff');
        moonBodyGrad.addColorStop(0.8, '#e0e7ff');
        moonBodyGrad.addColorStop(1, '#c7d2fe');
        ctx.fillStyle = moonBodyGrad;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Volumetric Cloud Layers (with Parallax & Wind velocity)
      const windRad = (windDegrees * Math.PI) / 180;
      const windVx = Math.cos(windRad) * (windSpeedKmh / 3.6) * 12 * dpr;
      const targetDensity = (cloudDensityPct / 100) * (condition === 'sunny' ? 0.15 : condition === 'partly_cloudy' ? 0.5 : 1.0);

      if (targetDensity > 0.05) {
        ctx.save();
        for (const cloud of state.cloudPuffs) {
          // Cloud drift
          const speedMod = cloud.layer === 0 ? 0.35 : cloud.layer === 1 ? 0.7 : 1.1;
          cloud.x += windVx * speedMod * dt;
          if (cloud.x > width * 1.3) cloud.x = -width * 0.3;
          if (cloud.x < -width * 0.3) cloud.x = width * 1.3;

          const cloudBaseAlpha = cloud.opacity * targetDensity;
          const isStormy = condition === 'thunderstorm' || condition === 'rain';

          // Cloud illumination
          for (const puff of cloud.puffOffsets) {
            const px = cloud.x + puff.dx;
            const py = cloud.y + puff.dy;
            const pr = puff.r;

            const puffGrad = ctx.createRadialGradient(px, py - pr * 0.3, pr * 0.1, px, py, pr);
            if (isStormy) {
              puffGrad.addColorStop(0, `rgba(45, 55, 72, ${cloudBaseAlpha * 0.9})`);
              puffGrad.addColorStop(0.7, `rgba(26, 32, 44, ${cloudBaseAlpha * 0.95})`);
              puffGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
            } else if (isSunUp && timeDecimal > 16.5) {
              // Sunset rim-lit clouds
              puffGrad.addColorStop(0, `rgba(254, 215, 170, ${cloudBaseAlpha * 0.9})`);
              puffGrad.addColorStop(0.65, `rgba(216, 180, 254, ${cloudBaseAlpha * 0.7})`);
              puffGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            } else if (isNight) {
              puffGrad.addColorStop(0, `rgba(30, 41, 59, ${cloudBaseAlpha * 0.8})`);
              puffGrad.addColorStop(0.8, `rgba(15, 23, 42, ${cloudBaseAlpha * 0.9})`);
              puffGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
            } else {
              // Bright fluffy daylight cumulus
              puffGrad.addColorStop(0, `rgba(255, 255, 255, ${cloudBaseAlpha * 0.95})`);
              puffGrad.addColorStop(0.7, `rgba(241, 245, 249, ${cloudBaseAlpha * 0.8})`);
              puffGrad.addColorStop(1, 'rgba(226, 232, 240, 0)');
            }

            ctx.fillStyle = puffGrad;
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // 5. Scenic Mountain / Landscape Silhouette Layer (if enabled)
      if (showScenicLandscape) {
        ctx.save();
        const groundY = height * 0.72;
        // Far Mountains
        ctx.fillStyle = isDark ? 'rgba(10, 15, 28, 0.65)' : 'rgba(71, 85, 105, 0.35)';
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, groundY - 40 * dpr);
        ctx.bezierCurveTo(width * 0.25, groundY - 110 * dpr, width * 0.45, groundY - 20 * dpr, width * 0.7, groundY - 80 * dpr);
        ctx.bezierCurveTo(width * 0.85, groundY - 120 * dpr, width * 0.95, groundY - 50 * dpr, width, groundY - 60 * dpr);
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        // Near Rolling Foothills
        ctx.fillStyle = isDark ? 'rgba(5, 8, 16, 0.85)' : 'rgba(30, 41, 59, 0.55)';
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, groundY + 30 * dpr);
        ctx.bezierCurveTo(width * 0.3, groundY - 30 * dpr, width * 0.6, groundY + 40 * dpr, width, groundY + 10 * dpr);
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 6. Volumetric Fog & Mist (if fog/haze active)
      const fogIntensity = (fogDensityPct / 100) * (condition === 'fog' ? 1.0 : condition === 'rain' ? 0.35 : 0.0);
      if (fogIntensity > 0.05) {
        ctx.save();
        const numFogLayers = 4;
        for (let fl = 0; fl < numFogLayers; fl++) {
          const fogY = height * (0.55 + fl * 0.1);
          const fSpeed = (12 + fl * 8) * dpr;
          const fOffset = (state.fogTime * fSpeed) % width;
          const fAlpha = (0.2 + fl * 0.12) * fogIntensity;

          const fGrad = ctx.createLinearGradient(0, fogY - 60 * dpr, 0, fogY + 80 * dpr);
          fGrad.addColorStop(0, 'rgba(226, 232, 240, 0)');
          fGrad.addColorStop(0.5, `rgba(241, 245, 249, ${fAlpha})`);
          fGrad.addColorStop(1, 'rgba(203, 213, 225, 0)');
          ctx.fillStyle = fGrad;

          ctx.beginPath();
          ctx.moveTo(-width * 0.5, height);
          for (let fx = -width * 0.5; fx <= width * 1.5; fx += 50 * dpr) {
            const fy = fogY + Math.sin((fx + fOffset) * 0.005 + fl) * (20 * dpr);
            ctx.lineTo(fx, fy);
          }
          ctx.lineTo(width * 1.5, height);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // 7. Thunderstorm & Lightning Simulator
      const isStorm = condition === 'thunderstorm' || isLightningActive;
      if (isStorm) {
        // Trigger random lightning bolt
        if (time > state.nextLightningTime || isLightningActive) {
          const boltStartX = width * (0.2 + Math.random() * 0.6);
          state.lightning = generateLightning(boltStartX, height * 0.08, height * 0.75);
          state.lightningFlashAlpha = 0.95;
          state.nextLightningTime = time + (Math.random() * 4500 + 3000);
          if (onLightningTriggered) onLightningTriggered();
        }

        // Render Lightning Flash Overlay
        if (state.lightningFlashAlpha > 0.02) {
          ctx.save();
          // Screen Sheet Flash
          ctx.fillStyle = `rgba(240, 245, 255, ${state.lightningFlashAlpha * 0.45})`;
          ctx.fillRect(0, 0, width, height);

          // Render Branching Bolts
          const drawBolt = (b: LightningBranch) => {
            if (b.points.length < 2) return;
            ctx.strokeStyle = `rgba(255, 255, 255, ${b.alpha * state.lightningFlashAlpha})`;
            ctx.lineWidth = b.width;
            ctx.shadowColor = '#93c5fd';
            ctx.shadowBlur = 16 * dpr;
            ctx.beginPath();
            ctx.moveTo(b.points[0].x, b.points[0].y);
            for (let i = 1; i < b.points.length; i++) {
              ctx.lineTo(b.points[i].x, b.points[i].y);
            }
            ctx.stroke();

            for (const fork of b.forks) {
              drawBolt(fork);
            }
          };

          if (state.lightning) {
            drawBolt(state.lightning);
          }

          state.lightningFlashAlpha *= Math.pow(0.05, dt);
          ctx.restore();
        }
      }

      // 8. Physics-based Rain & Splash Particle Simulation
      const isRaining = condition === 'rain' || condition === 'thunderstorm';
      const rainMult = isRaining ? (rainIntensityPct / 100) * (condition === 'thunderstorm' ? 1.25 : 1.0) : 0;

      if (rainMult > 0.05) {
        ctx.save();
        const activeDrops = Math.floor(state.raindrops.length * rainMult);
        const rainVx = Math.cos(windRad) * (windSpeedKmh / 3.6) * 35 * dpr;
        const groundLevel = height * 0.92;

        for (let i = 0; i < activeDrops; i++) {
          const drop = state.raindrops[i];
          drop.y += drop.speed * dt;
          drop.x += rainVx * dt;

          // Wrap around top or sides
          if (drop.x > width + 50 * dpr) drop.x = -50 * dpr;
          if (drop.x < -50 * dpr) drop.x = width + 50 * dpr;

          // Splash on ground plane impact
          if (drop.y > groundLevel + Math.random() * (height - groundLevel)) {
            // Spawn expanding ripple
            if (Math.random() < 0.35 && state.splashes.length < 45) {
              state.splashes.push({
                x: drop.x,
                y: drop.y,
                radius: 1.5 * dpr,
                maxRadius: (8 + Math.random() * 8) * dpr,
                opacity: 0.7,
                color: isDark ? 'rgba(224, 242, 254, 0.65)' : 'rgba(186, 230, 253, 0.8)',
              });
            }

            // Spawn micro bounce droplets
            if (Math.random() < 0.25 && state.splashDroplets.length < 60) {
              const numShards = 2 + Math.floor(Math.random() * 3);
              for (let s = 0; s < numShards; s++) {
                state.splashDroplets.push({
                  x: drop.x,
                  y: drop.y,
                  vx: (Math.random() * 80 - 40 + rainVx * 0.1) * dpr,
                  vy: -(Math.random() * 90 + 40) * dpr,
                  life: 0,
                  maxLife: Math.random() * 0.25 + 0.15,
                  size: (Math.random() * 1.5 + 0.8) * dpr,
                });
              }
            }

            // Reset drop to top
            drop.y = -drop.length - Math.random() * 100 * dpr;
            drop.x = Math.random() * width;
          }

          // Render Rain Streak
          ctx.strokeStyle = `rgba(224, 242, 254, ${drop.opacity * rainMult})`;
          ctx.lineWidth = drop.thickness;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - (rainVx / 30), drop.y - drop.length);
          ctx.stroke();
        }

        // Render Splash Ripples
        for (let r = state.splashes.length - 1; r >= 0; r--) {
          const rip = state.splashes[r];
          rip.radius += (rip.maxRadius - rip.radius) * 12 * dt;
          rip.opacity -= dt * 2.2;

          ctx.strokeStyle = rip.color.replace(/[\d.]+\)$/, `${rip.opacity})`);
          ctx.lineWidth = 1.0 * dpr;
          ctx.beginPath();
          ctx.ellipse(rip.x, rip.y, rip.radius, rip.radius * 0.45, 0, 0, Math.PI * 2);
          ctx.stroke();

          if (rip.opacity <= 0) {
            state.splashes.splice(r, 1);
          }
        }

        // Render Splash Micro Droplets
        for (let d = state.splashDroplets.length - 1; d >= 0; d--) {
          const sd = state.splashDroplets[d];
          sd.life += dt;
          sd.x += sd.vx * dt;
          sd.y += sd.vy * dt;
          sd.vy += 450 * dpr * dt; // gravity

          const sdAlpha = Math.max(0, 1 - sd.life / sd.maxLife);
          ctx.fillStyle = `rgba(224, 242, 254, ${sdAlpha * 0.75})`;
          ctx.beginPath();
          ctx.arc(sd.x, sd.y, sd.size, 0, Math.PI * 2);
          ctx.fill();

          if (sd.life >= sd.maxLife) {
            state.splashDroplets.splice(d, 1);
          }
        }

        ctx.restore();
      }

      // 9. Snow Particle Physics Simulation
      const isSnowing = condition === 'snow';
      if (isSnowing && snowIntensityPct > 5) {
        ctx.save();
        const activeSnow = Math.floor(state.snowflakes.length * (snowIntensityPct / 100));
        for (let i = 0; i < activeSnow; i++) {
          const sf = state.snowflakes[i];
          sf.swingPhase += sf.swingSpeed * dt;
          sf.y += sf.speedY * dt;
          sf.x += Math.sin(sf.swingPhase) * sf.swingAmplitude * dt + (windSpeedKmh * 0.4 * dpr * dt);
          sf.rotation += sf.rotationSpeed * dt;

          if (sf.y > height + 20 * dpr) {
            sf.y = -20 * dpr;
            sf.x = Math.random() * width;
          }
          if (sf.x > width + 40 * dpr) sf.x = -40 * dpr;
          if (sf.x < -40 * dpr) sf.x = width + 40 * dpr;

          ctx.fillStyle = `rgba(255, 255, 255, ${sf.opacity})`;
          ctx.beginPath();
          ctx.arc(sf.x, sf.y, sf.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    condition,
    timeDecimal,
    windSpeedKmh,
    windDegrees,
    rainIntensityPct,
    cloudDensityPct,
    fogDensityPct,
    snowIntensityPct,
    isLightningActive,
    showScenicLandscape,
    selectedLandscapeIdx,
    onLightningTriggered,
    onLuminanceChange,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};

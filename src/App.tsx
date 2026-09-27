/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mausam — Real-Time Physics Atmospheric Weather Portal & Persona Engine
 * Inspired by native Realme / ColorOS / HyperOS dynamic atmospheric canvas & IMD telemetry.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Navigation,
  Search,
  Check,
  MapPin,
  RefreshCw,
  Sun,
  CloudRain,
  Cloud,
  CloudLightning,
  CloudFog,
  Snowflake,
  Wind,
  AlertTriangle,
  Sprout,
  Users,
  HeartPulse,
  Activity,
  Waves,
  Calendar,
  Sunrise,
  Sunset,
  Clock,
  Droplets,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Thermometer,
  Umbrella,
  Bell,
  BellRing,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Gauge,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { WeatherCanvas } from './components/WeatherCanvas';
import { WeatherConditionType } from './types/weather';

// ============================================================================
// PROFILE & PERSONA DEFINITIONS
// ============================================================================

export type UserProfile =
  | 'farmer'
  | 'commuter'
  | 'health'
  | 'fitness'
  | 'beach'
  | 'planner';

export interface ProfileMeta {
  id: UserProfile;
  label: string;
  shortLabel: string;
  forWhom: string;
  icon: React.ElementType;
}

export const PROFILES: ProfileMeta[] = [
  {
    id: 'farmer',
    label: 'Farmer & Agriculture',
    shortLabel: 'Farmer',
    forWhom: 'Soil moisture, rain mm & crop guidance',
    icon: Sprout,
  },
  {
    id: 'commuter',
    label: 'Commuter & School Parent',
    shortLabel: 'Commuter',
    forWhom: 'Morning route, fog & road safety',
    icon: Users,
  },
  {
    id: 'health',
    label: 'Health & Air Quality',
    shortLabel: 'Health',
    forWhom: 'AQI, pollen count & UV index',
    icon: HeartPulse,
  },
  {
    id: 'fitness',
    label: 'Outdoor & Runner',
    shortLabel: 'Runner',
    forWhom: 'Best running hours & heat warnings',
    icon: Activity,
  },
  {
    id: 'beach',
    label: 'Beach & Coastal',
    shortLabel: 'Beach',
    forWhom: 'Tide timings, swell & water temp',
    icon: Waves,
  },
  {
    id: 'planner',
    label: 'Traveler & Events',
    shortLabel: 'Planner',
    forWhom: '7-day outlook & Comfort Index',
    icon: Calendar,
  },
];

// Presets for seamless location switching
export const POPULAR_LOCATIONS = [
  { name: 'Karnal (Punjab/Haryana Agri Belt)', lat: 29.6857, lon: 76.9905, type: 'agri' },
  { name: 'New Delhi (NCR Metro)', lat: 28.6139, lon: 77.2090, type: 'metro' },
  { name: 'Mumbai (Coastal Port)', lat: 18.9220, lon: 72.8347, type: 'coast' },
  { name: 'Bengaluru (Deccan Plateau)', lat: 12.9716, lon: 77.5946, type: 'metro' },
  { name: 'Pune (Western Maharashtra)', lat: 18.5204, lon: 73.8567, type: 'agri' },
  { name: 'Goa (Beaches & Shoreline)', lat: 15.2993, lon: 74.1240, type: 'coast' },
  { name: 'Shimla (Himalayan Ridge)', lat: 31.1048, lon: 77.1734, type: 'hills' },
];

// ============================================================================
// WEATHER ALERTS & NOTIFICATION INTERFACES
// ============================================================================

export interface WeatherAlertItem {
  id: string;
  type: 'severe_weather' | 'hazardous_aqi' | 'frost' | 'heat';
  severity: 'warning' | 'severe' | 'emergency';
  title: string;
  message: string;
  timestamp: string;
  suggestedAction: string;
}

// ============================================================================
// DATA ENGINE INTERFACES
// ============================================================================

export interface DailyOutlook {
  day: string;
  date: string;
  condition: WeatherConditionType;
  conditionText: string;
  rainProb: number;
  tempMax: number;
  tempMin: number;
  advice: string;
}

export interface WeatherModel {
  locationName: string;
  isGps: boolean;
  coords: { lat: number; lon: number };
  tempC: number;
  feelsLikeC: number;
  condition: WeatherConditionType;
  conditionText: string;
  rainProbNow: number;
  rainIntensityPct: number;
  cloudDensityPct: number;
  fogDensityPct: number;
  snowIntensityPct: number;
  rainExpectedInHours: number | null;
  humidityPct: number;
  windKmh: number;
  windDegrees: number;
  pressureHpa: number;
  dewPointC: number;

  // 1. Farmer data
  farming: {
    soilMoisturePct: number;
    soilStatus: 'Too Dry' | 'Optimal Moisture' | 'Waterlogged';
    frostAlert: boolean;
    frostMsg: string;
    plantingAdvice: string;
    nextRainWindow: string;
    expectedRainMm: number;
  };

  // 2. Commuter data
  commuter: {
    commuteRating: 'Safe & Clear' | 'Caution: Rain' | 'Slow: Heavy Fog';
    morningSchoolBusSafety: string;
    visibilityMeters: number;
    fogAlert: boolean;
    stormWarning: boolean;
    travelAdvice: string;
  };

  // 3. Health data
  health: {
    aqi: number;
    aqiStatus: 'Good' | 'Moderate' | 'Bad' | 'Hazardous';
    pollenLevel: 'Low' | 'Moderate' | 'High';
    uvIndex: number;
    uvStatus: 'Low' | 'Moderate' | 'Very High';
    simpleHealthAdvice: string;
  };

  // 4. Fitness data
  fitness: {
    bestHourToday: string;
    bestHourTemp: number;
    heatWarning: boolean;
    heatWarningText: string;
    sunriseTime: string;
    sunsetTime: string;
    runnerVerdict: string;
  };

  // 5. Beach data
  beach: {
    highTideTime: string;
    lowTideTime: string;
    waterTempC: number;
    waveHeightMeters: number;
    surfSafety: 'Safe Swell' | 'Moderate Waves' | 'Rough / Warning';
  };

  // 6. Planner data
  planner: {
    comfortIndex: number; // 0 - 100
    comfortLabel: string;
    packingAdvice: string;
  };

  daily7: DailyOutlook[];
}

// ============================================================================
// METEOROLOGICAL GENERATOR
// ============================================================================

export function generateAtmosphericWeather(
  lat: number,
  lon: number,
  customName?: string,
  isGps = false,
  forcedCondition?: WeatherConditionType
): WeatherModel {
  const seed = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233)) * 100;
  const isCoast = (lon > 72 && lon < 74) || (lon > 80 && lon < 85);
  const isNorthPlains = lat > 26 && lon > 74 && lon < 80;
  const isHills = lat > 30;

  const baseTemp = isHills ? 16 : isNorthPlains ? 31 : isCoast ? 29 : 27;
  const tempC = Math.round(baseTemp + (seed % 6) - 2);
  const humidityPct = Math.round(isCoast ? 78 : isHills ? 65 : 48 + (seed % 24));
  const rainProbNow = Math.round((seed * 3.4) % 98);
  const windKmh = Math.round(10 + (seed % 28));
  const windDegrees = Math.round((seed * 37) % 360);
  const pressureHpa = Math.round(1012 - (isHills ? 80 : (seed % 8)));
  const dewPointC = Math.round(tempC - (100 - humidityPct) / 5);

  // Derive atmospheric condition if not forced
  let condition: WeatherConditionType = 'sunny';
  let conditionText = 'Sunny & Clear';
  let rainIntensityPct = 0;
  let cloudDensityPct = 15;
  let fogDensityPct = 0;
  let snowIntensityPct = 0;
  let rainExpectedInHours: number | null = null;

  if (forcedCondition) {
    condition = forcedCondition;
    switch (forcedCondition) {
      case 'sunny':
        conditionText = 'Sunny & Clear Sky';
        cloudDensityPct = 10;
        break;
      case 'partly_cloudy':
        conditionText = 'Partly Cloudy';
        cloudDensityPct = 45;
        break;
      case 'overcast':
        conditionText = 'Dense Overcast Clouds';
        cloudDensityPct = 90;
        break;
      case 'rain':
        conditionText = 'Continuous Rain Showers';
        cloudDensityPct = 85;
        rainIntensityPct = 75;
        rainExpectedInHours = 0;
        break;
      case 'thunderstorm':
        conditionText = 'Severe Thunderstorm & Squall';
        cloudDensityPct = 100;
        rainIntensityPct = 95;
        rainExpectedInHours = 0;
        break;
      case 'fog':
        conditionText = 'Dense Volumetric Fog & Mist';
        fogDensityPct = 90;
        cloudDensityPct = 60;
        break;
      case 'snow':
        conditionText = 'Drifting Flurry Snow';
        snowIntensityPct = 80;
        cloudDensityPct = 75;
        break;
    }
  } else {
    if (rainProbNow > 80) {
      condition = 'thunderstorm';
      conditionText = 'Severe Thunderstorm & Squall';
      rainIntensityPct = 90;
      cloudDensityPct = 95;
      rainExpectedInHours = 1;
    } else if (rainProbNow > 55) {
      condition = 'rain';
      conditionText = 'Rain Showers Expected';
      rainIntensityPct = 65;
      cloudDensityPct = 80;
      rainExpectedInHours = 1;
    } else if (rainProbNow > 30) {
      condition = 'partly_cloudy';
      conditionText = 'Partly Cloudy';
      cloudDensityPct = 50;
      rainExpectedInHours = 3;
    } else if (isHills && tempC < 4) {
      condition = 'snow';
      conditionText = 'Mountain Snow & Cold Wave';
      snowIntensityPct = 70;
    } else if (humidityPct > 80 && tempC < 20) {
      condition = 'fog';
      conditionText = 'Morning Volumetric Fog';
      fogDensityPct = 80;
    } else {
      condition = 'sunny';
      conditionText = 'Clear Sunny Sky';
      cloudDensityPct = 15;
    }
  }

  // 1. Farming calculations
  const soilMoisturePct = Math.min(96, Math.max(18, Math.round(32 + (seed % 54))));
  let soilStatus: WeatherModel['farming']['soilStatus'] = 'Optimal Moisture';
  if (soilMoisturePct < 30) soilStatus = 'Too Dry';
  else if (soilMoisturePct > 82) soilStatus = 'Waterlogged';

  const frostAlert = tempC < 5;
  let plantingAdvice = 'Favorable weather for sowing, tilling, and routine field maintenance.';
  if (soilStatus === 'Too Dry') {
    plantingAdvice = 'Soil is dry. Deep irrigation recommended before evening crop sowing.';
  } else if (condition === 'rain' || condition === 'thunderstorm') {
    plantingAdvice = 'Precipitation active. Delay pesticide/fertilizer spraying to prevent chemical runoff.';
  } else if (frostAlert) {
    plantingAdvice = 'Cold temperature alert. Cover sensitive saplings to shield against frost burn.';
  }

  // 2. Commuter calculations
  const visibilityMeters =
    condition === 'fog' ? 800 : condition === 'thunderstorm' ? 1500 : condition === 'rain' ? 3200 : 9500;
  const fogAlert = visibilityMeters < 2000;
  const stormWarning = condition === 'thunderstorm' || rainIntensityPct > 70 || windKmh > 40;

  let commuteRating: WeatherModel['commuter']['commuteRating'] = 'Safe & Clear';
  if (stormWarning) commuteRating = 'Caution: Rain';
  else if (fogAlert) commuteRating = 'Slow: Heavy Fog';

  let morningSchoolBusSafety = 'Roads are dry and clear. School commute is normal.';
  if (stormWarning) {
    morningSchoolBusSafety = 'Heavy rain & wind squalls active. Pack raincoats and anticipate 15–20 min traffic delays.';
  } else if (fogAlert) {
    morningSchoolBusSafety = 'Dense morning mist. Drivers should use fog lamps and reduced speeds on arterial roads.';
  }

  // 3. Health calculations
  const aqiBase = isNorthPlains ? 185 : 65;
  const aqi = Math.round(aqiBase + (seed % 80));
  let aqiStatus: WeatherModel['health']['aqiStatus'] = 'Moderate';
  if (aqi <= 50) aqiStatus = 'Good';
  else if (aqi <= 100) aqiStatus = 'Moderate';
  else if (aqi <= 200) aqiStatus = 'Bad';
  else aqiStatus = 'Hazardous';

  const pollenLevel: WeatherModel['health']['pollenLevel'] = seed > 60 ? 'High' : seed > 30 ? 'Moderate' : 'Low';
  const uvIndex = Math.min(11, Math.max(2, Math.round(5 + (seed % 6))));
  const uvStatus: WeatherModel['health']['uvStatus'] = uvIndex >= 8 ? 'Very High' : uvIndex >= 5 ? 'Moderate' : 'Low';

  let simpleHealthAdvice = 'Air quality is acceptable for outdoor activity.';
  if (aqiStatus === 'Bad' || aqiStatus === 'Hazardous') {
    simpleHealthAdvice = 'Unhealthy air pollution. People with asthma or respiratory sensitivities should wear an N95 mask.';
  } else if (uvStatus === 'Very High') {
    simpleHealthAdvice = 'Harsh midday UV radiation. Apply sunscreen and wear UV-rated sunglasses.';
  }

  // 4. Fitness calculations
  const bestHourToday = tempC > 30 ? '06:00 AM' : '05:30 PM';
  const bestHourTemp = tempC > 30 ? tempC - 6 : tempC - 3;
  const heatWarning = tempC >= 34;
  const heatWarningText = heatWarning
    ? 'High Heat Stress: Avoid midday interval training. Maintain 1L hydration per hour of exercise.'
    : 'Comfortable thermal index. Safe for routine running and endurance training.';

  // 5. Beach calculations
  const waterTempC = Math.round(tempC - (isCoast ? 2 : 5));
  const waveHeightMeters = Number((0.6 + (seed % 15) * 0.1).toFixed(1));
  let surfSafety: WeatherModel['beach']['surfSafety'] = 'Safe Swell';
  if (waveHeightMeters > 1.5 || windKmh > 32) surfSafety = 'Rough / Warning';
  else if (waveHeightMeters > 1.0) surfSafety = 'Moderate Waves';

  // 6. Planner calculations (Thom's Discomfort Index)
  const discomfort = tempC - 0.55 * (1 - humidityPct / 100) * (tempC - 14.5);
  let comfortLabel = 'Optimal Comfort';
  if (discomfort > 28) comfortLabel = 'Severe Heat Discomfort';
  else if (discomfort > 24) comfortLabel = 'Moderate Humid Warmth';
  else if (discomfort < 15) comfortLabel = 'Crisp & Chilly';

  const comfortIndex = Math.round(Math.max(10, Math.min(95, 100 - (discomfort - 21) * 8)));

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const daily7: DailyOutlook[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayNames[d.getDay()];
    const dateLabel = `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`;
    const dRain = Math.min(95, Math.max(5, Math.round((seed * (i + 1) * 7) % 98)));
    const dMax = Math.round(tempC + (i % 3) - 1);
    const dMin = Math.round(dMax - 7);

    let dCond: WeatherConditionType = 'sunny';
    let dCondText = 'Clear Sky';
    if (dRain > 75) {
      dCond = 'thunderstorm';
      dCondText = 'Thunderstorms';
    } else if (dRain > 50) {
      dCond = 'rain';
      dCondText = 'Rain Showers';
    } else if (dRain > 25) {
      dCond = 'partly_cloudy';
      dCondText = 'Partly Cloudy';
    }

    let advice = 'Great day for outdoor events.';
    if (dRain > 60) advice = 'Carry an umbrella. High precipitation chance.';
    else if (dRain > 35) advice = 'Keep light rain cover handy.';
    else if (dMax >= 35) advice = 'Very warm. Schedule events in shaded areas.';

    daily7.push({
      day: dayLabel,
      date: dateLabel,
      condition: dCond,
      conditionText: dCondText,
      rainProb: dRain,
      tempMax: dMax,
      tempMin: dMin,
      advice,
    });
  }

  const locationName =
    customName || (isGps ? `GPS Coordinate (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)` : 'Karnal, Haryana');

  return {
    locationName,
    isGps,
    coords: { lat, lon },
    tempC,
    feelsLikeC: Math.round(tempC + (humidityPct > 60 ? 3 : -1)),
    condition,
    conditionText,
    rainProbNow,
    rainIntensityPct,
    cloudDensityPct,
    fogDensityPct,
    snowIntensityPct,
    rainExpectedInHours,
    humidityPct,
    windKmh,
    windDegrees,
    pressureHpa,
    dewPointC,
    farming: {
      soilMoisturePct,
      soilStatus,
      frostAlert,
      frostMsg: frostAlert
        ? 'Frost Risk Alert: Ground frost expected overnight! Cover delicate shoots.'
        : 'No Frost Risk: Minimum temperatures remain safely above freezing.',
      plantingAdvice,
      nextRainWindow: rainExpectedInHours
        ? `Rain likely within ${rainExpectedInHours} hour${rainExpectedInHours > 1 ? 's' : ''}`
        : 'No heavy rain expected today',
      expectedRainMm: rainProbNow > 50 ? Math.round(rainProbNow * 0.25) : 0,
    },
    commuter: {
      commuteRating,
      morningSchoolBusSafety,
      visibilityMeters,
      fogAlert,
      stormWarning,
      travelAdvice: stormWarning
        ? 'Wet roads & heavy downpour squalls. Drive with low beams on and increase braking distance.'
        : fogAlert
        ? 'Visibility under 2 km. Use fog lamps and maintain safe convoy spacing.'
        : 'Clear, dry pavement. Safe road conditions for school and work transit.',
    },
    health: {
      aqi,
      aqiStatus,
      pollenLevel,
      uvIndex,
      uvStatus,
      simpleHealthAdvice,
    },
    fitness: {
      bestHourToday,
      bestHourTemp,
      heatWarning,
      heatWarningText,
      sunriseTime: '06:12 AM',
      sunsetTime: '06:34 PM',
      runnerVerdict: heatWarning
        ? 'Run early morning only. Avoid daytime pavement heat stress.'
        : 'Pleasant running conditions during morning and late afternoon.',
    },
    beach: {
      highTideTime: '02:30 PM (High)',
      lowTideTime: '08:45 PM (Low)',
      waterTempC,
      waveHeightMeters,
      surfSafety,
    },
    planner: {
      comfortIndex,
      comfortLabel,
      packingAdvice:
        rainProbNow > 50
          ? 'Pack waterproof jacket and compact umbrella.'
          : tempC > 30
          ? 'Pack breathable cotton wear, sunglasses and sunscreen.'
          : 'Pack light layers for pleasant weather.',
    },
    daily7,
  };
}

// ============================================================================
// WEB AUDIO SOUND SYNTHESIZER (No external audio assets needed!)
// ============================================================================

function playAlertChime(severity: 'warning' | 'severe' | 'emergency') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (severity === 'emergency' || severity === 'severe') {
      // Urgent double beep
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(440, now + 0.15);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else {
      // Pleasant alert bell
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (e) {
    console.debug('Audio chime unable to play:', e);
  }
}

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  // Mode selection: 'realme' (dynamic physics canvas + frosted glass) vs 'sunlight' (high-contrast accessible outdoor mode)
  const [viewMode, setViewMode] = useState<'realme' | 'sunlight'>('realme');

  // User Profile selection
  const [profile, setProfile] = useState<UserProfile>('farmer');

  // Weather state & Overrides
  const [weather, setWeather] = useState<WeatherModel>(() =>
    generateAtmosphericWeather(29.6857, 76.9905, 'Karnal, Haryana (Agri Belt)', false)
  );

  // Time-of-day simulation state
  const [isLiveTime, setIsLiveTime] = useState<boolean>(true);
  const [customTimeDecimal, setCustomTimeDecimal] = useState<number>(() => {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  });

  // Weather condition override
  const [conditionOverride, setConditionOverride] = useState<WeatherConditionType | 'auto'>('auto');

  // Wind speed override
  const [windOverrideKmh, setWindOverrideKmh] = useState<number | null>(null);

  // Ambient sky luminance detected by canvas
  const [isSkyDark, setIsSkyDark] = useState<boolean>(true);

  // Temperature unit
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');

  // GPS & Search states
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [manualSearchQuery, setManualSearchQuery] = useState<string>('');

  // Notification API & Weather Alert state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isAlertCenterOpen, setIsAlertCenterOpen] = useState<boolean>(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [alertHistory, setAlertHistory] = useState<WeatherAlertItem[]>([]);
  const [isControlsOpen, setIsControlsOpen] = useState<boolean>(false);

  // Check Notification API status on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Update live time decimal clock if live time enabled
  useEffect(() => {
    if (!isLiveTime) return;
    const interval = setInterval(() => {
      const d = new Date();
      setCustomTimeDecimal(d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600);
    }, 10000);
    return () => clearInterval(interval);
  }, [isLiveTime]);

  // Request GPS on mount
  useEffect(() => {
    fetchCurrentGps();
  }, []);

  const fetchCurrentGps = () => {
    setIsLocating(true);
    setLocationError(null);

    if (!('geolocation' in navigator)) {
      setLocationError('GPS is not available on this device. You can select your city manually below.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newWeather = generateAtmosphericWeather(
          latitude,
          longitude,
          undefined,
          true,
          conditionOverride === 'auto' ? undefined : conditionOverride
        );
        setWeather(newWeather);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setLocationError('GPS permission was not allowed. Using Karnal (Agri Belt) as default. Select your city below:');
        } else {
          setLocationError('Could not acquire GPS fix. Using default location.');
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSearchQuery.trim()) return;

    const found = POPULAR_LOCATIONS.find((l) =>
      l.name.toLowerCase().includes(manualSearchQuery.toLowerCase().trim())
    );

    if (found) {
      setWeather(
        generateAtmosphericWeather(
          found.lat,
          found.lon,
          found.name,
          false,
          conditionOverride === 'auto' ? undefined : conditionOverride
        )
      );
    } else {
      const mockLat = 20.0 + (manualSearchQuery.length * 1.7) % 15;
      const mockLon = 75.0 + (manualSearchQuery.length * 2.3) % 12;
      setWeather(
        generateAtmosphericWeather(
          mockLat,
          mockLon,
          manualSearchQuery.trim(),
          false,
          conditionOverride === 'auto' ? undefined : conditionOverride
        )
      );
    }

    setManualSearchQuery('');
    setIsSearchOpen(false);
    setLocationError(null);
  };

  // Condition override handler
  const handleSelectCondition = (cond: WeatherConditionType | 'auto') => {
    setConditionOverride(cond);
    setWeather((prev) =>
      generateAtmosphericWeather(
        prev.coords.lat,
        prev.coords.lon,
        prev.locationName,
        prev.isGps,
        cond === 'auto' ? undefined : cond
      )
    );
  };

  // Active Weather Alerts Evaluator
  const activeAlerts = useMemo<WeatherAlertItem[]>(() => {
    const alerts: WeatherAlertItem[] = [];

    // 1. Severe Weather Alert (Thunderstorm or high rain intensity)
    if (weather.condition === 'thunderstorm' || weather.rainIntensityPct > 80) {
      alerts.push({
        id: `severe-storm-${weather.locationName}`,
        type: 'severe_weather',
        severity: 'severe',
        title: 'Severe Thunderstorm & Squall Warning',
        message: `High velocity wind gusts (${weather.windKmh} km/h) and heavy lightning active near ${weather.locationName}.`,
        timestamp: 'Just now',
        suggestedAction: 'Seek indoor shelter. Avoid open fields, metal fences, and under-tree parking.',
      });
    }

    // 2. Hazardous Air Quality Alert
    if (weather.health.aqi >= 200 || weather.health.aqiStatus === 'Hazardous') {
      alerts.push({
        id: `hazardous-aqi-${weather.locationName}`,
        type: 'hazardous_aqi',
        severity: 'emergency',
        title: 'Hazardous Air Quality Warning (AQI > 200)',
        message: `Dangerous particulate matter (AQI ${weather.health.aqi}) detected. Critical respiratory alert.`,
        timestamp: 'Just now',
        suggestedAction: 'Keep all windows closed. Avoid outdoor cardio workouts. Run HEPA air purifiers.',
      });
    }

    // 3. Frost / Freezing Alert
    if (weather.farming.frostAlert) {
      alerts.push({
        id: `frost-alert-${weather.locationName}`,
        type: 'frost',
        severity: 'warning',
        title: 'Overnight Ground Frost Alert',
        message: `Freezing temperatures (${weather.tempC}°C) threatening sensitive crops and winter vegetables.`,
        timestamp: 'Active',
        suggestedAction: 'Cover nursery beds with plastic mulch or straw. Apply light evening sprinkler irrigation.',
      });
    }

    return alerts;
  }, [weather]);

  // Trigger Browser Notification when severe condition occurs
  useEffect(() => {
    if (activeAlerts.length === 0) return;

    activeAlerts.forEach((alert) => {
      // If already recorded in history, skip duplicate push
      const isAlreadyInHistory = alertHistory.some((h) => h.id === alert.id);
      if (!isAlreadyInHistory) {
        setAlertHistory((prev) => [alert, ...prev]);

        // Play audio chime if enabled
        if (isAudioEnabled) {
          playAlertChime(alert.severity);
        }

        // Send browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`[MAUSAM ALERT] ${alert.title}`, {
              body: `${alert.message}\nAction: ${alert.suggestedAction}`,
              icon: '/favicon.ico',
              tag: alert.id,
            });
          } catch (e) {
            console.debug('Browser notification error:', e);
          }
        }
      }
    });
  }, [activeAlerts, isAudioEnabled, alertHistory]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Notification API is not supported in this browser environment.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        new Notification('Mausam Weather Alerts Active', {
          body: 'You will receive real-time notifications for Severe Weather and Hazardous AQI conditions.',
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateSevereStorm = () => {
    handleSelectCondition('thunderstorm');
    setIsAlertCenterOpen(false);
  };

  const handleSimulateHazardousAqi = () => {
    setWeather((prev) => ({
      ...prev,
      health: {
        ...prev.health,
        aqi: 342,
        aqiStatus: 'Hazardous',
        simpleHealthAdvice: 'Severe smog and hazardous particulate concentration. Stay indoors.',
      },
    }));
    setIsAlertCenterOpen(false);
  };

  const displayTemp = (celsius: number) => {
    if (tempUnit === 'F') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  const formatHourDecimal = (dec: number) => {
    const hrs = Math.floor(dec);
    const mins = Math.round((dec - hrs) * 60);
    const period = hrs >= 12 ? 'PM' : 'AM';
    const displayHrs = hrs % 12 === 0 ? 12 : hrs % 12;
    return `${displayHrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  const currentProfileMeta = useMemo(
    () => PROFILES.find((p) => p.id === profile) || PROFILES[0],
    [profile]
  );

  const effectiveWindSpeed = windOverrideKmh !== null ? windOverrideKmh : weather.windKmh;

  return (
    <div className={`min-h-screen relative font-sans transition-colors duration-500 select-none ${
      viewMode === 'sunlight' ? 'bg-neutral-100 text-neutral-950' : 'bg-slate-950 text-white'
    }`}>
      {/* 
        =======================================================================
        REALME / COLOROS DYNAMIC PHYSICS CANVAS LAYER
        =======================================================================
      */}
      {viewMode === 'realme' && (
        <WeatherCanvas
          condition={weather.condition}
          timeDecimal={customTimeDecimal}
          windSpeedKmh={effectiveWindSpeed}
          windDegrees={weather.windDegrees}
          rainIntensityPct={weather.rainIntensityPct}
          cloudDensityPct={weather.cloudDensityPct}
          fogDensityPct={weather.fogDensityPct}
          snowIntensityPct={weather.snowIntensityPct}
          onLuminanceChange={(isDark) => setIsSkyDark(isDark)}
          showScenicLandscape={true}
        />
      )}

      {/* 
        =======================================================================
        APPLICATION CONTAINER (ADAPTIVE FOREGROUND UI)
        =======================================================================
      */}
      <div className={`relative z-10 mx-auto min-h-screen flex flex-col ${
        viewMode === 'sunlight'
          ? 'max-w-lg bg-white border-x border-neutral-300 shadow-xl'
          : 'max-w-xl pb-16 backdrop-blur-[2px]'
      }`}>

        {/* 
          ---------------------------------------------------------------------
          TOP BAR: MODE SWITCH, ALERTS BELL, UNIT TOGGLE, GPS TRIGGER
          ---------------------------------------------------------------------
        */}
        <header className={`px-4 py-3 sticky top-0 z-30 transition-all ${
          viewMode === 'sunlight'
            ? 'bg-neutral-900 text-white border-b border-neutral-800'
            : isSkyDark
            ? 'bg-slate-950/60 backdrop-blur-xl border-b border-white/10 text-white'
            : 'bg-white/40 backdrop-blur-xl border-b border-black/10 text-slate-900'
        }`}>
          <div className="flex items-center justify-between gap-2">
            {/* App Brand & Tag */}
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
                MAUSAM
              </span>
              <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border ${
                viewMode === 'sunlight'
                  ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
                  : isSkyDark
                  ? 'bg-white/10 text-white/90 border-white/20'
                  : 'bg-black/10 text-slate-900 border-black/15'
              }`}>
                {viewMode === 'realme' ? 'Realme Sky Engine' : 'Sunlight Mode'}
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              {/* View Mode Toggle: Realme Sky vs Ultra-Accessible Sunlight */}
              <button
                onClick={() => setViewMode((m) => (m === 'realme' ? 'sunlight' : 'realme'))}
                title={viewMode === 'realme' ? 'Switch to High Sunlight Accessible Mode' : 'Switch to Realme Sky Engine'}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all flex items-center gap-1 active:scale-95 ${
                  viewMode === 'sunlight'
                    ? 'bg-white text-neutral-950 border-white hover:bg-neutral-200'
                    : isSkyDark
                    ? 'bg-white/15 text-white border-white/20 hover:bg-white/25'
                    : 'bg-black/10 text-slate-900 border-black/20 hover:bg-black/20'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{viewMode === 'realme' ? 'Accessible View' : 'Sky Engine'}</span>
              </button>

              {/* Notification Alerts Center Bell with Badge */}
              <button
                onClick={() => setIsAlertCenterOpen(true)}
                aria-label="Weather Alerts Notification Center"
                className={`relative p-2 rounded-lg border transition-all active:scale-95 ${
                  activeAlerts.length > 0
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                    : viewMode === 'sunlight'
                    ? 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                    : isSkyDark
                    ? 'bg-white/10 text-white border-white/15 hover:bg-white/20'
                    : 'bg-black/10 text-slate-900 border-black/15 hover:bg-black/15'
                }`}
              >
                {activeAlerts.length > 0 ? (
                  <BellRing className="w-4 h-4 text-red-500" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                {activeAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white shadow">
                    {activeAlerts.length}
                  </span>
                )}
              </button>

              {/* Atmosphere Controls Drawer Toggle */}
              {viewMode === 'realme' && (
                <button
                  onClick={() => setIsControlsOpen((c) => !c)}
                  title="Atmosphere & Time Settings"
                  className={`p-2 rounded-lg border transition-all active:scale-95 ${
                    isControlsOpen
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : isSkyDark
                      ? 'bg-white/10 text-white border-white/15 hover:bg-white/20'
                      : 'bg-black/10 text-slate-900 border-black/15 hover:bg-black/15'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              )}

              {/* °C / °F Unit Toggle */}
              <button
                onClick={() => setTempUnit((u) => (u === 'C' ? 'F' : 'C'))}
                aria-label="Toggle Temperature Unit"
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all active:scale-95 ${
                  viewMode === 'sunlight'
                    ? 'bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700'
                    : isSkyDark
                    ? 'bg-white/10 text-white border-white/15 hover:bg-white/20'
                    : 'bg-black/10 text-slate-900 border-black/15 hover:bg-black/15'
                }`}
              >
                °{tempUnit}
              </button>
            </div>
          </div>

          {/* 
            -------------------------------------------------------------------
            ATMOSPHERE CONTROLS BAR (REALME DYNAMIC SKY PREVIEWS)
            -------------------------------------------------------------------
          */}
          {viewMode === 'realme' && isControlsOpen && (
            <div className="mt-3 pt-3 border-t border-white/15 space-y-3 animate-in fade-in slide-in-from-top-2 text-xs">
              {/* Time of Day Scrub Bar */}
              <div>
                <div className="flex items-center justify-between mb-1 font-semibold text-white/80">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Time of Day: <span className="font-mono text-white font-bold">{formatHourDecimal(customTimeDecimal)}</span>
                  </span>
                  <button
                    onClick={() => {
                      setIsLiveTime((l) => !l);
                      if (!isLiveTime) {
                        const d = new Date();
                        setCustomTimeDecimal(d.getHours() + d.getMinutes() / 60);
                      }
                    }}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all ${
                      isLiveTime
                        ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400/50'
                        : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {isLiveTime ? '● Live Clock' : 'Manual Scrub'}
                  </button>
                </div>

                <input
                  type="range"
                  min="0"
                  max="24"
                  step="0.25"
                  value={customTimeDecimal}
                  onChange={(e) => {
                    setIsLiveTime(false);
                    setCustomTimeDecimal(parseFloat(e.target.value));
                  }}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
                />

                {/* Quick Time Presets */}
                <div className="grid grid-cols-5 gap-1 mt-1.5 text-[10px] text-center font-bold">
                  <button
                    onClick={() => { setIsLiveTime(false); setCustomTimeDecimal(6.0); }}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-orange-200"
                  >
                    🌅 Dawn
                  </button>
                  <button
                    onClick={() => { setIsLiveTime(false); setCustomTimeDecimal(12.0); }}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-yellow-200"
                  >
                    ☀️ Noon
                  </button>
                  <button
                    onClick={() => { setIsLiveTime(false); setCustomTimeDecimal(17.5); }}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-amber-200"
                  >
                    🌇 Golden
                  </button>
                  <button
                    onClick={() => { setIsLiveTime(false); setCustomTimeDecimal(19.2); }}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-purple-200"
                  >
                    🌆 Dusk
                  </button>
                  <button
                    onClick={() => { setIsLiveTime(false); setCustomTimeDecimal(23.0); }}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-indigo-200"
                  >
                    ✨ Night
                  </button>
                </div>
              </div>

              {/* Weather Condition Override Buttons */}
              <div>
                <div className="text-[11px] font-bold text-white/80 mb-1.5 flex items-center justify-between">
                  <span>Atmosphere Physics Condition:</span>
                  <span className="text-[10px] font-mono text-amber-300 capitalize">{conditionOverride}</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 text-[10px] font-semibold text-center">
                  <button
                    onClick={() => handleSelectCondition('auto')}
                    className={`p-1.5 rounded border transition-all ${conditionOverride === 'auto' ? 'bg-amber-400 text-slate-950 font-bold border-amber-300' : 'bg-white/10 hover:bg-white/20 border-white/10'}`}
                  >
                    Auto
                  </button>
                  <button
                    onClick={() => handleSelectCondition('sunny')}
                    className={`p-1.5 rounded border transition-all ${conditionOverride === 'sunny' ? 'bg-amber-400 text-slate-950 font-bold border-amber-300' : 'bg-white/10 hover:bg-white/20 border-white/10'}`}
                  >
                    ☀️ Sun
                  </button>
                  <button
                    onClick={() => handleSelectCondition('partly_cloudy')}
                    className={`p-1.5 rounded border transition-all ${conditionOverride === 'partly_cloudy' ? 'bg-amber-400 text-slate-950 font-bold border-amber-300' : 'bg-white/10 hover:bg-white/20 border-white/10'}`}
                  >
                    ⛅ Cloud
                  </button>
                  <button
                    onClick={() => handleSelectCondition('overcast')}
                    className={`p-1.5 rounded border transition-all ${conditionOverride === 'overcast' ? 'bg-amber-400 text-slate-950 font-bold border-amber-300' : 'bg-white/10 hover:bg-white/20 border-white/10'}`}
                  >
                    ☁️ Overcast
                  </button>
                  <button
                    onClick={() => handleSelectCondition('rain')}
                    className={`p-1.5 rounded border transition-all ${conditionOverride === 'rain' ? 'bg-blue-400 text-slate-950 font-bold border-blue-300' : 'bg-white/10 hover:bg-white/20 border-white/10'}`}
                  >
                    🌧️ Rain
                  </button>
                  <button
                    onClick={() => handleSelectCondition('thunderstorm')}
                    className={`p-1.5 rounded border transition-all ${conditionOverride === 'thunderstorm' ? 'bg-indigo-400 text-slate-950 font-bold border-indigo-300 animate-pulse' : 'bg-white/10 hover:bg-white/20 border-white/10'}`}
                  >
                    ⚡ Storm
                  </button>
                  <button
                    onClick={() => handleSelectCondition('fog')}
                    className={`p-1.5 rounded border transition-all ${conditionOverride === 'fog' ? 'bg-slate-300 text-slate-950 font-bold border-slate-200' : 'bg-white/10 hover:bg-white/20 border-white/10'}`}
                  >
                    🌫️ Fog
                  </button>
                  <button
                    onClick={() => handleSelectCondition('snow')}
                    className={`p-1.5 rounded border transition-all ${conditionOverride === 'snow' ? 'bg-cyan-300 text-slate-950 font-bold border-cyan-200' : 'bg-white/10 hover:bg-white/20 border-white/10'}`}
                  >
                    ❄️ Snow
                  </button>
                </div>
              </div>

              {/* Wind Speed Override */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="flex items-center gap-1 text-white/80 font-semibold shrink-0">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" />
                  Wind Angle & Speed: <span className="font-mono text-white font-bold">{effectiveWindSpeed} km/h</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="70"
                  step="5"
                  value={effectiveWindSpeed}
                  onChange={(e) => setWindOverrideKmh(parseInt(e.target.value))}
                  className="w-32 accent-cyan-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
                />
              </div>
            </div>
          )}
        </header>

        {/* 
          ---------------------------------------------------------------------
          ACTIVE WEATHER ALERTS BANNER (Triggered on Severe Storm / Bad AQI)
          ---------------------------------------------------------------------
        */}
        {activeAlerts.length > 0 && !dismissedAlertIds.has(activeAlerts[0].id) && (
          <div className="bg-red-600 text-white px-4 py-3 shadow-lg flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-1 border-b border-red-700">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-white animate-bounce" />
              <div>
                <div className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                  <span>{activeAlerts[0].title}</span>
                  <span className="text-[10px] bg-red-950 text-red-200 font-mono px-1.5 py-0.5 rounded font-bold">
                    EMERGENCY
                  </span>
                </div>
                <p className="text-xs text-red-100 font-medium mt-0.5">
                  {activeAlerts[0].message}
                </p>
                <div className="text-[11px] font-bold text-amber-200 mt-1">
                  Action: {activeAlerts[0].suggestedAction}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsAlertCenterOpen(true)}
                className="text-xs bg-white text-red-950 font-extrabold px-2.5 py-1 rounded shadow hover:bg-red-50 active:scale-95"
              >
                Details
              </button>
              <button
                onClick={() => setDismissedAlertIds((prev) => new Set([...prev, activeAlerts[0].id]))}
                className="p-1 hover:bg-red-700 rounded text-red-200"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 
          ---------------------------------------------------------------------
          LOCATION STATUS & GPS SEARCH BAR
          ---------------------------------------------------------------------
        */}
        <div className={`px-4 py-2.5 flex items-center justify-between gap-2 border-b transition-all ${
          viewMode === 'sunlight'
            ? 'bg-neutral-100 border-neutral-300 text-neutral-900'
            : isSkyDark
            ? 'bg-slate-900/40 border-white/10 text-white/90'
            : 'bg-white/30 border-black/10 text-slate-900'
        }`}>
          <div className="flex items-center gap-2 truncate">
            <MapPin className={`w-4 h-4 shrink-0 ${viewMode === 'sunlight' ? 'text-neutral-900' : 'text-amber-400'}`} />
            <span className="text-sm font-bold truncate">{weather.locationName}</span>
            {weather.isGps && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                viewMode === 'sunlight'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
              }`}>
                GPS FIX
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={fetchCurrentGps}
              disabled={isLocating}
              aria-label="Refresh Location with GPS"
              className={`p-1.5 rounded-lg border transition-all active:scale-95 ${
                viewMode === 'sunlight'
                  ? 'bg-white text-neutral-950 border-neutral-300 hover:bg-neutral-200'
                  : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsSearchOpen((s) => !s)}
              className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                viewMode === 'sunlight'
                  ? 'bg-white text-neutral-900 border-neutral-400 hover:bg-neutral-900 hover:text-white'
                  : isSkyDark
                  ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  : 'bg-black/10 text-slate-900 border-black/20 hover:bg-black/20'
              }`}
            >
              <Search className="w-3 h-3" />
              <span>{isSearchOpen ? 'Close' : 'Cities'}</span>
            </button>
          </div>
        </div>

        {/* Location Search Drawer */}
        {isSearchOpen && (
          <div className={`p-4 border-b-2 space-y-3 animate-in fade-in slide-in-from-top-2 ${
            viewMode === 'sunlight'
              ? 'bg-neutral-50 border-neutral-900 text-neutral-900'
              : 'bg-slate-900/90 backdrop-blur-2xl border-amber-400/50 text-white'
          }`}>
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input
                type="text"
                value={manualSearchQuery}
                onChange={(e) => setManualSearchQuery(e.target.value)}
                placeholder="Type city or station name (e.g. Mumbai, New Delhi, Shimla)..."
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border-2 focus:outline-none ${
                  viewMode === 'sunlight'
                    ? 'bg-white border-neutral-800 text-neutral-900 placeholder:text-neutral-500 focus:ring-2 focus:ring-neutral-900'
                    : 'bg-slate-950/80 border-white/20 text-white placeholder:text-white/40 focus:border-amber-400'
                }`}
              />
              <button
                type="submit"
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all active:scale-95 ${
                  viewMode === 'sunlight'
                    ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                    : 'bg-amber-400 text-slate-950 hover:bg-amber-300 font-extrabold'
                }`}
              >
                Search
              </button>
            </form>

            <div>
              <div className={`text-xs font-bold mb-1.5 uppercase tracking-wide ${
                viewMode === 'sunlight' ? 'text-neutral-600' : 'text-white/60'
              }`}>
                Quick Select Stations & Topographies:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => {
                      setWeather(
                        generateAtmosphericWeather(
                          loc.lat,
                          loc.lon,
                          loc.name,
                          false,
                          conditionOverride === 'auto' ? undefined : conditionOverride
                        )
                      );
                      setIsSearchOpen(false);
                      setLocationError(null);
                    }}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                      viewMode === 'sunlight'
                        ? 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-900 hover:text-white'
                        : 'bg-white/10 text-white border-white/15 hover:bg-amber-400 hover:text-slate-950'
                    }`}
                  >
                    {loc.name.split(' (')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Location Error Feedback */}
        {locationError && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2.5 text-xs text-amber-200 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{locationError}</span>
            </div>
            <button onClick={() => setLocationError(null)} className="p-1 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 
          ---------------------------------------------------------------------
          HERO SYNOPTIC DISPLAY: TEMPERATURE & SKY WEATHER AT A GLANCE
          ---------------------------------------------------------------------
        */}
        <div className={`px-5 py-6 flex items-center justify-between transition-all ${
          viewMode === 'sunlight'
            ? 'bg-neutral-50 border-b border-neutral-300'
            : isSkyDark
            ? 'bg-slate-900/30 backdrop-blur-md border-b border-white/10'
            : 'bg-white/20 backdrop-blur-md border-b border-black/10 text-slate-900'
        }`}>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight drop-shadow-sm">
                {displayTemp(weather.tempC)}
              </span>
              <span className="text-sm font-semibold opacity-75">
                Feels {displayTemp(weather.feelsLikeC)}
              </span>
            </div>
            <div className="text-base font-bold mt-1 flex items-center gap-2">
              <span>{weather.conditionText}</span>
            </div>
            <div className="text-xs opacity-75 mt-0.5">
              Humidity {weather.humidityPct}% • Dew Pt {displayTemp(weather.dewPointC)} • {weather.pressureHpa} hPa
            </div>
          </div>

          <div className="text-right space-y-1.5 pl-4 border-l border-current/15">
            <div className="text-xs font-bold uppercase tracking-wider opacity-70">
              Rain Chance
            </div>
            <div className="text-3xl font-black font-mono">
              {weather.rainProbNow}%
            </div>
            <div className="text-xs font-semibold opacity-85 flex items-center justify-end gap-1">
              <Compass className="w-3.5 h-3.5" />
              <span>{effectiveWindSpeed} km/h ({weather.windDegrees}°)</span>
            </div>
          </div>
        </div>

        {/* 
          ---------------------------------------------------------------------
          PERSONA SELECTOR: ROLE-BASED NAVIGATION
          ---------------------------------------------------------------------
        */}
        <section aria-label="Profile Selection" className={`p-4 border-b-2 transition-all ${
          viewMode === 'sunlight'
            ? 'bg-white border-neutral-900'
            : isSkyDark
            ? 'bg-slate-900/40 backdrop-blur-xl border-white/10'
            : 'bg-white/40 backdrop-blur-xl border-black/10'
        }`}>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 opacity-90">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Tailored Persona Engine:
            </label>
            <span className="text-xs opacity-70 font-medium">
              Filters strictly relevant data
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PROFILES.map((p) => {
              const Icon = p.icon;
              const isSelected = profile === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setProfile(p.id)}
                  aria-pressed={isSelected}
                  className={`p-3 rounded-xl border-2 text-left flex flex-col justify-between transition-all min-h-[76px] active:scale-95 ${
                    isSelected
                      ? viewMode === 'sunlight'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-md ring-2 ring-neutral-900 ring-offset-1'
                        : 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg font-bold'
                      : viewMode === 'sunlight'
                      ? 'bg-white text-neutral-900 border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50'
                      : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon className={`w-5 h-5 ${isSelected && viewMode === 'realme' ? 'text-slate-950' : ''}`} />
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-sm font-extrabold leading-tight mt-1">{p.shortLabel}</div>
                    <div className={`text-[10px] leading-none mt-0.5 truncate ${
                      isSelected ? (viewMode === 'sunlight' ? 'text-neutral-300' : 'text-slate-900/80') : 'opacity-70'
                    }`}>
                      {p.forWhom}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 
          ---------------------------------------------------------------------
          PERSONA DETAIL VIEWPORTS
          ---------------------------------------------------------------------
        */}
        <main className="flex-1 p-4 sm:p-5 space-y-4">

          {/* 1. FARMER & AGRICULTURE */}
          {profile === 'farmer' && (
            <div className="space-y-3.5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b pb-2 border-current/15">
                <h2 className="text-base font-extrabold uppercase tracking-tight flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-emerald-400" />
                  Farmer Field Weather Report
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Agri Agromet
                </span>
              </div>

              {/* 1. Soil Moisture Status */}
              <div className={`p-4 rounded-xl border-2 space-y-2 ${
                viewMode === 'sunlight'
                  ? 'bg-neutral-50 border-neutral-900'
                  : 'bg-slate-900/50 backdrop-blur-xl border-white/15'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase opacity-80">1. Root Zone Soil Moisture</span>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded ${
                    weather.farming.soilStatus === 'Optimal Moisture'
                      ? 'bg-emerald-600 text-white'
                      : weather.farming.soilStatus === 'Too Dry'
                      ? 'bg-amber-600 text-white'
                      : 'bg-blue-600 text-white'
                  }`}>
                    {weather.farming.soilStatus}
                  </span>
                </div>
                <div className="text-3xl font-black font-mono">
                  {weather.farming.soilMoisturePct}% Moisture
                </div>
                <p className="text-xs font-medium opacity-90 leading-relaxed">
                  {weather.farming.soilStatus === 'Too Dry'
                    ? 'Topsoil is rapidly losing moisture. Deep irrigation recommended before evening crop sowing.'
                    : weather.farming.soilStatus === 'Waterlogged'
                    ? 'Heavy water saturation in root zone. Ensure drainage ditches remain unobstructed.'
                    : 'Moisture level is optimal for active vegetative growth and fertilizer absorption.'}
                </p>
              </div>

              {/* 2. Rainfall Accumulation & Window */}
              <div className={`p-4 rounded-xl border-2 space-y-2 ${
                viewMode === 'sunlight'
                  ? 'bg-neutral-50 border-neutral-900'
                  : 'bg-slate-900/50 backdrop-blur-xl border-white/15'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase opacity-80">2. Precipitation Forecast</span>
                  <span className="text-xs font-mono font-bold opacity-75">Next 24h Window</span>
                </div>
                <div className="text-2xl font-black">
                  {weather.farming.nextRainWindow}
                </div>
                <div className="text-xs font-bold opacity-90">
                  Estimated accumulation: ~{weather.farming.expectedRainMm} mm
                </div>
              </div>

              {/* 3. Frost & Freezing Alert */}
              <div className={`p-4 rounded-xl border-2 space-y-1.5 ${
                weather.farming.frostAlert
                  ? 'bg-red-500/20 border-red-500 text-red-200'
                  : viewMode === 'sunlight'
                  ? 'bg-white border-neutral-300'
                  : 'bg-slate-900/40 border-white/15'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-5 h-5 ${weather.farming.frostAlert ? 'text-red-400' : 'opacity-70'}`} />
                  <span className="text-sm font-extrabold uppercase">3. Frost & Freezing Warning</span>
                </div>
                <p className="text-xs font-medium leading-relaxed mt-1">
                  {weather.farming.frostMsg}
                </p>
              </div>

              {/* 4. Seasonal Planting Guidance */}
              <div className={`p-4 rounded-xl border-2 space-y-1.5 ${
                viewMode === 'sunlight'
                  ? 'bg-neutral-50 border-neutral-900'
                  : 'bg-slate-900/50 backdrop-blur-xl border-white/15'
              }`}>
                <span className="text-xs font-bold uppercase opacity-80">4. Seasonal Agromet Guidance</span>
                <p className="text-sm font-bold leading-snug">
                  {weather.farming.plantingAdvice}
                </p>
              </div>
            </div>
          )}

          {/* 2. COMMUTER & PARENT */}
          {profile === 'commuter' && (
            <div className="space-y-3.5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b pb-2 border-current/15">
                <h2 className="text-base font-extrabold uppercase tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Commute, School & Transit Report
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Transit View
                </span>
              </div>

              {/* 1. School Commute Status */}
              <div className={`p-4 rounded-xl border-2 space-y-2 ${
                viewMode === 'sunlight'
                  ? 'bg-neutral-50 border-neutral-900'
                  : 'bg-slate-900/50 backdrop-blur-xl border-white/15'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase opacity-80">1. Morning School Bus Route</span>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded ${
                    weather.commuter.commuteRating === 'Safe & Clear'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}>
                    {weather.commuter.commuteRating}
                  </span>
                </div>
                <div className="text-sm font-bold leading-snug">
                  {weather.commuter.morningSchoolBusSafety}
                </div>
              </div>

              {/* 2. Immediate Rain / Storm Alert */}
              <div className={`p-4 rounded-xl border-2 space-y-1.5 ${
                weather.commuter.stormWarning
                  ? 'bg-red-500/20 border-red-500 text-red-200'
                  : viewMode === 'sunlight'
                  ? 'bg-white border-neutral-300'
                  : 'bg-slate-900/40 border-white/15'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase">2. Storm & Squall Risk</span>
                  <span className="text-xs font-mono font-bold">{weather.rainProbNow}% Rain Probability</span>
                </div>
                <div className="text-lg font-black">
                  {weather.commuter.stormWarning ? 'Storm Warning in Effect' : 'No Severe Storm Detected'}
                </div>
                <p className="text-xs font-medium opacity-90">
                  {weather.commuter.stormWarning
                    ? 'Sudden heavy downpours and squalls expected. Carry umbrella and allow 15–20 min buffer.'
                    : 'Safe for school bus routes, bicycling, and highway commutes.'}
                </p>
              </div>

              {/* 3. Optical Visibility Distance */}
              <div className={`p-4 rounded-xl border-2 space-y-2 ${
                viewMode === 'sunlight'
                  ? 'bg-neutral-50 border-neutral-900'
                  : 'bg-slate-900/50 backdrop-blur-xl border-white/15'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase opacity-80">3. Sightline Visibility & Fog</span>
                  <span className="text-xs font-mono font-bold">{weather.commuter.visibilityMeters} Meters</span>
                </div>
                <div className="text-xl font-black">
                  {weather.commuter.fogAlert ? 'Low Sightline Warning (Mist/Fog)' : 'Clear Road Sightlines'}
                </div>
                <p className="text-xs font-medium opacity-85">
                  {weather.commuter.travelAdvice}
                </p>
              </div>
            </div>
          )}

          {/* 3. HEALTH & AIR QUALITY */}
          {profile === 'health' && (
            <div className="space-y-3.5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b pb-2 border-current/15">
                <h2 className="text-base font-extrabold uppercase tracking-tight flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-rose-400" />
                  Health & Environmental Exposure
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/30">
                  SAFAR / CPCB
                </span>
              </div>

              {/* 1. AQI Score */}
              <div className={`p-4 rounded-xl border-2 space-y-2 ${
                viewMode === 'sunlight'
                  ? 'bg-neutral-50 border-neutral-900'
                  : 'bg-slate-900/50 backdrop-blur-xl border-white/15'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase opacity-80">1. Air Quality Index (AQI)</span>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded text-white ${
                    weather.health.aqiStatus === 'Good'
                      ? 'bg-emerald-600'
                      : weather.health.aqiStatus === 'Moderate'
                      ? 'bg-yellow-600'
                      : weather.health.aqiStatus === 'Bad'
                      ? 'bg-orange-600'
                      : 'bg-red-600'
                  }`}>
                    {weather.health.aqiStatus.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black font-mono">{weather.health.aqi}</span>
                  <span className="text-xs opacity-75 font-semibold">CPCB AQI Score</span>
                </div>
                <p className="text-xs font-medium opacity-90">
                  {weather.health.simpleHealthAdvice}
                </p>
              </div>

              {/* 2. Pollen Count */}
              <div className={`p-4 rounded-xl border-2 space-y-2 ${
                viewMode === 'sunlight'
                  ? 'bg-neutral-50 border-neutral-900'
                  : 'bg-slate-900/50 backdrop-blur-xl border-white/15'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase opacity-80">2. Allergen & Pollen Spores</span>
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    {weather.health.pollenLevel.toUpperCase()} POLLEN
                  </span>
                </div>
                <div className="text-2xl font-black">
                  {weather.health.pollenLevel} Grass & Tree Spores
                </div>
                <p className="text-xs font-medium opacity-85">
                  {weather.health.pollenLevel === 'High'
                    ? 'Allergy trigger: Keep windows shut during morning hours and take prescribed antihistamines.'
                    : 'Low allergen count today. Favorable for people with asthma or seasonal allergies.'}
                </p>
              </div>

              {/* 3. UV Index */}
              <div className={`p-4 rounded-xl border-2 space-y-2 ${
                viewMode === 'sunlight'
                  ? 'bg-neutral-50 border-neutral-900'
                  : 'bg-slate-900/50 backdrop-blur-xl border-white/15'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase opacity-80">3. Sun UV Ray Exposure</span>
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    {weather.health.uvStatus.toUpperCase()} UV
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono">{weather.health.uvIndex}</span>
                  <span className="text-xs opacity-75 font-semibold">UV Index</span>
                </div>
                <p className="text-xs font-medium opacity-85">
                  {weather.health.uvIndex >= 8
                    ? 'Strong midday UV radiation. Apply SPF 30+ sunscreen and wear sunglasses if outdoors.'
                    : 'Moderate sun exposure. Safe for typical outdoor transit.'}
                </p>
              </div>
            </div>
          )}

          {/* 4. FITNESS & RUNNERS */}
          {profile === 'fitness' && (
            <div className="space-y-3.5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b pb-2 border-current/15">
                <h2 className="text-base font-extrabold uppercase tracking-tight flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Runner & Outdoor Fitness Schedule
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Athlete View
                </span>
              </div>

              {/* 1. Best Time to Run */}
              <div className={`p-4 rounded-xl border-2 space-y-2 ${
                viewMode === 'sunlight'
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-medium'
              }`}>
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                  1. Best Running Window Today
                </span>
                <div className="text-3xl font-black font-mono">
                  {weather.fitness.bestHourToday}
                </div>
                <div className="text-xs opacity-90">
                  Forecasted Temp: {displayTemp(weather.fitness.bestHourTemp)} with lowest heat & best air quality.
                </div>
                <p className="text-xs border-t border-current/20 pt-2 font-semibold">
                  {weather.fitness.runnerVerdict}
                </p>
              </div>

              {/* 2. Sunrise & Sunset */}
              <div className={`p-4 rounded-xl border-2 space-y-2 ${
                viewMode === 'sunlight'
                  ? 'bg-neutral-50 border-neutral-900'
                  : 'bg-slate-900/50 backdrop-blur-xl border-white/15'
              }`}>
                <span className="text-xs font-bold uppercase opacity-80">2. Daylight Training Window</span>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="border-r border-current/15 pr-2">
                    <div className="flex items-center gap-1.5 text-xs opacity-75 font-bold">
                      <Sunrise className="w-4 h-4 text-amber-400" />
                      <span>Sunrise</span>
                    </div>
                    <div className="text-xl font-black font-mono mt-0.5">
                      {weather.fitness.sunriseTime}
                    </div>
                  </div>
                  <div className="pl-2">
                    <div className="flex items-center gap-1.5 text-xs opacity-75 font-bold">
                      <Sunset className="w-4 h-4 text-orange-400" />
                      <span>Sunset</span>
                    </div>
                    <div className="text-xl font-black font-mono mt-0.5">
                      {weather.fitness.sunsetTime}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Heat Stress Alert */}
              <div className={`p-4 rounded-xl border-2 space-y-1.5 ${
                weather.fitness.heatWarning
                  ? 'bg-red-500/20 border-red-500 text-red-200'
                  : viewMode === 'sunlight'
                  ? 'bg-white border-neutral-300'
                  : 'bg-slate-900/40 border-white/15'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase">3. Heat & Hydration Guidance</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${
                    weather.fitness.heatWarning ? 'bg-red-600' : 'bg-emerald-600'
                  }`}>
                    {weather.fitness.heatWarning ? 'HEAT ALERT' : 'NORMAL'}
                  </span>
                </div>
                <p className="text-xs font-bold leading-relaxed">
                  {weather.fitness.heatWarningText}
                </p>
              </div>
            </div>
          )}

          {/* 5. BEACH & SURF */}
          {profile === 'beach' && (
            <div className="space-y-3.5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b pb-2 border-current/15">
                <h2 className="text-base font-extrabold uppercase tracking-tight flex items-center gap-2">
                  <Waves className="w-5 h-5 text-cyan-400" />
                  Beach, Tide & Surf Conditions
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Coastal View
                </span>
              </div>

              {/* 1. Tide Timings */}
              <div className={`p-4 rounded-xl border-2 space-y-2 ${
                viewMode === 'sunlight'
                  ? 'bg-neutral-50 border-neutral-900'
                  : 'bg-slate-900/50 backdrop-blur-xl border-white/15'
              }`}>
                <span className="text-xs font-bold uppercase opacity-80">1. Exact Tide Timings</span>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="border-r border-current/15 pr-2">
                    <div className="text-xs opacity-75 font-bold">High Tide</div>
                    <div className="text-xl font-black font-mono mt-0.5">
                      {weather.beach.highTideTime}
                    </div>
                  </div>
                  <div className="pl-2">
                    <div className="text-xs opacity-75 font-bold">Low Tide</div>
                    <div className="text-xl font-black font-mono mt-0.5">
                      {weather.beach.lowTideTime}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Wave Heights & Surf State */}
              <div className={`p-4 rounded-xl border-2 space-y-2 ${
                viewMode === 'sunlight'
                  ? 'bg-neutral-50 border-neutral-900'
                  : 'bg-slate-900/50 backdrop-blur-xl border-white/15'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase opacity-80">2. Wave Swell & Surf State</span>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    {weather.beach.surfSafety}
                  </span>
                </div>
                <div className="text-3xl font-black font-mono">
                  {weather.beach.waveHeightMeters} Meters
                </div>
                <p className="text-xs font-medium opacity-85">
                  {weather.beach.waveHeightMeters > 1.4
                    ? 'Strong swell & shorebreak. Swimmers should stay in designated lifeguard zones.'
                    : 'Gentle swell. Good conditions for recreational swimming, kayaking, and paddleboarding.'}
                </p>
              </div>

              {/* 3. Water Temperature */}
              <div className={`p-4 rounded-xl border-2 space-y-1.5 ${
                viewMode === 'sunlight'
                  ? 'bg-neutral-50 border-neutral-900'
                  : 'bg-slate-900/50 backdrop-blur-xl border-white/15'
              }`}>
                <span className="text-xs font-bold uppercase opacity-80">3. Sea Water Temperature</span>
                <div className="text-2xl font-black font-mono">
                  {displayTemp(weather.beach.waterTempC)}
                </div>
                <p className="text-xs font-medium opacity-85">
                  Pleasant water temperature. No thermal wetsuit required.
                </p>
              </div>
            </div>
          )}

          {/* 6. TRAVELERS & EVENT PLANNERS */}
          {profile === 'planner' && (
            <div className="space-y-3.5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b pb-2 border-current/15">
                <h2 className="text-base font-extrabold uppercase tracking-tight flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  7-Day Outlook & Event Planning
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Planner View
                </span>
              </div>

              {/* Planning Recommendation */}
              <div className={`p-4 rounded-xl border-2 flex items-center gap-3.5 ${
                viewMode === 'sunlight'
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-indigo-950/60 backdrop-blur-xl border-indigo-400/40 text-white'
              }`}>
                <Umbrella className="w-6 h-6 shrink-0 text-indigo-400" />
                <div>
                  <div className="text-xs uppercase font-extrabold opacity-75">Planning Recommendation</div>
                  <div className="text-sm font-bold mt-0.5">
                    {weather.planner.packingAdvice}
                  </div>
                  <div className="text-xs opacity-80 mt-1">
                    Comfort Index: <span className="font-mono font-bold">{weather.planner.comfortIndex}/100</span> ({weather.planner.comfortLabel})
                  </div>
                </div>
              </div>

              {/* 7-Day Extended Table */}
              <div className={`rounded-xl border-2 overflow-hidden ${
                viewMode === 'sunlight'
                  ? 'border-neutral-900 bg-white'
                  : 'border-white/15 bg-slate-900/60 backdrop-blur-xl'
              }`}>
                <div className={`px-4 py-2 text-xs font-extrabold uppercase border-b flex justify-between ${
                  viewMode === 'sunlight'
                    ? 'bg-neutral-100 border-neutral-300 text-neutral-900'
                    : 'bg-white/10 border-white/10 text-white/80'
                }`}>
                  <span>Day & Forecast</span>
                  <span>Rain %</span>
                  <span>Max / Min</span>
                </div>

                <div className="divide-y divide-current/10 text-xs">
                  {weather.daily7.map((item) => (
                    <div key={item.day + item.date} className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div>
                        <div className="font-extrabold text-sm">{item.day}</div>
                        <div className="opacity-70 font-mono text-[11px]">{item.date} • {item.conditionText}</div>
                      </div>

                      <div className="text-center font-mono">
                        <span className={`font-black text-sm ${item.rainProb > 50 ? 'text-blue-400' : ''}`}>
                          {item.rainProb}%
                        </span>
                        <div className="text-[10px] opacity-60 font-sans">rain</div>
                      </div>

                      <div className="text-right">
                        <div className="font-black font-mono text-sm">
                          {displayTemp(item.tempMax)} / {displayTemp(item.tempMin)}
                        </div>
                        <div className="text-[10px] opacity-75 font-medium">
                          {item.advice}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* 
          ---------------------------------------------------------------------
          FOOTER
          ---------------------------------------------------------------------
        */}
        <footer className={`mt-auto border-t p-4 text-center space-y-1 ${
          viewMode === 'sunlight'
            ? 'bg-neutral-100 border-neutral-300 text-neutral-900'
            : isSkyDark
            ? 'bg-slate-950/70 border-white/10 text-white/70'
            : 'bg-white/30 border-black/10 text-slate-900'
        }`}>
          <div className="text-xs font-extrabold uppercase tracking-wide">
            MAUSAM ATMOSPHERIC WEATHER SYSTEM
          </div>
          <div className="text-[11px] opacity-75">
            Physics particle atmospheric engine with 6-persona meteorological intelligence.
          </div>
        </footer>

      </div>

      {/* 
        =======================================================================
        WEATHER ALERTS & NOTIFICATION CENTER MODAL
        =======================================================================
      */}
      {isAlertCenterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-red-500/60 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-white animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-extrabold uppercase tracking-tight">
                  Weather Alerts Notification Center
                </h3>
              </div>
              <button
                onClick={() => setIsAlertCenterOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Browser Notification Permission Banner */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white/80">Browser Notification API:</span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                  notificationPermission === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : notificationPermission === 'denied'
                    ? 'bg-red-500/20 text-red-300 border border-red-400/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                }`}>
                  {notificationPermission}
                </span>
              </div>

              {notificationPermission !== 'granted' && (
                <button
                  onClick={requestNotificationPermission}
                  className="w-full py-2 bg-amber-400 text-slate-950 text-xs font-black rounded-lg hover:bg-amber-300 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <BellRing className="w-4 h-4" />
                  Enable Push Alerts for Severe Weather
                </button>
              )}

              <div className="flex items-center justify-between text-[11px] text-white/70 pt-1">
                <span>Sound Chime on Alert:</span>
                <button
                  onClick={() => setIsAudioEnabled((a) => !a)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all flex items-center gap-1 ${
                    isAudioEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-white/10 text-white/60 border-white/20'
                  }`}
                >
                  {isAudioEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                  {isAudioEnabled ? 'Audio ON' : 'Audio Muted'}
                </button>
              </div>
            </div>

            {/* Active Alerts List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <div className="text-xs font-bold uppercase text-white/60 tracking-wider">
                Active Critical Warnings ({activeAlerts.length})
              </div>

              {activeAlerts.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  No active severe weather or hazardous AQI warnings.
                </div>
              ) : (
                activeAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-red-300 uppercase">{alert.title}</span>
                      <span className="text-[10px] font-mono text-red-400">{alert.timestamp}</span>
                    </div>
                    <p className="text-xs text-red-200/90">{alert.message}</p>
                    <p className="text-[11px] text-amber-300 font-semibold pt-1">Action: {alert.suggestedAction}</p>
                  </div>
                ))
              )}
            </div>

            {/* Interactive Simulation Triggers */}
            <div className="border-t border-white/15 pt-3 space-y-2">
              <div className="text-xs font-bold uppercase text-white/60 tracking-wider">
                Simulate Conditions (Testing Engine):
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSimulateSevereStorm}
                  className="p-2.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-xs font-bold text-left transition-all active:scale-95"
                >
                  ⚡ Trigger Severe Storm
                  <div className="text-[10px] text-white/60 font-normal">Squalls, lightning & heavy rain</div>
                </button>

                <button
                  onClick={handleSimulateHazardousAqi}
                  className="p-2.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 border border-red-400/40 text-xs font-bold text-left transition-all active:scale-95"
                >
                  ⚠️ Trigger Hazardous AQI
                  <div className="text-[10px] text-white/60 font-normal">Simulate AQI 340+ smog alert</div>
                </button>
              </div>
            </div>

            {/* Close */}
            <button
              onClick={() => setIsAlertCenterOpen(false)}
              className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg border border-white/20 transition-all"
            >
              Close Center
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

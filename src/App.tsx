/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mausam — High-Contrast Accessible Weather Dashboard
 * Tailored strictly for maximum outdoor legibility and role-based simplicity.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Navigation,
  Search,
  Check,
  MapPin,
  RefreshCw,
  Sun,
  CloudRain,
  Cloud,
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
  ArrowRight,
  X
} from 'lucide-react';

// ============================================================================
// PROFILE DEFINITIONS
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
    forWhom: 'Fields, Soil & Crops',
    icon: Sprout,
  },
  {
    id: 'commuter',
    label: 'Commuter & School Parent',
    shortLabel: 'Commuter',
    forWhom: 'Morning Travel, Fog & School',
    icon: Users,
  },
  {
    id: 'health',
    label: 'Health & Air Quality',
    shortLabel: 'Health',
    forWhom: 'Allergies, Asthma & UV',
    icon: HeartPulse,
  },
  {
    id: 'fitness',
    label: 'Outdoor & Runner',
    shortLabel: 'Runner',
    forWhom: 'Best Time to Run & Heat',
    icon: Activity,
  },
  {
    id: 'beach',
    label: 'Beach & Coastal',
    shortLabel: 'Beach',
    forWhom: 'Tides, Waves & Water Temp',
    icon: Waves,
  },
  {
    id: 'planner',
    label: 'Traveler & Events',
    shortLabel: 'Planner',
    forWhom: '7-Day Outlook & Rain %',
    icon: Calendar,
  },
];

// Presets for seamless manual location fallback
export const POPULAR_LOCATIONS = [
  { name: 'Karnal (Punjab/Haryana Agri Belt)', lat: 29.6857, lon: 76.9905, type: 'agri' },
  { name: 'New Delhi (NCR Metro)', lat: 28.6139, lon: 77.2090, type: 'metro' },
  { name: 'Mumbai (Coastal Port)', lat: 18.9220, lon: 72.8347, type: 'coast' },
  { name: 'Bengaluru (Deccan Plateau)', lat: 12.9716, lon: 77.5946, type: 'metro' },
  { name: 'Pune (Western Maharashtra)', lat: 18.5204, lon: 73.8567, type: 'agri' },
  { name: 'Goa (Beaches & Shoreline)', lat: 15.2993, lon: 74.1240, type: 'coast' },
  { name: 'Shimla (Hill Station)', lat: 31.1048, lon: 77.1734, type: 'hills' },
];

// ============================================================================
// METEOROLOGICAL ENGINE (Realistic Mock Data Generator)
// ============================================================================

export interface DailyOutlook {
  day: string;
  date: string;
  condition: string;
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
  conditionText: string;
  rainProbNow: number;
  rainExpectedInHours: number | null; // e.g. 2 means rain in 2 hours
  humidityPct: number;
  windKmh: number;

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

  // 2. Commuter / Parent data
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
  daily7: DailyOutlook[];
}

export function generateAccessibleWeather(lat: number, lon: number, customName?: string, isGps = false): WeatherModel {
  // Deterministic seed based on latitude and longitude
  const seed = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233)) * 100;
  const isCoast = (lon > 72 && lon < 74) || (lon > 80 && lon < 85);
  const isNorthPlains = lat > 26 && lon > 74 && lon < 80;

  const baseTemp = isNorthPlains ? 31 : isCoast ? 29 : 26;
  const tempC = Math.round(baseTemp + (seed % 6) - 2);
  const humidityPct = Math.round(isCoast ? 76 : 52 + (seed % 20));
  const rainProbNow = Math.round((seed * 3) % 95);
  const windKmh = Math.round(10 + (seed % 18));

  // Determine immediate rain and condition
  let conditionText = 'Sunny & Clear';
  let rainExpectedInHours: number | null = null;
  if (rainProbNow > 65) {
    conditionText = 'Rain Showers Expected';
    rainExpectedInHours = 1;
  } else if (rainProbNow > 40) {
    conditionText = 'Partly Cloudy';
    rainExpectedInHours = 3;
  }

  // 1. Farming calculations
  const soilMoisturePct = Math.min(94, Math.max(22, Math.round(35 + (seed % 50))));
  let soilStatus: WeatherModel['farming']['soilStatus'] = 'Optimal Moisture';
  if (soilMoisturePct < 32) soilStatus = 'Too Dry';
  else if (soilMoisturePct > 80) soilStatus = 'Waterlogged';

  const frostAlert = tempC < 6;
  let plantingAdvice = 'Favorable weather for sowing, tilling, and field maintenance.';
  if (soilStatus === 'Too Dry') {
    plantingAdvice = 'Soil is dry. Irrigation recommended before evening sowing.';
  } else if (rainProbNow > 65) {
    plantingAdvice = 'Rain imminent. Delay pesticide or fertilizer spraying to prevent runoff.';
  } else if (frostAlert) {
    plantingAdvice = 'Cold temperature alert. Cover sensitive saplings to prevent frost burn.';
  }

  // 2. Commuter / Parent calculations
  const visibilityMeters = rainProbNow > 70 ? 2500 : (seed % 10 > 7 ? 1200 : 8000);
  const fogAlert = visibilityMeters < 2000;
  const stormWarning = rainProbNow > 75 || windKmh > 35;

  let commuteRating: WeatherModel['commuter']['commuteRating'] = 'Safe & Clear';
  if (stormWarning) commuteRating = 'Caution: Rain';
  else if (fogAlert) commuteRating = 'Slow: Heavy Fog';

  let morningSchoolBusSafety = 'Roads are dry and clear. School commute is normal.';
  if (stormWarning) {
    morningSchoolBusSafety = 'Heavy rain expected during morning hours. Pack raincoats and expect 15 min delays.';
  } else if (fogAlert) {
    morningSchoolBusSafety = 'Dense morning mist. Drivers should use fog lamps and slow speeds.';
  }

  // 3. Health calculations
  const aqiBase = isNorthPlains ? 195 : 75;
  const aqi = Math.round(aqiBase + (seed % 70));
  let aqiStatus: WeatherModel['health']['aqiStatus'] = 'Moderate';
  if (aqi <= 50) aqiStatus = 'Good';
  else if (aqi <= 100) aqiStatus = 'Moderate';
  else if (aqi <= 200) aqiStatus = 'Bad';
  else aqiStatus = 'Hazardous';

  const pollenLevel: WeatherModel['health']['pollenLevel'] = seed > 60 ? 'High' : seed > 30 ? 'Moderate' : 'Low';
  const uvIndex = Math.min(11, Math.max(3, Math.round(5 + (seed % 6))));
  const uvStatus: WeatherModel['health']['uvStatus'] = uvIndex >= 8 ? 'Very High' : uvIndex >= 5 ? 'Moderate' : 'Low';

  let simpleHealthAdvice = 'Air quality is acceptable for outdoor activity.';
  if (aqiStatus === 'Bad' || aqiStatus === 'Hazardous') {
    simpleHealthAdvice = 'Unhealthy air. People with asthma or elderly should wear a mask and stay indoors.';
  } else if (uvStatus === 'Very High') {
    simpleHealthAdvice = 'Harsh midday sun. Seek shade between 11 AM and 3 PM.';
  }

  // 4. Fitness calculations
  const bestHourToday = tempC > 30 ? '06:00 AM' : '05:30 PM';
  const bestHourTemp = tempC > 30 ? tempC - 6 : tempC - 3;
  const heatWarning = tempC >= 34;
  const heatWarningText = heatWarning
    ? 'High Heat Warning: Avoid strenuous midday running. Drink 1 liter of water per hour.'
    : 'No severe heat warning. Safe for routine running and walking.';

  // 5. Beach calculations
  const waterTempC = Math.round(tempC - 3);
  const waveHeightMeters = Number((0.6 + (seed % 14) * 0.1).toFixed(1));
  let surfSafety: WeatherModel['beach']['surfSafety'] = 'Safe Swell';
  if (waveHeightMeters > 1.5 || windKmh > 30) surfSafety = 'Rough / Warning';
  else if (waveHeightMeters > 1.0) surfSafety = 'Moderate Waves';

  // 6. 7-Day Daily Planner
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const daily7: DailyOutlook[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayNames[d.getDay()];
    const dateLabel = `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`;
    const dRain = Math.min(90, Math.max(5, Math.round((seed * (i + 1) * 7) % 95)));
    const dMax = Math.round(tempC + (i % 3) - 1);
    const dMin = Math.round(dMax - 7);

    let advice = 'Good day for open outdoor plans.';
    if (dRain > 60) advice = 'Carry an umbrella. High rain risk.';
    else if (dRain > 35) advice = 'Keep light rain jacket handy.';
    else if (dMax >= 35) advice = 'Very hot. Plan indoor events.';

    daily7.push({
      day: dayLabel,
      date: dateLabel,
      condition: dRain > 55 ? 'Showers' : dRain > 30 ? 'Cloudy' : 'Sunny',
      rainProb: dRain,
      tempMax: dMax,
      tempMin: dMin,
      advice,
    });
  }

  const locationName = customName || (isGps ? `GPS Location (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)` : 'Karnal, Haryana');

  return {
    locationName,
    isGps,
    coords: { lat, lon },
    tempC,
    feelsLikeC: Math.round(tempC + (humidityPct > 60 ? 3 : -1)),
    conditionText,
    rainProbNow,
    rainExpectedInHours,
    humidityPct,
    windKmh,
    farming: {
      soilMoisturePct,
      soilStatus,
      frostAlert,
      frostMsg: frostAlert ? 'Frost Risk Alert: Freezing ground temperatures expected overnight!' : 'No Frost Risk: Minimum temperatures remain safely above freezing.',
      plantingAdvice,
      nextRainWindow: rainExpectedInHours ? `Rain likely within ${rainExpectedInHours} hours` : 'No heavy rain expected today',
      expectedRainMm: rainProbNow > 50 ? Math.round(rainProbNow * 0.2) : 0,
    },
    commuter: {
      commuteRating,
      morningSchoolBusSafety,
      visibilityMeters,
      fogAlert,
      stormWarning,
      travelAdvice: stormWarning
        ? 'Wet roads & heavy downpour. Drive at reduced speed, headlights on.'
        : fogAlert
        ? 'Visibility under 2 km. Use low beams and allow extra travel time.'
        : 'Clear, dry pavement. Safe road conditions for school and work commute.',
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
      sunriseTime: '06:15 AM',
      sunsetTime: '06:30 PM',
      runnerVerdict: heatWarning
        ? 'Run early morning only. Avoid daytime pavement heat.'
        : 'Good running conditions during morning and late evening hours.',
    },
    beach: {
      highTideTime: '02:30 PM (High)',
      lowTideTime: '08:45 PM (Low)',
      waterTempC,
      waveHeightMeters,
      surfSafety,
    },
    daily7,
  };
}

// ============================================================================
// ACCESSIBLE SINGLE-FILE COMPONENT
// ============================================================================

export default function App() {
  const [profile, setProfile] = useState<UserProfile>('farmer');
  const [weather, setWeather] = useState<WeatherModel>(() =>
    generateAccessibleWeather(29.6857, 76.9905, 'Karnal, Haryana (Agri Belt)', false)
  );
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');

  // Helper for temp conversion
  const displayTemp = (celsius: number) => {
    if (tempUnit === 'F') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  // Immediate GPS request on mount
  useEffect(() => {
    fetchCurrentGps();
  }, []);

  const fetchCurrentGps = () => {
    setIsLocating(true);
    setLocationError(null);

    if (!('geolocation' in navigator)) {
      setLocationError('GPS is not available on this device. You can select your town manually below.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newWeather = generateAccessibleWeather(latitude, longitude, undefined, true);
        setWeather(newWeather);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setLocationError('GPS permission was not allowed. Using Karnal (Agri Belt) as default. Select your city below:');
        } else {
          setLocationError('Could not fetch GPS fix. Using default location.');
        }
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    // Simple matching against preset list
    const found = POPULAR_LOCATIONS.find((l) =>
      l.name.toLowerCase().includes(manualInput.toLowerCase().trim())
    );

    if (found) {
      setWeather(generateAccessibleWeather(found.lat, found.lon, found.name, false));
    } else {
      // Synthesize weather for custom query with hashed coordinates
      const mockLat = 20.0 + (manualInput.length * 1.7) % 15;
      const mockLon = 75.0 + (manualInput.length * 2.3) % 12;
      setWeather(generateAccessibleWeather(mockLat, mockLon, manualInput.trim(), false));
    }

    setManualInput('');
    setIsSearchOpen(false);
    setLocationError(null);
  };

  const currentProfileMeta = useMemo(
    () => PROFILES.find((p) => p.id === profile) || PROFILES[0],
    [profile]
  );

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-950 flex flex-col items-center">
      {/* 
        Maximum Accessibility Mobile Viewport Container
        Stark off-white background, solid black borders, pure contrast.
      */}
      <div className="w-full max-w-lg min-h-screen bg-white flex flex-col border-x border-neutral-300 shadow-md">
        
        {/* ===================================================================
            HEADER: High Contrast & Simple App Identity
           =================================================================== */}
        <header className="bg-neutral-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight">MAUSAM</span>
            <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded border border-neutral-700 font-mono font-medium">
              Simple Weather
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Unit Toggle Button */}
            <button
              onClick={() => setTempUnit((u) => (u === 'C' ? 'F' : 'C'))}
              aria-label="Toggle Temperature Unit"
              className="px-3 py-1.5 bg-neutral-800 text-white text-xs font-mono font-bold rounded border border-neutral-700 hover:bg-neutral-700 active:scale-95 transition-all"
            >
              °{tempUnit}
            </button>

            {/* GPS Refresh Button */}
            <button
              onClick={fetchCurrentGps}
              disabled={isLocating}
              aria-label="Find my current location with GPS"
              className="px-3 py-1.5 bg-white text-neutral-950 text-xs font-bold rounded flex items-center gap-1.5 hover:bg-neutral-200 active:scale-95 transition-all"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Finding...' : 'My GPS'}</span>
            </button>
          </div>
        </header>

        {/* ===================================================================
            LOCATION BAR & FALLBACK SEARCH
           =================================================================== */}
        <div className="bg-neutral-200 border-b border-neutral-300 px-5 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 text-neutral-800 shrink-0" />
            <span className="text-sm font-bold text-neutral-900 truncate">
              {weather.locationName}
            </span>
            {weather.isGps && (
              <span className="text-[10px] font-bold bg-neutral-900 text-white px-1.5 py-0.5 rounded shrink-0">
                LIVE GPS
              </span>
            )}
          </div>

          <button
            onClick={() => setIsSearchOpen((s) => !s)}
            className="text-xs font-bold text-neutral-900 underline hover:text-black shrink-0 px-2 py-1 bg-white border border-neutral-400 rounded"
          >
            {isSearchOpen ? 'Close' : 'Change City'}
          </button>
        </div>

        {/* Search Drawer (Fallback when GPS is unavailable) */}
        {isSearchOpen && (
          <div className="bg-neutral-50 border-b-2 border-neutral-900 p-4 space-y-3">
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Type city or town name..."
                className="flex-1 bg-white border-2 border-neutral-800 px-3 py-2 text-sm font-medium rounded text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <button
                type="submit"
                className="bg-neutral-900 text-white px-4 py-2 text-sm font-bold rounded hover:bg-neutral-800 active:scale-95"
              >
                Search
              </button>
            </form>

            <div>
              <div className="text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wide">
                Quick Select Towns:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => {
                      setWeather(generateAccessibleWeather(loc.lat, loc.lon, loc.name, false));
                      setIsSearchOpen(false);
                      setLocationError(null);
                    }}
                    className="text-xs bg-white text-neutral-900 border border-neutral-400 font-semibold px-2.5 py-1 rounded hover:bg-neutral-900 hover:text-white transition-colors"
                  >
                    {loc.name.split(' (')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Location Error Banner */}
        {locationError && (
          <div className="bg-amber-100 border-b border-amber-300 px-5 py-2.5 text-xs text-amber-950 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0" />
              <span className="font-medium">{locationError}</span>
            </div>
            <button
              onClick={() => setLocationError(null)}
              className="text-amber-900 font-bold p-1 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ===================================================================
            CORE FEATURE: LARGE HIGH-CONTRAST "I AM A..." PROFILE SELECTOR
           =================================================================== */}
        <section aria-label="Profile Selection" className="p-4 bg-white border-b-2 border-neutral-900">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-neutral-900">
              Select Your Role / Profile:
            </label>
            <span className="text-xs font-semibold text-neutral-600">
              Shows only relevant data
            </span>
          </div>

          {/* 6 Large, Easy-to-Tap Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PROFILES.map((p) => {
              const Icon = p.icon;
              const isSelected = profile === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setProfile(p.id)}
                  aria-pressed={isSelected}
                  className={`p-3 rounded-lg border-2 text-left flex flex-col justify-between transition-all min-h-[72px] ${
                    isSelected
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-md ring-2 ring-neutral-900 ring-offset-1'
                      : 'bg-white text-neutral-900 border-neutral-400 hover:border-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-neutral-800'}`} />
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <div className="text-sm font-extrabold leading-tight mt-1">{p.shortLabel}</div>
                    <div className={`text-[10px] leading-none mt-0.5 truncate ${isSelected ? 'text-neutral-300' : 'text-neutral-600'}`}>
                      {p.forWhom}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ===================================================================
            COMMON OVERVIEW BAR: Instant High-Contrast Temperature & Condition
           =================================================================== */}
        <div className="px-5 py-4 bg-neutral-50 border-b border-neutral-300 flex items-center justify-between">
          <div>
            <div className="text-4xl font-extrabold font-mono text-neutral-950 tracking-tight">
              {displayTemp(weather.tempC)}
            </div>
            <div className="text-sm font-bold text-neutral-800 mt-0.5">
              {weather.conditionText}
            </div>
            <div className="text-xs text-neutral-600 font-medium">
              Feels like {displayTemp(weather.feelsLikeC)} • Humidity {weather.humidityPct}%
            </div>
          </div>

          <div className="text-right border-l-2 border-neutral-300 pl-4 space-y-1">
            <div className="text-xs font-bold text-neutral-600 uppercase">Rain Chance Now</div>
            <div className={`text-2xl font-black font-mono ${weather.rainProbNow > 50 ? 'text-blue-900' : 'text-neutral-900'}`}>
              {weather.rainProbNow}%
            </div>
            <div className="text-[11px] font-semibold text-neutral-700">
              Wind: {weather.windKmh} km/h
            </div>
          </div>
        </div>

        {/* ===================================================================
            ROLE-BASED VIEWPORTS: Hides all clutter, shows ONLY relevant data
           =================================================================== */}
        <main className="flex-1 p-5 space-y-5 bg-white">

          {/* ---------------------------------------------------------------
              ROLE 1: FARMER & AGRICULTURE
              Strictly: Soil Moisture, Simple Rain Prediction, Frost Alert, Planting Advice
             --------------------------------------------------------------- */}
          {profile === 'farmer' && (
            <div className="space-y-4">
              <div className="border-b pb-2 flex items-center justify-between">
                <h2 className="text-base font-extrabold text-neutral-950 uppercase tracking-tight">
                  Farmer Field Weather Report
                </h2>
                <span className="text-xs font-bold bg-neutral-200 text-neutral-900 px-2 py-0.5 rounded">
                  Agri View
                </span>
              </div>

              {/* 1. Soil Moisture Status */}
              <div className="p-4 border-2 border-neutral-900 rounded-lg bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-neutral-700">1. Soil Moisture Status</span>
                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded text-white ${
                    weather.farming.soilStatus === 'Optimal Moisture' ? 'bg-neutral-900' : 'bg-neutral-700'
                  }`}>
                    {weather.farming.soilStatus}
                  </span>
                </div>
                <div className="text-3xl font-black font-mono text-neutral-950">
                  {weather.farming.soilMoisturePct}% Moisture
                </div>
                <p className="text-xs text-neutral-700 font-medium">
                  {weather.farming.soilStatus === 'Too Dry'
                    ? 'Topsoil is losing moisture. Deep irrigation needed for wheat/cotton/rice.'
                    : weather.farming.soilStatus === 'Waterlogged'
                    ? 'Heavy water retention in root zone. Ensure field drains are open.'
                    : 'Moisture level is ideal for crop growth and seed germination.'}
                </p>
              </div>

              {/* 2. Simple Rainfall Prediction */}
              <div className="p-4 border-2 border-neutral-900 rounded-lg bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-neutral-700">2. Rainfall Prediction</span>
                  <span className="text-xs font-mono font-bold text-neutral-900">
                    Next 24 Hours
                  </span>
                </div>
                <div className="text-2xl font-black text-neutral-950">
                  {weather.farming.nextRainWindow}
                </div>
                <div className="text-xs font-bold text-neutral-800">
                  Expected accumulation: ~{weather.farming.expectedRainMm} mm
                </div>
              </div>

              {/* 3. Frost Alert Widget */}
              <div className={`p-4 border-2 rounded-lg space-y-1 ${
                weather.farming.frostAlert
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-400 bg-white text-neutral-900'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-5 h-5 ${weather.farming.frostAlert ? 'text-white' : 'text-neutral-700'}`} />
                  <span className="text-sm font-extrabold uppercase">3. Frost & Freezing Alert</span>
                </div>
                <p className="text-xs font-medium leading-relaxed mt-1">
                  {weather.farming.frostMsg}
                </p>
              </div>

              {/* 4. Seasonal Planting & Field Guidance */}
              <div className="p-4 border-2 border-neutral-900 rounded-lg bg-neutral-50 space-y-1.5">
                <span className="text-xs font-bold uppercase text-neutral-700">4. Seasonal Planting Guidance</span>
                <p className="text-sm font-bold text-neutral-950 leading-snug">
                  {weather.farming.plantingAdvice}
                </p>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------
              ROLE 2: COMMUTER, STUDENT & PARENT
              Strictly: Morning school commute, Immediate rain/storm alerts, Visibility (fog) warnings
             --------------------------------------------------------------- */}
          {profile === 'commuter' && (
            <div className="space-y-4">
              <div className="border-b pb-2 flex items-center justify-between">
                <h2 className="text-base font-extrabold text-neutral-950 uppercase tracking-tight">
                  Commute, School & Transit Report
                </h2>
                <span className="text-xs font-bold bg-neutral-200 text-neutral-900 px-2 py-0.5 rounded">
                  Transit View
                </span>
              </div>

              {/* 1. Morning School Commute Conditions */}
              <div className="p-4 border-2 border-neutral-900 rounded-lg bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-neutral-700">1. School & Morning Commute</span>
                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded text-white ${
                    weather.commuter.commuteRating === 'Safe & Clear' ? 'bg-neutral-900' : 'bg-neutral-800'
                  }`}>
                    {weather.commuter.commuteRating}
                  </span>
                </div>
                <div className="text-sm font-bold text-neutral-950 leading-snug">
                  {weather.commuter.morningSchoolBusSafety}
                </div>
              </div>

              {/* 2. Immediate Rain / Storm Alerts */}
              <div className={`p-4 border-2 rounded-lg space-y-1.5 ${
                weather.commuter.stormWarning
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-400 bg-white text-neutral-900'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase">2. Immediate Storm & Rain Alert</span>
                  <span className="text-xs font-mono font-bold">
                    {weather.rainProbNow}% Rain Chance
                  </span>
                </div>
                <div className="text-lg font-black">
                  {weather.commuter.stormWarning ? 'Storm Warning in Effect' : 'No Severe Storm Detected'}
                </div>
                <p className="text-xs font-medium">
                  {weather.commuter.stormWarning
                    ? 'Sudden downpours and squalls expected. Take umbrella and allow extra commute buffer.'
                    : 'Safe for school bus routes, bike riding, and highway transit.'}
                </p>
              </div>

              {/* 3. Visibility (Fog) Warnings */}
              <div className="p-4 border-2 border-neutral-900 rounded-lg bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-neutral-700">3. Road Visibility & Fog Warning</span>
                  <span className="text-xs font-bold font-mono text-neutral-900">
                    {weather.commuter.visibilityMeters} Meters
                  </span>
                </div>
                <div className="text-xl font-black text-neutral-950">
                  {weather.commuter.fogAlert ? 'Low Visibility Warning (Fog)' : 'Clear Road Sightlines'}
                </div>
                <p className="text-xs text-neutral-700 font-medium">
                  {weather.commuter.travelAdvice}
                </p>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------
              ROLE 3: HEALTH-CONSCIOUS USERS
              Strictly: Air Quality Index (AQI), Pollen count, UV Index with Simple Good/Bad codes
             --------------------------------------------------------------- */}
          {profile === 'health' && (
            <div className="space-y-4">
              <div className="border-b pb-2 flex items-center justify-between">
                <h2 className="text-base font-extrabold text-neutral-950 uppercase tracking-tight">
                  Health & Environmental Exposure
                </h2>
                <span className="text-xs font-bold bg-neutral-200 text-neutral-900 px-2 py-0.5 rounded">
                  Health View
                </span>
              </div>

              {/* 1. Air Quality Index (Simple Good / Bad indicator) */}
              <div className="p-4 border-2 border-neutral-900 rounded-lg bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-neutral-700">1. Air Quality Index (AQI)</span>
                  <span className={`text-xs font-black px-3 py-1 rounded text-white ${
                    weather.health.aqiStatus === 'Good'
                      ? 'bg-neutral-900'
                      : weather.health.aqiStatus === 'Moderate'
                      ? 'bg-neutral-700'
                      : 'bg-black'
                  }`}>
                    {weather.health.aqiStatus === 'Good' ? 'GOOD' : weather.health.aqiStatus === 'Moderate' ? 'MODERATE' : 'BAD AIR'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black font-mono text-neutral-950">{weather.health.aqi}</span>
                  <span className="text-xs font-bold text-neutral-600">AQI Score</span>
                </div>
                <p className="text-xs text-neutral-800 font-medium">
                  {weather.health.simpleHealthAdvice}
                </p>
              </div>

              {/* 2. Pollen Count */}
              <div className="p-4 border-2 border-neutral-900 rounded-lg bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-neutral-700">2. Allergy & Pollen Count</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded text-white ${
                    weather.health.pollenLevel === 'High' ? 'bg-black' : 'bg-neutral-800'
                  }`}>
                    {weather.health.pollenLevel.toUpperCase()} POLLEN
                  </span>
                </div>
                <div className="text-2xl font-black text-neutral-950">
                  {weather.health.pollenLevel} Grass & Tree Spores
                </div>
                <p className="text-xs text-neutral-700 font-medium">
                  {weather.health.pollenLevel === 'High'
                    ? 'Allergy trigger warning: Keep windows shut in morning and take antihistamines if needed.'
                    : 'Low allergen count today. Favorable for people with seasonal allergies.'}
                </p>
              </div>

              {/* 3. UV Index */}
              <div className="p-4 border-2 border-neutral-900 rounded-lg bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-neutral-700">3. Sun UV Ray Index</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded text-white ${
                    weather.health.uvStatus === 'Very High' ? 'bg-black' : 'bg-neutral-800'
                  }`}>
                    {weather.health.uvStatus.toUpperCase()} SUN
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-neutral-950">{weather.health.uvIndex}</span>
                  <span className="text-xs font-bold text-neutral-600">Index Level</span>
                </div>
                <p className="text-xs text-neutral-700 font-medium">
                  {weather.health.uvIndex >= 8
                    ? 'Very strong sunlight. Sunscreen and hat needed if outside for more than 20 minutes.'
                    : 'Moderate sun exposure. Safe for normal outdoor movement.'}
                </p>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------
              ROLE 4: OUTDOOR & FITNESS (RUNNERS)
              Strictly: "Best time to run today", Sunrise/Sunset times, Heat warnings
             --------------------------------------------------------------- */}
          {profile === 'fitness' && (
            <div className="space-y-4">
              <div className="border-b pb-2 flex items-center justify-between">
                <h2 className="text-base font-extrabold text-neutral-950 uppercase tracking-tight">
                  Runner & Outdoor Fitness Schedule
                </h2>
                <span className="text-xs font-bold bg-neutral-200 text-neutral-900 px-2 py-0.5 rounded">
                  Runner View
                </span>
              </div>

              {/* 1. Best Time to Run Today */}
              <div className="p-4 border-2 border-neutral-900 rounded-lg bg-neutral-900 text-white space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  1. Best Time To Run Today
                </span>
                <div className="text-3xl font-black font-mono">
                  {weather.fitness.bestHourToday}
                </div>
                <div className="text-xs text-neutral-200 font-medium">
                  Expected Temperature: {displayTemp(weather.fitness.bestHourTemp)} with lowest heat & best air.
                </div>
                <p className="text-xs text-neutral-300 border-t border-neutral-700 pt-2 font-medium">
                  {weather.fitness.runnerVerdict}
                </p>
              </div>

              {/* 2. Sunrise and Sunset Times */}
              <div className="p-4 border-2 border-neutral-900 rounded-lg bg-neutral-50 space-y-2">
                <span className="text-xs font-bold uppercase text-neutral-700">2. Daylight Training Window</span>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="border-r border-neutral-300 pr-2">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-bold">
                      <Sunrise className="w-4 h-4 text-neutral-900" />
                      <span>Sunrise</span>
                    </div>
                    <div className="text-xl font-black font-mono text-neutral-950 mt-0.5">
                      {weather.fitness.sunriseTime}
                    </div>
                  </div>
                  <div className="pl-2">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-bold">
                      <Sunset className="w-4 h-4 text-neutral-900" />
                      <span>Sunset</span>
                    </div>
                    <div className="text-xl font-black font-mono text-neutral-950 mt-0.5">
                      {weather.fitness.sunsetTime}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Heat Warning Widget */}
              <div className={`p-4 border-2 rounded-lg space-y-1.5 ${
                weather.fitness.heatWarning
                  ? 'border-neutral-900 bg-neutral-100 text-neutral-950'
                  : 'border-neutral-400 bg-white text-neutral-900'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase">3. Heat & Hydration Alert</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${weather.fitness.heatWarning ? 'bg-neutral-900' : 'bg-neutral-700'}`}>
                    {weather.fitness.heatWarning ? 'HEAT ALERT' : 'NORMAL'}
                  </span>
                </div>
                <p className="text-xs font-bold leading-relaxed">
                  {weather.fitness.heatWarningText}
                </p>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------
              ROLE 5: BEACHGOERS & SURFERS
              Strictly: Tide timings, Wave heights, Water temperature
             --------------------------------------------------------------- */}
          {profile === 'beach' && (
            <div className="space-y-4">
              <div className="border-b pb-2 flex items-center justify-between">
                <h2 className="text-base font-extrabold text-neutral-950 uppercase tracking-tight">
                  Beach, Tide & Surf Conditions
                </h2>
                <span className="text-xs font-bold bg-neutral-200 text-neutral-900 px-2 py-0.5 rounded">
                  Coastal View
                </span>
              </div>

              {/* 1. Tide Timings */}
              <div className="p-4 border-2 border-neutral-900 rounded-lg bg-neutral-50 space-y-2">
                <span className="text-xs font-bold uppercase text-neutral-700">1. Exact Tide Timings</span>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="border-r border-neutral-300 pr-2">
                    <div className="text-xs text-neutral-600 font-bold">High Tide</div>
                    <div className="text-xl font-black font-mono text-neutral-950 mt-0.5">
                      {weather.beach.highTideTime}
                    </div>
                  </div>
                  <div className="pl-2">
                    <div className="text-xs text-neutral-600 font-bold">Low Tide</div>
                    <div className="text-xl font-black font-mono text-neutral-950 mt-0.5">
                      {weather.beach.lowTideTime}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Wave Heights */}
              <div className="p-4 border-2 border-neutral-900 rounded-lg bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-neutral-700">2. Wave Height & Surf State</span>
                  <span className="text-xs font-bold bg-neutral-900 text-white px-2 py-0.5 rounded">
                    {weather.beach.surfSafety}
                  </span>
                </div>
                <div className="text-3xl font-black font-mono text-neutral-950">
                  {weather.beach.waveHeightMeters} Meters
                </div>
                <p className="text-xs text-neutral-700 font-medium">
                  {weather.beach.waveHeightMeters > 1.4
                    ? 'Strong swell. Swimmers should exercise caution near shorebreak.'
                    : 'Gentle waves. Good conditions for swimming and beach walking.'}
                </p>
              </div>

              {/* 3. Water Temperature */}
              <div className="p-4 border-2 border-neutral-900 rounded-lg bg-neutral-50 space-y-1.5">
                <span className="text-xs font-bold uppercase text-neutral-700">3. Sea Water Temperature</span>
                <div className="text-2xl font-black font-mono text-neutral-950">
                  {displayTemp(weather.beach.waterTempC)}
                </div>
                <p className="text-xs text-neutral-700 font-medium">
                  Pleasant water temperature. No wetsuit needed for swimming.
                </p>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------
              ROLE 6: TRAVELERS & EVENT PLANNERS
              Strictly: 7-Day Extended Forecast, Rain Probability %, Basic Planning Suggestions
             --------------------------------------------------------------- */}
          {profile === 'planner' && (
            <div className="space-y-4">
              <div className="border-b pb-2 flex items-center justify-between">
                <h2 className="text-base font-extrabold text-neutral-950 uppercase tracking-tight">
                  7-Day Outlook & Planning Advice
                </h2>
                <span className="text-xs font-bold bg-neutral-200 text-neutral-900 px-2 py-0.5 rounded">
                  Planner View
                </span>
              </div>

              {/* Simple Planning Suggestion Banner */}
              <div className="p-3.5 border-2 border-neutral-900 rounded-lg bg-neutral-900 text-white flex items-center gap-3">
                <Umbrella className="w-6 h-6 shrink-0" />
                <div>
                  <div className="text-xs uppercase font-extrabold text-neutral-300">Key Recommendation</div>
                  <div className="text-sm font-bold mt-0.5">
                    {weather.rainProbNow > 50
                      ? 'Carry an umbrella today. Plan outdoor gatherings under covered tents.'
                      : 'Clear week ahead. Ideal for outdoor weddings, travel and events.'}
                  </div>
                </div>
              </div>

              {/* Simple 7-Day Table: Zero Clutter, High Contrast */}
              <div className="border-2 border-neutral-900 rounded-lg overflow-hidden">
                <div className="bg-neutral-100 px-4 py-2 text-xs font-extrabold uppercase text-neutral-900 border-b border-neutral-300 flex justify-between">
                  <span>Day & Date</span>
                  <span>Rain %</span>
                  <span>Max / Min</span>
                </div>

                <div className="divide-y divide-neutral-300">
                  {weather.daily7.map((item) => (
                    <div key={item.day + item.date} className="p-3 bg-white hover:bg-neutral-50 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-extrabold text-sm text-neutral-950">{item.day}</div>
                        <div className="text-neutral-500 font-mono text-[11px]">{item.date} • {item.condition}</div>
                      </div>

                      <div className="text-center font-mono">
                        <span className={`font-black text-sm ${item.rainProb > 50 ? 'text-blue-900' : 'text-neutral-900'}`}>
                          {item.rainProb}%
                        </span>
                        <div className="text-[10px] text-neutral-500 font-sans">rain</div>
                      </div>

                      <div className="text-right">
                        <div className="font-black font-mono text-sm text-neutral-950">
                          {displayTemp(item.tempMax)} / {displayTemp(item.tempMin)}
                        </div>
                        <div className="text-[10px] text-neutral-600 font-medium">
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

        {/* ===================================================================
            FOOTER: Pure Functional Accessibility Statement
           =================================================================== */}
        <footer className="mt-auto border-t-2 border-neutral-900 bg-neutral-100 p-4 text-center space-y-1">
          <div className="text-xs font-extrabold text-neutral-900">
            MAUSAM ACCESSIBLE WEATHER SYSTEM
          </div>
          <div className="text-[11px] text-neutral-600">
            Designed for high-contrast sunlight visibility and direct role-based utility.
          </div>
        </footer>

      </div>
    </div>
  );
}

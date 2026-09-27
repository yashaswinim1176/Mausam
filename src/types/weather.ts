export type WeatherConditionType =
  | 'sunny'
  | 'partly_cloudy'
  | 'overcast'
  | 'rain'
  | 'thunderstorm'
  | 'fog'
  | 'snow';

export type TimeOfDay = 'dawn' | 'day' | 'golden_hour' | 'dusk' | 'night';

export interface WeatherTelemetry {
  tempC: number;
  feelsLikeC: number;
  tempMaxC: number;
  tempMinC: number;
  condition: WeatherConditionType;
  conditionLabel: string;
  timeDecimal: number; // 0.00 to 24.00 (e.g. 14.5 = 14:30)
  windSpeedKmh: number;
  windGustKmh: number;
  windDegrees: number;
  windDirection: string;
  humidityPct: number;
  dewPointC: number;
  pressureHpa: number;
  uvIndex: number;
  visibilityKm: number;
  rainIntensityPct: number; // 0 to 100
  cloudDensityPct: number; // 0 to 100
  fogDensityPct: number; // 0 to 100
  snowIntensityPct: number; // 0 to 100
  aqi: number;
  aqiCategory: 'Good' | 'Moderate' | 'Unhealthy' | 'Hazardous';
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  sunriseTime: string; // "06:14"
  sunsetTime: string; // "18:32"
  moonPhase: string; // "Waxing Crescent", etc.
  moonIlluminationPct: number;
}

export interface HourlyForecastItem {
  hourStr: string;
  hourDecimal: number;
  tempC: number;
  feelsLikeC: number;
  condition: WeatherConditionType;
  rainProbPct: number;
  rainMm: number;
  windSpeedKmh: number;
  windDirection: string;
  uvIndex: number;
}

export interface DailyForecastItem {
  dayName: string;
  dateStr: string;
  condition: WeatherConditionType;
  conditionLabel: string;
  tempMaxC: number;
  tempMinC: number;
  rainProbPct: number;
  windSpeedKmh: number;
  uvIndex: number;
}

export interface CityPreset {
  id: string;
  name: string;
  country: string;
  region: string;
  lat: number;
  lon: number;
  timezoneOffsetHours: number;
  defaultCondition: WeatherConditionType;
  landscapeImageIdx?: number;
}

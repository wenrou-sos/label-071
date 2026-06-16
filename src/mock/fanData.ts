import type { FanParameters } from '../types';

const BASE_PARAMS = {
  fanId: 'FAN001',
  fanName: '1号主通风机',
  airVolume: 85,
  airPressure: 2800,
  motorCurrent: 185,
  bearingTemp: 55,
  vibration: 2.5,
};

function randomVariation(base: number, percent: number): number {
  const offset = base * percent * (Math.random() * 2 - 1);
  return Math.round((base + offset) * 100) / 100;
}

function determineStatus(params: Omit<FanParameters, 'status'>): 'normal' | 'warning' | 'alarm' {
  if (
    params.bearingTemp > 85 ||
    params.vibration > 4.5 ||
    params.motorCurrent > 220
  ) {
    return 'alarm';
  }
  if (
    params.bearingTemp > 75 ||
    params.vibration > 3.5 ||
    params.motorCurrent > 200
  ) {
    return 'warning';
  }
  return 'normal';
}

export function generateFanParams(): FanParameters {
  const params = {
    fanId: BASE_PARAMS.fanId,
    fanName: BASE_PARAMS.fanName,
    airVolume: randomVariation(BASE_PARAMS.airVolume, 0.05),
    airPressure: randomVariation(BASE_PARAMS.airPressure, 0.03),
    motorCurrent: randomVariation(BASE_PARAMS.motorCurrent, 0.06),
    bearingTemp: randomVariation(BASE_PARAMS.bearingTemp, 0.1),
    vibration: randomVariation(BASE_PARAMS.vibration, 0.15),
    timestamp: new Date().toISOString(),
  };
  return { ...params, status: determineStatus(params) };
}

export function generateFanHistory(count: number): FanParameters[] {
  const now = Date.now();
  const interval = 5 * 60 * 1000;
  const records: FanParameters[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const params = {
      fanId: BASE_PARAMS.fanId,
      fanName: BASE_PARAMS.fanName,
      airVolume: randomVariation(BASE_PARAMS.airVolume, 0.05),
      airPressure: randomVariation(BASE_PARAMS.airPressure, 0.03),
      motorCurrent: randomVariation(BASE_PARAMS.motorCurrent, 0.06),
      bearingTemp: randomVariation(BASE_PARAMS.bearingTemp, 0.1),
      vibration: randomVariation(BASE_PARAMS.vibration, 0.15),
      timestamp: new Date(now - i * interval).toISOString(),
    };
    records.push({ ...params, status: determineStatus(params) });
  }

  return records;
}

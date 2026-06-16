import dayjs from 'dayjs';
import type { ComparisonAirData, AirLocation } from '@/types';

const LOCATION_NAMES: { name: string; type: AirLocation['type'] }[] = [
  { name: '1105采煤工作面', type: '采煤工作面' },
  { name: '2203采煤工作面', type: '采煤工作面' },
  { name: '3301采煤工作面', type: '采煤工作面' },
  { name: '1#轨道巷掘进面', type: '掘进面' },
  { name: '2#回风巷掘进面', type: '掘进面' },
  { name: '3#运输巷掘进面', type: '掘进面' },
  { name: '中央变电所硐室', type: '硐室' },
  { name: '水泵房硐室', type: '硐室' },
  { name: '充电硐室', type: '硐室' },
  { name: '爆破材料硐室', type: '硐室' },
];

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function generateTrendPoints(days: number, pointsPerDay: number, baseAirVolume: number): ComparisonAirData['airVolumeTrend'] {
  const total = days * pointsPerDay;
  const result: ComparisonAirData['airVolumeTrend'] = [];

  for (let i = 0; i < total; i++) {
    let label: string;
    if (days <= 1) {
      const hour = i % 24;
      label = `${String(hour).padStart(2, '0')}:00`;
    } else if (pointsPerDay <= 2) {
      label = `第${i + 1}天`;
    } else {
      const dayIdx = Math.floor(i / pointsPerDay) + 1;
      const slot = i % pointsPerDay + 1;
      label = `第${dayIdx}天-${slot}`;
    }
    const airVolume = baseAirVolume + rand(-8, 8);
    const airPressure = 2750 + rand(-150, 150);
    const bearingTemp = 55 + rand(-10, 18);
    const vibration = 2.3 + rand(-0.5, 1.2);
    const motorCurrent = 180 + rand(-20, 30);
    result.push({
      time: label,
      airVolume,
      airPressure,
      bearingTemp,
      vibration,
      motorCurrent,
    });
  }
  return result;
}

function generateLocationComparison(baseOffset: number = 0) {
  return LOCATION_NAMES.map((loc, i) => {
    const req = loc.type === '采煤工作面' ? 12 + i * 1.5 : loc.type === '掘进面' ? 8 + i : 6 + i * 0.8;
    const actual = req * (0.9 + baseOffset + Math.random() * 0.25);
    return {
      name: loc.name,
      type: loc.type,
      actualAirVolume: Math.round(actual * 10) / 10,
      requiredAirVolume: Math.round(req * 10) / 10,
    };
  });
}

export function generateComparisonData(preset: 'month' | 'week' | 'day'): { periodA: ComparisonAirData; periodB: ComparisonAirData } {
  let days: number;
  let pointsPerDay: number;
  let labelA: string;
  let labelB: string;
  let baseA: number;
  let baseB: number;

  if (preset === 'month') {
    days = 30;
    pointsPerDay = 2;
    labelA = '本月';
    labelB = '上月';
    baseA = 85;
    baseB = 83;
  } else if (preset === 'week') {
    days = 7;
    pointsPerDay = 6;
    labelA = '本周';
    labelB = '上周';
    baseA = 86;
    baseB = 84;
  } else {
    days = 1;
    pointsPerDay = 24;
    labelA = '今日';
    labelB = '昨日';
    baseA = 87;
    baseB = 85;
  }

  const locA = generateLocationComparison(0.02);
  const locB = generateLocationComparison(0);

  const compliantA = locA.filter(l => l.actualAirVolume >= l.requiredAirVolume).length;
  const compliantB = locB.filter(l => l.actualAirVolume >= l.requiredAirVolume).length;

  const now = dayjs();
  const startA = now.subtract(days - 1, 'day').startOf('day');
  const endA = now.endOf('day');
  const startB = startA.subtract(days, 'day');
  const endB = endA.subtract(days, 'day');

  const alarmWarningA = Math.floor(6 + Math.random() * 10);
  const alarmAlarmA = Math.floor(1 + Math.random() * 3);
  const alarmWarningB = Math.floor(8 + Math.random() * 12);
  const alarmAlarmB = Math.floor(2 + Math.random() * 4);

  const periodA: ComparisonAirData = {
    periodLabel: labelA,
    startDate: startA.format('YYYY-MM-DD'),
    endDate: endA.format('YYYY-MM-DD'),
    airVolumeTrend: generateTrendPoints(days, pointsPerDay, baseA),
    alarmStats: {
      warningCount: alarmWarningA,
      alarmCount: alarmAlarmA,
      totalCount: alarmWarningA + alarmAlarmA,
      avgResponseTimeMin: Math.round(5 + Math.random() * 15),
      handledRate: Math.round((85 + Math.random() * 14) * 10) / 10,
    },
    complianceRate: Math.round((compliantA / locA.length) * 1000) / 10,
    totalLocations: locA.length,
    compliantLocations: compliantA,
    avgEffectiveAirRate: Math.round((82 + Math.random() * 12) * 10) / 10,
    avgFanEfficiency: Math.round((78 + Math.random() * 15) * 10) / 10,
    locationComparison: locA,
  };

  const periodB: ComparisonAirData = {
    periodLabel: labelB,
    startDate: startB.format('YYYY-MM-DD'),
    endDate: endB.format('YYYY-MM-DD'),
    airVolumeTrend: generateTrendPoints(days, pointsPerDay, baseB),
    alarmStats: {
      warningCount: alarmWarningB,
      alarmCount: alarmAlarmB,
      totalCount: alarmWarningB + alarmAlarmB,
      avgResponseTimeMin: Math.round(7 + Math.random() * 18),
      handledRate: Math.round((80 + Math.random() * 15) * 10) / 10,
    },
    complianceRate: Math.round((compliantB / locB.length) * 1000) / 10,
    totalLocations: locB.length,
    compliantLocations: compliantB,
    avgEffectiveAirRate: Math.round((79 + Math.random() * 12) * 10) / 10,
    avgFanEfficiency: Math.round((75 + Math.random() * 14) * 10) / 10,
    locationComparison: locB,
  };

  return { periodA, periodB };
}

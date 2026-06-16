import type { MonthlyReport, AirLocation } from '../types';

const LOCATION_TEMPLATES: Array<{
  name: string;
  type: AirLocation['type'];
  requiredBase: number;
}> = [
  { name: '1301采煤工作面', type: '采煤工作面', requiredBase: 850 },
  { name: '1302采煤工作面', type: '采煤工作面', requiredBase: 820 },
  { name: '2301采煤工作面', type: '采煤工作面', requiredBase: 900 },
  { name: '3301掘进面', type: '掘进面', requiredBase: 380 },
  { name: '3302掘进面', type: '掘进面', requiredBase: 350 },
  { name: '中央变电所', type: '硐室', requiredBase: 180 },
  { name: '中央水泵房', type: '硐室', requiredBase: 200 },
  { name: '井下火药库', type: '硐室', requiredBase: 150 },
];

function generateLocations(monthIndex: number): AirLocation[] {
  const count = 5 + Math.floor(Math.random() * 4);
  const selected = LOCATION_TEMPLATES.slice(0, count);

  return selected.map((tpl, idx) => {
    const required = tpl.requiredBase + Math.round(Math.random() * 50 - 25);
    const variation = 0.88 + Math.random() * 0.2;
    const actual = Math.round(required * variation);
    const compliance = actual >= required;

    return {
      id: `LOC${monthIndex}${String(idx + 1).padStart(2, '0')}`,
      name: tpl.name,
      type: tpl.type,
      actualAirVolume: actual,
      requiredAirVolume: required,
      compliance,
    };
  });
}

export function generateMonthlyReports(): MonthlyReport[] {
  const reports: MonthlyReport[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const locations = generateLocations(6 - i);
    const complianceCount = locations.filter((l) => l.compliance).length;
    const effectiveAirRate = Math.round((complianceCount / locations.length) * 100);
    const fanEfficiency = Math.round((72 + Math.random() * 18) * 10) / 10;

    reports.push({
      id: `RPT${month.replace('-', '')}`,
      month,
      locations,
      effectiveAirRate,
      fanEfficiency,
      generatedAt: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString(),
    });
  }

  return reports;
}
